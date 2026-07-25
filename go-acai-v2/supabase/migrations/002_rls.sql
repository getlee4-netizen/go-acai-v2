-- 002_rls.sql - Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TENANTS POLICIES
-- ============================================
-- Public read for active tenants
CREATE POLICY "Public read active tenants" ON tenants
    FOR SELECT USING (is_active = true);

-- Tenant users can read their own tenant
CREATE POLICY "Tenant users read own tenant" ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- CATEGORIES POLICIES
-- ============================================
-- Public read for active categories of active tenants
CREATE POLICY "Public read active categories" ON categories
    FOR SELECT USING (
        is_active = true AND
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

-- Tenant users full access to their categories
CREATE POLICY "Tenant users manage categories" ON categories
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- PRODUCTS POLICIES
-- ============================================
-- Public read for available products of active tenants
CREATE POLICY "Public read available products" ON products
    FOR SELECT USING (
        is_available = true AND
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

-- Tenant users full access to their products
CREATE POLICY "Tenant users manage products" ON products
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- DELIVERY ZONES POLICIES
-- ============================================
CREATE POLICY "Public read delivery zones" ON delivery_zones
    FOR SELECT USING (
        is_active = true AND
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

CREATE POLICY "Tenant users manage delivery zones" ON delivery_zones
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- CUSTOMERS POLICIES
-- ============================================
-- Customers can read their own data
CREATE POLICY "Customers read own data" ON customers
    FOR SELECT USING (
        auth.uid() = id OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- Customers can insert their own data
CREATE POLICY "Customers insert own data" ON customers
    FOR INSERT WITH CHECK (
        auth.uid() = id OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- Customers can update their own data
CREATE POLICY "Customers update own data" ON customers
    FOR UPDATE USING (
        auth.uid() = id OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- ============================================
-- ORDERS POLICIES
-- ============================================
-- Public can create orders (for customers)
CREATE POLICY "Public create orders" ON orders
    FOR INSERT WITH CHECK (
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

-- Customers can read their own orders
CREATE POLICY "Customers read own orders" ON orders
    FOR SELECT USING (
        customer_id = auth.uid() OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- Tenant users can read all orders for their tenant
CREATE POLICY "Tenant users read orders" ON orders
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- Tenant users can update orders
CREATE POLICY "Tenant users update orders" ON orders
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- BANNER CONFIGS POLICIES
-- ============================================
CREATE POLICY "Public read active banners" ON banner_configs
    FOR SELECT USING (
        is_active = true AND
        (start_date IS NULL OR start_date <= NOW()) AND
        (end_date IS NULL OR end_date >= NOW()) AND
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

CREATE POLICY "Tenant users manage banners" ON banner_configs
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- PUSH SUBSCRIPTIONS POLICIES
-- ============================================
CREATE POLICY "Customers manage own subscriptions" ON push_subscriptions
    FOR ALL USING (
        customer_id = auth.uid() OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- ============================================
-- TENANT USERS POLICIES
-- ============================================
CREATE POLICY "Users read own tenant links" ON tenant_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users manage own tenant links" ON tenant_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- STORAGE POLICIES (for logos bucket)
-- ============================================
-- These should be configured in Supabase Dashboard > Storage > Policies
-- But here's the SQL equivalent for reference:

-- CREATE POLICY "Public read logos" ON storage.objects
--     FOR SELECT USING (bucket_id = 'logos');

-- CREATE POLICY "Tenant users upload logos" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'logos' AND
--         auth.uid() IN (
--             SELECT user_id FROM tenant_users WHERE tenant_id = split_part(name, '/', 1)
--         )
--     );

-- CREATE POLICY "Tenant users update logos" ON storage.objects
--     FOR UPDATE USING (
--         bucket_id = 'logos' AND
--         auth.uid() IN (
--             SELECT user_id FROM tenant_users WHERE tenant_id = split_part(name, '/', 1)
--         )
--     );