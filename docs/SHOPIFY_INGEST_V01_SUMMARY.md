# Shopify Order Ingest — Summary

## Objective

Connect the Twinkle & Hex Shopify store so orders become usable operational
demand — without production/inventory automation yet.

## Architecture

```
Shopify → POST /api/integrations/shopify/webhook → commerce ingest → Supabase
```

Shopify delivers webhooks directly to Vercel. The app verifies HMAC, normalizes
the order, and upserts into commerce tables.

## Database (migration 015 — unchanged schema)

| Table | Role |
| --- | --- |
| `commerce_orders` | One row per Shopify order (shop + order id unique) |
| `commerce_order_lines` | Line items; `polish_id` nullable until mapped |
| `commerce_product_mappings` | Shopify variant id → `polishes` |
| `commerce_integration_events` | Delivery idempotency + observability |

**Migration 015 was not rewritten for this transport change.** No additive
migration was required: existing columns cover webhook idempotency and order
freshness (`shopify_updated_at`).

## API

- **Route:** `POST /api/integrations/shopify/webhook`
- **Auth:** Shopify `X-Shopify-Hmac-Sha256` over raw body + optional shop domain check
- **Internal contract:** `CommerceOrderInput` in `lib/commerce/contract.ts`
- **Normalize:** `lib/commerce/shopify-normalize.ts`
- **Topics:** `orders/create`, `orders/updated`, `orders/edited`

## UI (preserved)

- `/admin/orders` — list + Needs Mapping counts
- `/admin/orders/[id]` — detail + variant → polish mapping picker
- Dashboard open-demand + needs-mapping strip

## Env

| Variable | Required |
| --- | --- |
| `SHOPIFY_CLIENT_SECRET` | Yes |
| `SHOPIFY_SHOP_DOMAIN` | Recommended (reject unexpected shops) |

## Docs

- `docs/integrations/shopify.md` — setup, security, test procedure

## Explicit non-goals

Inventory decrement, production batch creation, calendar scheduling, Shopify
fulfillment writes, catalog sync, refunds, polling Shopify.

## After merge (manual)

1. Apply migration `015` if not already on live Supabase
2. Set `SHOPIFY_CLIENT_SECRET` and `SHOPIFY_SHOP_DOMAIN` on Vercel (remove any old `TWINKLE_N8N_INGEST_SECRET`)
3. Register Shopify webhooks at `/api/integrations/shopify/webhook`
4. Place a test order and verify Admin → Orders
