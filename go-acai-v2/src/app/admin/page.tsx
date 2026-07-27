'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  RefreshCw,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  DollarSign,
  CreditCard,
  Users,
  ArrowRight,
  Image as ImageIcon,
  Palette,
  Upload,
  Save,
  ExternalLink,
  Menu,
} from 'lucide-react';
import { cn, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/utils/helpers';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'categories', label: 'Categorias', icon: Tag },
  { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

interface Tenant {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  delivery_fee: number;
  minimum_order: number;
  working_hours: Record<string, { open: string; close: string; closed: boolean }>;
  installments: number;
  price_per_km: number;
  address: string;
  whatsapp: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  category_id: string | null;
  display_order: number;
  prep_time_minutes: number;
  is_featured: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean;
  display_order: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{ product_name: string; quantity: number; total_price: number }>;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: string;
  address: Record<string, string>;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [activeTab, setActiveTab] = useState<TabId>((searchParams?.get('tab') as TabId) || 'dashboard');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [prevActiveCount, setPrevActiveCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  useEffect(() => {
    const storedTenant = localStorage.getItem('goacai_tenant');
    if (!storedTenant) {
      router.push('/login');
      return;
    }
    loadTenant(storedTenant);
  }, [router]);

  useEffect(() => {
    if (tenant) {
      loadProducts();
      loadCategories();
      loadOrders();
      const cleanup = setupRealtime();

      // Polling fallback - check for new orders every 10 seconds
      const pollInterval = setInterval(() => {
        loadOrders();
      }, 10000);

      return () => { cleanup?.(); clearInterval(pollInterval); };
    }
  }, [tenant]);

  useEffect(() => {
    const activeOrders = orders.filter(o =>
      ['pending', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
    ).length;

    if (prevActiveCount > 0 && activeOrders > prevActiveCount && soundEnabled) {
      playNotificationSound();
      setToast({ message: `🔔 Novo pedido recebido!`, type: 'info' });
      setTimeout(() => setToast(null), 5000);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Novo Pedido!', {
          body: `Você tem ${activeOrders - prevActiveCount} novo(s) pedido(s) pendente(s)`,
          icon: '/favicon.ico',
        });
      }
    }
    setPrevActiveCount(activeOrders);
  }, [orders, prevActiveCount, soundEnabled, playNotificationSound]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadTenant = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setTenant(data);
    } catch (err) {
      console.error('Error loading tenant:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!tenant) return;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('display_order', { ascending: true });
    if (!error) setProducts(data || []);
  };

  const loadCategories = async () => {
    if (!tenant) return;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('display_order', { ascending: true });
    if (!error) setCategories(data || []);
  };

  const loadOrders = async () => {
    if (!tenant) return;
    try {
      const res = await fetch(`/api/orders?tenant_id=${tenant.id}`);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch {
      // Fallback to direct query
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error) setOrders(data || []);
    }
  };

  const setupRealtime = () => {
    if (!tenant) return;

    const channel = supabase
      .channel(`admin-orders-${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          loadOrders();
          if (payload.eventType === 'INSERT') {
            setNewOrdersCount(prev => prev + 1);
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem('goacai_tenant');
    router.push('/login');
  };

  const getStatusColorClass = (status: string) => getStatusColor(status);
  const getStatusLabelText = (status: string) => getStatusLabel(status);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-acai-500 to-purple-600 animate-pulse-soft" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-acai-500 to-purple-600 animate-ping opacity-20" />
          </div>
          <p className="text-sm text-dark-400 dark:text-dark-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="min-h-screen bg-dark-50/50 dark:bg-dark-950 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-r border-dark-200/50 dark:border-dark-700/50 flex flex-col z-50 transition-transform duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 border-b border-dark-200/50 dark:border-dark-700/50 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-acai-500 to-purple-600 shadow-colored group-hover:shadow-colored-lg transition-all duration-300">
                <span className="text-white font-bold text-lg">G</span>
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-lg text-dark-900 dark:text-white block leading-tight">GO AÇAÍ</span>
              <p className="text-[11px] text-dark-400 dark:text-dark-500 truncate max-w-[140px]">{tenant.name}</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-xl hover:bg-dark-100/50 dark:hover:bg-dark-800/50">
            <X className="h-5 w-5 text-dark-400" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Menu administrativo">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-acai-500/10 to-purple-500/10 dark:from-acai-500/20 dark:to-purple-500/20 text-acai-700 dark:text-acai-300 shadow-sm border border-acai-200/50 dark:border-acai-700/30'
                  : 'text-dark-500 dark:text-dark-400 hover:bg-dark-100/50 dark:hover:bg-dark-800/50 hover:text-dark-700 dark:hover:text-dark-300'
              )}
            >
              <tab.icon className="h-4.5 w-4.5" aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-dark-200/50 dark:border-dark-700/50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-dark-500 dark:text-dark-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
          >
            <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/60 dark:bg-dark-900/60 backdrop-blur-xl border-b border-dark-200/30 dark:border-dark-700/30">
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-dark-100/50 dark:hover:bg-dark-800/50">
                <Menu className="h-5 w-5 text-dark-600 dark:text-dark-300" />
              </button>
              <h1 className="font-display font-bold text-lg sm:text-xl text-dark-900 dark:text-white">
                {TABS.find(t => t.id === activeTab)?.label}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/app/${tenant?.slug}`}
                target="_blank"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium bg-gradient-to-r from-acai-500 to-purple-600 text-white hover:from-acai-600 hover:to-purple-700 transition-all duration-300 shadow-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Ver Loja
              </Link>
              <Link
                href={`/app/${tenant?.slug}`}
                target="_blank"
                className="sm:hidden p-2.5 rounded-2xl bg-gradient-to-r from-acai-500 to-purple-600 text-white shadow-sm"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>

              <button
                onClick={loadOrders}
                className="p-2.5 rounded-2xl text-dark-400 dark:text-dark-500 hover:bg-dark-100/50 dark:hover:bg-dark-800/50 hover:text-dark-600 dark:hover:text-dark-300 transition-all duration-300"
                aria-label="Atualizar pedidos"
              >
                <RefreshCw className="h-4.5 w-4.5" />
              </button>

              <div className="relative">
                <button className="relative p-2.5 rounded-2xl text-dark-400 dark:text-dark-500 hover:bg-dark-100/50 dark:hover:bg-dark-800/50 hover:text-dark-600 dark:hover:text-dark-300 transition-all duration-300" aria-label="Notificações">
                  <Bell className="h-4.5 w-4.5" />
                  {newOrdersCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-bounce-gentle">
                      {newOrdersCount > 9 ? '9+' : newOrdersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {toast && (
          <div className="mx-3 sm:mx-4 md:mx-6 mt-3 p-4 rounded-2xl bg-gradient-to-r from-acai-500 to-purple-600 text-white font-medium text-sm shadow-lg animate-[slideDown_0.3s_ease-out] flex items-center gap-3">
            <Bell className="h-5 w-5 animate-bounce" />
            {toast.message}
          </div>
        )}

        <div className="p-3 sm:p-4 md:p-6">
          {activeTab === 'dashboard' && <DashboardTab tenant={tenant} orders={orders} onNavigate={setActiveTab} />}
          {activeTab === 'products' && <ProductsTab tenant={tenant} products={products} categories={categories} onRefresh={loadProducts} />}
          {activeTab === 'categories' && <CategoriesTab tenant={tenant} categories={categories} onRefresh={loadCategories} />}
          {activeTab === 'orders' && <OrdersTab tenant={tenant} orders={orders} onRefresh={loadOrders} />}
          {activeTab === 'analytics' && <AnalyticsTab tenant={tenant} orders={orders} />}
          {activeTab === 'settings' && <SettingsTab tenant={tenant} onUpdate={(data) => setTenant({ ...tenant, ...data })} />}
        </div>
      </main>
    </div>
  );
}

function DashboardTab({ tenant, orders, onNavigate }: { tenant: Tenant; orders: Order[]; onNavigate: (tab: TabId) => void }) {
  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready', 'out_for_delivery'].includes(o.status));
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

  const stats = [
    { label: 'Faturamento Hoje', value: formatCurrency(todayRevenue), icon: DollarSign, gradient: 'from-emerald-500 to-teal-500', bgLight: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Pedidos Hoje', value: todayOrders.length.toString(), icon: ShoppingCart, gradient: 'from-blue-500 to-cyan-500', bgLight: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Ticket Médio', value: formatCurrency(avgTicket), icon: Users, gradient: 'from-violet-500 to-purple-500', bgLight: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Pendentes', value: activeOrders.length.toString(), icon: Clock, gradient: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={stat.label} 
            className="premium-card p-5 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-dark-400 dark:text-dark-500 mb-1.5 uppercase tracking-wider">{stat.label}</p>
                <p className="font-display font-bold text-2xl text-dark-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={cn('p-3 rounded-2xl bg-gradient-to-br', stat.gradient, 'text-white shadow-lg')}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-5 border-b border-dark-200/50 dark:border-dark-700/50 flex items-center justify-between">
            <h2 className="font-bold text-dark-900 dark:text-white">Pedidos Recentes</h2>
            <span className="badge badge-primary">{orders.length} total</span>
          </div>
          <div className="divide-y divide-dark-200/30 dark:divide-dark-700/30">
            {orders.slice(0, 10).map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-dark-50/50 dark:hover:bg-dark-800/30 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className={cn('status-dot', getStatusColor(order.status))} />
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white text-sm">{order.customer_name}</p>
                    <p className="text-xs text-dark-400 dark:text-dark-500">{formatCurrency(order.total)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('badge text-[10px]', getStatusColor(order.status))}>
                    {getStatusLabel(order.status)}
                  </span>
                  <span className="text-[11px] text-dark-400 dark:text-dark-500">{formatDate(order.created_at)}</span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">🛒</div>
                <p className="text-sm text-dark-400 dark:text-dark-500 font-medium">Nenhum pedido ainda</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b border-dark-200/50 dark:border-dark-700/50">
            <h2 className="font-bold text-dark-900 dark:text-white">Ações Rápidas</h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate('products')} className="premium-card p-5 text-center group">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-acai-500 to-purple-600 text-white mb-3 shadow-colored group-hover:shadow-colored-lg transition-all duration-300 group-hover:scale-110">
                <Plus className="h-5 w-5" />
              </div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Novo Produto</p>
            </button>
            <button onClick={() => onNavigate('categories')} className="premium-card p-5 text-center group">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-3 shadow-lg group-hover:scale-110 transition-all duration-300">
                <Tag className="h-5 w-5" />
              </div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Nova Categoria</p>
            </button>
            <button onClick={() => onNavigate('orders')} className="premium-card p-5 text-center group">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white mb-3 shadow-lg group-hover:scale-110 transition-all duration-300">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Ver Pedidos</p>
            </button>
            <button onClick={() => onNavigate('settings')} className="premium-card p-5 text-center group">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white mb-3 shadow-lg group-hover:scale-110 transition-all duration-300">
                <Settings className="h-5 w-5" />
              </div>
              <p className="font-semibold text-dark-900 dark:text-white text-sm">Configurações</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ tenant, products, categories, onRefresh }: { tenant: Tenant; products: Product[]; categories: Category[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    is_available: true,
    display_order: 0,
    prep_time_minutes: 10,
    is_featured: false,
    image_url: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category_id: '',
      is_available: true,
      display_order: 0,
      prep_time_minutes: 10,
      is_featured: false,
      image_url: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await supabase.from('products').update(formData).eq('id', editingProduct.id);
      } else {
        await supabase.from('products').insert({ ...formData, tenant_id: tenant.id });
      }
      setShowModal(false);
      setEditingProduct(null);
      onRefresh();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-dark-900 dark:text-white">Produtos</h2>
        <button onClick={() => { setEditingProduct(null); resetForm(); setShowModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Novo Produto
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700 text-left text-sm text-dark-500 dark:text-dark-400">
                <th className="p-3 font-medium">Produto</th>
                <th className="p-3 font-medium">Categoria</th>
                <th className="p-3 font-medium">Preço</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200 dark:divide-dark-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {product.image_url && (
                        <img src={product.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-dark-900 dark:text-white">{product.name}</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">Prep: {product.prep_time_minutes}min</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="badge badge-primary">{categories.find(c => c.id === product.category_id)?.name || 'Sem categoria'}</span>
                  </td>
                  <td className="p-3 font-medium text-dark-900 dark:text-white">{formatCurrency(product.price)}</td>
                  <td className="p-3">
                    <span className={cn('badge', product.is_available ? 'badge-success' : 'badge-warning')}>
                      {product.is_available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingProduct(product); setFormData({ ...product, description: product.description || '', category_id: product.category_id || '', image_url: product.image_url || '' }); setShowModal(true); }} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800" aria-label="Editar">
                        <Edit className="h-4 w-4 text-dark-500" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Excluir">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-dark-500 dark:text-dark-400">Nenhum produto cadastrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-elevated max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-4 border-b border-dark-200 dark:border-dark-700 flex items-center justify-between">
              <h3 className="font-bold text-dark-900 dark:text-white">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => { setShowModal(false); setEditingProduct(null); }} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input" rows={3} />
              </div>
              <div>
                <label className="label">Preço *</label>
                <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="input" required />
              </div>
              <div>
                <label className="label">Categoria</label>
                <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="input">
                  <option value="">Selecione</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tempo de preparo (min)</label>
                  <input type="number" value={formData.prep_time_minutes} onChange={e => setFormData({...formData, prep_time_minutes: parseInt(e.target.value) || 0})} className="input" />
                </div>
                <div>
                  <label className="label">Ordem de exibição</label>
                  <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} className="input" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="available" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} className="h-4 w-4 rounded border-dark-300 text-acai-600" />
                <label htmlFor="available" className="text-sm text-dark-700 dark:text-dark-300">Disponível</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} className="h-4 w-4 rounded border-dark-300 text-acai-600" />
                <label htmlFor="featured" className="text-sm text-dark-700 dark:text-dark-300">Destaque</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingProduct(null); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesTab({ tenant, categories, onRefresh }: { tenant: Tenant; categories: Category[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '', is_active: true, display_order: 0 });

  const resetForm = () => setFormData({ name: '', icon: '', is_active: true, display_order: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await supabase.from('categories').update(formData).eq('id', editingCategory.id);
      } else {
        await supabase.from('categories').insert({ ...formData, tenant_id: tenant.id });
      }
      setShowModal(false);
      setEditingCategory(null);
      onRefresh();
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      await supabase.from('categories').delete().eq('id', id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-dark-900 dark:text-white">Categorias</h2>
        <button onClick={() => { setEditingCategory(null); resetForm(); setShowModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Nova Categoria
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700 text-left text-sm text-dark-500 dark:text-dark-400">
                <th className="p-3 font-medium">Ícone</th>
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Ordem</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200 dark:divide-dark-700">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/50">
                  <td className="p-3 text-2xl">{category.icon || '📦'}</td>
                  <td className="p-3 font-medium text-dark-900 dark:text-white">{category.name}</td>
                  <td className="p-3 text-dark-500 dark:text-dark-400">{category.display_order}</td>
                  <td className="p-3">
                    <span className={cn('badge', category.is_active ? 'badge-success' : 'badge-warning')}>
                      {category.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingCategory(category); setFormData({ name: category.name, icon: category.icon || '', is_active: category.is_active, display_order: category.display_order }); setShowModal(true); }} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800" aria-label="Editar">
                        <Edit className="h-4 w-4 text-dark-500" />
                      </button>
                      <button onClick={() => handleDelete(category.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Excluir">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-elevated max-w-md w-full animate-scale-in">
            <div className="p-4 border-b border-dark-200 dark:border-dark-700 flex items-center justify-between">
              <h3 className="font-bold text-dark-900 dark:text-white">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button onClick={() => { setShowModal(false); setEditingCategory(null); }} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Ícone (Emoji)</label>
                <input type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="input" placeholder="🍦" maxLength={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ordem</label>
                  <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} className="input" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="h-4 w-4 rounded border-dark-300 text-acai-600" />
                  <label htmlFor="active" className="text-sm text-dark-700 dark:text-dark-300">Ativa</label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingCategory(null); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersTab({ tenant, orders, onRefresh }: { tenant: Tenant; orders: Order[]; onRefresh: () => void }) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendente' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'ready', label: 'Pronto' },
    { value: 'out_for_delivery', label: 'Saiu para entrega' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (search && !order.customer_name.toLowerCase().includes(search.toLowerCase()) && !order.id.includes(search)) return false;
    return true;
  });

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="font-bold text-dark-900 dark:text-white">Pedidos</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pedido..." className="input pl-10" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-auto">
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700 text-left text-sm text-dark-500 dark:text-dark-400">
                <th className="p-3 font-medium">Pedido</th>
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Itens</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Pagamento</th>
                <th className="p-3 font-medium">Data</th>
                <th className="p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200 dark:divide-dark-700">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/50">
                  <td className="p-3 font-mono text-sm text-dark-900 dark:text-white">#{order.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <p className="font-medium text-dark-900 dark:text-white">{order.customer_name}</p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">{order.customer_phone}</p>
                  </td>
                  <td className="p-3">
                    <div className="max-h-16 overflow-y-auto text-sm text-dark-600 dark:text-dark-400">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span>{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-medium text-dark-900 dark:text-white">{formatCurrency(order.total)}</td>
                  <td className="p-3">
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className={cn('badge px-2 py-1 text-xs', getStatusColor(order.status))}
                    >
                      {statusOptions.filter(o => o.value !== 'all').map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-dark-600 dark:text-dark-400 capitalize">{order.payment_method}</td>
                  <td className="p-3 text-sm text-dark-500 dark:text-dark-400">{formatDate(order.created_at)}</td>
                  <td className="p-3">
                    {order.status === 'delivered' || order.status === 'cancelled' ? (
                      <button onClick={() => { if (confirm('Excluir permanentemente?')) supabase.from('orders').delete().eq('id', order.id).then(onRefresh); }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Excluir">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    ) : (
                      <span className="text-xs text-dark-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-dark-500 dark:text-dark-400">Nenhum pedido encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab({ tenant, orders }: { tenant: Tenant; orders: Order[] }) {
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= new Date(Date.now() - 7 * 86400000));
  const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= new Date(Date.now() - 30 * 86400000));

  const revenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const revenueWeek = thisWeekOrders.reduce((sum, o) => sum + o.total, 0);
  const revenueMonth = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="premium-card p-6">
          <p className="text-xs font-semibold text-dark-400 dark:text-dark-500 mb-2 uppercase tracking-wider">Hoje</p>
          <p className="font-display font-bold text-3xl text-dark-900 dark:text-white mb-1">{formatCurrency(revenueToday)}</p>
          <p className="text-sm text-dark-400 dark:text-dark-500">{todayOrders.length} pedidos</p>
        </div>
        <div className="premium-card p-6">
          <p className="text-xs font-semibold text-dark-400 dark:text-dark-500 mb-2 uppercase tracking-wider">Esta Semana</p>
          <p className="font-display font-bold text-3xl text-dark-900 dark:text-white mb-1">{formatCurrency(revenueWeek)}</p>
          <p className="text-sm text-dark-400 dark:text-dark-500">{thisWeekOrders.length} pedidos</p>
        </div>
        <div className="premium-card p-6">
          <p className="text-xs font-semibold text-dark-400 dark:text-dark-500 mb-2 uppercase tracking-wider">Este Mês</p>
          <p className="font-display font-bold text-3xl text-dark-900 dark:text-white mb-1">{formatCurrency(revenueMonth)}</p>
          <p className="text-sm text-dark-400 dark:text-dark-500">{thisMonthOrders.length} pedidos</p>
        </div>
      </div>

      <div className="card">
        <div className="p-5 border-b border-dark-200/50 dark:border-dark-700/50">
          <h3 className="font-bold text-dark-900 dark:text-white">Status dos Pedidos</h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map(status => {
            const count = orders.filter(o => o.status === status).length;
            return (
              <div key={status} className="premium-card p-4 text-center group">
                <p className="text-[11px] font-semibold text-dark-400 dark:text-dark-500 mb-2 uppercase tracking-wider">{getStatusLabel(status)}</p>
                <p className={cn('font-display font-bold text-3xl', getStatusColor(status))}>{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ tenant, onUpdate }: { tenant: Tenant; onUpdate: (data: Partial<Tenant>) => void }) {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'delivery', label: 'Entrega', icon: Truck },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'logo', label: 'Logo', icon: ImageIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <nav className="card p-2 space-y-1" aria-label="Seções de configurações">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300',
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-acai-500/10 to-purple-500/10 dark:from-acai-500/20 dark:to-purple-500/20 text-acai-700 dark:text-acai-300 shadow-sm border border-acai-200/50 dark:border-acai-700/30'
                    : 'text-dark-500 dark:text-dark-400 hover:bg-dark-100/50 dark:hover:bg-dark-800/50 hover:text-dark-700 dark:hover:text-dark-300'
                )}
              >
                <section.icon className="h-4.5 w-4.5" />
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'general' && <GeneralSettings tenant={tenant} onUpdate={onUpdate} />}
          {activeSection === 'appearance' && <AppearanceSettings tenant={tenant} onUpdate={onUpdate} />}
          {activeSection === 'delivery' && <DeliverySettings tenant={tenant} onUpdate={onUpdate} />}
          {activeSection === 'payments' && <PaymentsSettings tenant={tenant} />}
          {activeSection === 'notifications' && <NotificationsSettings tenant={tenant} />}
          {activeSection === 'logo' && <LogoSettings tenant={tenant} onUpdate={onUpdate} />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({ tenant, onUpdate }: { tenant: Tenant; onUpdate: (data: Partial<Tenant>) => void }) {
  const [name, setName] = useState(tenant.name);
  const [whatsapp, setWhatsapp] = useState(tenant.whatsapp);
  const [address, setAddress] = useState(tenant.address);
  const [deliveryFee, setDeliveryFee] = useState(tenant.delivery_fee);
  const [minimumOrder, setMinimumOrder] = useState(tenant.minimum_order);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = { name, whatsapp, address, delivery_fee: deliveryFee, minimum_order: minimumOrder };
    const { error } = await supabase.from('tenants').update(data).eq('id', tenant.id);
    if (!error) {
      onUpdate(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      <h3 className="font-bold text-dark-900 dark:text-white">Informações Gerais</h3>
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4" />
          Configurações salvas com sucesso!
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="label">Nome da Loja</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Slug (URL)</label>
          <input type="text" defaultValue={tenant.slug} className="input" disabled />
          <p className="text-xs text-dark-500 dark:text-dark-400">O slug não pode ser alterado</p>
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="input" placeholder="(11) 99999-9999" />
        </div>
        <div>
          <label className="label">Endereço</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)} className="input" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Taxa de Entrega</label>
            <input type="number" step="0.01" value={deliveryFee} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} className="input" />
          </div>
          <div>
            <label className="label">Pedido Mínimo</label>
            <input type="number" step="0.01" value={minimumOrder} onChange={e => setMinimumOrder(parseFloat(e.target.value) || 0)} className="input" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar Alterações</>}
        </button>
      </div>
    </div>
  );
}

function AppearanceSettings({ tenant, onUpdate }: { tenant: Tenant; onUpdate: (data: Partial<Tenant>) => void }) {
  const [primaryColor, setPrimaryColor] = useState(tenant.primary_color);
  const [workingHours, setWorkingHours] = useState(tenant.working_hours || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = { primary_color: primaryColor, working_hours: workingHours };
    const { error } = await supabase.from('tenants').update(data).eq('id', tenant.id);
    if (!error) {
      onUpdate(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const updateDay = (day: string, field: string, value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      <h3 className="font-bold text-dark-900 dark:text-white">Aparência</h3>
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4" />
          Aparência salva com sucesso!
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="label">Cor Primária</label>
          <div className="flex items-center gap-4">
            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-10 w-10 rounded-lg border border-dark-300 dark:border-dark-600 cursor-pointer" />
            <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="input flex-1 font-mono" />
          </div>
        </div>
        <div>
          <label className="label">Horário de Funcionamento</label>
          <div className="space-y-2">
            {days.map(day => (
              <div key={day} className="flex items-center gap-2">
                <label className="w-24 text-sm text-dark-700 dark:text-dark-300 capitalize">{day}</label>
                <input
                  type="checkbox"
                  checked={workingHours[day]?.closed !== true}
                  onChange={e => updateDay(day, 'closed', !e.target.checked)}
                  className="h-4 w-4 rounded border-dark-300 text-acai-600"
                />
                <input
                  type="time"
                  value={workingHours[day]?.open || '09:00'}
                  onChange={e => updateDay(day, 'open', e.target.value)}
                  className="input w-24"
                />
                <span className="text-dark-400">até</span>
                <input
                  type="time"
                  value={workingHours[day]?.close || '22:00'}
                  onChange={e => updateDay(day, 'close', e.target.value)}
                  className="input w-24"
                />
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar Aparência</>}
        </button>
      </div>
    </div>
  );
}

function DeliverySettings({ tenant, onUpdate }: { tenant: Tenant; onUpdate: (data: Partial<Tenant>) => void }) {
  const [pricePerKm, setPricePerKm] = useState(tenant.price_per_km);
  const [installments, setInstallments] = useState(tenant.installments);
  const [zones, setZones] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tenant) {
      supabase
        .from('delivery_zones')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('min_distance_km')
        .then(({ data }) => setZones(data || []));
    }
  }, [tenant]);

  const handleSave = async () => {
    setSaving(true);
    const data = { price_per_km: pricePerKm, installments };
    const { error } = await supabase.from('tenants').update(data).eq('id', tenant.id);
    if (!error) {
      onUpdate(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const updateZone = (index: number, field: string, value: any) => {
    setZones(prev => prev.map((z, i) => i === index ? { ...z, [field]: value } : z));
  };

  const addZone = () => {
    setZones(prev => [...prev, { name: '', min_distance_km: 0, max_distance_km: 0, fee: 0, tenant_id: tenant.id }]);
  };

  const removeZone = async (index: number) => {
    const zone = zones[index];
    if (zone.id) {
      await supabase.from('delivery_zones').delete().eq('id', zone.id);
    }
    setZones(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      <h3 className="font-bold text-dark-900 dark:text-white">Configurações de Entrega</h3>
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4" />
          Configurações de entrega salvas!
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Taxa por Km</label>
            <input type="number" step="0.01" value={pricePerKm} onChange={e => setPricePerKm(parseFloat(e.target.value) || 0)} className="input" />
          </div>
          <div>
            <label className="label">Parcelamento Máximo</label>
            <input type="number" value={installments} onChange={e => setInstallments(parseInt(e.target.value) || 1)} className="input" />
          </div>
        </div>

        <h4 className="font-semibold text-dark-900 dark:text-white">Zonas de Entrega</h4>
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 p-2 bg-dark-50 dark:bg-dark-800/50 rounded-xl text-sm font-medium text-dark-500 dark:text-dark-400">
            <span>Nome</span>
            <span>Distância (km)</span>
            <span>Taxa</span>
            <span></span>
          </div>
          {zones.map((zone, i) => (
            <div key={zone.id || i} className="grid grid-cols-4 gap-2 items-center">
              <input type="text" value={zone.name || ''} onChange={e => updateZone(i, 'name', e.target.value)} className="input" placeholder="Nome da zona" />
              <input type="number" step="0.5" value={zone.max_distance_km || ''} onChange={e => updateZone(i, 'max_distance_km', parseFloat(e.target.value) || 0)} className="input" />
              <input type="number" step="0.01" value={zone.fee || ''} onChange={e => updateZone(i, 'fee', parseFloat(e.target.value) || 0)} className="input" />
              <button onClick={() => removeZone(i)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" aria-label="Remover"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={addZone} className="btn-outline justify-self-start">+ Adicionar Zona</button>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar Entrega</>}
        </button>
      </div>
    </div>
  );
}

function PaymentsSettings({ tenant }: { tenant: Tenant }) {
  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      <h3 className="font-bold text-dark-900 dark:text-white">Formas de Pagamento</h3>
      <div className="space-y-4">
        {[
          { id: 'pix', label: 'PIX', icon: '💳', enabled: true },
          { id: 'credit_card', label: 'Cartão de Crédito', icon: '💳', enabled: true },
          { id: 'debit_card', label: 'Cartão de Débito', icon: '💳', enabled: true },
          { id: 'cash', label: 'Dinheiro', icon: '💵', enabled: true },
          { id: 'online', label: 'Pagamento Online', icon: '🌐', enabled: false },
        ].map(payment => (
          <div key={payment.id} className="flex items-center justify-between p-4 card">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{payment.icon}</span>
              <div>
                <p className="font-medium text-dark-900 dark:text-white">{payment.label}</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">Disponível para clientes</p>
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked={payment.enabled}
              className="h-5 w-5 rounded border-dark-300 text-acai-600"
            />
          </div>
        ))}
        <button className="btn-primary">Salvar Pagamentos</button>
      </div>
    </div>
  );
}

function NotificationsSettings({ tenant }: { tenant: Tenant }) {
  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      <h3 className="font-bold text-dark-900 dark:text-white">Notificações Push</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 card">
          <div>
            <p className="font-medium text-dark-900 dark:text-white">Notificações de Novo Pedido</p>
            <p className="text-sm text-dark-500 dark:text-dark-400">Receber alerta sonoro e visual no dashboard</p>
          </div>
          <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-dark-300 text-acai-600" />
        </div>
        <div className="flex items-center justify-between p-4 card">
          <div>
            <p className="font-medium text-dark-900 dark:text-white">Notificações de Status</p>
            <p className="text-sm text-dark-500 dark:text-dark-400">Alertar quando pedido muda de status</p>
          </div>
          <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-dark-300 text-acai-600" />
        </div>
        <div className="flex items-center justify-between p-4 card">
          <div>
            <p className="font-medium text-dark-900 dark:text-white">Som de Notificação</p>
            <p className="text-sm text-dark-500 dark:text-dark-400">Tocar som ao receber novo pedido</p>
          </div>
          <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-dark-300 text-acai-600" />
        </div>
        <button className="btn-primary">Salvar Notificações</button>
      </div>
    </div>
  );
}

function LogoSettings({ tenant, onUpdate }: { tenant: Tenant; onUpdate: (data: Partial<Tenant>) => void }) {
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', tenant.id);

      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        console.error('Upload error:', result.error);
        return;
      }

      onUpdate({ logo_url: result.logoUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    const { error } = await supabase.from('tenants').update({ logo_url: null }).eq('id', tenant.id);
    if (!error) {
      onUpdate({ logo_url: null });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      <h3 className="font-bold text-dark-900 dark:text-white">Logo da Loja</h3>
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4" />
          Logo atualizada com sucesso!
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt="Logo atual" className="h-32 w-32 rounded-xl object-cover border border-dark-200 dark:border-dark-700" />
            ) : (
              <div className="h-32 w-32 rounded-xl bg-gradient-to-br from-acai-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-5xl">{tenant.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-dark-900 dark:text-white">Logo Atual</p>
            <p className="text-sm text-dark-500 dark:text-dark-400">Tamanho recomendado: 512x512px</p>
          </div>
        </div>
        <div>
          <label className="label">Nova Logo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="input"
            disabled={uploading}
          />
          <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">PNG, JPG ou WebP. Max 5MB.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" /> Upload e Salvar</>}
          </button>
          {tenant.logo_url && (
            <button onClick={handleRemove} className="btn-outline">Remover Logo</button>
          )}
        </div>
      </div>
    </div>
  );
}