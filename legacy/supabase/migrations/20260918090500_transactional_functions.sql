/*
# Transactional operations

PostgREST issues one statement per request, so multi-table operations written in
application code are not atomic: a crash between two calls leaves points spent
with no redemption, or a company with no owner. The operations below therefore
live in the database, where a function body is a single transaction and rows can
be locked for the duration.

Each function is SECURITY DEFINER and EXECUTE is revoked from `anon` and
`authenticated`: only the API, holding the service-role key, can call them. They
take the caller's profile id as a parameter — the API derives it from the
verified token, never from a request body.

Failures are raised with a stable machine-readable code (`insufficient_points`,
`event_full`, ...) which the API maps to an HTTP status.
*/

-- ---------------------------------------------------------------------------
-- award_points: one ledger row plus the derived balance, atomically
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_amount integer,
  p_type points_transaction_type,
  p_reference_type text,
  p_reference_id uuid,
  p_description text
)
RETURNS points_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_transaction points_transactions;
BEGIN
  IF p_amount = 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  -- Create the balance row on first use, then lock it. Every concurrent award
  -- for this member queues behind this lock, so the balance cannot drift.
  INSERT INTO point_balances (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_balance
  FROM point_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  INSERT INTO points_transactions (user_id, amount, type, reference_type, reference_id, description)
  VALUES (p_user_id, p_amount, p_type, p_reference_type, p_reference_id, p_description)
  RETURNING * INTO v_transaction;

  UPDATE point_balances
  SET balance = v_balance + p_amount
  WHERE user_id = p_user_id;

  RETURN v_transaction;
END;
$$;

-- ---------------------------------------------------------------------------
-- redeem_reward: availability, stock, points and the redemption record
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_user_id uuid,
  p_reward_id uuid
)
RETURNS reward_redemptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward rewards;
  v_redemption reward_redemptions;
BEGIN
  -- Locking the reward row serialises redemptions of the same reward, which is
  -- what prevents two callers from claiming the last unit.
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reward_not_found';
  END IF;

  IF v_reward.status <> 'active' THEN
    RAISE EXCEPTION 'reward_unavailable';
  END IF;

  IF v_reward.expires_at IS NOT NULL AND v_reward.expires_at < now() THEN
    RAISE EXCEPTION 'reward_expired';
  END IF;

  IF v_reward.stock <= 0 THEN
    RAISE EXCEPTION 'reward_out_of_stock';
  END IF;

  IF EXISTS (
    SELECT 1 FROM reward_redemptions
    WHERE reward_id = p_reward_id AND user_id = p_user_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'duplicate_redemption';
  END IF;

  -- Raises insufficient_points and aborts the whole transaction if the member
  -- cannot afford the reward, so stock is never decremented for free.
  PERFORM award_points(
    p_user_id,
    -v_reward.points_cost,
    'spent'::points_transaction_type,
    'reward_redemption',
    p_reward_id,
    format('Redeemed reward: %s', v_reward.title)
  );

  UPDATE rewards
  SET stock = stock - 1,
      status = CASE WHEN stock - 1 = 0 THEN 'sold_out'::reward_status ELSE status END
  WHERE id = p_reward_id;

  INSERT INTO reward_redemptions (reward_id, user_id, points_cost, status)
  VALUES (p_reward_id, p_user_id, v_reward.points_cost, 'pending')
  RETURNING * INTO v_redemption;

  RETURN v_redemption;
END;
$$;

-- ---------------------------------------------------------------------------
-- complete_course_enrollment: transition plus the reward, exactly once
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.complete_course_enrollment(
  p_user_id uuid,
  p_course_id uuid
)
RETURNS course_enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment course_enrollments;
  v_course courses;
BEGIN
  SELECT * INTO v_enrollment
  FROM course_enrollments
  WHERE course_id = p_course_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'enrollment_not_found';
  END IF;

  IF v_enrollment.status = 'completed' THEN
    RAISE EXCEPTION 'already_completed';
  END IF;

  SELECT * INTO v_course FROM courses WHERE id = p_course_id;

  UPDATE course_enrollments
  SET status = 'completed', completed_at = now()
  WHERE id = v_enrollment.id
  RETURNING * INTO v_enrollment;

  -- The row lock above plus this single transaction mean replaying the endpoint
  -- cannot credit the points a second time.
  IF v_course.points_reward > 0 THEN
    PERFORM award_points(
      p_user_id,
      v_course.points_reward,
      'earned'::points_transaction_type,
      'course_completion',
      p_course_id,
      format('Completed course: %s', v_course.title)
    );
  END IF;

  RETURN v_enrollment;
END;
$$;

-- ---------------------------------------------------------------------------
-- register_for_event: capacity checked under a lock
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.register_for_event(
  p_user_id uuid,
  p_event_id uuid
)
RETURNS event_registrations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event events;
  v_taken integer;
  v_registration event_registrations;
BEGIN
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  IF v_event.status <> 'published' THEN
    RAISE EXCEPTION 'event_not_open';
  END IF;

  IF EXISTS (
    SELECT 1 FROM event_registrations
    WHERE event_id = p_event_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'already_registered';
  END IF;

  IF v_event.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_taken
    FROM event_registrations
    WHERE event_id = p_event_id AND status IN ('registered', 'attended');

    IF v_taken >= v_event.capacity THEN
      RAISE EXCEPTION 'event_full';
    END IF;
  END IF;

  INSERT INTO event_registrations (event_id, user_id, status)
  VALUES (p_event_id, p_user_id, 'registered')
  RETURNING * INTO v_registration;

  RETURN v_registration;
END;
$$;

-- ---------------------------------------------------------------------------
-- create_company_with_owner: a company always has an administrator
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  p_owner_profile_id uuid,
  p_name text,
  p_slug text,
  p_description text,
  p_website text,
  p_industry text,
  p_location text,
  p_logo_url text,
  p_cover_url text
)
RETURNS companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company companies;
BEGIN
  IF EXISTS (SELECT 1 FROM companies WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'slug_taken';
  END IF;

  INSERT INTO companies (name, slug, description, website, industry, location, logo_url, cover_url, status)
  VALUES (p_name, p_slug, p_description, p_website, p_industry, p_location, p_logo_url, p_cover_url, 'active')
  RETURNING * INTO v_company;

  INSERT INTO company_members (company_id, user_id, role)
  VALUES (v_company.id, p_owner_profile_id, 'admin');

  RETURN v_company;
END;
$$;

-- ---------------------------------------------------------------------------
-- Execution rights: the API only
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.award_points(uuid, integer, points_transaction_type, text, uuid, text)',
    'public.redeem_reward(uuid, uuid)',
    'public.complete_course_enrollment(uuid, uuid)',
    'public.register_for_event(uuid, uuid)',
    'public.create_company_with_owner(uuid, text, text, text, text, text, text, text, text)'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;
