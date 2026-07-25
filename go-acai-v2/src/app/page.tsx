'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  BarChart3, 
  Smartphone, 
  Globe, 
  ChevronRight,
  Star,
  Check,
  Sparkles,
  Store,
  CreditCard,
  Truck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Store,
    title: 'Loja Virtual',
    description: 'App PWA exclusivo para cada loja, com design personalizado e marca própria.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Inteligente',
    description: 'Painel completo com analytics, pedidos em tempo real e gestão de produtos.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: CreditCard,
    title: 'Pagamento Integrado',
    description: 'PIX, cartão, dinheiro — tudo configurável com parcelamento personalizado.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Truck,
    title: 'Entrega Geolocalizada',
    description: 'Zonas de entrega por distância, cálculo automático de frete e rastreio.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Zap,
    title: 'Notificações Push',
    description: 'Alertas em tempo real para novos pedidos e atualizações de status.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Globe,
    title: 'Multi-Tenant',
    description: 'Uma única plataforma para gerenciar múltiplas lojas e marcas.',
    gradient: 'from-pink-500 to-rose-500',
  },
];

const STEPS = [
  { step: '01', title: 'Cadastre sua loja', description: 'Crie sua conta em segundos e personalize sua marca.' },
  { step: '02', title: 'Adicione seus produtos', description: 'Organize por categorias, defina preços e fotos.' },
  { step: '03', title: 'Compartilhe o link', description: 'Seus clientes acessam pelo app PWA exclusivo.' },
  { step: '04', title: 'Receba pedidos', description: 'Gerencie tudo pelo dashboard em tempo real.' },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 dark:border-dark-700/30">
        <div className="container-main">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-acai-500 to-purple-600 shadow-colored group-hover:shadow-colored-lg transition-shadow duration-300">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-acai-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
              </div>
              <span className="font-display font-bold text-xl lg:text-2xl text-dark-900 dark:text-white">
                GO <span className="gradient-text">AÇAÍ</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <Link href="#features" className="btn-ghost text-sm">Funcionalidades</Link>
              <Link href="#how" className="btn-ghost text-sm">Como funciona</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="btn-secondary text-sm hidden sm:inline-flex">
                Entrar
              </Link>
              <Link href="/login" className="btn-primary text-sm">
                Começar Grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero-gradient relative min-h-screen flex items-center pt-20 lg:pt-0">
        {/* Background Elements */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="orb orb-purple w-[600px] h-[600px] -top-32 -right-32 animate-float-slow" />
        <div className="orb orb-dark w-[400px] h-[400px] bottom-20 -left-20 animate-float" />
        
        <div className="container-main relative z-10 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-white/5 border border-white/10 text-white/80 text-sm font-medium mb-8 backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Sparkles className="h-4 w-4 text-acai-300" />
              <span>Plataforma SaaS para Açaí & Sorveterias</span>
            </div>

            {/* Heading */}
            <h1 className={`font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              Seu negócio de açaí{' '}
              <span className="relative">
                <span className="gradient-text">online</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8C40 2 80 2 100 6C120 10 160 10 198 4" stroke="url(#underline)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underline" x1="0" y1="0" x2="200" y2="0">
                      <stop stopColor="#a855f7" />
                      <stop offset="1" stopColor="#7e22ce" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>{' '}
              em outro nível
            </h1>

            <p className={`text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              Crie seu app de delivery com marca própria, dashboard completo e gestão inteligente. 
              Tudo em uma plataforma poderosa e fácil de usar.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <Link href="/login" className="btn-primary text-base px-8 py-4 rounded-2xl group">
                <span>Criar Minha Loja Grátis</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#how" className="btn-outline border-white/20 text-white hover:bg-white/10 text-base px-8 py-4 rounded-2xl">
                Ver Como Funciona
              </Link>
            </div>

            {/* Preview Card */}
            <div className={`relative max-w-3xl mx-auto transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="bg-gradient-to-br from-dark-800 to-dark-900 p-1">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-dark-800/80 rounded-t-2xl">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-dark-700/50 rounded-lg px-4 py-1.5 text-xs text-dark-400 font-mono text-center">
                        goacai.com.br/app/sua-loja
                      </div>
                    </div>
                  </div>
                  {/* App Preview */}
                  <div className="bg-gradient-to-br from-acai-950/80 via-dark-900 to-purple-950/50 rounded-b-2xl p-8 lg:p-12">
                    <div className="grid grid-cols-3 gap-4">
                      {['Açaí Tradicional', 'Sorvete', 'Cremes'].map((item, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-acai-400/30 transition-all duration-300 hover:bg-white/10">
                          <div className="text-3xl mb-2">{['🍇', '🍦', '🥄'][i]}</div>
                          <div className="text-white text-sm font-medium">{item}</div>
                          <div className="text-acai-300 text-xs mt-1">R$ {(16 + i * 3).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-acai-500/20 to-purple-500/20 rounded-3xl blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== LOGOS ===== */}
      <section className="relative py-16 border-b border-dark-200/30 dark:border-dark-700/30">
        <div className="container-main">
          <p className="text-center text-sm text-dark-400 dark:text-dark-500 mb-8 uppercase tracking-widest font-medium">
            Confiado por lojas em todo o Brasil
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-40">
            {['Açaí do João', 'Gelateria Bella', 'Sorveteria do Zé', 'Berry Bowl', 'Açaí House'].map((name) => (
              <div key={name} className="font-display font-bold text-lg lg:text-xl text-dark-400 dark:text-dark-600">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative py-24 lg:py-32">
        <div className="container-main">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-acai-100/50 dark:bg-acai-900/20 text-acai-700 dark:text-acai-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-acai-200/50 dark:border-acai-800/30">
              Funcionalidades
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 dark:text-white mb-4">
              Tudo que você precisa em{' '}
              <span className="gradient-text">uma plataforma</span>
            </h2>
            <p className="text-lg text-dark-500 dark:text-dark-400">
              Ferramentas poderosas para gerenciar seu negócio de delivery do início ao fim.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div 
                key={feature.title} 
                className="premium-card p-6 lg:p-8 group cursor-default"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-dark-500 dark:text-dark-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="relative py-24 lg:py-32 bg-dark-50 dark:bg-dark-900/50">
        <div className="container-main">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-200/50 dark:border-emerald-800/30">
              Como funciona
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 dark:text-white mb-4">
              Simples de{' '}
              <span className="text-gradient">começar</span>
            </h2>
            <p className="text-lg text-dark-500 dark:text-dark-400">
              Em 4 passos simples, sua loja já está no ar.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {STEPS.map((step, i) => (
              <div key={step.step} className="relative group">
                <div className="premium-card p-6 lg:p-8 h-full">
                  <div className="text-5xl font-display font-bold text-acai-100 dark:text-acai-900/50 mb-4 group-hover:text-acai-200 dark:group-hover:text-acai-800/50 transition-colors">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-dark-500 dark:text-dark-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-6 w-6 text-dark-300 dark:text-dark-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="container-main relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="premium-card p-8 lg:p-16 bg-gradient-to-br from-white/90 to-acai-50/50 dark:from-dark-900/90 dark:to-acai-950/30 border-acai-200/30 dark:border-acai-800/20">
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-acai-500 to-purple-600 text-white mb-6 shadow-colored-lg">
                <Store className="h-8 w-8" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 dark:text-white mb-4">
                Pronto para{' '}
                <span className="gradient-text">começar?</span>
              </h2>
              <p className="text-lg text-dark-500 dark:text-dark-400 mb-8 max-w-xl mx-auto">
                Crie sua loja agora mesmo e comece a vender online em minutos. 
                Sem taxas de setup, sem complicação.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login" className="btn-primary text-base px-8 py-4 rounded-2xl group">
                  <Zap className="h-5 w-5" />
                  <span>Criar Minha Loja Agora</span>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-dark-500 dark:text-dark-400">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Setup em 5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Suporte incluído</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-dark-200/30 dark:border-dark-700/30 py-12">
        <div className="container-main">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-acai-500 to-purple-600">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-display font-bold text-lg text-dark-900 dark:text-white">GO AÇAÍ</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-dark-500 dark:text-dark-400">
              <Link href="/login" className="hover:text-acai-600 dark:hover:text-acai-400 transition-colors">Login</Link>
              <span>•</span>
              <span>© 2024 GO AÇAÍ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
