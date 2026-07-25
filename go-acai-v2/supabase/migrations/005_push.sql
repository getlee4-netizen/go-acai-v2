-- 005_push_notifications.sql - Push notifications setup

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    subscription JSONB NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_push_subscriptions_tenant ON push_subscriptions(tenant_id);
CREATE INDEX idx_push_subscriptions_customer ON push_subscriptions(customer_id);

-- Function to send push notification
CREATE OR REPLACE FUNCTION send_push_notification(
    p_tenant_id UUID,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT '{}'::jsonb,
    p_customer_ids UUID[] DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_subscription RECORD;
    v_payload JSONB;
    v_vapid_private_key TEXT := current_setting('app.vapid_private_key', true);
    v_vapid_public_key TEXT := current_setting('app.vapid_public_key', true);
    v_vapid_subject TEXT := current_setting('app.vapid_subject', true);
BEGIN
    -- This is a placeholder - actual push sending is done via the /api/push/send endpoint
    -- using web-push library with VAPID keys
    NULL;
END;
$$;

-- Trigger to notify admin of new orders (handled via Supabase Realtime on orders table)
-- The admin dashboard listens to the orders channel for INSERT/UPDATE events