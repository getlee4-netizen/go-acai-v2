import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, Tenant, Customer, Product, Category, DeliveryZone, BannerConfig } from '@/types';

export function useTenant(slug: string) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenant() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        setTenant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar loja');
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchTenant();
  }, [slug]);

  return { tenant, loading, error };
}

export function useCategories(tenantId: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    async function fetchCategories() {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error) setCategories(data || []);
      setLoading(false);
    }

    fetchCategories();
  }, [tenantId]);

  return { categories, loading };
}

export function useProducts(tenantId: string | null, categoryId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    async function fetchProducts() {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_available', true)
        .order('display_order', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (!error) setProducts(data || []);
      setLoading(false);
    }

    fetchProducts();
  }, [tenantId, categoryId]);

  return { products, loading };
}

export function useFeaturedProducts(tenantId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_available', true)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(10);

      if (!error) setProducts(data || []);
      setLoading(false);
    }

    fetchProducts();
  }, [tenantId]);

  return { products, loading };
}

export function useOrders(tenantId: string | null, status?: Order['status'][]) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

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
      setError(error.message);
      setOrders([]);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [tenantId, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!tenantId) return;

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
        (payload) => {
          setOrders((prev) => [payload.new as Order, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id ? (payload.new as Order) : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return { orders, loading, error, refetch: fetchOrders };
}

export function useCustomer(tenantId: string | null, phone: string) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCustomer = useCallback(async () => {
    if (!tenantId || !phone) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
      .single();

    if (!error) setCustomer(data);
    setLoading(false);
  }, [tenantId, phone]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return { customer, loading, refetch: fetchCustomer };
}

export function useDeliveryZones(tenantId: string | null) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    async function fetchZones() {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('min_distance_km', { ascending: true });

      if (!error) setZones(data || []);
      setLoading(false);
    }

    fetchZones();
  }, [tenantId]);

  return { zones, loading };
}

export function useBannerConfig(tenantId: string | null) {
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    async function fetchConfig() {
      setLoading(true);
      const { data, error } = await supabase
        .from('banner_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (!error) setConfig(data);
      setLoading(false);
    }

    fetchConfig();
  }, [tenantId]);

  return { config, loading };
}