'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Circle,
  MapPin,
  CreditCard,
  Smartphone,
  Truck,
  Home,
  X,
  Loader2,
  AlertCircle,
  Heart,
  Star,
  Minus,
  Plus,
  Trash2,
  Clock,
  Check,
  ExternalLink,
  ShoppingCart,
  Wallet,
  ChevronUp,
} from 'lucide-react';
import { cn, formatCurrency, formatPhone, validatePhone, generateOrderNumber, fetchCEP, calculateDistance } from '@/utils/helpers';
import { supabase } from '@/lib/supabase';
import { useOrderStore, useOrderFlow } from '@/hooks/useOrderStore';
import type { Tenant, Category, Product, DeliveryZone, OrderItem, Customization } from '@/types';

type StepId = 'phone' | 'type' | 'size' | 'toppings' | 'fruits' | 'extras' | 'cart' | 'checkout' | 'tracking';

type Step = {
  id: StepId;
  label: string;
  icon: typeof Heart;
};

const STEPS: readonly Step[] = [
  { id: 'phone', label: 'Telefone', icon: Smartphone },
  { id: 'type', label: 'Base', icon: Heart },
  { id: 'size', label: 'Tamanho', icon: Circle },
  { id: 'toppings', label: 'Coberturas', icon: Star },
  { id: 'fruits', label: 'Frutas', icon: Star },
  { id: 'extras', label: 'Complementos', icon: Star },
  { id: 'cart', label: 'Carrinho', icon: ShoppingCart },
  { id: 'checkout', label: 'Checkout', icon: CreditCard },
  { id: 'tracking', label: 'Acompanhar', icon: Truck },
] as const;

interface OrderAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

interface LocalCartItem {
  product: Product;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations: Customization[];
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-50 to-white dark:from-dark-950 dark:to-dark-950 p-4">
      <div className="max-w-md mx-auto space-y-6 pt-32">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse space-y-3">
            <div className="h-4 bg-dark-200 dark:bg-dark-700 rounded-full w-3/4" />
            <div className="h-3 bg-dark-200 dark:bg-dark-700 rounded-full w-1/2" />
            <div className="h-32 bg-dark-200 dark:bg-dark-700 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyCart({ tenant, onGoBack }: { tenant: Tenant; onGoBack: () => void }) {
  return (
    <div className="max-w-md mx-auto space-y-6 text-center pt-8">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-3xl mx-auto"
        style={{ backgroundColor: `${tenant.primary_color}15` }}
      >
        <ShoppingCart className="h-12 w-12" style={{ color: tenant.primary_color }} />
      </div>
      <div>
        <h2 className="font-bold text-xl text-dark-900 dark:text-white mb-2">Carrinho vazio</h2>
        <p className="text-dark-500 dark:text-dark-400 text-sm">Adicione itens para continuar</p>
      </div>
      <button
        onClick={onGoBack}
        className="px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-200 active:scale-95"
        style={{ backgroundColor: tenant.primary_color }}
      >
        Voltar e Escolher
      </button>
    </div>
  );
}

