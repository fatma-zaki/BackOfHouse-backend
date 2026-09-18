/*
# Redemption lifecycle: cancellation with refund

A pending redemption either gets fulfilled (a status change the API performs
with a conditional update) or cancelled. Cancelling must return the points and
the unit of stock in the same transaction as the status change, otherwise a
failure between the steps could lose points or stock, and a retried request
could refund twice. The row lock and the `status = 'pending'` check make the
refund happen at most once.
*/

CREATE OR REPLACE FUNCTION public.cancel_reward_redemption(p_redemption_id uuid)
RETURNS reward_redemptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_redemption reward_redemptions;
BEGIN
  SELECT * INTO v_redemption
  FROM reward_redemptions
  WHERE id = p_redemption_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'redemption_not_found';
  END IF;

  IF v_redemption.status <> 'pending' THEN
    RAISE EXCEPTION 'redemption_not_pending';
  END IF;

  UPDATE reward_redemptions
  SET status = 'cancelled'
  WHERE id = p_redemption_id
  RETURNING * INTO v_redemption;

  UPDATE rewards
  SET stock = stock + 1,
      status = CASE WHEN status = 'sold_out' THEN 'active'::reward_status ELSE status END
  WHERE id = v_redemption.reward_id;

  PERFORM award_points(
    v_redemption.user_id,
    v_redemption.points_cost,
    'admin_adjustment'::points_transaction_type,
    'reward_refund',
    v_redemption.id,
    'Refund for cancelled reward redemption'
  );

  RETURN v_redemption;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_reward_redemption(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reward_redemption(uuid) TO service_role;
