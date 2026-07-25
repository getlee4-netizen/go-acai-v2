# GO AÇAÍ v2 - Sistema de Delivery para Açaí e Sorveterias

SaaS multi-tenant completo para delivery de açaí, sorveterias e gelaterias. Versão 2.0 reescrita com arquitetura moderna, TypeScript estrito, e melhores práticas.

## 🚀 Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | TailwindCSS 3.4 + CSS Variables |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth + Custom tenant_users |
| State | Zustand + React Context |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Icons | Lucide React |
| Notifications | Web Push (VAPID) |
| PWA | Service Worker + Manifest dinâmico |
| Deploy | Vercel |

## 📁 Estrutura do Projeto

```
go-acai-v2/
├── public/
│   ├── sw.js              # Service Worker
│   ├── manifest.json      # PWA Manifest
│   └── icons/             # Ícones PWA
├── scripts/
│   └── setup.sql          # Schema completo Supabase
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── admin/         # Dashboard Admin (Server Component)
│   │   ├── app/[slug]/    # Customer App (Client Component)
│   │   ├── api/           # API Routes
│   │   ├── layout.tsx     # Root Layout
│   │   ├── page.tsx       # Landing Page
│   │   └── globals.css    # Estilos globais
│   ├── components/        # Componentes reutilizáveis
│   ├── context/           # React Context (Auth, Order)
│   ├── hooks/             # Custom Hooks (useData, useOrderStore)
│   ├── lib/               # Supabase clients, queries
│   ├── types/             # TypeScript types
│   ├── utils/             # Helpers (formatters, validators)
│   └── styles/            # Estilos adicionais
├── supabase/
│   ├── migrations/        # SQL Migrations
│   └── seed.sql           # Seed data
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── next.config.js
```

## 🎯 Principais Melhorias v2 vs v1

### Arquitetura
- **Server Components** por padrão, Client Components apenas onde necessário
- **TypeScript strict mode** com types gerados do Supabase
- **Zustand + Context** para estado global (ordem, auth, carrinho)
- **Custom hooks** para data fetching (`useTenant`, `useProducts`, `useOrders`)

### Customer App
- **State machine** para fluxo de pedido (9 etapas)
- **Persistência** no localStorage + sincronização Supabase
- **PWA completo**: installable, offline, push notifications
- **Manifest dinâmico** por tenant (cores, ícones, nome)
- **SVG icons dinâmicos** por tenant

### Admin Dashboard
- **Modular**: cada aba é um componente separado
- **Realtime**: pedidos via Supabase Realtime
- **CRUD completo**: produtos, categorias, pedidos
- **Settings modulares**: Geral, Aparência, Entrega, Pagamentos, Notificações, Logo

### API Routes
- `/api/banner` - Config de banner/mensagens por tenant
- `/api/push/subscribe` - Inscrição push notifications
- `/api/push/send` - Envio push notifications (web-push + VAPID)
- `/api/signup` - Cria nova loja (auth + tenant + link)
- `/api/upload-logo` - Upload logo para Supabase Storage

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- Conta Supabase
- Conta Vercel (opcional)

### 1. Clone e instale
```bash
cd go-acai-v2
npm install
```

### 2. Configure Supabase
1. Crie projeto no [Supabase](https://supabase.com)
2. Execute `supabase/schema.sql` no SQL Editor
3. Execute migrations em `supabase/migrations/`
4. Copie URL e chaves para `.env.local`

### 3. Configure variáveis
```bash
cp .env.example .env.local
# Edite .env.local com suas chaves
```

### 4. Gere tipos TypeScript
```bash
npm run db:generate
```

### 5. Rode em desenvolvimento
```bash
npm run dev
```

## 📦 Deploy Vercel

1. Conecte repositório no Vercel
2. Configure variáveis de ambiente
3. Deploy automático

## 🗄️ Schema Supabase

### Tabelas Principais
- `tenants` - Lojas (multi-tenant)
- `categories` - Categorias de produtos
- `products` - Produtos com preços, imagens, disponibilidade
- `delivery_zones` - Zonas de entrega por distância
- `customers` - Clientes (phone-based)
- `orders` - Pedidos com JSONB items
- `banner_configs` - Config de banner/mensagens
- `push_subscriptions` - Subscriptions Web Push
- `tenant_users` - Link auth.users ↔ tenants

### Realtime
- Tabela `orders` publicada no `supabase_realtime`
- Admin recebe pedidos em tempo real via WebSocket

## 🔐 Auth

- **Admin**: Email/Password (Supabase Auth) + tenant_users link
- **Customer**: Phone-based (lookup + upsert)
- **Demo mode**: Seleção de tenant + senha fixa (123456)

## 🔔 Push Notifications

- VAPID keys para web-push
- Subscription salva no Supabase
- Envio via `/api/push/send`
- Service Worker mostra notificação

## 📱 PWA Features

- Installable (A2HS prompt)
- Offline cache (Service Worker)
- Dynamic manifest per tenant
- Dynamic SVG icons per tenant
- Push notifications
- Background sync ready

## 🎨 Theming

- CSS Variables para cores por tenant
- Tailwind config extendido
- Dark mode suportado
- Animações Framer Motion

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Rodar build
npm run lint         # ESLint
npm run db:generate  # Gerar tipos Supabase
npm run db:push      # Push migrations
npm run db:reset     # Reset DB local
```

## 📄 Licença

MIT