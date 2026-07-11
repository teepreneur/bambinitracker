-- ============================================================================
-- Bambini Tracker: Orders & Payment Security
-- ============================================================================
-- Previously the client created orders with status = 'paid' straight from the
-- device and there was no UPDATE policy at all. This migration:
--   * forces client-created orders to start as 'pending'
--   * lets a user read only their own orders
--   * grants NO update/delete to the authenticated/anon roles, so the
--     'paid' transition can only happen via the verify-payment edge function
--     (which runs with the service role and verifies against Paystack).
-- ============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- A user may only create their OWN order, and it must start life as 'pending'.
-- The status is flipped to 'paid' server-side after Paystack verification.
CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Least privilege: clients may read/insert only. No UPDATE/DELETE grant, so
-- there is no way for a client to mark an order paid.
REVOKE ALL ON public.orders FROM anon;
GRANT SELECT, INSERT ON public.orders TO authenticated;
