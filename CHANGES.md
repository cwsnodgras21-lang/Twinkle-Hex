# Twinkle & Hex — Change Log

## Production ops requirements (this branch)

Extends the production OS for oz+bottles batches, unfinished bulk, inventory
consumption, packaging BOM, cost-per-bottle, polish prototypes, Drive SDS,
photo deadlines, LLB/SOU/LBOH programs, and monthly revenue toward $1,500.

### Schema (`016_production_ops_requirements.sql`)

- Production batches: total bulk oz, bottles filled, remaining bulk, lot numbers
  (`TH-YYYY-MMDD-NNN`), inventory_consumed_at, cost snapshot
- Atomic `apply_production_batch_inventory` RPC + movement audit
- Packaging BOM (supplies per finished bottle — not in polish formula)
- Polish prototypes (15 ml) + lines + photos bucket (separate from ingredient R&D)
- Ingredient cost fields; Google Drive SDS as canonical compliance source
- Releases: collaboration_program (LLB/SOU/LBOH) + photo_upload_by
- Manual `revenue_entries` by business source; ops monthly goal default $1500
- Rewards readiness only: `commerce_orders.shopify_customer_id`

### UI

- Make Batch records oz + bottles; shows remaining bulk, lot #, cost
- Polish detail: SDS warning, copyable ingredient list, prototype link
- `/admin/prototypes` with photos + Promote to Production Formula
- `/admin/packaging` BOM editor; `/admin/revenue` + dashboard goal strip
- Release form: program + photo upload deadline (calendar integrated)

### Intentionally deferred

- Full rewards engine (patches, collection completion, Shopify collections)
- Automated PayPal ingest (schema ready via revenue_entries)
- Complex PDF reporting

### Apply on live Supabase

1. Migrations through `015` as needed
2. `016_production_ops_requirements.sql`

---

## Shopify order ingest v0.1 (prior)

First production-ready commerce path: Shopify sends order webhooks directly to
Twinkle & Hex; the app verifies HMAC, normalizes, persists, and maps variants to
polishes. No intermediary orchestration layer.

### Added

- Migration `015_commerce_shopify_orders.sql` — `commerce_orders`,
  `commerce_order_lines`, `commerce_product_mappings`,
  `commerce_integration_events` (RLS admin-only; schema unchanged for direct webhooks)
- `POST /api/integrations/shopify/webhook` — Shopify HMAC-verified ingest
- Shopify normalize → internal `CommerceOrderInput` + ingest orchestration
- `/admin/orders` list + detail with variant → polish mapping (backfills lines)
- Dashboard strip: open order demand + needs mapping
- Docs: `docs/integrations/shopify.md`
- Vitest coverage for HMAC, shop validation, ingest, idempotency, freshness, mapping

### Intentionally not built

- Inventory decrement (now in 016), production scheduling/batches, Shopify fulfillment
  write-back, catalog sync, refunds

### Apply on live Supabase

1. Prior migrations through `014` as needed
2. `015_commerce_shopify_orders.sql`
3. Set `SHOPIFY_CLIENT_SECRET` and `SHOPIFY_SHOP_DOMAIN` on Vercel
4. Register Shopify order webhooks per `docs/integrations/shopify.md`

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
