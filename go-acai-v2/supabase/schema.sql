-- Supabase Schema - Execute no Supabase Dashboard → SQL Editor

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabelas principais
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

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(200),
    email VARCHAR(200),
    addresses JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{"notifications": true, "marketing": false, "favorite_categories": [], "dietary_restrictions": []}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone)
);

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

CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    subscription JSONB NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(30) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Seed data (3 tenants demo)
INSERT INTO tenants (slug, name, primary_color, whatsapp, address, delivery_fee, minimum_order, working_hours, installments, price_per_km) VALUES
  ('acai-do-joao', 'Açaí do João', '#d946ef', '(11) 99999-1111', 'Rua das Açaís, 123 - Centro, São Paulo - SP', 5.00, 15.00,
   '{"segunda": {"open": "10:00", "close": "22:00", "closed": false}, "terca": {"open": "10:00", "close": "22:00", "closed": false}, "quarta": {"open": "10:00", "close": "22:00", "closed": false}, "quinta": {"open": "10:00", "close": "22:00", "closed": false}, "sexta": {"open": "10:00", "close": "23:00", "closed": false}, "sabado": {"open": "10:00", "close": "23:00", "closed": false}, "domingo": {"open": "10:00", "close": "22:00", "closed": false}}', 3, 2.00),
  ('gelateria-bella', 'Gelateria Bella', '#e91e63', '(11) 99999-2222', 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP', 7.50, 20.00,
   '{"segunda": {"open": "11:00", "close": "23:00", "closed": false}, "terca": {"open": "11:00", "close": "23:00", "closed": false}, "quarta": {"open": "11:00", "close": "23:00", "closed": false}, "quinta": {"open": "11:00", "close": "23:00", "closed": false}, "sexta": {"open": "11:00", "close": "00:00", "closed": false}, "sabado": {"open": "11:00", "close": "00:00", "closed": false}, "domingo": {"open": "12:00", "close": "22:00", "closed": false}}', 4, 2.50),
  ('sorveteria-do-ze', 'Sorveteria do Zé', '#3b82f6', '(11) 99999-3333', 'Rua do Sorvete, 456 - Vila Madalena, São Paulo - SP', 4.00, 10.00,
   '{"segunda": {"open": "12:00", "close": "22:00", "closed": false}, "terca": {"open": "12:00", "close": "22:00", "closed": false}, "quarta": {"open": "12:00", "close": "22:00", "closed": false}, "quinta": {"open": "12:00", "close": "22:00", "closed": false}, "sexta": {"open": "12:00", "close": "23:00", "closed": false}, "sabado": {"open": "12:00", "close": "23:00", "closed": false}, "domingo": {"open": "12:00", "close": "22:00", "closed": false}}', 2, 1.50);

-- Categorias e produtos (exemplo para acai-do-joao)
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