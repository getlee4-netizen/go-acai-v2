-- 003_auth.sql - Auth configuration and tenant_users link

-- This file documents the auth setup - actual auth is handled by Supabase Auth
-- The tenant_users table links auth.users to tenants

-- Trigger to create tenant_users entry on signup (via API)
-- This is handled by the /api/signup endpoint

-- Function to get tenant_id from auth user
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM tenant_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    RETURN v_tenant_id;
END;
$$;

-- Helper function to check if user is admin of a tenant
CREATE OR REPLACE FUNCTION is_tenant_admin(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM tenant_users
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid();
    RETURN v_count > 0;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant_admin(UUID) TO authenticated;