export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  address: string;
  delivery_fee: number;
  minimum_order: number;
  working_hours: Record<string, { open: string; close: string; closed: boolean }>;
  installments: number;
  price_per_km: number;
  latitude: number | null;
  longitude: number | null;
  cep: string | null;
  whatsapp: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  tenant_id: string;
  name: string;
  min_distance_km: number;
  max_distance_km: number;
  fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  prep_time_minutes: number;
  is_featured: boolean;
  nutritional_info: NutritionalInfo | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  address: Address;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes: string | null;
  estimated_delivery_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations: Customization[];
  subtotal: number;
  options?: Record<string, unknown>;
}

export interface Customization {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Address {
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'online';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Customer {
  id: string;
  tenant_id: string;
  phone: string;
  name: string | null;
  email: string | null;
  addresses: Address[];
  preferences: CustomerPreferences;
  created_at: string;
  updated_at: string;
}

export interface CustomerPreferences {
  notifications: boolean;
  marketing: boolean;
  favorite_categories: string[];
  dietary_restrictions: string[];
}

export interface BannerConfig {
  id: string;
  tenant_id: string;
  is_active: boolean;
  title: string;
  subtitle: string;
  background_color: string;
  text_color: string;
  image_url: string | null;
  link_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  subscription: PushSubscriptionJSON;
  user_agent: string | null;
  created_at: string;
}

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}