/*
# Rebuild the row level security model

Why this migration exists
-------------------------
The first RLS pass compared `user_id` columns with `auth.uid()`. Those columns
hold `public.users.id` (the application profile id), while `auth.uid()` returns
`auth.users.id`, so the predicates never matched the intended row: some policies
silently denied everything and others — combined with `USING (true)` write
policies on `courses`, `rewards` and `news_articles` — let any signed-in client
edit first-party catalogue content directly with the public anon key.

The model applied here
----------------------
1. Helper functions map the JWT to the caller's profile id and platform role.
   The role is read from `app_metadata`, which only the service role can write.
   `user_metadata` is client-writable and is never consulted.
2. Clients (holding the anon key) get SELECT policies only. Every write goes
   through the NestJS API, which authorizes the caller and then uses the
   service-role key. RLS is the second line of defence, not the only one.
3. Ledger, balance and audit rows are readable by their owner only; the audit
   trail is restricted to platform administrators.
*/

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so that policies on company_members can call these helpers
-- without re-entering the same policy and recursing.
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.current_profile_id() IS
  'public.users.id for the current JWT subject, or NULL when unauthenticated.';

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'app_role', 'USER');
$$;

COMMENT ON FUNCTION public.current_app_role() IS
  'Platform role from app_metadata. user_metadata is client-writable and is never used.';

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_app_role() = 'PLATFORM_ADMIN';
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = public.current_profile_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = public.current_profile_id()
      AND cm.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Drop every policy created by the earlier migrations
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'users', 'companies', 'company_members', 'professionals',
        'events', 'event_registrations', 'opportunities',
        'news_articles', 'news_comments', 'news_reactions',
        'courses', 'course_enrollments',
        'points_transactions', 'point_balances',
        'rewards', 'reward_redemptions',
        'notifications', 'audit_logs'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname, policy_record.schemaname, policy_record.tablename
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Identity and organisations
-- ---------------------------------------------------------------------------

-- A member reads their own profile. The member directory is served by the API,
-- which returns a projection without email or phone.
CREATE POLICY users_select_self ON users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY companies_select_visible ON companies FOR SELECT TO authenticated
  USING (status = 'active' OR public.is_company_member(id) OR public.is_platform_admin());

CREATE POLICY company_members_select_own_company ON company_members FOR SELECT TO authenticated
  USING (
    user_id = public.current_profile_id()
    OR public.is_company_member(company_id)
    OR public.is_platform_admin()
  );

CREATE POLICY professionals_select_visible ON professionals FOR SELECT TO authenticated
  USING (
    profile_visibility = 'public'
    OR user_id = public.current_profile_id()
    OR public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- Events and opportunities
-- ---------------------------------------------------------------------------

CREATE POLICY events_select_visible ON events FOR SELECT TO authenticated
  USING (
    status IN ('published', 'cancelled', 'completed')
    OR created_by = public.current_profile_id()
    OR (company_id IS NOT NULL AND public.is_company_member(company_id))
    OR public.is_platform_admin()
  );

CREATE POLICY event_registrations_select_own ON event_registrations FOR SELECT TO authenticated
  USING (
    user_id = public.current_profile_id()
    OR public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_registrations.event_id
        AND (
          e.created_by = public.current_profile_id()
          OR (e.company_id IS NOT NULL AND public.is_company_admin(e.company_id))
        )
    )
  );

CREATE POLICY opportunities_select_visible ON opportunities FOR SELECT TO authenticated
  USING (
    status IN ('open', 'closed', 'archived')
    OR created_by = public.current_profile_id()
    OR (company_id IS NOT NULL AND public.is_company_member(company_id))
    OR public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- First-party content: news and courses
-- ---------------------------------------------------------------------------

CREATE POLICY news_articles_select_published ON news_articles FOR SELECT TO authenticated
  USING (status = 'published' OR public.is_platform_admin());

CREATE POLICY news_comments_select_visible ON news_comments FOR SELECT TO authenticated
  USING (
    status = 'visible'
    OR user_id = public.current_profile_id()
    OR public.is_platform_admin()
  );

CREATE POLICY news_reactions_select_all ON news_reactions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY courses_select_published ON courses FOR SELECT TO authenticated
  USING (status = 'published' OR public.is_platform_admin());

CREATE POLICY course_enrollments_select_own ON course_enrollments FOR SELECT TO authenticated
  USING (user_id = public.current_profile_id() OR public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Points and rewards
-- ---------------------------------------------------------------------------

-- The ledger is append-only and written exclusively by award_points(), which
-- runs with the service role. No client may insert, update or delete here.
CREATE POLICY points_transactions_select_own ON points_transactions FOR SELECT TO authenticated
  USING (user_id = public.current_profile_id() OR public.is_platform_admin());

CREATE POLICY point_balances_select_own ON point_balances FOR SELECT TO authenticated
  USING (user_id = public.current_profile_id() OR public.is_platform_admin());

CREATE POLICY rewards_select_active ON rewards FOR SELECT TO authenticated
  USING (status = 'active' OR public.is_platform_admin());

CREATE POLICY reward_redemptions_select_own ON reward_redemptions FOR SELECT TO authenticated
  USING (user_id = public.current_profile_id() OR public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Notifications and audit
-- ---------------------------------------------------------------------------

CREATE POLICY notifications_select_own ON notifications FOR SELECT TO authenticated
  USING (user_id = public.current_profile_id());

CREATE POLICY audit_logs_select_admin ON audit_logs FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Constraints the application relies on
-- ---------------------------------------------------------------------------

-- One professional profile per member; the API reports the conflict as 409.
CREATE UNIQUE INDEX IF NOT EXISTS professionals_user_id_key ON professionals(user_id);

-- A member may hold at most one pending redemption of a given reward. This is
-- what actually stops a double redemption when two requests arrive together.
CREATE UNIQUE INDEX IF NOT EXISTS reward_redemptions_pending_unique
  ON reward_redemptions(reward_id, user_id)
  WHERE status = 'pending';

-- Keeps the ledger honest: a debit is negative, a credit is positive.
ALTER TABLE points_transactions DROP CONSTRAINT IF EXISTS points_amount_sign_matches_type;
ALTER TABLE points_transactions ADD CONSTRAINT points_amount_sign_matches_type CHECK (
  (type = 'earned' AND amount > 0)
  OR (type = 'spent' AND amount < 0)
  OR type = 'admin_adjustment'
);
