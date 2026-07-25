'use client'

import { useState } from 'react'
import { ShoppingBag, ChevronLeft, Check, Minus, Plus, ArrowRight, MapPin, CreditCard, Clock, Package, ChefHat } from 'lucide-react'
import { playStatusChange } from '@/lib/sound'

type Step = 'home' | 'type' | 'size' | 'toppings' | 'fruits' | 'extras' | 'cart' | 'checkout' | 'tracking'

interface OrderState {
  type: string
  size: string
  base: string
  toppings: string[]
  fruits: string[]
  extras: string[]
  paymentMethod: string
  deliveryMethod: string
}

const toggleArray = (arr: string[], item: string) =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

const prices: Record<string, string> = {
  '300 ml': 'R$ 15,00',
  '500 ml': 'R$ 19,90',
  '700 ml': 'R$ 24,90',
  '1 Litro': 'R$ 32,90',
}

const toppingsList = ['Leite Condensado', 'Nutella', 'Chocolate', 'Caramelo', 'Morango', 'Doce de Leite', 'Leite Ninho', 'Creme de Avelã']
const fruitsList = ['Banana', 'Morango', 'Kiwi', 'Uva', 'Manga', 'Abacaxi', 'Maçã', 'Pera', 'Maracujá', 'Coco']
const extrasList = ['Granola', 'Paçoca', 'Leite em Pó', 'Castanha', 'Confete', 'Ovomaltine', 'Amendoim', 'Coco Ralado', 'Chia', 'MM\'s']

const steps: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'home', label: 'Início', icon: ShoppingBag },
  { key: 'type', label: 'Tipo', icon: ChefHat },
  { key: 'size', label: 'Tamanho', icon: Plus },
  { key: 'toppings', label: 'Coberturas', icon: Minus },
  { key: 'fruits', label: 'Frutas', icon: ShoppingBag },
  { key: 'extras', label: 'Extras', icon: Plus },
  { key: 'cart', label: 'Carrinho', icon: ShoppingBag },
  { key: 'checkout', label: 'Checkout', icon: CreditCard },
  { key: 'tracking', label: 'Acompanhar', icon: Clock },
]

export default function DemoApp() {
  const [step, setStep] = useState<Step>('home')
  const [order, setOrder] = useState<OrderState>({
    type: '', size: '', base: '', toppings: [], fruits: [], extras: [], paymentMethod: '', deliveryMethod: ''
  })
  const [history, setHistory] = useState<Step[]>([])

  const goTo = (next: Step) => {
    setHistory(prev => [...prev, step])
    setStep(next)
  }

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1]
      setHistory(h => h.slice(0, -1))
      setStep(prev)
    }
  }

  const getPrice = () => {
    const base = order.size ? parseInt(prices[order.size]?.replace('R$ ', '').replace(',', '.')) || 19.90 : 19.90
    const extrasPrice = order.extras.length * 2
    const toppingsPrice = order.toppings.length * 1.5
    return base + extrasPrice + toppingsPrice
  }

  const progress = (steps.findIndex(s => s.key === step) / (steps.length - 1)) * 100

  if (step === 'tracking') {
    return <TrackingScreen goBack={goBack} goTo={goTo} order={order} getPrice={getPrice} />
  }

  if (step === 'checkout') {
    return <CheckoutScreen goBack={goBack} goTo={goTo} order={order} setOrder={setOrder} getPrice={getPrice} />
  }

  if (step === 'cart') {
    return <CartScreen goBack={goBack} goTo={goTo} order={order} getPrice={getPrice} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-acai-50">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative flex flex-col overflow-hidden">
        <Header step={step} goBack={goBack} progress={progress} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 'home' && <HomeScreen goTo={goTo} />}
          {step === 'type' && <TypeScreen order={order} setOrder={setOrder} goTo={goTo} />}
          {step === 'size' && <SizeScreen order={order} setOrder={setOrder} goTo={goTo} />}
          {step === 'toppings' && <ToppingsScreen order={order} setOrder={setOrder} goTo={goTo} />}
          {step === 'fruits' && <FruitsScreen order={order} setOrder={setOrder} goTo={goTo} />}
          {step === 'extras' && <ExtrasScreen order={order} setOrder={setOrder} goTo={goTo} />}
        </div>
        <BottomBar step={step} order={order} getPrice={getPrice} goTo={goTo} />
      </div>
    </div>
  )
}

