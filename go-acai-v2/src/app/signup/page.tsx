'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const plans = [
  { name: 'Mensal', price: 'R$ 20', period: '/mês', features: ['Dashboard completo', 'App do cliente', 'Suporte email'], popular: false },
  { name: 'Anual', price: 'R$ 15', period: '/mês', features: ['Dashboard completo', 'App do cliente', 'Produtos ilimitados', 'Suporte prioritário'], popular: true },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'plan' | 'form'>('plan')
  const [selectedPlan, setSelectedPlan] = useState(plans[0].name)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function translateError(msg: string) {
    const map: Record<string, string> = {
      'A user with this email address has already been registered': 'Este email já está cadastrado. Faça login ou use outro email.',
      'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres.',
      'Unable to validate email address: invalid format': 'Email inválido. Digite um email válido.',
    }
    return map[msg] || msg
  }

  const handleSignup = async () => {
    setLoading(true); setError('')

    const res = await fetch('/api/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, storeName, plan: selectedPlan }),
    })
    const data = await res.json()
    if (!res.ok) { setError(translateError(data.error)); setLoading(false); return }

    localStorage.setItem('goacai_tenant', data.tenantSlug)
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white font-display">GO AÇAÍ</h1>
          <p className="text-dark-400 mt-1">Crie sua loja online</p>
        </div>

        {step === 'plan' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white text-center">Escolha seu plano</h2>
            <div className="grid gap-3">
              {plans.map(p => (
                <button key={p.name} onClick={() => { setSelectedPlan(p.name); setStep('form') }}
                  className={`text-left p-5 rounded-2xl border-2 transition-all ${p.popular ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-900 hover:border-primary-500/50'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white text-lg">{p.name}</p>
                      <p className="text-2xl font-bold text-primary-400">{p.price}<span className="text-sm text-dark-400">{p.period}</span></p>
                    </div>
                    {p.popular && <span className="text-xs bg-primary-500 text-white px-3 py-1 rounded-full">Popular</span>}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-dark-500">Já tem conta? <Link href="/login" className="text-primary-400 hover:underline">Entrar</Link></p>
          </div>
        ) : (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Criar conta</h2>
            <p className="text-sm text-dark-400">Plano: <span className="text-primary-400 font-medium">{selectedPlan}</span></p>
            <div>
              <label className="text-xs text-dark-400 block mb-1">Nome da loja</label>
              <input value={storeName} onChange={e => setStoreName(e.target.value)} className="input-dark w-full" placeholder="Ex: Açaí do João" />
            </div>
            <div>
              <label className="text-xs text-dark-400 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-dark w-full" placeholder="seu@email.com" />
            </div>
            <div>
              <label className="text-xs text-dark-400 block mb-1">Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-dark w-full" placeholder="Mínimo 6 caracteres" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={handleSignup} disabled={loading || !storeName || !email || !password}
              className="btn-primary w-full">{loading ? 'Criando...' : 'Criar loja - Grátis por 7 dias'}</button>
            <p className="text-center text-sm text-dark-500"><button onClick={() => setStep('plan')} className="text-dark-400 hover:text-white">Voltar planos</button></p>
          </div>
        )}
      </div>
    </div>
  )
}
