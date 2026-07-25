import { supabase } from '@/lib/supabase';
import type {
  Tenant,
  Category,
  Product,
  Order,
  Customer,
  DeliveryZone,
  BannerConfig,
  PushSubscription,
} from '@/types';

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
  return data;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
  return data;
}

export async function getActiveTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
  return data || [];
}

export async function getCategoriesByTenant(tenantId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function getProductsByTenant(tenantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_available', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data || [];
}

export async function getFeaturedProducts(tenantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_available', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
  return data || [];
}

export async function getProductsByCategory(tenantId: string, categoryId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('category_id', categoryId)
    .eq('is_available', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
  return data || [];
}

export async function getOrdersByTenant(
  tenantId: string,
  status?: Order['status'][]
): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (status && status.length > 0) {
    query = query.in('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data || [];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }
  return data;
}

export async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    return null;
  }
  return data;
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    return null;
  }
  return data;
}

export async function getCustomerByPhone(tenantId: string, phone: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('phone', phone)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching customer:', error);
    }
    return null;
  }
  return data;
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    return null;
  }
  return data;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    return null;
  }
  return data;
}

export async function getDeliveryZones(tenantId: string): Promise<DeliveryZone[]> {
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('min_distance_km', { ascending: true });

  if (error) {
    console.error('Error fetching delivery zones:', error);
    return [];
  }
  return data || [];
}

export async function calculateDeliveryFee(tenantId: string, distanceKm: number): Promise<number> {
  const zones = await getDeliveryZones(tenantId);
  const zone = zones.find(z => distanceKm >= z.min_distance_km && distanceKm <= z.max_distance_km);
  return zone?.fee || 0;
}

export async function getBannerConfig(tenantId: string): Promise<BannerConfig | null> {
  const { data, error } = await supabase
    .from('banner_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching banner config:', error);
    }
    return null;
  }
  return data;
}

export async function saveBannerConfig(config: Omit<BannerConfig, 'id' | 'created_at' | 'updated_at'>): Promise<BannerConfig | null> {
  const { data, error } = await supabase
    .from('banner_configs')
    .upsert({ ...config, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error('Error saving banner config:', error);
    return null;
  }
  return data;
}

export async function savePushSubscription(subscription: Omit<PushSubscription, 'id' | 'created_at'>): Promise<PushSubscription | null> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert(subscription)
    .select()
    .single();

  if (error) {
    console.error('Error saving push subscription:', error);
    return null;
  }
  return data;
}

export async function getPushSubscriptions(tenantId: string): Promise<PushSubscription[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error fetching push subscriptions:', error);
    return [];
  }
  return data || [];
}

export function subscribeToOrders(tenantId: string, callback: (order: Order) => void) {
  const channel = supabase
    .channel(`orders-${tenantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => callback(payload.new as Order)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToOrderUpdates(tenantId: string, callback: (order: Order) => void) {
  const channel = supabase
    .channel(`order-updates-${tenantId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => callback(payload.new as Order)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}