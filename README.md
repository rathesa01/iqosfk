# IQOS CRM

ระบบจัดการลูกค้า + ออเดอร์ + สต็อก สำหรับธุรกิจขาย IQOS — ทดแทน Google Sheets เดิม

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript strict
- **Tailwind CSS v4** + **shadcn/ui** (Base UI components)
- **Supabase** (Postgres + Auth + RLS)
- **Drizzle ORM** + **postgres-js** (type-safe DB queries + migrations)
- **TanStack Query**, **React Hook Form**, **Zod**, **Recharts**, **date-fns** (TZ Asia/Bangkok)
- **next-themes** (dark mode), **sonner** (toasts), **lucide-react** (icons)
- **Noto Sans Thai** + **Geist Mono** fonts

## Quick start

```bash
# 1. install
npm install

# 2. set env (already populated for this project)
cp .env.example .env.local

# 3. run DB migrations
npm run db:migrate

# 4. (one-time) create the first admin user
npm run create-admin -- you@example.com SuperSecret123 "Owner Name"

# 5. dev server
npm run dev
```

App runs at <http://localhost:3000>. You'll be redirected to `/login`.

## Scripts

| Script                                           | Description                                |
| ------------------------------------------------ | ------------------------------------------ |
| `npm run dev`                                    | Next.js dev server                         |
| `npm run build`                                  | Production build                           |
| `npm run lint`                                   | ESLint                                     |
| `npm run format`                                 | Prettier write                             |
| `npm run db:generate`                            | Generate Drizzle SQL migration from schema |
| `npm run db:migrate`                             | Apply pending migrations to Supabase       |
| `npm run db:studio`                              | Drizzle Studio (DB browser)                |
| `npm run db:check`                               | List tables + enums to verify schema       |
| `npm run create-admin <email> <password> [name]` | Bootstrap an admin user                    |

## Project layout

```
app/
  (auth)/login/        # login page + server actions
  (dashboard)/         # authenticated layout (sidebar + topbar)
  layout.tsx           # root layout — fonts, providers
  providers.tsx        # QueryClient, ThemeProvider, Toaster, TooltipProvider
components/
  ui/                  # shadcn primitives
  layouts/             # sidebar-nav, topbar
lib/
  db/schema.ts         # Drizzle schema (single source of truth)
  db/index.ts          # Drizzle client
  supabase/{client,server,middleware}.ts
  analytics/customer.ts # segment / status / due-status logic
  utils/{auth,date}.ts
drizzle/               # generated SQL migrations
scripts/               # migrate, check-db, create-admin, (later) seed
proxy.ts               # Next.js 16 proxy (was middleware) — refreshes Supabase session
```

## Roles

| Role     | Permissions                                        |
| -------- | -------------------------------------------------- |
| `admin`  | full access; manages users, master data, deletions |
| `staff`  | create/edit orders & customers, view analytics     |
| `viewer` | read-only dashboard + reports                      |

## Roadmap

- [x] **M1 — Foundation**: Next.js, Tailwind v4, shadcn, Supabase Auth, Drizzle schema, layout, login
- [ ] **M2 — Core CRUD**: customers, products, categories, orders (mobile-optimised)
- [ ] **M3 — Dashboard & Analytics**: today view, charts, filters
- [ ] **M4 — Stock & Finance**: stock movements, P&L
- [ ] **M5 — Integrations**: LINE Notify, exports
- [ ] **M6 — Polish & Deploy**: roles, activity logs, dark mode polish, Vercel
