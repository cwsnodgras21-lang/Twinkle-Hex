# Shopify Order Ingest v0.1 — What Was Done

**PR:** https://github.com/cwsnodgras21-lang/Twinkle-Hex/pull/8  
**Branch:** `cursor/shopify-order-ingestion-7a08`

## Goal

Connect the Twinkle & Hex Shopify store to the ops app through n8n so orders become usable operational demand — without n8n writing to Supabase, and without production/inventory automation yet.

```
Shopify → n8n → POST /api/integrations/shopify/orders → app DB
```

## Audit first

Existing app is Next.js 14 + Supabase admin ops. Canonical product entity is **`polishes`**. No live orders model (dropped in migration 012). No API routes; mutations were mostly server actions. No Zod. RLS is admin JWT; writes often use service role. Tests are Vitest pure-logic suites.

**NolTurn:** Public repos (`Nolturn-Local`, `nolturn-cmms`) were readable. `nolturn-software-factory` was not accessible. Work followed Twinkle & Hex patterns + reductive scope from in-repo docs.

## Database (`015_commerce_shopify_orders.sql`)

| Table | Purpose |
| --- | --- |
| `commerce_orders` | Shopify order header; unique `(shop_domain, shopify_order_id)` |
| `commerce_order_lines` | Line items; unique per order + Shopify line id; `polish_id` nullable |
| `commerce_product_mappings` | Shopify variant → `polishes`; keyed by variant id |
| `commerce_integration_events` | Idempotency + observability for n8n retries |

Admin-only RLS on all four. Service role used for ingest writes.

## API

- **Route:** `POST /api/integrations/shopify/orders`
- **Auth:** `Authorization: Bearer <TWINKLE_N8N_INGEST_SECRET>` (server-only)
- **Contract:** Zod schema in `lib/commerce/contract.ts` (normalized n8n payload)
- **Behavior:** validate → record event → upsert order/lines → apply known mappings → return structured JSON
- **Idempotency:** same `eventId` / same Shopify order does not create duplicates; later updates overwrite state

## Product mapping

- Durable key = **Shopify variant id** (SKU is assistive only)
- Unknown variants ingest as **Needs mapping** (`polish_id` null)
- Saving a mapping from the Orders UI backfills existing unmapped lines for that variant

## UI

- Sidebar: **Orders**
- `/admin/orders` — list (order #, date, customer, bottles, payment, fulfillment, mapping status, total)
- `/admin/orders/[id]` — lines + polish picker for unmapped variants
- Dashboard strip: open order demand + needs-mapping counts

## Docs / env

- `docs/integrations/shopify-n8n.md` — Shopify + n8n setup, node sequence, field map, error handling
- Updated `docs/ARCHITECTURE.md`, `CHANGES.md`, `README.md`, `.env.example`

**Env to configure:**

| Variable | Required |
| --- | --- |
| `TWINKLE_N8N_INGEST_SECRET` | Yes (app + n8n) |
| `SHOPIFY_SHOP_DOMAIN` | Optional |
| Existing Supabase URL / anon / service role | Yes |

## Tests & verification

- Vitest: auth, malformed payload, create order + lines, known/unknown mapping, duplicate event, order update, mapping backfill, secret boundary
- Passed: `tsc --noEmit`, `npm test` (30), `npm run lint`, `npm run build`

## Explicitly not built

Inventory decrement, production batch creation, calendar scheduling, Shopify fulfillment writes, catalog sync, refunds, polling Shopify, or n8n → Supabase direct writes.

## What you still need to do

1. Apply `015_commerce_shopify_orders.sql` in Supabase
2. Set `TWINKLE_N8N_INGEST_SECRET` (and optional `SHOPIFY_SHOP_DOMAIN`) on Vercel
3. Point Shopify order webhooks at n8n
4. Build the n8n workflow per `docs/integrations/shopify-n8n.md`
5. Place a test order and confirm it appears under **Admin → Orders**
