-- =============================================
-- GO AÇAÍ v2 - Setup Completo do Banco
-- Cole este SQL no Supabase Dashboard → SQL Editor → New Query
-- =============================================

-- 0. Limpar tabelas existentes (se houver)
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS tenant_users CASCADE;
DROP TABLE IF EXISTS banner_configs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS is_tenant_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_customer_on_order() CASCADE;
DROP FUNCTION IF EXISTS send_push_notification(UUID, TEXT, TEXT, JSONB, UUID[]) CASCADE;

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS (Lojas)
-- ============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#d946ef',
    address TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 5.00,
    minimum_order DECIMAL(10,2) DEFAULT 15.00,
    working_hours JSONB DEFAULT '{"segunda": {"open": "10:00", "close": "23:00", "closed": false}, "terca": {"open": "10:00", "close": "23:00", "closed": false}, "quarta": {"open": "10:00", "close": "23:00", "closed": false}, "quinta": {"open": "10:00", "close": "23:00", "closed": false}, "sexta": {"open": "10:00", "close": "23:00", "closed": false}, "sabado": {"open": "10:00", "close": "23:00", "closed": false}, "domingo": {"open": "10:00", "close": "22:00", "closed": true}}',
    installments INT DEFAULT 3,
    price_per_km DECIMAL(10,2) DEFAULT 2.00,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    cep VARCHAR(10),
    whatsapp VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    prep_time_minutes INT DEFAULT 10,
    is_featured BOOLEAN DEFAULT false,
    nutritional_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DELIVERY ZONES
-- ============================================
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    min_distance_km DECIMAL(5,2) DEFAULT 0,
    max_distance_km DECIMAL(5,2) NOT NULL,
    fee DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(200),
    email VARCHAR(200),
    cep TEXT,
    address TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    addresses JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{"notifications": true, "marketing": false, "favorite_categories": [], "dietary_restrictions": []}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone)
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    address JSONB NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'pending',
    notes TEXT,
    estimated_delivery_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BANNER CONFIGS
-- ============================================
CREATE TABLE banner_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    title VARCHAR(200),
    subtitle TEXT,
    background_color VARCHAR(7) DEFAULT '#d946ef',
    text_color VARCHAR(7) DEFAULT '#ffffff',
    image_url TEXT,
    link_url TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    step_messages JSONB DEFAULT '{}',
    item_icons JSONB DEFAULT '{}',
    item_prices JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- ============================================
-- PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    subscription JSONB NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone)
);

