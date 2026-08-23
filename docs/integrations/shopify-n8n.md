# Shopify → n8n → Twinkle & Hex

Companion workflow for order ingestion. n8n is **not** part of the app
runtime and must **never** write to Supabase directly.

Architecture:

```
Shopify webhook → n8n (normalize) → POST /api/integrations/shopify/orders → app DB
```

The app owns validation, idempotency, persistence, and Shopify-variant →
polish mapping.

## Prerequisites

1. Apply migration `supabase/migrations/015_commerce_shopify_orders.sql`
2. Set server env (Vercel / `.env.local`):

| Variable | Where | Notes |
| --- | --- | --- |
| `TWINKLE_N8N_INGEST_SECRET` | App + n8n | Shared bearer secret; never `NEXT_PUBLIC_` |
| `SHOPIFY_SHOP_DOMAIN` | App (optional) | Default shop domain if payload omits `shopDomain` |
| `SUPABASE_SERVICE_ROLE_KEY` | App | Required for ingest writes (bypasses RLS) |

3. Deploy / run the app so `https://<APP_URL>/api/integrations/shopify/orders` is reachable

## Shopify setup

1. Shopify Admin → **Settings → Notifications → Webhooks** (or use the
   Shopify Trigger node credentials in n8n)
2. Subscribe to:
   - `Order creation`
   - `Order updated` (and/or `Order edited` if available on your plan)
3. Point webhooks at your **n8n webhook URL** (not the Twinkle API)
4. Format: JSON

You do **not** need a full catalog sync for this milestone.

## Recommended n8n node sequence

### 1. Trigger

**Option A (preferred):** Shopify Trigger node

- Events: `orders/create`, `orders/updated`

**Option B:** Webhook node

- Method: `POST`
- Path: e.g. `/twinkle-shopify-order`
- Register that URL in Shopify webhooks

### 2. Normalize (Code or Set node)

Build this JSON body (field names matter):

```json
{
  "provider": "shopify",
  "event": "{{ $json.topic || 'orders/create' }}",
  "eventId": "{{ $json.id || $json.admin_graphql_api_id || $execution.id }}",
  "receivedAt": "{{ $now.toISO() }}",
  "shopDomain": "{{ $json.shop_domain || 'your-shop.myshopify.com' }}",
  "order": {
    "shopifyOrderId": "{{ String($json.id) }}",
    "orderNumber": "{{ $json.order_number }}",
    "name": "{{ $json.name }}",
    "customer": {
      "name": "{{ [$json.customer?.first_name, $json.customer?.last_name].filter(Boolean).join(' ') }}",
      "email": "{{ $json.email || $json.customer?.email || null }}"
    },
    "financialStatus": "{{ $json.financial_status }}",
    "fulfillmentStatus": "{{ $json.fulfillment_status }}",
    "currency": "{{ $json.currency }}",
    "subtotal": "{{ Number($json.subtotal_price) }}",
    "total": "{{ Number($json.total_price) }}",
    "orderedAt": "{{ $json.created_at }}",
    "updatedAt": "{{ $json.updated_at }}",
    "lineItems": []
  }
}
```

Map `line_items` → `order.lineItems`:

| Shopify `line_items[]` | Contract field |
| --- | --- |
| `id` | `shopifyLineItemId` (string) |
| `product_id` | `shopifyProductId` |
| `variant_id` | `shopifyVariantId` |
| `sku` | `sku` |
| `title` | `productTitle` |
| `variant_title` | `variantTitle` |
| `quantity` | `quantity` |
| `price` | `unitPrice` (number) |

**Important:** `eventId` must be stable per Shopify delivery so retries are
idempotent. Prefer Shopify's webhook `X-Shopify-Webhook-Id` header when
available; otherwise use a composite like `orders/updated:{orderId}:{updated_at}`.

### 3. HTTP Request

- Method: `POST`
- URL: `https://<APP_URL>/api/integrations/shopify/orders`
- Authentication: Header
  - Name: `Authorization`
  - Value: `Bearer {{ $env.TWINKLE_N8N_INGEST_SECRET }}`
- Headers: `Content-Type: application/json`
- Body: the normalized JSON from step 2

### 4. Error handling

| App response | n8n behavior |
| --- | --- |
| `2xx` | Success (may be `duplicate: true` on retry) |
| `401` / `400` | **Do not** endless-retry — fix secret or payload |
| `5xx` / network | Retry with backoff |

Keep execution data (especially the normalized body) for troubleshooting.
Never log the bearer secret.

## Success criteria

1. Place a real/test Shopify order
2. n8n execution succeeds
3. Order appears under **Admin → Orders**
4. Known variants show mapped polishes; unknown ones show **Needs mapping**
5. Saving a mapping backfills older unmapped lines for that variant

## Explicit non-goals (do not add in n8n)

- Direct Supabase inserts/updates
- Inventory decrements
- Production batch creation
- Shopify fulfillment write-backs
- Catalog polling / full product sync
