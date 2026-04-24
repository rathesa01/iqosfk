# IQOS CRM

ระบบจัดการลูกค้า + ออเดอร์ + สต็อก + การเงิน สำหรับธุรกิจขาย IQOS — ทดแทน Google Sheets เดิม

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript strict
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives)
- **Supabase** (Postgres + Auth + RLS)
- **Drizzle ORM** + **postgres-js** (type-safe queries + migrations)
- **TanStack Query**, **React Hook Form**, **Zod**, **Recharts**
- **date-fns** (Asia/Bangkok), **next-themes** (dark mode), **sonner** (toasts)
- **Noto Sans Thai** + **Geist Mono** fonts

## Features

- ✅ **Auth** — email/password (Supabase) + 3 roles (admin / staff / viewer)
- ✅ **Customers** — list, search, segment + status auto-compute, contact log
- ✅ **Products + categories** — master data, low-stock alerts
- ✅ **Orders** — mobile-first multi-product form, autocomplete, transactional
- ✅ **Stock** — receive (multi-item purchase), quick adjust, movements log
- ✅ **Finance** — P&L by day/month, COGS from snapshots, expenses
- ✅ **Today dashboard** — due-to-contact list, stats cards, top products
- ✅ **Analytics** — daily sales, top products/customers, distributions, heatmap
- ✅ **Notifications** — LINE Messaging API + generic webhook (Discord/Slack/...)
- ✅ **Cron** — daily summary 21:00 BKK + contact reminders 09:00 BKK
- ✅ **Exports** — CSV (orders, customers, P&L) UTF-8+BOM for Excel-Thai
- ✅ **Users** — admin invite by email, role change, delete
- ✅ **Activity logs** — auto-audit on every insert/update/delete (PG triggers)
- ✅ **RLS** — row-level security enabled on all tables (browser-side protection)

## Quick start

```bash
# 1. install
npm install

# 2. set env (already populated for this project — see .env.example)
cp .env.example .env.local

# 3. run all DB migrations
npm run db:migrate

# 4. (one-time) create the first admin user
npm run create-admin -- you@example.com SuperSecret123 "Owner Name"

# 5. dev server
npm run dev
```

Open <http://localhost:3000> — you'll be redirected to `/login`.

## Scripts

| Script                                             | Description                                       |
| -------------------------------------------------- | ------------------------------------------------- |
| `npm run dev`                                      | Next.js dev server                                |
| `npm run build`                                    | Production build                                  |
| `npm run lint`                                     | ESLint                                            |
| `npm run format`                                   | Prettier write                                    |
| `npm run db:generate`                              | Generate Drizzle SQL migration from schema        |
| `npm run db:migrate`                               | Apply pending migrations to Supabase              |
| `npm run db:studio`                                | Drizzle Studio (DB browser)                       |
| `npm run db:check`                                 | List tables + enums                               |
| `npm run create-admin <email> <password> [name]`   | Bootstrap an admin user                           |
| `npm run migrate-from-sheet <path-to-csv>`         | Import old orders from a Google Sheets CSV export |

## Project layout

```
app/
  (auth)/login/                # login page + server actions
  (dashboard)/
    page.tsx                   # Today dashboard (due-to-contact + stats)
    customers/                 # CRUD
    products/                  # CRUD + categories
    orders/                    # CRUD (mobile-first form)
    stock/                     # list + /in (receive) + adjust + history
    finance/                   # P&L + expenses
    analytics/                 # charts + heatmap
    settings/
      page.tsx                 # hub
      notifications/           # LINE / webhook / cron secret
      users/                   # invite, role, delete (admin)
      activity/                # PG-trigger audit log viewer (admin)
      exports/                 # CSV download links
  api/
    customers/search/          # autocomplete
    products/{search,search-lite}/
    cron/{daily-summary,contact-reminders}/   # Vercel Cron targets
    export/{orders,customers,pnl}.csv/
components/
  ui/                          # shadcn (Base UI) primitives + LinkButton
  layouts/                     # sidebar-nav, topbar, mobile bottom nav
  charts/                      # sales-line, top-products, distribution, heatmap, pnl
  segment-badge.tsx            # segment + status colored badges
lib/
  db/                          # Drizzle schema + client
  supabase/                    # browser, server, middleware (proxy.ts)
  analytics/                   # customer logic + queries + finance
  validations/                 # Zod schemas
  utils/                       # date, csv, auth, auth-admin, cron-auth
  notify.ts                    # generic notify dispatcher
  settings.ts                  # JSONB key-value settings reader/writer
drizzle/                       # generated SQL migrations + meta
  0000_init.sql
  0001_profile_trigger.sql
  0002_analytics_triggers.sql  # auto-recompute customer analytics
  0003_audit_triggers.sql      # activity_logs auto-audit
  0004_rls.sql                 # RLS policies
scripts/
  migrate.ts
  check-db.ts
  create-admin.ts
  migrate-from-sheet.ts        # Google Sheets import
proxy.ts                       # Next.js 16 proxy — refreshes Supabase session
vercel.json                    # cron schedules
```

## Roles

| Role     | Permissions                                        |
| -------- | -------------------------------------------------- |
| `admin`  | full access; manages users, master data, deletions |
| `staff`  | create/edit orders & customers, view analytics     |
| `viewer` | read-only dashboard + reports                      |

## Deploy to Vercel

1. **Import the GitHub repo** at <https://vercel.com/new>
2. **Set environment variables** (copy from `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SECRET_KEY`
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL` — your final domain (e.g. `https://iqoscrm.vercel.app`)
   - `CRON_SECRET` — paste the cron secret you generated in `/settings/notifications`
3. **Deploy**. The first build will create routes + 2 cron jobs:
   - `/api/cron/daily-summary` at 14:00 UTC (= 21:00 BKK)
   - `/api/cron/contact-reminders` at 02:00 UTC (= 09:00 BKK)
4. **Update `NEXT_PUBLIC_APP_URL`** in env if you connect a custom domain later.
5. Open the deployed app → `/login` → use the admin you bootstrapped locally.

## Migration from Google Sheets

```bash
# 1. Export your Google Sheet to CSV with these columns:
#    date, customer_name, phone, line_id, product_sku, product_name,
#    quantity, unit_price, cost_price, delivery_method, location, notes
# 2. Each row = one order line item (multi-line orders auto-grouped by date+phone)

npm run migrate-from-sheet -- ./old-orders.csv
```

The script:
- Normalises phones (strips `-`, prepends `0`)
- Upserts customers + products (deduplicates)
- Groups rows into orders + items
- Inserts inside one transaction per order
- Skips already-migrated rows (matched by SHA1 of date+phone)
- DB triggers auto-fill `segment`, `status`, `avg_freq_days`, `next_expected_date`

## Roadmap

- [x] **M1 — Foundation**: Next.js, Supabase, Drizzle schema, layout, login
- [x] **M2 — Core CRUD**: customers, products, orders + auto-analytics triggers
- [x] **M3 — Dashboard & Analytics**: today view, charts, heatmap
- [x] **M4 — Stock & Finance**: receive, adjust, movements, P&L, expenses
- [x] **M5 — Integrations**: LINE/webhook notify, cron jobs, CSV exports
- [x] **M6 — Polish & Deploy**: users, activity logs, RLS, Vercel deploy, sheet migration

🎉 **All 6 milestones complete.**