function FloatingCartBar({
  tenant,
  count,
  total,
  onGoToCart,
}: {
  tenant: Tenant;
  count: number;
  total: number;
  onGoToCart: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none">
      <button
        onClick={onGoToCart}
        className="w-full pointer-events-auto"
      >
        <div
          className="flex items-center justify-between p-4 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.primary_color}dd)`,
            boxShadow: `0 8px 30px ${tenant.primary_color}40`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">{count} {count === 1 ? 'item' : 'itens'} no carrinho</p>
              <p className="text-xs opacity-80">{formatCurrency(total)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Ver Carrinho</span>
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </button>
    </div>
  );
}

function BackToTop({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show || !visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-50 h-10 w-10 rounded-full bg-dark-900/80 text-white backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-dark-800 transition-all duration-300 active:scale-90"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}

function ProductImage({ product, size = 'md' }: { product: Product; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-12 w-12 rounded-xl text-lg',
    md: 'h-16 w-16 rounded-2xl text-2xl',
    lg: 'h-24 w-24 rounded-3xl text-3xl',
  };

  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        className={cn(sizeClasses[size], 'object-cover bg-dark-100 dark:bg-dark-800')}
      />
    );
  }

  const emojiMap: Record<string, string> = {
    'açaí': '🫐', 'acai': '🫐', 'sorvete': '🍦', 'combo': '🍽️',
    'cobertura': '🍫', 'fruta': '🍓', 'complemento': '🥜', 'base': '🫐',
  };
  const name = product.name.toLowerCase();
  const emoji = Object.entries(emojiMap).find(([k]) => name.includes(k))?.[1] || '🍦';

  return (
    <div
      className={cn(sizeClasses[size], 'flex items-center justify-center bg-dark-100 dark:bg-dark-800')}
    >
      {emoji}
    </div>
  );
}

export default function CustomerAppPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');

  const {
    customer,
    setCustomer,
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    currentStep,
    setStep,
    resetFlow,
    deliveryType,
    setDeliveryType,
    deliveryAddress,
    setDeliveryAddress,
    deliveryZone,
    setDeliveryZone,
    deliveryFee,
    setDeliveryFee,
    paymentMethod,
    setPaymentMethod,
    order,
    setOrder,
    getCartTotal,
    getCartCount,
  } = useOrderStore();

  const { nextStep, prevStep, steps } = useOrderFlow();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (tenantError) throw tenantError;
        setTenant(tenantData);

        const [cats, prods, zones] = await Promise.all([
          supabase.from('categories').select('*').eq('tenant_id', tenantData.id).eq('is_active', true).order('display_order'),
          supabase.from('products').select('*').eq('tenant_id', tenantData.id).eq('is_available', true).order('display_order'),
          supabase.from('delivery_zones').select('*').eq('tenant_id', tenantData.id).eq('is_active', true).order('min_distance_km'),
        ]);

        if (!cats.error) setCategories(cats.data || []);
        if (!prods.error) setProducts(prods.data || []);
        if (!zones.error) setDeliveryZones(zones.data || []);
      } catch (err) {
        setError('Erro ao carregar loja');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  useEffect(() => {
    if (tenant) {
      document.title = `${tenant.name} - GO AÇAÍ`;
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) metaThemeColor.setAttribute('content', tenant.primary_color);
    }
  }, [tenant]);

  const handlePhoneSubmit = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!validatePhone(cleanPhone)) {
      alert('Número inválido. Digite um telefone com DDD, exemplo: (11) 99999-8888');
      return;
    }

    try {
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .eq('phone', cleanPhone)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (customerData) {
        setCustomer(customerData);
      } else {
        setCustomer({
          id: '',
          tenant_id: tenant!.id,
          phone: cleanPhone,
          name: null,
          email: null,
          addresses: [],
          preferences: { notifications: true, marketing: false, favorite_categories: [], dietary_restrictions: [] },
          created_at: '',
          updated_at: '',
        });
      }
      nextStep();
    } catch (err) {
      console.error(err);
      alert('Erro ao buscar cliente');
    }
  };

  const handleCustomerRegister = async (name: string) => {
    if (!customer?.phone) return;
    try {
      const { data, error } = await supabase
        .from('customers')
        .upsert({
          tenant_id: tenant!.id,
          phone: customer.phone,
          name,
        })
        .select()
        .single();

      if (error) throw error;
      setCustomer(data);
      nextStep();
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar');
    }
  };

  const handleSelectType = (categoryId: string) => {
    setSelectedCategory(categoryId);
    nextStep();
  };

  const handleSelectSize = () => nextStep();

  const handleSelectToppings = () => nextStep();

  const handleSelectFruits = () => nextStep();

  const handleSelectExtras = () => nextStep();

  const handleCartConfirm = () => nextStep();

  const handleCheckout = async () => {
    if (deliveryType === 'delivery' && !deliveryAddress) {
      setShowAddressModal(true);
      return;
    }

    try {
      const generatedNumber = generateOrderNumber();
      const subtotal = getCartTotal();
      const total = subtotal + (deliveryType === 'delivery' ? deliveryFee : 0);

      const orderItems = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        customizations: item.customizations || [],
      }));

      const newOrder = {
        tenant_id: tenant!.id,
        customer_id: customer?.id || null,
        customer_name: customer?.name || 'Cliente',
        customer_phone: customer?.phone || '',
        order_number: generatedNumber,
        items: orderItems,
        subtotal,
        delivery_fee: deliveryType === 'delivery' ? deliveryFee : 0,
        total,
        address: deliveryType === 'delivery' && deliveryAddress
          ? deliveryAddress
          : { street: 'Retirada no local', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '' },
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'pix' ? 'pending' : 'paid',
        status: 'pending' as const,
        notes: '',
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (error) throw error;

      setOrder(data);
      setOrderNumber(generatedNumber);
      clearCart();
      nextStep();
    } catch (err) {
      console.error(err);
      alert('Erro ao finalizar pedido');
    }
  };

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setDeliveryAddress((prev: any) => prev ? {
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
          zip_code: cleanCep,
        } : {
          street: data.logradouro,
          number: '',
          complement: '',
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
          zip_code: cleanCep,
        });
      } else {
        alert('CEP não encontrado');
      }
    } catch {
      alert('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  };

  const calculateDeliveryFee = (address: { latitude?: number; longitude?: number }) => {
    if (!tenant) return;
    if (address.latitude && address.longitude && tenant.latitude && tenant.longitude) {
      const distance = calculateDistance(
        tenant.latitude,
        tenant.longitude,
        address.latitude,
        address.longitude
      );
      const zone = deliveryZones.find(z => distance >= z.min_distance_km && distance <= z.max_distance_km);
      const fee = zone?.fee || tenant.delivery_fee;
      setDeliveryFee(fee);
      setDeliveryZone(zone || null);
    } else {
      setDeliveryFee(tenant.delivery_fee);
      setDeliveryZone(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Loja não encontrada</h1>
          <Link href="/" className="text-acai-600 hover:underline">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 'phone':
        return <StepPhone onSubmit={handlePhoneSubmit} tenant={tenant} />;
      case 'type':
        return <StepType categories={categories} selectedCategory={selectedCategory} onSelect={handleSelectType} tenant={tenant} />;
      case 'size':
        return <StepSize products={products} categories={categories} selectedCategory={selectedCategory} onSelect={handleSelectSize} tenant={tenant} />;
      case 'toppings':
        return <StepToppings products={products} categories={categories} onNext={handleSelectToppings} tenant={tenant} />;
      case 'fruits':
        return <StepFruits products={products} categories={categories} onNext={handleSelectFruits} tenant={tenant} />;
      case 'extras':
        return <StepExtras products={products} categories={categories} onNext={handleSelectExtras} tenant={tenant} />;
      case 'cart':
        if (items.length === 0) return <EmptyCart tenant={tenant} onGoBack={prevStep} />;
        return <StepCart items={items} onConfirm={handleCartConfirm} onBack={prevStep} tenant={tenant} deliveryFee={deliveryFee} deliveryType={deliveryType} getCartTotal={getCartTotal} />;
      case 'checkout':
        return (
          <StepCheckout
            tenant={tenant}
            customer={customer}
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
            deliveryZones={deliveryZones}
            deliveryFee={deliveryFee}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onSubmit={handleCheckout}
            onBack={prevStep}
            showAddressModal={showAddressModal}
            setShowAddressModal={setShowAddressModal}
            cepLoading={cepLoading}
            onCepSearch={handleCepSearch}
            calculateDeliveryFee={calculateDeliveryFee}
            getCartTotal={getCartTotal}
          />
        );
      case 'tracking':
        return <StepTracking order={order} orderNumber={orderNumber} tenant={tenant} onNewOrder={resetFlow} />;
      default:
        return null;
    }
  };

  const showFloatingBar = currentStep !== 'phone' && currentStep !== 'type' && currentStep !== 'tracking' && currentStep !== 'cart';

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-dark-50 to-white dark:from-dark-950 dark:to-dark-950"
      style={{ '--primary-color': tenant.primary_color } as React.CSSProperties}
    >
      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-dark-100/50 dark:bg-dark-800/50 backdrop-blur-sm">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${tenant.primary_color}, ${tenant.primary_color}cc)`,
            boxShadow: `0 0 20px ${tenant.primary_color}40`,
          }}
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-dark-950/80 backdrop-blur-xl border-b border-dark-200/30 dark:border-dark-700/30">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => currentStep !== 'phone' && prevStep()}
            className="p-2 rounded-2xl hover:bg-dark-100/50 dark:hover:bg-dark-800/50 transition-all duration-300 active:scale-90"
          >
            <ChevronLeft className="h-5 w-5 text-dark-600 dark:text-dark-400" />
          </button>
          <div className="flex-1 flex items-center justify-center px-4">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto" />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-2xl text-white font-bold text-lg shadow-lg"
                style={{ background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.primary_color}dd)` }}
              >
                {tenant.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="w-10" />
        </div>

        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 min-w-max justify-center">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                disabled={index > currentStepIndex}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-300',
                  index < currentStepIndex
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : index === currentStepIndex
                    ? 'text-white shadow-lg'
                    : 'bg-dark-100/50 dark:bg-dark-800/50 text-dark-400 dark:text-dark-500'
                )}
                style={{
                  backgroundColor: index === currentStepIndex ? tenant.primary_color : undefined,
                  boxShadow: index === currentStepIndex ? `0 4px 15px ${tenant.primary_color}40` : undefined,
                }}
              >
                <step.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-4" style={{ minHeight: '100vh' }}>
        <div
          key={currentStep}
          className="animate-[fadeIn_0.25s_ease-out]"
        >
          {renderStep()}
        </div>
      </main>

      {showFloatingBar && getCartCount() > 0 && (
        <FloatingCartBar
          tenant={tenant}
          count={getCartCount()}
          total={getCartTotal()}
          onGoToCart={() => setStep('cart')}
        />
      )}

      <BackToTop show={currentStep === 'toppings' || currentStep === 'fruits' || currentStep === 'extras'} />

      {showAddressModal && (
        <AddressModal
          tenant={tenant}
          onClose={() => setShowAddressModal(false)}
          onCepSearch={handleCepSearch}
          cepLoading={cepLoading}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          calculateDeliveryFee={calculateDeliveryFee}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function AddressModal({
  tenant,
  onClose,
  onCepSearch,
  cepLoading,
  deliveryAddress,
  setDeliveryAddress,
  calculateDeliveryFee,
}: {
  tenant: Tenant;
  onClose: () => void;
  onCepSearch: (cep: string) => void;
  cepLoading: boolean;
  deliveryAddress: any;
  setDeliveryAddress: any;
  calculateDeliveryFee: (address: { latitude?: number; longitude?: number }) => void;
}) {
  const [localAddress, setLocalAddress] = useState({
    street: deliveryAddress?.street || '',
    number: deliveryAddress?.number || '',
    complement: deliveryAddress?.complement || '',
    neighborhood: deliveryAddress?.neighborhood || '',
    city: deliveryAddress?.city || '',
    state: deliveryAddress?.state || '',
    zip_code: deliveryAddress?.zip_code || '',
    reference: deliveryAddress?.reference || '',
  });

  const updateField = (field: string, value: string) => {
    setLocalAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const address = {
      ...localAddress,
      latitude: deliveryAddress?.latitude || null,
      longitude: deliveryAddress?.longitude || null,
    };
    setDeliveryAddress(address);
    calculateDeliveryFee(address);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl">
      <div className="bg-white dark:bg-dark-900 rounded-3xl shadow-elevated max-w-md w-full max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease-out]">
        <div className="p-5 border-b border-dark-200/50 dark:border-dark-700/50 flex items-center justify-between">
          <h3 className="font-bold text-lg text-dark-900 dark:text-white">Endereço de Entrega</h3>
          <button onClick={onClose} className="p-2 rounded-2xl hover:bg-dark-100/50 dark:hover:bg-dark-800/50 transition-all duration-300 active:scale-90">
            <X className="h-5 w-5 text-dark-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">CEP</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="00000-000"
                className="input flex-1"
                value={localAddress.zip_code}
                onChange={e => updateField('zip_code', e.target.value)}
                onBlur={e => onCepSearch(e.target.value)}
                disabled={cepLoading}
              />
              {cepLoading && <Loader2 className="h-5 w-5 animate-spin text-acai-500 mt-10 mr-2" />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rua</label>
              <input
                className="input"
                placeholder="Rua"
                value={localAddress.street}
                onChange={e => updateField('street', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Número</label>
              <input
                className="input"
                placeholder="Nº"
                value={localAddress.number}
                onChange={e => updateField('number', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Complemento</label>
            <input
              className="input"
              placeholder="Apto, Bloco, etc."
              value={localAddress.complement}
              onChange={e => updateField('complement', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Bairro</label>
              <input
                className="input"
                placeholder="Bairro"
                value={localAddress.neighborhood}
                onChange={e => updateField('neighborhood', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input
                className="input"
                placeholder="Cidade"
                value={localAddress.city}
                onChange={e => updateField('city', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Estado</label>
              <input
                className="input"
                placeholder="UF"
                maxLength={2}
                value={localAddress.state}
                onChange={e => updateField('state', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Referência</label>
              <input
                className="input"
                placeholder="Ex: Próximo à padaria"
                value={localAddress.reference}
                onChange={e => updateField('reference', e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-semibold border-2 border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 transition-all duration-200 active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 rounded-2xl font-semibold text-white transition-all duration-200 active:scale-95"
              style={{ backgroundColor: tenant.primary_color }}
            >
              Salvar e Continuar
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function StepPhone({ onSubmit, tenant }: { onSubmit: (phone: string) => void; tenant: Tenant }) {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, '');
    if (validatePhone(clean)) {
      setSubmitting(true);
      onSubmit(clean);
    } else {
      alert('Digite um telefone válido com DDD');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 text-center">
      <div className="space-y-4">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl mx-auto shadow-lg transition-transform duration-300 hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.primary_color}dd)`,
            boxShadow: `0 8px 30px ${tenant.primary_color}30`,
          }}
        >
          <span className="text-4xl">📱</span>
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-dark-900 dark:text-white mb-2">Qual seu telefone?</h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm">Vamos buscar seu cadastro ou criar um novo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="phone" className="sr-only">Telefone</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            className="input text-center text-lg py-4 rounded-2xl"
            maxLength={15}
            required
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={submitting || phone.replace(/\D/g, '').length < 10}
          className="w-full py-4 text-base font-semibold rounded-2xl text-white disabled:opacity-40 group transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.primary_color}dd)`,
            boxShadow: `0 4px 20px ${tenant.primary_color}40`,
          }}
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Buscando...</span>
            </div>
          ) : (
            <>
              <span>Continuar</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <p className="text-[11px] text-dark-400 dark:text-dark-500 leading-relaxed">
        Ao continuar, você concorda com nossos{' '}
        <Link href="#" className="underline hover:text-acai-600 dark:hover:text-acai-400 transition-colors">Termos de Uso</Link>{' '}
        e{' '}
        <Link href="#" className="underline hover:text-acai-600 dark:hover:text-acai-400 transition-colors">Política de Privacidade</Link>
      </p>
    </div>
  );
}

