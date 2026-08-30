# Production Operating System — Architecture

## What existed before

Lean post-012 ops tool answering three questions: finished stock, ingredients
(with SDS), and polish recipes. Releases, batches, and swatchers had been
removed as organizational gravity.

## What was wrong

Tracey’s bottleneck is **lead time** (production → swatchers → marketing →
launch), not warehouse inventory. The dashboard showed counts, not next actions.
Recipes had no version history. R&D and experimental pigments had no gate.

## Standards

No in-repo NolTurn Factory canon. Work followed Organizational Gravity /
reductive improvement from the product brief, plus existing Twinkle & Hex
conventions (standalone polishes, unified ingredients, brand palette, admin RLS).

**Conflict resolved:** Reintroduced releases/batches/swatchers as a lean
production OS, not the old CRM/kanban suite. Polishes stay independent.

## Canonical sources of truth

| Concern | Source |
| --- | --- |
| Polish identity | `polishes` |
| Current formula | `polish_recipe_lines` (+ `polishes.formula_version`) |
| Historical formula | `production_batches.formula_snapshot` + `formula_version` + `lot_number` |
| Ingredient + SDS | `ingredients`; Google Drive SDS via `ingredient_msds_documents` (canonical); legacy Storage uploads secondary |
| Packaging per bottle | `packaging_boms` + `packaging_bom_lines` (supplies — not in polish formula) |
| Collection plan | `releases` + `release_polishes` (+ `collaboration_program`, `photo_upload_by`) |
| Ingredient R&D | `rd_prototypes` (material testing; separate from polish prototypes) |
| Polish prototypes | `polish_prototypes` + lines + photos (15 ml; promote → production formula) |
| Swatcher timeline | `swatchers` + `swatcher_assignments` (bottles from same production batch) |
| Program revenue | `revenue_entries` (LLB/SOU/LBOH); Shopify totals from `commerce_orders` |
| Defaults | `ops_settings` (single row; fill oz, photo lead, $1500 goal) |
| Marketing notes | `ops_calendar_items` (thin; calendar also derives from releases/R&D/batches) |

## Lifecycle boundaries

1. **Product development:** experimental ingredient → prototype → review →
   approve/reject → ingredient lifecycle updated explicitly.
2. **Production:** polish planned on a release → formula ready → batch →
   `production_status=complete`.
3. **Launch:** release deadlines → swatcher send/return → marketing → launch.

Experimental ingredients (`lifecycle_status=experimental`) are **not**
production-eligible when linked on a recipe line. Free-text-only lines remain
allowed (Tracey does not catalog every material).

## Production planning rules

- Remaining work = release polishes where `production_status != complete`
  (one batch assumed per polish for planning).
- Workdays default Mon–Fri; max 2 batches/day (`ops_settings`).
- Plan evenly across remaining workdays through `production_complete_by`.
- Missed days: re-run with new `today` and same remaining count.
- Documented launch lead times (days before launch): marketing 7, swatch return
  21, swatcher send 35, production complete 42.

## Swatcher risk

Transparent reasons only (no health score):

- Assignment `send_by` passed without `sent_at`
- Release `swatcher_send_by` passed with remaining production
- Remaining batches exceed capacity before `swatcher_send_by`

## Command Center

`/admin` answers: needs attention, today, this week, upcoming releases with
plain-language risk, and the projected production plan.

Restrained commerce signals also appear on the dashboard:

- Open order demand (unfulfilled Shopify orders + bottle count)
- Needs product mapping (unmapped line / variant counts)

## Commerce / Shopify (v0.1)

Architecture: **Shopify → `POST /api/integrations/shopify/webhook` → app DB**.

Shopify sends order webhooks directly to Twinkle & Hex. The app verifies HMAC,
normalizes the payload, and owns idempotency, persistence, and Shopify-variant →
`polishes` mapping. No intermediary orchestration layer.

| Concern | Source |
| --- | --- |
| Orders | `commerce_orders` |
| Lines | `commerce_order_lines` (`polish_id` nullable until mapped) |
| Variant → polish | `commerce_product_mappings` (keyed by Shopify variant id) |
| Idempotency / observability | `commerce_integration_events` (`X-Shopify-Webhook-Id`) |

Auth: `X-Shopify-Hmac-Sha256` over the raw body using `SHOPIFY_CLIENT_SECRET`
(server-only). Optional `SHOPIFY_SHOP_DOMAIN` rejects unexpected shops.

UI: `/admin/orders` list + detail with mapping picker. Saving a mapping
backfills existing unmapped lines for that variant.

See `docs/integrations/shopify.md` for webhook setup.

**NolTurn note:** Public NolTurn repos (`Nolturn-Local`, `nolturn-cmms`) were
referenced for patterns; `nolturn-software-factory` was not accessible to this
agent. Work followed existing Twinkle & Hex conventions plus Organizational
Gravity / reductive scope from in-repo docs.

## Migrations

1. Ensure `012_simplify_to_core_ops.sql` is applied.
2. Apply `013_production_operating_system.sql`.
3. Apply `014_ops_daily_tasks.sql` if used.
4. Apply `015_commerce_shopify_orders.sql` for Shopify ingest.
5. Apply `016_production_ops_requirements.sql` for oz/bottles batches, packaging BOM,
   polish prototypes, Drive SDS, photo deadlines, and revenue.

## Intentionally not built

- Full rewards engine (see `shopify_customer_id` + `rewards_future_notes` readiness only)
- Automated PayPal ingest (manual `revenue_entries` ready for later automation)
- Core stock-target replenishment automation / MRP / purchasing
- Multi-tenancy, AI agents
- Re-enabling admin login (still `ADMIN_LOGIN_DISABLED`)
- Shopify fulfillment write-back or catalog sync

## Future opportunities

- Configurable lead-time UI (table already exists)
- Optional ingredient_id picker in recipe editor
- Core polish “below stock target” queue item
- Signed-in admin enforcement once users exist
- Production-demand automation once ingest + mapping are trusted
