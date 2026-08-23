# Shopify → Twinkle & Hex

Direct order webhook integration. Shopify delivers order events to the app;
the app verifies authenticity, normalizes the payload, and upserts commerce
demand data into Supabase.

## Architecture

```
Shopify order create/update
  → POST /api/integrations/shopify/webhook (Vercel)
  → HMAC + shop verification
  → normalize Shopify JSON → CommerceOrderInput
  → commerce ingest / upsert
  → commerce_orders + commerce_order_lines (+ mappings)
  → Admin → Orders
```

There is no n8n (or other intermediary) in this path.

## Environment variables

| Variable | Required | Where | Purpose |
| --- | --- | --- | --- |
| `SHOPIFY_CLIENT_SECRET` | Yes | Vercel / server env | Shopify app/client secret; verifies `X-Shopify-Hmac-Sha256` over the **raw** body |
| `SHOPIFY_SHOP_DOMAIN` | Recommended | Vercel / server env | Expected shop (e.g. `twinkle-hex.myshopify.com`). When set, unexpected shops are rejected |

Never expose these as `NEXT_PUBLIC_*`.

Also required for persistence (existing):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server ingest uses the admin client)

## Webhook URL

Production (or preview) URL:

```
https://<YOUR_VERCEL_HOST>/api/integrations/shopify/webhook
```

Example:

```
https://twinkle-hex.vercel.app/api/integrations/shopify/webhook
```

Configure this exact path in Shopify. Method: **POST**.

## Supported topics

| Shopify topic | Behavior |
| --- | --- |
| `orders/create` | Upsert order + lines |
| `orders/updated` | Upsert order + lines |
| `orders/edited` | Upsert order + lines |

Unsupported topics are acknowledged (`200`) without mutating commerce order
state. A processed integration event may be recorded for audit when a webhook id
is present.

## Security

1. Read the raw request body bytes (do not HMAC a re-stringified JSON object).
2. Compute `HMAC-SHA256(rawBody, SHOPIFY_CLIENT_SECRET)` and Base64-encode.
3. Compare to `X-Shopify-Hmac-Sha256` with constant-time equality.
4. When `SHOPIFY_SHOP_DOMAIN` is set, require matching `X-Shopify-Shop-Domain`.
5. Reject invalid signatures **before** database writes.
6. Runtime-validate the normalized internal payload before upsert.
7. Idempotent on `X-Shopify-Webhook-Id` via `commerce_integration_events`.
8. Freshness: an older `updated_at` does not overwrite a newer stored order.

Admin UI and mapping writes remain behind existing admin / RLS boundaries.

## Shopify setup steps

1. Deploy the app with `SHOPIFY_CLIENT_SECRET` (and ideally `SHOPIFY_SHOP_DOMAIN`) set on Vercel.
2. Apply migration `015_commerce_shopify_orders.sql` if not already applied.
3. In Shopify Admin → **Settings → Notifications → Webhooks** (or your custom app’s webhook subscriptions):
   - Create webhooks for **Order creation**, **Order update**, and **Order editing**
     (topics `orders/create`, `orders/updated`, `orders/edited`).
   - URL: `https://<YOUR_VERCEL_HOST>/api/integrations/shopify/webhook`
   - Format: JSON
4. Confirm the webhook signing secret matches the value in `SHOPIFY_CLIENT_SECRET`
   (for custom apps this is typically the app’s **Client secret** / API secret key).
5. Place a test order in the store.
6. Open **Admin → Orders** in Twinkle & Hex and confirm the order + lines appear.
7. Map any unmapped variants (Needs Mapping) to polishes; confirm backfill on existing lines.
8. Edit the Shopify order (quantity / line change) and confirm the same commerce order updates.
9. If Shopify allows redelivery, redeliver the same webhook and confirm no duplicate order.

## Product mapping

Durable key: **Shopify variant id → `polishes.id`**.

SKU is assistive only. Unmapped variants still ingest; `polish_id` stays null and
the UI shows Needs Mapping. Saving a mapping backfills matching unmapped lines.

## Explicit non-goals

Do not add inventory decrement, production batches/calendar automation, Shopify
fulfillment write-back, refunds, catalog sync, polling, AI, or customer
notifications on this webhook path.
