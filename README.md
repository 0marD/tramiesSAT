# TrámiteSAT

> A step-by-step PWA that guides Mexican citizens through their SAT tax procedures — no accountant needed.

---

## What is it?

TrámiteSAT turns complex SAT bureaucracy into simple, guided checklists. Users follow numbered steps with plain-language instructions, check off required documents, and complete their tax procedures independently.

**It does not file taxes or connect to SAT systems.** It is a guided educational tool.

---

## Features

| Feature | Description |
|---|---|
| Step-by-step guides | Each trámite broken into numbered, actionable steps |
| Document checklist | Interactive pre-flight checklist before starting |
| Diagnostic quiz | Tailors the guide based on the user's profile |
| Progress tracking | Saves progress per trámite per user |
| Magic link login | Passwordless auth via email |
| Tax reminders | Push notifications for upcoming deadlines |
| PWA | Installable, works offline once loaded |
| Pay-per-trámite | Unlock individual guides or subscribe annually |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 — strict mode |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Backend | Supabase (Postgres + Auth + RLS) |
| Payments | MercadoPago |
| Email | Resend |
| Push notifications | Web Push API (VAPID) |
| Hosting | Vercel |
| Package manager | Yarn |
| Testing | Vitest + Testing Library |

---

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Public pages — tramite guides, landing
│   ├── (auth)/            # Login, callback
│   ├── (app)/             # Protected pages — historial, vencimientos, cuenta
│   └── api/               # API routes — payments, webhooks
├── components/
│   ├── layout/            # Header, BottomNav, PageContainer
│   ├── shared/            # EstadoCargando, EstadoVacio, EstadoError, BotonPrincipal
│   └── tramite/           # TramiteCard, PasoGuia, ChecklistDocumentos, DiagnosticoForm
├── content/
│   └── tramites/          # JSON content per trámite (steps, docs, diagnostics)
├── hooks/                 # usePaso, etc.
├── lib/
│   ├── supabase/          # Client, server, middleware helpers
│   ├── mercadopago/       # Webhook signature verification
│   ├── tramites/          # Server Actions
│   ├── utils/             # Date formatting, logger
│   └── validaciones/      # Zod schemas
├── types/                 # Domain types — tramite, usuario, pago, database
└── constants/             # Textos, planes, tramites catalog
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn (`npm install -g yarn`)
- A [Supabase](https://supabase.com) project
- (Optional) A [MercadoPago](https://www.mercadopago.com.mx) account for payments

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials. Required fields:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # "Publishable key" in the Supabase dashboard
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> See `.env.example` for the full list of variables.

### 3. Set up the database

Open your Supabase project's SQL editor and run the full contents of `database/schema.sql`. This creates all tables, RLS policies, indexes, and seed data.

### 4. Start the development server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

```bash
yarn dev          # Start development server
yarn build        # Production build
yarn start        # Start production server
yarn type-check   # TypeScript check (zero errors required)
yarn lint         # ESLint
yarn test         # Run unit tests (Vitest)
yarn test:watch   # Run tests in watch mode
yarn test:ci      # Run tests once, no watch (for CI)
```

---

## Trámites Catalog

| Slug | Name |
|---|---|
| `rfc-persona-fisica` | RFC for individuals |
| `contrasena-sat` | SAT password (CIEC) |
| `efirma` | e.firma digital signature |
| `declaracion-anual` | Annual tax return |
| `cfdi-40` | CFDI 4.0 invoicing |

---

## Pricing

| Plan | Price (MXN) |
|---|---|
| Pay per trámite | $59 |
| Annual subscription | $349 |

---

## Security

- All user data protected by Supabase Row Level Security (RLS) — users can only access their own records.
- MercadoPago webhook signatures verified with HMAC-SHA256 and timing-safe comparison.
- No sensitive keys exposed to the client. `SUPABASE_SERVICE_ROLE_KEY` and payment tokens are server-only.
- All user input validated with Zod on both client and server.

---

## License

This project is proprietary software. All rights reserved.
See [LICENSE](./LICENSE) for full terms. Unauthorized copying, distribution, or use is strictly prohibited.
# tramiesSAT