-- ============================================
-- TENANT USERS (Auth link)
-- ============================================
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(30) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(is_active);
CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_delivery_zones_tenant ON delivery_zones(tenant_id);
CREATE INDEX idx_banner_configs_tenant ON banner_configs(tenant_id);
CREATE INDEX idx_push_subscriptions_tenant ON push_subscriptions(tenant_id);
CREATE INDEX idx_push_subscriptions_customer ON push_subscriptions(customer_id);
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banner_configs_updated_at BEFORE UPDATE ON banner_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- TENANTS POLICIES
CREATE POLICY "Public read active tenants" ON tenants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Tenant users read own tenant" ON tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- CATEGORIES POLICIES
CREATE POLICY "Public read active categories" ON categories
    FOR SELECT USING (
        is_active = true AND
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

CREATE POLICY "Tenant users manage categories" ON categories
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- PRODUCTS POLICIES
CREATE POLICY "Public read available products" ON products
    FOR SELECT USING (
        is_available = true AND
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

CREATE POLICY "Tenant users manage products" ON products
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- DELIVERY ZONES POLICIES
CREATE POLICY "Public read delivery zones" ON delivery_zones
    FOR SELECT USING (
        is_active = true AND
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

CREATE POLICY "Tenant users manage delivery zones" ON delivery_zones
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- CUSTOMERS POLICIES
CREATE POLICY "Customers read own data" ON customers
    FOR SELECT USING (
        auth.uid() = id OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Customers insert own data" ON customers
    FOR INSERT WITH CHECK (
        auth.uid() = id OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Customers update own data" ON customers
    FOR UPDATE USING (
        auth.uid() = id OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- ORDERS POLICIES
CREATE POLICY "Public create orders" ON orders
    FOR INSERT WITH CHECK (
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

CREATE POLICY "Customers read own orders" ON orders
    FOR SELECT USING (
        customer_id = auth.uid() OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Tenant users read orders" ON orders
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Tenant users update orders" ON orders
    FOR UPDATE USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- BANNER CONFIGS POLICIES
CREATE POLICY "Public read active banners" ON banner_configs
    FOR SELECT USING (
        is_active = true AND
        (start_date IS NULL OR start_date <= NOW()) AND
        (end_date IS NULL OR end_date >= NOW()) AND
        tenant_id IN (SELECT id FROM tenants WHERE is_active = true)
    );

CREATE POLICY "Tenant users manage banners" ON banner_configs
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- PUSH SUBSCRIPTIONS POLICIES
CREATE POLICY "Customers manage own subscriptions" ON push_subscriptions
    FOR ALL USING (
        customer_id = auth.uid() OR
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- TENANT USERS POLICIES
CREATE POLICY "Users read own tenant links" ON tenant_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users manage own tenant links" ON tenant_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- AUTH FUNCTIONS
-- ============================================
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

GRANT EXECUTE ON FUNCTION get_current_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant_admin(UUID) TO authenticated;

-- ============================================
-- CUSTOMER ON ORDER TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION create_customer_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO customers (tenant_id, phone, name, addresses)
    VALUES (
        NEW.tenant_id,
        NEW.customer_phone,
        NEW.customer_name,
        jsonb_build_array(
            jsonb_build_object(
                'street', NEW.address->>'street',
                'number', NEW.address->>'number',
                'complement', NEW.address->>'complement',
                'neighborhood', NEW.address->>'neighborhood',
                'city', NEW.address->>'city',
                'state', NEW.address->>'state',
                'zip_code', NEW.address->>'zip_code'
            )
        )
    )
    ON CONFLICT (tenant_id, phone) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, customers.name),
        addresses = jsonb_build_array(
            jsonb_build_object(
                'street', NEW.address->>'street',
                'number', NEW.address->>'number',
                'complement', NEW.address->>'complement',
                'neighborhood', NEW.address->>'neighborhood',
                'city', NEW.address->>'city',
                'state', NEW.address->>'state',
                'zip_code', NEW.address->>'zip_code'
            )
        ),
        updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_customer_on_order
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_customer_on_order();

-- ============================================
-- SEED DATA - 3 TENANTS DEMO
-- ============================================
INSERT INTO tenants (slug, name, primary_color, whatsapp, address, delivery_fee, minimum_order, working_hours, installments, price_per_km) VALUES
  ('acai-do-joao', 'Açaí do João', '#d946ef', '(11) 99999-1111', 'Rua das Açaís, 123 - Centro, São Paulo - SP', 5.00, 15.00,
   '{"segunda": {"open": "10:00", "close": "22:00", "closed": false}, "terca": {"open": "10:00", "close": "22:00", "closed": false}, "quarta": {"open": "10:00", "close": "22:00", "closed": false}, "quinta": {"open": "10:00", "close": "22:00", "closed": false}, "sexta": {"open": "10:00", "close": "23:00", "closed": false}, "sabado": {"open": "10:00", "close": "23:00", "closed": false}, "domingo": {"open": "10:00", "close": "22:00", "closed": false}}', 3, 2.00),
  ('gelateria-bella', 'Gelateria Bella', '#e91e63', '(11) 99999-2222', 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP', 7.50, 20.00,
   '{"segunda": {"open": "11:00", "close": "23:00", "closed": false}, "terca": {"open": "11:00", "close": "23:00", "closed": false}, "quarta": {"open": "11:00", "close": "23:00", "closed": false}, "quinta": {"open": "11:00", "close": "23:00", "closed": false}, "sexta": {"open": "11:00", "close": "00:00", "closed": false}, "sabado": {"open": "11:00", "close": "00:00", "closed": false}, "domingo": {"open": "12:00", "close": "22:00", "closed": false}}', 4, 2.50),
  ('sorveteria-do-ze', 'Sorveteria do Zé', '#3b82f6', '(11) 99999-3333', 'Rua do Sorvete, 456 - Vila Madalena, São Paulo - SP', 4.00, 10.00,
   '{"segunda": {"open": "12:00", "close": "22:00", "closed": false}, "terca": {"open": "12:00", "close": "22:00", "closed": false}, "quarta": {"open": "12:00", "close": "22:00", "closed": false}, "quinta": {"open": "12:00", "close": "22:00", "closed": false}, "sexta": {"open": "12:00", "close": "23:00", "closed": false}, "sabado": {"open": "12:00", "close": "23:00", "closed": false}, "domingo": {"open": "12:00", "close": "22:00", "closed": false}}', 2, 1.50);

-- ============================================
-- SEED DATA - CATEGORIAS E PRODUTOS
-- ============================================
DO $$
DECLARE
    v_joao UUID;
    v_bella UUID;
    v_ze UUID;
BEGIN
    SELECT id INTO v_joao FROM tenants WHERE slug = 'acai-do-joao';
    SELECT id INTO v_bella FROM tenants WHERE slug = 'gelateria-bella';
    SELECT id INTO v_ze FROM tenants WHERE slug = 'sorveteria-do-ze';

    -- Categorias para João
    INSERT INTO categories (tenant_id, name, icon, display_order, is_active) VALUES
      (v_joao, 'Açaí', '🍇', 1, true),
      (v_joao, 'Sorvetes', '🍦', 2, true),
      (v_joao, 'Cremes', '🥄', 3, true),
      (v_joao, 'Complementos', '🍯', 4, true);

    -- Categorias para Bella
    INSERT INTO categories (tenant_id, name, icon, display_order, is_active) VALUES
      (v_bella, 'Gelatos', '🍨', 1, true),
      (v_bella, 'Sorbets', '🍧', 2, true),
      (v_bella, 'Coberturas', '🍫', 3, true);

    -- Categorias para Zé
    INSERT INTO categories (tenant_id, name, icon, display_order, is_active) VALUES
      (v_ze, 'Sorvetes', '🍦', 1, true),
      (v_ze, 'Picolés', '🍭', 2, true),
      (v_ze, 'Adicionais', '🍪', 3, true);

    -- Produtos para João
    INSERT INTO products (tenant_id, category_id, name, description, price, is_available, display_order, prep_time_minutes, is_featured) VALUES
      (v_joao, (SELECT id FROM categories WHERE tenant_id = v_joao AND name = 'Açaí' LIMIT 1), 'Açaí Tradicional', 'Açaí puro com granola e banana', 18.90, true, 1, 5, true),
      (v_joao, (SELECT id FROM categories WHERE tenant_id = v_joao AND name = 'Açaí' LIMIT 1), 'Açaí Zero Açúcar', 'Açaí sem adição de açúcar', 20.90, true, 2, 5, true),
      (v_joao, (SELECT id FROM categories WHERE tenant_id = v_joao AND name = 'Açaí' LIMIT 1), 'Açaí Premium', 'Açaí com frutas vermelhas e mel', 22.90, true, 3, 5, false),
      (v_joao, (SELECT id FROM categories WHERE tenant_id = v_joao AND name = 'Sorvetes' LIMIT 1), 'Sorvete de Açaí', 'Sorvete cremoso de açaí', 16.90, true, 4, 3, false),
      (v_joao, (SELECT id FROM categories WHERE tenant_id = v_joao AND name = 'Cremes' LIMIT 1), 'Creme de Cupuaçu', 'Creme amazônico tradicional', 19.90, true, 5, 4, true),
      (v_joao, (SELECT id FROM categories WHERE tenant_id = v_joao AND name = 'Complementos' LIMIT 1), 'Leite Condensado', 'Adicional', 2.00, true, 6, 1, false),
      (v_joao, (SELECT id FROM categories WHERE tenant_id = v_joao AND name = 'Complementos' LIMIT 1), 'Granola Extra', 'Adicional', 2.00, true, 7, 1, false),
      (v_joao, (SELECT id FROM categories WHERE tenant_id = v_joao AND name = 'Complementos' LIMIT 1), 'Frutas da Estação', 'Adicional', 3.00, true, 8, 2, false);

    -- Delivery zones para João
    INSERT INTO delivery_zones (tenant_id, name, min_distance_km, max_distance_km, fee, is_active) VALUES
      (v_joao, 'Centro', 0, 3, 5.00, true),
      (v_joao, 'Bairros Próximos', 3, 8, 8.00, true),
      (v_joao, 'Região Metropolitana', 8, 15, 12.00, true);

    -- Produtos para Bella
    INSERT INTO products (tenant_id, category_id, name, description, price, is_available, display_order, prep_time_minutes, is_featured) VALUES
      (v_bella, (SELECT id FROM categories WHERE tenant_id = v_bella AND name = 'Gelatos' LIMIT 1), 'Gelato Pistache', 'Gelato artesanal de pistache', 14.90, true, 1, 3, true),
      (v_bella, (SELECT id FROM categories WHERE tenant_id = v_bella AND name = 'Gelatos' LIMIT 1), 'Gelato Stracciatella', 'Gelato de creme com flocos de chocolate', 13.90, true, 2, 3, false),
      (v_bella, (SELECT id FROM categories WHERE tenant_id = v_bella AND name = 'Sorbets' LIMIT 1), 'Sorbet Frutas Vermelhas', 'Sorbet refrescante de frutas vermelhas', 12.90, true, 3, 2, true);

    -- Produtos para Zé
    INSERT INTO products (tenant_id, category_id, name, description, price, is_available, display_order, prep_time_minutes, is_featured) VALUES
      (v_ze, (SELECT id FROM categories WHERE tenant_id = v_ze AND name = 'Sorvetes' LIMIT 1), 'Sorvete Chocolate', 'Sorvete cremoso de chocolate belga', 12.90, true, 1, 3, true),
      (v_ze, (SELECT id FROM categories WHERE tenant_id = v_ze AND name = 'Sorvetes' LIMIT 1), 'Sorvete Baunilha', 'Sorvete clássico de baunilha', 11.90, true, 2, 3, false),
      (v_ze, (SELECT id FROM categories WHERE tenant_id = v_ze AND name = 'Picolés' LIMIT 1), 'Picolé Frutas', 'Picolé natural de frutas', 6.90, true, 3, 1, true);
END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 'TENANTS' as table_name, count(*) as rows FROM tenants
UNION ALL SELECT 'CATEGORIES', count(*) FROM categories
UNION ALL SELECT 'PRODUCTS', count(*) FROM products
UNION ALL SELECT 'DELIVERY_ZONES', count(*) FROM delivery_zones;
