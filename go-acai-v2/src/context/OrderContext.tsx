import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Order, OrderItem, Product, Customer, Address, DeliveryZone } from '@/types';

interface OrderState {
  customer: Customer | null;
  items: OrderItem[];
  currentStep: OrderStep;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress: Address | null;
  deliveryZone: DeliveryZone | null;
  deliveryFee: number;
  paymentMethod: Order['payment_method'];
  notes: string;
  order: Order | null;
}

type OrderStep = 'phone' | 'type' | 'size' | 'toppings' | 'fruits' | 'extras' | 'cart' | 'checkout' | 'tracking';

type OrderAction =
  | { type: 'SET_CUSTOMER'; payload: Customer | null }
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number; customizations: OrderItem['customizations'] } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; customizations: OrderItem['customizations'] } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; customizations: OrderItem['customizations'] } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_STEP'; payload: OrderStep }
  | { type: 'SET_DELIVERY_TYPE'; payload: 'delivery' | 'pickup' }
  | { type: 'SET_DELIVERY_ADDRESS'; payload: Address | null }
  | { type: 'SET_DELIVERY_ZONE'; payload: DeliveryZone | null }
  | { type: 'SET_DELIVERY_FEE'; payload: number }
  | { type: 'SET_PAYMENT_METHOD'; payload: Order['payment_method'] }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SET_ORDER'; payload: Order | null }
  | { type: 'RESET_ORDER' };

const initialState: OrderState = {
  customer: null,
  items: [],
  currentStep: 'phone',
  deliveryType: 'delivery',
  deliveryAddress: null,
  deliveryZone: null,
  deliveryFee: 0,
  paymentMethod: 'pix',
  notes: '',
  order: null,
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_CUSTOMER':
      return { ...state, customer: action.payload };

    case 'ADD_ITEM': {
      const { product, quantity, customizations } = action.payload;
      const existingIndex = state.items.findIndex(
        (item) =>
          item.product_id === product.id &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );

      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += quantity;
        newItems[existingIndex].total_price = newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
        return { ...state, items: newItems };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            product_id: product.id,
            product_name: product.name,
            quantity,
            unit_price: product.price,
            total_price: product.price * quantity,
            subtotal: product.price * quantity,
            customizations,
          },
        ],
      };
    }

    case 'REMOVE_ITEM': {
      const { productId, customizations } = action.payload;
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            item.product_id !== productId ||
            JSON.stringify(item.customizations) !== JSON.stringify(customizations)
        ),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity, customizations } = action.payload;
      if (quantity <= 0) {
        return orderReducer(state, { type: 'REMOVE_ITEM', payload: { productId, customizations } });
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.product_id === productId && JSON.stringify(item.customizations) === JSON.stringify(customizations)
            ? { ...item, quantity, total_price: item.unit_price * quantity }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_DELIVERY_TYPE':
      return { ...state, deliveryType: action.payload };

    case 'SET_DELIVERY_ADDRESS':
      return { ...state, deliveryAddress: action.payload };

    case 'SET_DELIVERY_ZONE':
      return { ...state, deliveryZone: action.payload };

    case 'SET_DELIVERY_FEE':
      return { ...state, deliveryFee: action.payload };

    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };

    case 'SET_NOTES':
      return { ...state, notes: action.payload };

    case 'SET_ORDER':
      return { ...state, order: action.payload };

    case 'RESET_ORDER':
      return initialState;

    default:
      return state;
  }
}

const OrderContext = createContext<{
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
  subtotal: number;
  total: number;
  itemCount: number;
  canProceed: boolean;
  nextStep: () => void;
  prevStep: () => void;
} | null>(null);

interface OrderProviderProps {
  children: ReactNode;
}

const stepOrder: OrderStep[] = ['phone', 'type', 'size', 'toppings', 'fruits', 'extras', 'cart', 'checkout', 'tracking'];

export function OrderProvider({ children }: OrderProviderProps) {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  const subtotal = state.items.reduce((sum, item) => sum + item.total_price, 0);
  const total = subtotal + state.deliveryFee;
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const currentIndex = stepOrder.indexOf(state.currentStep);
  const canProceed = (() => {
    switch (state.currentStep) {
      case 'phone':
        return !!state.customer;
      case 'type':
      case 'size':
      case 'toppings':
      case 'fruits':
      case 'extras':
        return state.items.length > 0;
      case 'cart':
        return state.items.length > 0 && !!state.customer;
      case 'checkout':
        return state.deliveryType === 'pickup' || !!state.deliveryAddress;
      default:
        return false;
    }
  })();

  const nextStep = () => {
    if (currentIndex < stepOrder.length - 1) {
      dispatch({ type: 'SET_STEP', payload: stepOrder[currentIndex + 1] });
    }
  };

  const prevStep = () => {
    if (currentIndex > 0) {
      dispatch({ type: 'SET_STEP', payload: stepOrder[currentIndex - 1] });
    }
  };

  return (
    <OrderContext.Provider
      value={{
        state,
        dispatch,
        subtotal,
        total,
        itemCount,
        canProceed,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}