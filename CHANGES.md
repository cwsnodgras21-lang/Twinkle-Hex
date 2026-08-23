# Twinkle & Hex — Change Log

## Shopify order ingest v0.1 (this branch)

First production-ready commerce path: Shopify orders flow through n8n into the
app; the app owns validation, persistence, idempotency, and polish mapping.

### Added

- Migration `015_commerce_shopify_orders.sql` — `commerce_orders`,
  `commerce_order_lines`, `commerce_product_mappings`,
  `commerce_integration_events` (RLS admin-only)
- `POST /api/integrations/shopify/orders` — bearer-auth ingest for n8n
- Zod contract + in-memory/Supabase repository + ingest orchestration
- `/admin/orders` list + detail with variant → polish mapping (backfills lines)
- Dashboard strip: open order demand + needs mapping
- Docs: `docs/integrations/shopify-n8n.md`
- Vitest coverage for auth, validation, ingest, idempotency, mapping

### Intentionally not built

- Inventory decrement, production scheduling/batches, Shopify fulfillment
  write-back, catalog sync, refunds, n8n → Supabase direct writes

### Apply on live Supabase

1. Prior migrations through `014` as needed
2. `015_commerce_shopify_orders.sql`
3. Set `TWINKLE_N8N_INGEST_SECRET` (and optional `SHOPIFY_SHOP_DOMAIN`) on Vercel
4. Configure n8n per `docs/integrations/shopify-n8n.md`

---

## Production Operating System (prior)

Turned the lean stock/ingredients/recipes admin into Tracey’s production OS
without rewriting the gravitational centers.

### Added

- **Command Center** (`/admin`) — needs attention, today, this week, upcoming
  releases with plain-language risk, production plan projection
- **Releases** — collections with launch + derived upstream deadlines
- **Production planner** — deterministic workday batch spreading + reproject
- **Make Batch** on polish detail — 32 oz default, formula version snapshot
- **Ingredient lifecycle** — tracked / experimental / approved / rejected / archived
- **R&D Lab** — prototypes, review dates, explicit approve/reject promotion
- **Swatchers** — assignments with send/return dates and overdue flags
- **Operating calendar** — derived timeline + thin marketing notes
- Migration `013_production_operating_system.sql`
- Vitest suite for scaling, planning, risk, eligibility (`npm test`)
- Docs: `docs/MILESTONE_0_ASSESSMENT.md`, `docs/ARCHITECTURE.md`

### Reused

- `polishes` / `polish_recipe_lines`, `ingredients` + SDS storage, finished stock,
  admin shell, brand palette, admin RLS pattern

### Intentionally not built

- Core replenishment automation, full consumption ledger, multi-tenancy, AI,
  Shopify/ERP, re-enabling admin login

### Apply on live Supabase

1. `012_simplify_to_core_ops.sql` (if not already)
2. `013_production_operating_system.sql`

---

## Prior: Admin simplification

The admin app was rebuilt around exactly three questions:

1. **What do we have in finished stock?**
2. **What do we have in ingredients?**
3. **How is a specific polish made?**

Removed storefront, community, old releases/batches/swatchers/marketing CRM.
See git history for PRs #1–#3. Login enforcement remains temporarily disabled
until a real admin user exists.
