// ============================================================================
// verify-payment — Supabase Edge Function
// ============================================================================
// Verifies a Paystack transaction server-side before an order is marked 'paid'.
//
// The client creates an order as 'pending', runs the Paystack popup, then calls
// this function with { orderId, reference }. We:
//   1. Identify the caller from their JWT and confirm they own the order.
//   2. Recompute the expected total from live shop_items prices (never trust
//      the client-sent amount).
//   3. Ask Paystack whether the transaction actually succeeded for that amount.
//   4. Only then flip the order to 'paid' using the service role.
//
// Required secrets (set via `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYSTACK_SECRET_KEY
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '').trim()
    if (!jwt) return json({ error: 'Missing authorization' }, 401)

    const { orderId, reference } = await req.json().catch(() => ({}))
    if (!orderId || !reference) {
      return json({ error: 'orderId and reference are required' }, 400)
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // 1. Identify the caller from their JWT.
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401)
    const userId = userData.user.id

    // 2. Load the order and confirm ownership.
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, user_id, status, total_amount, items')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return json({ error: 'Order not found' }, 404)
    if (order.user_id !== userId) return json({ error: 'Forbidden' }, 403)

    // Idempotent: if it is already paid, do not re-verify or double-charge logic.
    if (order.status === 'paid') return json({ status: 'paid', alreadyProcessed: true })

    // 3. Recompute the expected total from live prices instead of trusting the
    //    amount stored on the order.
    const itemIds = Array.isArray(order.items)
      ? order.items.map((i: { id: string }) => i.id).filter(Boolean)
      : []
    if (itemIds.length === 0) return json({ error: 'Order has no items' }, 400)

    const { data: liveItems, error: itemsErr } = await admin
      .from('shop_items')
      .select('id, price')
      .in('id', itemIds)

    if (itemsErr || !liveItems || liveItems.length !== itemIds.length) {
      return json({ error: 'Could not price order items' }, 400)
    }

    const expectedTotal = liveItems.reduce((sum, i) => sum + Number(i.price), 0)
    const expectedPesewas = Math.round(expectedTotal * 100)

    // 4. Verify the transaction with Paystack.
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
    )
    const verifyBody = await verifyRes.json()

    if (!verifyRes.ok || !verifyBody?.status || verifyBody?.data?.status !== 'success') {
      return json({ error: 'Payment not successful', status: 'failed' }, 402)
    }

    const paid = verifyBody.data
    if (paid.currency !== 'GHS' || Number(paid.amount) !== expectedPesewas) {
      // Amount or currency mismatch — do NOT mark the order paid.
      return json({ error: 'Payment amount mismatch', status: 'mismatch' }, 402)
    }

    // 5. Mark the order paid (service role bypasses RLS). Guard on status so
    //    concurrent calls cannot double-process.
    const { data: updated, error: updateErr } = await admin
      .from('orders')
      .update({ status: 'paid', paystack_reference: reference })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select('id, status')
      .maybeSingle()

    if (updateErr) return json({ error: 'Failed to update order' }, 500)

    return json({ status: 'paid', order: updated ?? { id: orderId, status: 'paid' } })
  } catch (error) {
    return json({ error: (error as Error).message ?? 'Unexpected error' }, 500)
  }
})
