-- ============================================================================
-- Bambini Tracker: Authenticate the order-confirmation webhook
-- ============================================================================
-- The order-confirmation edge function now requires a shared secret so it
-- cannot be invoked by third parties to send email from our domain. The trigger
-- reads the secret from a database setting and includes it in the request body.
--
-- One-time operator setup (value is NOT stored in the repo):
--   ALTER DATABASE postgres SET app.settings.order_webhook_secret = '<random-secret>';
--   -- then set the same value as the ORDER_WEBHOOK_SECRET function secret:
--   -- supabase secrets set ORDER_WEBHOOK_SECRET=<random-secret>
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    webhook_secret TEXT := current_setting('app.settings.order_webhook_secret', true);
BEGIN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        PERFORM
            extensions.http_post(
                'https://xoqrvcykpygfishrkgnt.supabase.co/functions/v1/order-confirmation',
                json_build_object(
                    'record', row_to_json(NEW),
                    'secret', webhook_secret
                )::text,
                'application/json'
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
