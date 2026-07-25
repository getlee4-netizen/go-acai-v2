import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, Customer, Order, OrderItem } from '@/types';

interface CartItem extends OrderItem {
  product: Product;
}

interface OrderState {
  // Customer
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;

  // Cart
  items: CartItem[];
  addItem: (product: Product, quantity?: number, options?: OrderItem['options']) => void;
  removeItem: (productId: string, options?: OrderItem['options']) => void;
  updateQuantity: (productId: string, quantity: number, options?: OrderItem['options']) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  // Order flow
  currentStep: OrderStep;
  setStep: (step: OrderStep) => void;
  resetFlow: () => void;

  // Delivery
  deliveryType: 'delivery' | 'pickup';
  setDeliveryType: (type: 'delivery' | 'pickup') => void;
  deliveryAddress: DeliveryAddress | null;
  setDeliveryAddress: (address: DeliveryAddress | null | ((prev: DeliveryAddress | null) => DeliveryAddress | null)) => void;
  deliveryZone: import('@/types').DeliveryZone | null;
  setDeliveryZone: (zone: import('@/types').DeliveryZone | null) => void;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;

  // Payment
  paymentMethod: Order['payment_method'];
  setPaymentMethod: (method: Order['payment_method']) => void;

  // Order
  order: Order | null;
  setOrder: (order: Order | null) => void;
}

type OrderStep =
  | 'phone'
  | 'type'
  | 'size'
  | 'toppings'
  | 'fruits'
  | 'extras'
  | 'cart'
  | 'checkout'
  | 'tracking';

interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  reference?: string;
}

const stepOrder: OrderStep[] = [
  'phone',
  'type',
  'size',
  'toppings',
  'fruits',
  'extras',
  'cart',
  'checkout',
  'tracking',
];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      // Customer
      customer: null,
      setCustomer: (customer) => set({ customer }),

      // Cart
      items: [],
      addItem: (product, quantity = 1, options = {}) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product_id === product.id &&
              JSON.stringify(item.options) === JSON.stringify(options)
          );

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            newItems[existingIndex].total_price =
              newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
            return { items: newItems };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                product_id: product.id,
                product_name: product.name,
                quantity,
                unit_price: product.price,
                total_price: product.price * quantity,
                options,
                customizations: [],
                subtotal: product.price * quantity,
              },
            ],
          };
        });
      },
      removeItem: (productId, options = {}) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              item.product_id !== productId ||
              JSON.stringify(item.options) !== JSON.stringify(options)
          ),
        }));
      },
      updateQuantity: (productId, quantity, options = {}) => {
        if (quantity <= 0) {
          get().removeItem(productId, options);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId &&
            JSON.stringify(item.options) === JSON.stringify(options)
              ? { ...item, quantity, total_price: item.unit_price * quantity }
              : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.total_price, 0);
      },
      getCartCount: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },

      // Order flow
      currentStep: 'phone',
      setStep: (step) => set({ currentStep: step }),
      resetFlow: () => set({ currentStep: 'phone', items: [], customer: null }),

      // Delivery
      deliveryType: 'delivery',
      setDeliveryType: (type) => set({ deliveryType: type }),
      deliveryAddress: null,
      setDeliveryAddress: (address) => set((state) => ({ deliveryAddress: typeof address === 'function' ? address(state.deliveryAddress) : address })),
      deliveryZone: null,
      setDeliveryZone: (zone) => set({ deliveryZone: zone }),
      deliveryFee: 0,
      setDeliveryFee: (fee) => set({ deliveryFee: fee }),

      // Payment
      paymentMethod: 'pix',
      setPaymentMethod: (method) => set({ paymentMethod: method }),

      // Order
      order: null,
      setOrder: (order) => set({ order }),
    }),
    {
      name: 'go-acai-order',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customer: state.customer,
        items: state.items,
        currentStep: state.currentStep,
        deliveryType: state.deliveryType,
        deliveryAddress: state.deliveryAddress,
        deliveryZone: state.deliveryZone,
        deliveryFee: state.deliveryFee,
        paymentMethod: state.paymentMethod,
        order: state.order,
      }),
    }
  )
);

export function useOrderFlow() {
  const { currentStep, setStep, resetFlow } = useOrderStore();

  const nextStep = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const canGoNext = () => {
    const { items, customer, deliveryAddress, deliveryType } = useOrderStore.getState();

    switch (currentStep) {
      case 'phone':
        return !!customer;
      case 'type':
      case 'size':
      case 'toppings':
      case 'fruits':
      case 'extras':
        return items.length > 0;
      case 'cart':
        return items.length > 0 && customer;
      case 'checkout':
        if (deliveryType === 'delivery') return !!deliveryAddress;
        return true;
      default:
        return false;
    }
  };

  return {
    currentStep,
    setStep,
    nextStep,
    prevStep,
    canGoNext: canGoNext(),
    resetFlow,
    steps: stepOrder,
  };
}