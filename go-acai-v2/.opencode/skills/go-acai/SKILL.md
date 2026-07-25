# GO AÇAÍ v2 - OpenCode Skill

Este arquivo fornece contexto para o OpenCode trabalhar com o projeto GO AÇAÍ v2.

## Visão Geral do Projeto

GO AÇAÍ v2 é um SaaS multi-tenant de delivery para açaí, sorveterias e gelaterias. Possui duas faces:

1. **Admin Dashboard** (`/admin`) - Painel administrativo com 6 abas
2. **Customer App** (`/app/[slug]`) - App do cliente com fluxo de montagem de açaí

## Stack Tecnológica

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: TailwindCSS 3.4 + CSS Variables
- **Database**: Supabase (PostgreSQL + Realtime)
- **Auth**: Supabase Auth + tenant_users table
- **State**: Zustand + React Context
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Web Push (VAPID)
- **PWA**: Service Worker + Dynamic Manifest

## Estrutura de Pastas

```
src/
├── app/
│   ├── admin/page.tsx          # Dashboard Admin (6 abas)
│   ├── app/[slug]/page.tsx     # Customer App (9 etapas)
│   ├── api/                    # API Routes
│   │   ├── banner/
│   │   ├── push/subscribe/
│   │   ├── push/send/
│   │   ├── signup/
│   │   └── upload-logo/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles
├── components/                 # Reusable components
├── context/
│   ├── AuthContext.tsx         # Supabase Auth
│   └── OrderContext.tsx        # Order state machine
├── hooks/
│   ├── useData.ts              # Data fetching hooks
│   └── useOrderStore.ts        # Zustand order store
├── lib/
│   ├── supabase.ts             # Supabase client
│   └── queries.ts              # Database queries
├── types/
│   └── index.ts                # TypeScript types
└── utils/
    └── helpers.ts              # Formatters, validators
```

## Fluxo do Customer App (9 Etapas)

1. **phone** - Digita telefone → lookup/criação cliente
2. **type** - Escolhe base (Açaí, Zero Açúcar, Cupuaçu, Sorvetes)
3. **size** - Escolhe tamanho (300ml, 500ml, 700ml, 1L)
4. **toppings** - Coberturas (até 2 grátis, R$ 1,50 adicionais)
5. **fruits** - Frutas (grátis ou com preço)
6. **extras** - Complementos (R$ 2,00 cada)
7. **cart** - Resumo do pedido
8. **checkout** - Endereço (ViaCEP) + entrega/retirada + pagamento
9. **tracking** - Acompanhamento realtime (4 estágios)

## Estado Global (Zustand + Context)

- `useOrderStore` - Carrinho, step atual, entrega, pagamento
- `AuthContext` - Supabase Auth (admin)
- `OrderContext` - Fluxo de pedido (reducer)

## Database Schema (Supabase)

### Tabelas Principais
- `tenants` - Lojas (slug, name, logo, primary_color, delivery_fee, min_order, working_hours, etc.)
- `categories` - Categorias por tenant
- `products` - Produtos com preço, imagem, disponibilidade
- `delivery_zones` - Zonas por distância
- `customers` - Clientes por phone
- `orders` - Pedidos com items JSONB
- `banner_configs` - Config dinâmica por tenant
- `push_subscriptions` - Web Push subscriptions
- `tenant_users` - Link auth.users ↔ tenants

### Realtime
- Tabela `orders` publicada no `supabase_realtime`
- Admin escuta INSERT/UPDATE filtrado por tenant_id

## API Routes

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/banner` | GET/POST | Config banner/mensagens |
| `/api/push/subscribe` | POST | Salva subscription push |
| `/api/push/send` | POST | Envia push notification |
| `/api/signup` | POST | Cria nova loja |
| `/api/upload-logo` | POST | Upload logo → Supabase Storage |

## PWA Features

- **Manifest dinâmico** por tenant (`/app/[slug]/manifest`)
- **Ícone SVG dinâmico** por tenant (`/app/[slug]/icon`)
- **Service Worker** com cache-first, stale-while-revalidate
- **Push notifications** via Service Worker
- **Install prompt** customizado

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

## Comandos Úteis

```bash
npm run dev          # Dev server
npm run build        # Build production
npm run start        # Run production build
npm run lint         # ESLint
npm run db:generate  # Generate Supabase types
npm run db:push      # Push migrations
npm run db:reset     # Reset local DB
```

## Deploy

1. Conecte repo no Vercel
2. Configure env vars
3. Deploy automático

## Supabase Setup

1. Execute `supabase/schema.sql` no SQL Editor
2. Execute migrations em `supabase/migrations/`
3. Configure Storage buckets: `logos` (5MB, public), `push-subs` (public)
4. Enable Realtime na tabela `orders`
5. Configure VAPID keys para Web Push