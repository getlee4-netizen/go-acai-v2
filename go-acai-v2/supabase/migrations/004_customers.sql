-- 004_customers.sql - Customers table and triggers

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    phone TEXT NOT NULL,
    name TEXT,
    email TEXT,
    cep TEXT,
    address TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    preferences JSONB DEFAULT '{"notifications": true, "marketing": false, "favorite_categories": [], "dietary_restrictions": []}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone)
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Trigger to update updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);

-- Function to create customer profile on order creation (if not exists)
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

-- Trigger on order insert to create/update customer
CREATE TRIGGER trigger_create_customer_on_order
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_customer_on_order();