# Database migrations

Ordered, idempotent SQL migrations. Apply in filename order (they are timestamp
prefixed). The `20260711*` migrations are the security-hardening pass; the
legacy ad-hoc scripts in `supabase/*.sql` (e.g. `growth_screen_tables.sql`,
`health_tables.sql`, `shop_tables.sql`, `milestones_v2.sql`, `tips.sql`) still
hold the base table definitions and seed data and should be applied first, once,
before these migrations.

## Order

1. Base schema + feature tables (existing loose scripts in `supabase/`):
   `supabase_schema.sql`, `growth_screen_tables.sql`, `health_tables.sql`,
   `shop_tables.sql`, `milestones_v2.sql`, `tips.sql`, `observations_bucket.sql`,
   `webhook_setup.sql`, `unique_assignments.sql`, `add_target_milestone.sql`.
2. `20260711000000_security_rls_hardening.sql` — parent-link-based RLS on all
   child-scoped tables; re-enables RLS everywhere; least-privilege grants.
3. `20260711000100_orders_payment_security.sql` — orders start as `pending`;
   no client-side status updates.
4. `20260711000200_observations_bucket_private.sql` — makes the observations
   media bucket private with owner-scoped reads (served via signed URLs).
5. `20260711000300_order_webhook_secret.sql` — authenticates the
   order-confirmation webhook with a shared secret.

> The `20260711*` migrations supersede the permissive policies in
> `fix_milestones_rls.sql`, `fix_milestones_api_access.sql`, `api_grants.sql`,
> and `growth_rls_fix.sql`. Those files are kept only for historical reference —
> **do not** re-apply them.

## Required secrets / settings

Set these once in the Supabase project (never commit the values):

```bash
# Edge function secrets
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx
supabase secrets set GEMINI_API_KEY=xxx
supabase secrets set RESEND_API_KEY=xxx
supabase secrets set ORDER_WEBHOOK_SECRET=<random-secret>
```

```sql
-- Database setting used by the order-confirmation trigger. Must match
-- ORDER_WEBHOOK_SECRET above.
ALTER DATABASE postgres SET app.settings.order_webhook_secret = '<random-secret>';
```

## Edge functions

- `ai` — server-side Gemini wrapper (activity generation + milestone synthesis).
- `verify-payment` — verifies a Paystack transaction before marking an order paid.
- `order-confirmation` — sends the order confirmation email (secret-gated).

Deploy with `supabase functions deploy <name>`.