function StepType({ categories, selectedCategory, onSelect, tenant }: { categories: Category[]; selectedCategory: string | null; onSelect: (id: string) => void; tenant: Tenant }) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="font-display font-bold text-2xl text-dark-900 dark:text-white mb-2">Escolha sua base</h2>
        <p className="text-sm text-dark-500 dark:text-dark-400">Selecione o tipo de açaí que deseja</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="p-6 text-center rounded-2xl border-2 transition-all duration-200 active:scale-95"
            style={{
              borderColor: selectedCategory === cat.id ? tenant.primary_color : undefined,
              boxShadow: selectedCategory === cat.id ? `0 8px 30px ${tenant.primary_color}25, 0 0 0 2px ${tenant.primary_color}40` : undefined,
              backgroundColor: selectedCategory === cat.id ? `${tenant.primary_color}10` : undefined,
            }}
          >
            <span className="text-4xl block mb-3">{cat.icon || '🍦'}</span>
            <span className="font-semibold text-dark-900 dark:text-white">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSize({ products, categories, selectedCategory, onSelect, tenant }: { products: Product[]; categories: Category[]; selectedCategory: string | null; onSelect: () => void; tenant: Tenant }) {
  const { addItem } = useOrderStore();
  const categoryProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-bold text-2xl text-dark-900 dark:text-white text-center">Escolha o tamanho</h2>

      <div className="space-y-3">
        {categoryProducts.map(product => (
          <button
            key={product.id}
            onClick={() => {
              addItem(product, 1);
              onSelect();
            }}
            className="w-full p-4 rounded-2xl border-2 border-dark-200 dark:border-dark-700 hover:border-acai-300 transition-all duration-200 text-left active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <ProductImage product={product} size="sm" />
                <div className="min-w-0">
                  <p className="font-bold text-dark-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400 truncate">{product.description || ''}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-lg" style={{ color: tenant.primary_color }}>
                  {formatCurrency(product.price)}
                </p>
                <p className="text-xs text-dark-400">~{product.prep_time_minutes}min</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepToppings({ products, categories, onNext, tenant }: { products: Product[]; categories: Category[]; onNext: () => void; tenant: Tenant }) {
  const { addItem, removeItem } = useOrderStore();
  const toppings = products.filter(p => categories.find(c => c.id === p.category_id)?.name?.toLowerCase().includes('cobertura'));
  const [selected, setSelected] = useState<Record<string, number>>({});

  const handleToggle = (product: Product) => {
    const current = selected[product.id] || 0;
    const next = current > 0 ? 0 : 1;
    const newSelected = { ...selected, [product.id]: next };
    setSelected(newSelected);

    if (next > 0) {
      addItem(product, 1);
    } else {
      removeItem(product.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-bold text-2xl text-dark-900 dark:text-white text-center">Coberturas</h2>
      <p className="text-center text-dark-500 dark:text-dark-400">Até 2 grátis, adicionais R$ 1,50 cada</p>

      <div className="grid grid-cols-2 gap-3">
        {toppings.map(topping => {
          const count = selected[topping.id] || 0;
          return (
            <button
              key={topping.id}
              onClick={() => handleToggle(topping)}
              className="p-4 rounded-2xl border-2 transition-all duration-200 text-center active:scale-95"
              style={{
                borderColor: count > 0 ? tenant.primary_color : undefined,
                backgroundColor: count > 0 ? `${tenant.primary_color}15` : undefined,
              }}
            >
              <span className="text-2xl block">{topping.name}</span>
              <div className="flex items-center justify-center gap-2 mt-2">
                {count > 0 && (
                  <>
                    <span className="font-bold" style={{ color: tenant.primary_color }}>{count}x</span>
                    <span className="text-xs text-dark-500">
                      {count <= 2 ? 'Grátis' : `+${formatCurrency(1.50)}`}
                    </span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={onNext} className="w-full py-3 font-semibold rounded-2xl text-white transition-all duration-200 active:scale-95" style={{ backgroundColor: tenant.primary_color }}>Continuar</button>
    </div>
  );
}

function StepFruits({ products, categories, onNext, tenant }: { products: Product[]; categories: Category[]; onNext: () => void; tenant: Tenant }) {
  const { addItem, removeItem } = useOrderStore();
  const fruits = products.filter(p => categories.find(c => c.id === p.category_id)?.name?.toLowerCase().includes('fruta'));
  const [selected, setSelected] = useState<Record<string, number>>({});

  const handleToggle = (product: Product) => {
    const current = selected[product.id] || 0;
    const next = current > 0 ? 0 : 1;
    const newSelected = { ...selected, [product.id]: next };
    setSelected(newSelected);

    if (next > 0) {
      addItem(product, 1);
    } else {
      removeItem(product.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-bold text-2xl text-dark-900 dark:text-white text-center">Frutas</h2>

      <div className="grid grid-cols-2 gap-3">
        {fruits.map(fruit => (
          <button
            key={fruit.id}
            onClick={() => handleToggle(fruit)}
            className="p-4 rounded-2xl border-2 transition-all duration-200 text-center active:scale-95"
            style={{
              borderColor: selected[fruit.id] > 0 ? tenant.primary_color : undefined,
              backgroundColor: selected[fruit.id] > 0 ? `${tenant.primary_color}15` : undefined,
            }}
          >
            <span className="text-2xl block">{fruit.name}</span>
            {selected[fruit.id] > 0 && (
              <span className="text-xs font-medium" style={{ color: tenant.primary_color }}>
                {selected[fruit.id]}x selecionado
              </span>
            )}
          </button>
        ))}
      </div>

      <button onClick={onNext} className="w-full py-3 font-semibold rounded-2xl text-white transition-all duration-200 active:scale-95" style={{ backgroundColor: tenant.primary_color }}>Continuar</button>
    </div>
  );
}

function StepExtras({ products, categories, onNext, tenant }: { products: Product[]; categories: Category[]; onNext: () => void; tenant: Tenant }) {
  const { addItem, removeItem } = useOrderStore();
  const extras = products.filter(p => categories.find(c => c.id === p.category_id)?.name?.toLowerCase().includes('complemento'));
  const [selected, setSelected] = useState<Record<string, number>>({});

  const handleToggle = (product: Product) => {
    const current = selected[product.id] || 0;
    const next = current > 0 ? 0 : 1;
    const newSelected = { ...selected, [product.id]: next };
    setSelected(newSelected);

    if (next > 0) {
      addItem(product, 1);
    } else {
      removeItem(product.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-bold text-2xl text-dark-900 dark:text-white text-center">Complementos</h2>
      <p className="text-center text-dark-500 dark:text-dark-400">R$ 2,00 cada</p>

      <div className="grid grid-cols-2 gap-3">
        {extras.map(extra => (
          <button
            key={extra.id}
            onClick={() => handleToggle(extra)}
            className="p-4 rounded-2xl border-2 transition-all duration-200 text-center active:scale-95"
            style={{
              borderColor: selected[extra.id] > 0 ? tenant.primary_color : undefined,
              backgroundColor: selected[extra.id] > 0 ? `${tenant.primary_color}15` : undefined,
            }}
          >
            <span className="text-2xl block">{extra.name}</span>
            {selected[extra.id] > 0 && (
              <span className="text-xs font-medium" style={{ color: tenant.primary_color }}>
                {selected[extra.id]}x - {formatCurrency(2 * selected[extra.id])}
              </span>
            )}
          </button>
        ))}
      </div>

      <button onClick={onNext} className="w-full py-3 font-semibold rounded-2xl text-white transition-all duration-200 active:scale-95" style={{ backgroundColor: tenant.primary_color }}>Continuar</button>
    </div>
  );
}

function StepCart({
  items,
  onConfirm,
  onBack,
  tenant,
  deliveryFee,
  deliveryType,
  getCartTotal,
}: {
  items: any[];
  onConfirm: () => void;
  onBack: () => void;
  tenant: Tenant;
  deliveryFee: number;
  deliveryType: 'delivery' | 'pickup';
  getCartTotal: () => number;
}) {
  const { updateQuantity, removeItem } = useOrderStore();
  const subtotal = getCartTotal();
  const total = subtotal + (deliveryType === 'delivery' ? deliveryFee : 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-bold text-2xl text-dark-900 dark:text-white text-center">Seu Carrinho</h2>

      <div className="card divide-y divide-dark-200 dark:divide-dark-700">
        {items.map((item: LocalCartItem, index: number) => (
          <div key={index} className="p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {item.product && <ProductImage product={item.product} size="sm" />}
                <p className="font-medium text-dark-900 dark:text-white">{item.product_name}</p>
              </div>
              {item.customizations && item.customizations.length > 0 && (
                <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                  {item.customizations.map((c: Customization) => `${c.name}${c.quantity > 1 ? ` (${c.quantity}x)` : ''}`).join(', ')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  className="p-1 rounded hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors active:scale-90"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-medium px-3">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  className="p-1 rounded hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors active:scale-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="ml-auto p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors active:scale-90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-dark-900 dark:text-white">{formatCurrency(item.total_price)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-dark-600 dark:text-dark-400">
          <span>Subtotal</span>
          <span>{formatCurrency(getCartTotal())}</span>
        </div>
        {deliveryType === 'delivery' && (
          <div className="flex justify-between text-dark-600 dark:text-dark-400">
            <span>Taxa de entrega</span>
            <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-dark-200 dark:border-dark-700 pt-3">
          <span className="font-bold text-lg text-dark-900 dark:text-white">Total</span>
          <span className="font-bold text-lg" style={{ color: tenant.primary_color }}>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-2xl font-semibold border-2 border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 transition-all duration-200 active:scale-95">Voltar</button>
        <button onClick={onConfirm} className="flex-1 py-3 text-lg rounded-2xl font-semibold text-white transition-all duration-200 active:scale-95" style={{ backgroundColor: tenant.primary_color }}>Finalizar Pedido</button>
      </div>
    </div>
  );
}

function StepCheckout({
  tenant,
  customer,
  deliveryType,
  setDeliveryType,
  deliveryAddress,
  setDeliveryAddress,
  deliveryZones,
  deliveryFee,
  paymentMethod,
  setPaymentMethod,
  onSubmit,
  onBack,
  showAddressModal,
  setShowAddressModal,
  cepLoading,
  onCepSearch,
  calculateDeliveryFee,
  getCartTotal,
}: any) {
  const subtotal = getCartTotal();
  const total = subtotal + (deliveryType === 'delivery' ? deliveryFee : 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-bold text-2xl text-dark-900 dark:text-white text-center">Finalizar Pedido</h2>

      <div className="card p-4">
        <h3 className="font-bold text-dark-900 dark:text-white mb-4">Forma de Entrega</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDeliveryType('delivery')}
            className="p-4 rounded-xl border-2 text-center transition-all duration-200 active:scale-95"
            style={{
              borderColor: deliveryType === 'delivery' ? tenant.primary_color : undefined,
              backgroundColor: deliveryType === 'delivery' ? `${tenant.primary_color}15` : undefined,
            }}
          >
            <Truck className="h-8 w-8 mx-auto mb-2" style={{ color: deliveryType === 'delivery' ? tenant.primary_color : undefined }} />
            <p className="font-medium">Entrega</p>
            <p className="text-xs text-dark-500">Receba em casa</p>
          </button>
          <button
            onClick={() => setDeliveryType('pickup')}
            className="p-4 rounded-xl border-2 text-center transition-all duration-200 active:scale-95"
            style={{
              borderColor: deliveryType === 'pickup' ? tenant.primary_color : undefined,
              backgroundColor: deliveryType === 'pickup' ? `${tenant.primary_color}15` : undefined,
            }}
          >
            <Home className="h-8 w-8 mx-auto mb-2" style={{ color: deliveryType === 'pickup' ? tenant.primary_color : undefined }} />
            <p className="font-medium">Retirada</p>
            <p className="text-xs text-dark-500">Buscar na loja</p>
          </button>
        </div>
      </div>

      {deliveryType === 'delivery' && (
        <div className="card p-4 space-y-4">
          <h3 className="font-bold text-dark-900 dark:text-white">Endereço de Entrega</h3>
          {deliveryAddress ? (
            <div className="p-3 rounded-xl bg-dark-50 dark:bg-dark-800/50">
              <p className="font-medium text-dark-900 dark:text-white">{deliveryAddress.street}, {deliveryAddress.number}</p>
              <p className="text-sm text-dark-500">{deliveryAddress.neighborhood}, {deliveryAddress.city} - {deliveryAddress.state}</p>
              <button onClick={() => setShowAddressModal(true)} className="text-sm mt-2" style={{ color: tenant.primary_color }}>
                Alterar endereço
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAddressModal(true)} className="btn-outline w-full">
              <MapPin className="h-4 w-4 mr-2" /> Adicionar endereço
            </button>
          )}
        </div>
      )}

      <div className="card p-4">
        <h3 className="font-bold text-dark-900 dark:text-white mb-4">Forma de Pagamento</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'pix', label: 'PIX', icon: Smartphone },
            { id: 'credit_card', label: 'Cartão', icon: CreditCard },
            { id: 'cash', label: 'Dinheiro', icon: Wallet },
          ].map(pay => (
            <button
              key={pay.id}
              onClick={() => setPaymentMethod(pay.id as any)}
              className="p-4 rounded-xl border-2 text-center transition-all duration-200 active:scale-95"
              style={{
                borderColor: paymentMethod === pay.id ? tenant.primary_color : undefined,
                backgroundColor: paymentMethod === pay.id ? `${tenant.primary_color}15` : undefined,
              }}
            >
              <pay.icon className="h-6 w-6 mx-auto mb-2" style={{ color: paymentMethod === pay.id ? tenant.primary_color : undefined }} />
              <p className="font-medium text-sm">{pay.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex justify-between text-dark-600 dark:text-dark-400">
          <span>Subtotal</span>
          <span>{formatCurrency(getCartTotal())}</span>
        </div>
        {deliveryType === 'delivery' && deliveryFee > 0 && (
          <div className="flex justify-between text-dark-600 dark:text-dark-400">
            <span>Taxa de entrega</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-dark-200 dark:border-dark-700 pt-3">
          <span className="font-bold text-lg text-dark-900 dark:text-white">Total</span>
          <span className="font-bold text-lg" style={{ color: tenant.primary_color }}>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-2xl font-semibold border-2 border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 transition-all duration-200 active:scale-95">Voltar</button>
        <button onClick={onSubmit} className="flex-1 py-3 text-lg rounded-2xl font-semibold text-white transition-all duration-200 active:scale-95" style={{ backgroundColor: tenant.primary_color }}>Confirmar Pedido</button>
      </div>
    </div>
  );
}

function StepTracking({
  order,
  orderNumber,
  tenant,
  onNewOrder,
}: {
  order: any;
  orderNumber: string;
  tenant: Tenant;
  onNewOrder: () => void;
}) {
  const [liveOrder, setLiveOrder] = useState(order);

  const stages = [
    { id: 'pending', label: 'Recebido', icon: Clock },
    { id: 'confirmed', label: 'Confirmado', icon: CheckCircle },
    { id: 'preparing', label: 'Preparando', icon: Loader2 },
    { id: 'ready', label: 'Pronto', icon: CheckCircle },
    { id: 'out_for_delivery', label: 'Saiu p/ entrega', icon: Truck },
    { id: 'delivered', label: 'Entregue', icon: CheckCircle },
  ];

  const currentIndex = stages.findIndex(s => s.id === liveOrder?.status) ?? 0;
  const displayNumber = orderNumber || liveOrder?.order_number || liveOrder?.id?.slice(0, 8)?.toUpperCase() || '---';

  useEffect(() => {
    if (!liveOrder?.id) return;

    const channel = supabase
      .channel(`order-${liveOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${liveOrder.id}`,
        },
        (payload) => {
          setLiveOrder((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveOrder?.id]);

  useEffect(() => {
    if (order) setLiveOrder(order);
  }, [order]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center">
      <div className="p-6 rounded-2xl" style={{ backgroundColor: `${tenant.primary_color}15` }}>
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full mx-auto mb-4 animate-bounce"
          style={{ backgroundColor: tenant.primary_color }}
        >
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <h2 className="font-display font-bold text-2xl text-dark-900 dark:text-white">Pedido Confirmado!</h2>
        <p className="text-dark-500 dark:text-dark-400 mt-1">
          Número: <span className="font-mono font-bold" style={{ color: tenant.primary_color }}>{displayNumber}</span>
        </p>
      </div>

      <div className="card p-6">
        <div className="relative">
          <div className="absolute top-8 left-8 right-8 h-1 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${currentIndex >= 0 ? ((currentIndex) / (stages.length - 1)) * 100 : 0}%`,
                background: `linear-gradient(90deg, ${tenant.primary_color}, ${tenant.primary_color}cc)`,
              }}
            />
          </div>
          <div className="flex justify-between relative z-10">
            {stages.map((stage, index) => {
              const isActive = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div key={stage.id} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-16 w-16 items-center justify-center rounded-full mb-2 transition-all duration-500',
                      isCurrent && 'animate-pulse'
                    )}
                    style={{
                      backgroundColor: isActive ? tenant.primary_color : undefined,
                      color: isActive ? 'white' : undefined,
                      boxShadow: isCurrent ? `0 0 0 4px ${tenant.primary_color}40` : undefined,
                    }}
                  >
                    {!isActive && (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dark-200 dark:bg-dark-700 text-dark-400">
                        <stage.icon className="h-7 w-7" />
                      </div>
                    )}
                    {isActive && (
                      <stage.icon className={cn('h-7 w-7', isCurrent && stage.id === 'preparing' && 'animate-spin')} />
                    )}
                  </div>
                  <span className={cn('text-[10px] font-medium text-center leading-tight max-w-[60px]', isActive ? 'text-dark-900 dark:text-white' : 'text-dark-500')}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-4 w-4" style={{ color: tenant.primary_color }} />
          <p className="font-medium text-dark-900 dark:text-white">
            Status: <span style={{ color: tenant.primary_color }} className="font-bold capitalize">{liveOrder?.status?.replace('_', ' ') || 'Pendente'}</span>
          </p>
        </div>
        <p className="text-sm text-dark-500 dark:text-dark-400">Seu pedido está sendo preparado com carinho 💜</p>
      </div>

      <button
        onClick={onNewOrder}
        className="w-full py-3 rounded-2xl font-semibold text-white transition-all duration-200 active:scale-95"
        style={{ backgroundColor: tenant.primary_color }}
      >
        Fazer Novo Pedido
      </button>
    </div>
  );
}
