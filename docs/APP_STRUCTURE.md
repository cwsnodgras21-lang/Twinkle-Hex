# App Structure

Twinkle Hex is a Next.js 14 (App Router) admin/ops tool for managing polish
production, backed by Supabase. Stack: React 18, TypeScript, Tailwind CSS,
Zod for validation, Vitest for tests.

## Top-level layout

```
app/                  Next.js App Router pages, layouts, and server actions
components/           React components (admin UI + shared layout)
hooks/                Client-side React hooks
lib/                  Domain logic, grouped by area (admin, auth, commerce, ops)
supabase/             Supabase client/server/middleware setup + SQL migrations
styles/               Styling notes
test/                 Test stubs/helpers
types/                Shared TypeScript types
docs/                 Architecture and integration docs
```

## `app/` — routes

- `app/page.tsx`, `app/layout.tsx`, `app/globals.css` — root page/layout.
- `app/login/` — login page + `LoginForm.tsx`.
- `app/api/integrations/shopify/` — Shopify integration API route.
- `app/admin/` — the admin dashboard, one subfolder per domain area:
  - `admin/page.tsx`, `admin/layout.tsx` — dashboard home + shared admin layout.
  - `admin/actions.ts`, `admin/ops-actions.ts` — server actions shared across admin.
  - `calendar/` — production calendar.
  - `ingredients/` (`[id]`, `new`) — ingredient CRUD.
  - `inventory/` (`new`) — finished inventory items.
  - `orders/` (`[id]`, `actions.ts`) — customer orders.
  - `polishes/` (`[id]`, `new`) — polish catalog/recipes.
  - `rd/` (`[id]`, `new`) — R&D polish entries.
  - `releases/` (`[id]`, `new`) — product releases.
  - `settings/` — admin settings + user management (`actions.ts`).
  - `swatchers/` — swatcher assignment management.

## `components/`

- `components/layout/AdminSidebar.tsx` — admin nav shell.
- `components/admin/` — shared admin UI primitives (`AdminPageShell`,
  `AdminTopbar`, `DetailDrawer`, `EmptyState`, `FiltersBar`, `FormShell`,
  `MetricCard`, `StatusBadge`, `TableShell`) plus one subfolder per domain
  mirroring `app/admin/*` (`batches/`, `calendar/`, `dashboard/`,
  `ingredients/`, `inventory/`, `orders/`, `polishes/`, `rd/`, `releases/`,
  `settings/`, `swatchers/`).

## `lib/`

- `lib/admin/` — data access + business logic per admin domain (batches,
  calendar notes, command-center data, daily tasks, ingredients, inventory,
  ops settings, polishes, R&D, releases, swatchers, users) plus
  `supabase-write.ts` for write helpers.
- `lib/auth/` — auth helpers, admin role checks (`admin-check.ts`,
  `helpers.ts`, `roles.ts`).
- `lib/commerce/` — Shopify order ingestion pipeline: `contract.ts`,
  `ingest.ts`, `orders.ts`, `repository.ts`, `shopify-auth.ts`,
  `shopify-normalize.ts`, `helpers.ts`, with tests in `__tests__/`.
- `lib/ops/` — production/ops logic: calendar, command center,
  formula scaling, production plan, release deadlines/risk, with tests in
  `__tests__/`.
- `lib/errors.ts` — shared error types.

## `supabase/`

- `client.ts`, `server.ts`, `admin.ts`, `middleware.ts` — Supabase client
  factories for browser, server, admin (service role), and middleware
  contexts.
- `migrations/` — numbered SQL migrations (000–015), covering admin schema,
  community schema, releases, inventory, RLS policies, production operating
  system, daily tasks, and Shopify commerce order ingestion.

## Other

- `middleware.ts` — Next.js middleware (auth/session handling via Supabase).
- `hooks/useAuth.ts` — client auth hook.
- `types/admin.ts`, `types/commerce.ts`, `types/index.ts` — shared types.
- `docs/ARCHITECTURE.md`, `docs/MILESTONE_0_ASSESSMENT.md`,
  `docs/SHOPIFY_INGEST_V01_SUMMARY.md`, `docs/integrations/shopify.md` —
  existing design/architecture docs.
- `vitest.config.ts`, `test/stubs/` — test configuration and stubs.
