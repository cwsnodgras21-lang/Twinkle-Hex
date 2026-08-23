/**
 * Normalize Shopify Admin webhook JSON into internal CommerceOrderInput.
 */

import type { CommerceOrderInput, CommerceOrderLineInput } from "@/lib/commerce/contract";

/** Topics we accept for order demand sync. */
export const SUPPORTED_ORDER_TOPICS = [
  "orders/create",
  "orders/updated",
  "orders/edited",
] as const;

export type SupportedOrderTopic = (typeof SUPPORTED_ORDER_TOPICS)[number];

export function isSupportedOrderTopic(topic: string): topic is SupportedOrderTopic {
  return (SUPPORTED_ORDER_TOPICS as readonly string[]).includes(topic);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  return t.length ? t : null;
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toIsoOrNull(value: unknown): string | null {
  const s = str(value);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function customerName(order: Record<string, unknown>): string | null {
  const customer = asRecord(order.customer);
  if (customer) {
    const first = str(customer.first_name) ?? "";
    const last = str(customer.last_name) ?? "";
    const joined = `${first} ${last}`.trim();
    if (joined) return joined;
  }
  return str(order.billing_address && asRecord(order.billing_address)?.name);
}

function normalizeLineItem(raw: unknown): CommerceOrderLineInput | null {
  const item = asRecord(raw);
  if (!item) return null;
  const lineId = str(item.id) ?? str(item.admin_graphql_api_id);
  if (!lineId) return null;
  return {
    shopifyLineItemId: lineId,
    shopifyProductId: str(item.product_id),
    shopifyVariantId: str(item.variant_id),
    sku: str(item.sku),
    productTitle: str(item.title) ?? str(item.name),
    variantTitle: str(item.variant_title),
    quantity: Math.max(0, Math.trunc(num(item.quantity))),
    unitPrice: Math.max(0, num(item.price)),
  };
}

export type NormalizeShopifyResult =
  | { ok: true; data: CommerceOrderInput }
  | { ok: false; error: string };

/**
 * Map a verified Shopify order webhook body into the internal commerce input.
 */
export function normalizeShopifyOrderWebhook(input: {
  topic: string;
  shopDomain: string;
  webhookId: string;
  receivedAt?: string;
  body: unknown;
}): NormalizeShopifyResult {
  if (!isSupportedOrderTopic(input.topic)) {
    return { ok: false, error: `Unsupported topic: ${input.topic}` };
  }

  const order = asRecord(input.body);
  if (!order) {
    return { ok: false, error: "Order payload must be an object" };
  }

  const shopifyOrderId = str(order.id) ?? str(order.admin_graphql_api_id);
  if (!shopifyOrderId) {
    return { ok: false, error: "Missing Shopify order id" };
  }

  const rawLines = Array.isArray(order.line_items) ? order.line_items : [];
  const lineItems: CommerceOrderLineInput[] = [];
  for (const raw of rawLines) {
    const line = normalizeLineItem(raw);
    if (line) lineItems.push(line);
  }

  const email =
    str(order.email) ??
    str(order.contact_email) ??
    str(asRecord(order.customer)?.email);

  const data: CommerceOrderInput = {
    provider: "shopify",
    event: input.topic,
    eventId: input.webhookId,
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    shopDomain: input.shopDomain.trim().toLowerCase(),
    order: {
      shopifyOrderId,
      orderNumber:
        order.order_number == null || order.order_number === ""
          ? null
          : Math.trunc(num(order.order_number)),
      name: str(order.name),
      customer: {
        name: customerName(order),
        email,
      },
      financialStatus: str(order.financial_status),
      fulfillmentStatus: str(order.fulfillment_status),
      currency: (str(order.currency) ?? "USD").toUpperCase(),
      subtotal: Math.max(0, num(order.subtotal_price ?? order.current_subtotal_price)),
      total: Math.max(0, num(order.total_price ?? order.current_total_price)),
      orderedAt: toIsoOrNull(order.created_at),
      updatedAt: toIsoOrNull(order.updated_at),
      lineItems,
    },
  };

  return { ok: true, data };
}