function Header({ step, goBack, progress }: { step: Step; goBack: () => void; progress: number }) {
  if (step === 'home') return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5 text-white text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-2">
        <ShoppingBag className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-xl font-bold font-display">GO AÇAÍ</h1>
      <p className="text-sm text-white/80">Monte seu pedido</p>
    </div>
  )
  return (
    <div className="bg-white border-b border-primary-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-lg hover:bg-primary-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-primary-600" />
        </button>
        <div className="flex-1">
          <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-acai-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function HomeScreen({ goTo }: { goTo: (s: Step) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="space-y-2">
        <p className="text-5xl">🍧</p>
        <h2 className="text-2xl font-bold font-display text-dark-900">O que você deseja?</h2>
        <p className="text-dark-500">Monte sua tigela ou copo do seu jeito</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        <button onClick={() => goTo('type')} className="p-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-400 text-white shadow-lg">
          <p className="text-3xl mb-2">🥣</p>
          <p className="font-bold">Tigela</p>
          <p className="text-sm text-white/80">Tradicional</p>
        </button>
        <button onClick={() => goTo('type')} className="p-6 rounded-2xl bg-gradient-to-br from-acai-500 to-acai-400 text-white shadow-lg">
          <p className="text-3xl mb-2">🥤</p>
          <p className="font-bold">Copo</p>
          <p className="text-sm text-white/80">Para viagem</p>
        </button>
      </div>
      <p className="text-xs text-dark-400">Personalize cada detalhe do seu açaí</p>
    </div>
  )
}

function TypeScreen({ order, setOrder, goTo }: { order: OrderState; setOrder: (o: OrderState) => void; goTo: (s: Step) => void }) {
  const options = ['Açaí Tradicional', 'Açaí Zero Açúcar', 'Creme de Cupuaçu', 'Sorvete de Creme', 'Sorvete de Chocolate', 'Sorvete de Morango']
  const emojis: Record<string, string> = { 'Açaí Tradicional': '🍇', 'Açaí Zero Açúcar': '🍇', 'Creme de Cupuaçu': '🍈', 'Sorvete de Creme': '🍦', 'Sorvete de Chocolate': '🍫', 'Sorvete de Morango': '🍓' }
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-display text-dark-900">Escolha a base</h2>
      <div className="space-y-2">
        {options.map(opt => (
          <button key={opt} onClick={() => { const baseMap: Record<string, string> = { 'Açaí Tradicional': 'Açaí', 'Açaí Zero Açúcar': 'Açaí', 'Creme de Cupuaçu': 'Creme', 'Sorvete de Creme': 'Sorvete', 'Sorvete de Chocolate': 'Sorvete', 'Sorvete de Morango': 'Sorvete' }; setOrder({ ...order, type: opt, base: baseMap[opt] || 'Açaí' }); goTo('size') }} className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all ${order.type === opt ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:border-primary-200'}`}>
            <span className="text-2xl">{emojis[opt]}</span>
            <span className="font-medium text-dark-900 flex-1 text-left">{opt}</span>
            {order.type === opt && <Check className="w-5 h-5 text-primary-500" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function SizeScreen({ order, setOrder, goTo }: { order: OrderState; setOrder: (o: OrderState) => void; goTo: (s: Step) => void }) {
  const options = ['300 ml', '500 ml', '700 ml', '1 Litro']
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-display text-dark-900">Qual o tamanho?</h2>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <button key={opt} onClick={() => { setOrder({ ...order, size: opt }); goTo('toppings') }} className={`p-5 rounded-2xl border-2 transition-all text-center ${order.size === opt ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:border-primary-200'}`}>
            <div className="flex items-center justify-center mb-2">
              <div style={{ width: `${40 + i * 15}px`, height: `${40 + i * 15}px` }} className="rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <span className="text-primary-600 font-bold text-xs">{opt}</span>
              </div>
            </div>
            <p className="text-lg font-bold text-primary-600">{prices[opt]}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function ToppingsScreen({ order, setOrder, goTo }: { order: OrderState; setOrder: (o: OrderState) => void; goTo: (s: Step) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-display text-dark-900">Coberturas <span className="text-sm font-normal text-dark-500">(R$ 1,50 cada)</span></h2>
      <div className="flex flex-wrap gap-2">
        {toppingsList.map(item => (
          <button key={item} onClick={() => setOrder({ ...order, toppings: toggleArray(order.toppings, item) })} className={`px-4 py-2 rounded-full border-2 transition-all ${order.toppings.includes(item) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 hover:border-primary-200 text-dark-700'}`}>
            {item}
          </button>
        ))}
      </div>
      <button onClick={() => goTo('fruits')} className="btn-primary w-full mt-4">Continuar <ArrowRight className="w-4 h-4 inline ml-1" /></button>
    </div>
  )
}

function FruitsScreen({ order, setOrder, goTo }: { order: OrderState; setOrder: (o: OrderState) => void; goTo: (s: Step) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-display text-dark-900">Frutas <span className="text-sm font-normal text-dark-500">(Grátis)</span></h2>
      <div className="grid grid-cols-2 gap-2">
        {fruitsList.map(item => (
          <button key={item} onClick={() => setOrder({ ...order, fruits: toggleArray(order.fruits, item) })} className={`p-3 rounded-xl border-2 transition-all text-center ${order.fruits.includes(item) ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:border-primary-200'}`}>
            <span className="font-medium text-dark-900">{item}</span>
          </button>
        ))}
      </div>
      <button onClick={() => goTo('extras')} className="btn-primary w-full mt-4">Continuar <ArrowRight className="w-4 h-4 inline ml-1" /></button>
    </div>
  )
}

function ExtrasScreen({ order, setOrder, goTo }: { order: OrderState; setOrder: (o: OrderState) => void; goTo: (s: Step) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-display text-dark-900">Complementos <span className="text-sm font-normal text-dark-500">(R$ 2,00 cada)</span></h2>
      <div className="space-y-2">
        {extrasList.map(item => (
          <button key={item} onClick={() => setOrder({ ...order, extras: toggleArray(order.extras, item) })} className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all ${order.extras.includes(item) ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:border-primary-200'}`}>
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${order.extras.includes(item) ? 'bg-primary-500 border-primary-500' : 'border-dark-300'}`}>
              {order.extras.includes(item) && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="font-medium text-dark-900 flex-1 text-left">{item}</span>
            <span className="text-sm text-dark-500">+R$ 2,00</span>
          </button>
        ))}
      </div>
      <button onClick={() => goTo('cart')} className="btn-primary w-full mt-4">Ver Carrinho <ArrowRight className="w-4 h-4 inline ml-1" /></button>
    </div>
  )
}

function CartScreen({ goBack, goTo, order, getPrice }: { goBack: () => void; goTo: (s: Step) => void; order: OrderState; getPrice: () => number }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-display text-dark-900">Resumo do Pedido</h2>
      <div className="bg-primary-50 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center"><span className="font-semibold text-dark-900">{order.size} - {order.base}</span><span className="font-bold text-primary-600">{prices[order.size]}</span></div>
        {order.toppings.length > 0 && <div className="flex justify-between text-sm"><span className="text-dark-500">Coberturas ({order.toppings.length}x)</span><span className="text-dark-500">+R$ {(order.toppings.length * 1.5).toFixed(2).replace('.', ',')}</span></div>}
        {order.fruits.length > 0 && <div className="flex justify-between text-sm"><span className="text-dark-500">Frutas ({order.fruits.length}x)</span><span className="text-dark-500">Grátis</span></div>}
        {order.extras.length > 0 && <div className="flex justify-between text-sm"><span className="text-dark-500">Complementos ({order.extras.length}x)</span><span className="text-dark-500">+R$ {(order.extras.length * 2).toFixed(2).replace('.', ',')}</span></div>}
        <div className="border-t border-primary-200 pt-3 flex justify-between text-lg"><span className="font-bold text-dark-900">Total</span><span className="font-bold text-primary-600">R$ {getPrice().toFixed(2).replace('.', ',')}</span></div>
      </div>
      <div className="bg-acai-50 rounded-xl p-3 flex items-center gap-3 text-sm">
        <MapPin className="w-5 h-5 text-acai-500" />
        <span className="text-dark-700">Digite seu endereço para entrega</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={goBack} className="btn-outline">Voltar</button>
        <button onClick={() => goTo('checkout')} className="btn-primary">Ir para Pagamento <ArrowRight className="w-4 h-4 inline ml-1" /></button>
      </div>
    </div>
  )
}

function CheckoutScreen({ goBack, goTo, order, setOrder, getPrice }: { goBack: () => void; goTo: (s: Step) => void; order: OrderState; setOrder: (o: OrderState) => void; getPrice: () => number }) {
  const [delivery, setDelivery] = useState(order.deliveryMethod || '')
  const [payment, setPayment] = useState(order.paymentMethod || '')
  const [address, setAddress] = useState('Rua Exemplo, 123')
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    setOrder({ ...order, deliveryMethod: delivery, paymentMethod: payment })
    setConfirmed(true)
    setTimeout(() => goTo('tracking'), 1500)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold font-display text-dark-900">Finalizar Pedido</h2>
      <div>
        <p className="font-semibold text-dark-700 mb-2">Entrega ou Retirada?</p>
        <div className="grid grid-cols-2 gap-2">
          {['Entrega', 'Retirada'].map(opt => (
            <button key={opt} onClick={() => setDelivery(opt)} className={`p-3 rounded-xl border-2 text-center transition-all ${delivery === opt ? 'border-primary-500 bg-primary-50' : 'border-dark-200'}`}>
              {opt === 'Entrega' ? '🚚 Entrega' : '🏪 Retirada'}
            </button>
          ))}
        </div>
      </div>
      {delivery === 'Entrega' && (
        <div>
          <p className="font-semibold text-dark-700 mb-2">Endereço</p>
          <input value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 rounded-xl border-2 border-dark-200 focus:border-primary-500 outline-none" placeholder="Seu endereço" />
        </div>
      )}
      <div>
        <p className="font-semibold text-dark-700 mb-2">Forma de Pagamento</p>
        <div className="grid grid-cols-3 gap-2">
          {[{ icon: '💵', label: 'Dinheiro' }, { icon: '💳', label: 'Cartão' }, { icon: '📱', label: 'PIX' }].map(opt => (
            <button key={opt.label} onClick={() => setPayment(opt.label)} className={`p-3 rounded-xl border-2 text-center transition-all ${payment === opt.label ? 'border-primary-500 bg-primary-50' : 'border-dark-200'}`}>
              <p className="text-xl">{opt.icon}</p>
              <p className="text-xs font-medium text-dark-700">{opt.label}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-dark-200 pt-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>R$ {getPrice().toFixed(2).replace('.', ',')}</span></div>
        <div className="flex justify-between text-acai-600"><span>Entrega</span><span>Grátis</span></div>
        <div className="flex justify-between text-lg font-bold border-t border-dark-200 pt-2"><span>Total</span><span>R$ {getPrice().toFixed(2).replace('.', ',')}</span></div>
      </div>
      {confirmed ? (
        <div className="text-center p-6 bg-acai-50 rounded-2xl">
          <Check className="w-12 h-12 text-acai-500 mx-auto mb-2" />
          <p className="font-bold text-dark-900">Pedido Confirmado!</p>
          <p className="text-sm text-dark-500">Redirecionando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={goBack} className="btn-outline">Voltar</button>
          <button onClick={handleConfirm} disabled={!delivery || !payment} className="btn-primary">Confirmar Pedido</button>
        </div>
      )}
    </div>
  )
}

function TrackingScreen({ goBack, goTo, order, getPrice }: { goBack: () => void; goTo: (s: Step) => void; order: OrderState; getPrice: () => number }) {
  const [currentStatus, setCurrentStatus] = useState(0)
  const statuses = [
    { icon: '📋', label: 'Pedido recebido', time: 'Agora' },
    { icon: '👨‍🍳', label: 'Em preparo', time: '5 min' },
    { icon: '🚚', label: 'Saiu para entrega', time: '15 min' },
    { icon: '✅', label: 'Entregue', time: '30 min' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-acai-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl p-6 space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-acai-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-acai-600" />
          </div>
          <h2 className="text-2xl font-bold font-display text-dark-900">Pedido #GO-{Math.floor(Math.random() * 10000)}</h2>
          <p className="text-dark-500">{order.size} - {order.base} com {order.toppings.slice(0, 2).join(', ')}</p>
          <p className="text-lg font-bold text-primary-600 mt-2">Total: R$ {getPrice().toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="space-y-6 mt-8">
          {statuses.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${i <= currentStatus ? 'bg-primary-100' : 'bg-dark-100'}`}>
                {s.icon}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${i <= currentStatus ? 'text-dark-900' : 'text-dark-400'}`}>{s.label}</p>
                <p className={`text-sm ${i === currentStatus ? 'text-primary-600' : 'text-dark-400'}`}>{i === currentStatus ? 'Agora' : s.time}</p>
              </div>
              {i <= currentStatus && <Check className="w-5 h-5 text-acai-500" />}
            </div>
          ))}
        </div>
        <div className="border-t border-dark-200 pt-6 space-y-3">
          <button onClick={() => { const next = Math.min(currentStatus + 1, 3); setCurrentStatus(next); const labels = ['pending', 'preparing', 'out_for_delivery', 'delivered']; playStatusChange(labels[next]) }} className="btn-primary w-full">Simular Próximo Status</button>
          <button onClick={() => goTo('home')} className="btn-outline w-full">Novo Pedido</button>
        </div>
      </div>
    </div>
  )
}

function BottomBar({ step, order, getPrice, goTo }: { step: Step; order: OrderState; getPrice: () => number; goTo: (s: Step) => void }) {
  return (
    <div className="border-t border-primary-100 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-dark-500">
          {order.size && <span>{order.size} - {order.base || 'Açaí'}</span>}
        </div>
        {step !== 'home' && step !== 'tracking' && <div className="text-right"><span className="text-xs text-dark-400">Total</span><p className="font-bold text-primary-600">R$ {getPrice().toFixed(2).replace('.', ',')}</p></div>}
      </div>
    </div>
  )
}
