-- 1. Add contact_email to orders table for easier notification processing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 2. Enable HTTP extension for webhooks
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 3. Create a function to trigger the edge function
CREATE OR REPLACE FUNCTION trigger_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        PERFORM
            extensions.http_post(
                'https://xoqrvcykpygfishrkgnt.supabase.co/functions/v1/order-confirmation',
                json_build_object('record', row_to_json(NEW))::text,
                'application/json'
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger on the orders table
DROP TRIGGER IF EXISTS on_order_paid ON orders;
CREATE TRIGGER on_order_paid
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_notification();

-- 5. Also trigger on initial insert if status is already paid
DROP TRIGGER IF EXISTS on_order_inserted_paid ON orders;
CREATE TRIGGER on_order_inserted_paid
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_notification();
