'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Store, Shield, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helpers';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [demoTenant, setDemoTenant] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isDemo) {
        if (!demoTenant) {
          setError('Selecione uma loja demo');
          setIsLoading(false);
          return;
        }
        localStorage.setItem('goacai_tenant', demoTenant);
        router.push('/admin');
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        // Look up user's tenant from tenant_users
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: link } = await supabase
            .from('tenant_users')
            .select('tenant:tenants(slug)')
            .eq('user_id', user.id)
            .single();
          if (link && (link as any).tenant) {
            localStorage.setItem('goacai_tenant', (link as any).tenant.slug);
          }
        }
        router.push('/admin');
      }
    } catch (err) {
      setError('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const demoTenants = [
    { slug: 'acai-do-joao', name: 'Açaí do João', emoji: '🍇' },
    { slug: 'gelateria-bella', name: 'Gelateria Bella', emoji: '🍨' },
    { slug: 'sorveteria-do-zé', name: 'Sorveteria do Zé', emoji: '🍦' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative items-center justify-center">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="orb orb-purple w-[500px] h-[500px] -top-20 -left-20 animate-float-slow" />
        <div className="orb orb-dark w-[300px] h-[300px] bottom-20 right-10 animate-float" />
        
        <div className="relative z-10 max-w-lg px-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/70 text-xs font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-acai-300" />
            Plataforma SaaS para Delivery
          </div>
          
          <h1 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Gerencie sua loja de{' '}
            <span className="gradient-text">açaí</span>{' '}
            com inteligência
          </h1>
          
          <p className="text-white/50 text-lg leading-relaxed mb-10">
            Dashboard completo, app PWA para seus clientes, e tudo que você precisa para vender mais.
          </p>

          <div className="space-y-4">
            {[
              { icon: Store, text: 'App PWA com marca própria' },
              { icon: Shield, text: 'Pagamentos integrados' },
              { icon: Zap, text: 'Notificações em tempo real' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white/60">
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <item.icon className="h-4 w-4 text-acai-300" />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dark-50 via-white to-acai-50/30 dark:from-dark-950 dark:via-dark-950 dark:to-dark-900 relative">
        <div className="absolute inset-0 bg-mesh opacity-30 dark:opacity-10" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-acai-500 to-purple-600 shadow-colored">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="font-display font-bold text-2xl text-dark-900 dark:text-white">
                GO <span className="gradient-text">AÇAÍ</span>
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white mb-2">
              {isDemo ? 'Acessar Demo' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-dark-500 dark:text-dark-400">
              {isDemo
                ? 'Escolha uma loja para explorar o painel'
                : 'Entre na sua conta para gerenciar sua loja'}
            </p>
          </div>

          {/* Card */}
          <div className="premium-card p-6 sm:p-8">
            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 p-1 bg-dark-100/50 dark:bg-dark-800/50 rounded-2xl">
                <button
                  onClick={() => setIsDemo(false)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                    !isDemo
                      ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-white shadow-soft'
                      : 'text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300'
                  )}
                >
                  Email/Senha
                </button>
                <button
                  onClick={() => setIsDemo(true)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                    isDemo
                      ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-white shadow-soft'
                      : 'text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300'
                  )}
                >
                  Demo
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {isDemo ? (
                <div className="space-y-3">
                  {demoTenants.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => setDemoTenant(t.slug)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left',
                        demoTenant === t.slug
                          ? 'border-acai-500 bg-acai-50/50 dark:bg-acai-900/20 shadow-colored'
                          : 'border-dark-200/50 dark:border-dark-700/50 hover:border-acai-300 dark:hover:border-acai-700 hover:bg-white/50 dark:hover:bg-dark-800/50'
                      )}
                    >
                      <div className="text-2xl">{t.emoji}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-dark-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-dark-400 dark:text-dark-500">/{t.slug}</p>
                      </div>
                      {demoTenant === t.slug && (
                        <div className="h-5 w-5 rounded-full bg-acai-500 flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}

                  <p className="text-xs text-dark-400 dark:text-dark-500 text-center pt-2">
                    Senha para todas: <code className="bg-dark-100 dark:bg-dark-800 px-2 py-0.5 rounded-lg font-mono">123456</code>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="label">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      placeholder="seu@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="label">
                      Senha
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm animate-slide-down mt-4 flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (isDemo && !demoTenant)}
                className="btn-primary w-full py-3.5 mt-6 text-base rounded-2xl group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <>
                    <span>{isDemo ? 'Entrar na Demo' : 'Entrar'}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-dark-200/50 dark:border-dark-700/50 text-center">
              <Link
                href="/signup"
                className="text-sm text-acai-600 dark:text-acai-400 hover:text-acai-700 dark:hover:text-acai-300 font-medium transition-colors inline-flex items-center gap-1.5"
              >
                Criar nova loja
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-dark-400 dark:text-dark-500 text-center mt-6">
            Demo: teste sem cadastro · Produção: use seu email/senha
          </p>
        </div>
      </div>
    </div>
  );
}
