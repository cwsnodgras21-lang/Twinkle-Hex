/**
 * Shopify order ingest orchestration (n8n → app).
 * Owns validation outcomes, idempotency, upsert, and polish mapping lookup.
 */

import type { ShopifyOrderIngestPayload } from "@/lib/commerce/contract";
import { parseShopifyOrderIngest } from "@/lib/commerce/contract";
import type { CommerceRepository } from "@/lib/commerce/repository";
import { resolveShopDomain } from "@/lib/commerce/repository";
import type { CommerceOrder, CommerceOrderLine } from "@/types/commerce";

export type IngestResult =
  | {
      ok: true;
      status: 200 | 201;
      duplicate: boolean;
      created: boolean;
      orderId: string;
      shopifyOrderId: string;
      lineCount: number;
      mappedLineCount: number;
      unmappedLineCount: number;
    }
  | {
      ok: false;
      status: 400 | 409 | 500;
      error: string;
    };

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  return e.code === "23505" || Boolean(e.message?.toLowerCase().includes("duplicate"));
}

export async function ingestShopifyOrder(
  raw: unknown,
  repo: CommerceRepository
): Promise<IngestResult> {
  const parsed = parseShopifyOrderIngest(raw);
  if (!parsed.ok) {
    return { ok: false, status: 400, error: parsed.error };
  }

  const payload = parsed.data;
  const shopDomain = resolveShopDomain(payload.shopDomain);
  const receivedAt = payload.receivedAt ?? new Date().toISOString();

  // Record event first for observability; treat unique conflict as retry.
  let eventId: string | null = null;
  let duplicateEvent = false;
  try {
    const existing = await repo.findEventByProviderEventId("shopify", payload.eventId);
    if (existing && (existing.status === "processed" || existing.status === "duplicate")) {
      duplicateEvent = true;
      eventId = existing.id;
      if (existing.commerce_order_id) {
        const lines = await repo.listLinesForOrder(existing.commerce_order_id);
        const mapped = lines.filter((l) => l.polish_id).length;
        return {
          ok: true,
          status: 200,
          duplicate: true,
          created: false,
          orderId: existing.commerce_order_id,
          shopifyOrderId: payload.order.shopifyOrderId,
          lineCount: lines.length,
          mappedLineCount: mapped,
          unmappedLineCount: lines.length - mapped,
        };
      }
    }

    if (!existing) {
      try {
        const ev = await repo.insertEvent({
          provider: "shopify",
          event_id: payload.eventId,
          event_type: payload.event,
          shop_domain: shopDomain,
          status: "received",
          received_at: receivedAt,
        });
        eventId = ev.id;
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        duplicateEvent = true;
        const again = await repo.findEventByProviderEventId("shopify", payload.eventId);
        eventId = again?.id ?? null;
        if (again?.status === "processed" && again.commerce_order_id) {
          const lines = await repo.listLinesForOrder(again.commerce_order_id);
          const mapped = lines.filter((l) => l.polish_id).length;
          return {
            ok: true,
            status: 200,
            duplicate: true,
            created: false,
            orderId: again.commerce_order_id,
            shopifyOrderId: payload.order.shopifyOrderId,
            lineCount: lines.length,
            mappedLineCount: mapped,
            unmappedLineCount: lines.length - mapped,
          };
        }
      }
    } else {
      eventId = existing.id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record integration event";
    return { ok: false, status: 500, error: message };
  }

  try {
    const { order, lines, created } = await upsertOrderFromPayload(payload, shopDomain, repo);
    const mapped = lines.filter((l) => l.polish_id).length;

    if (eventId) {
      await repo.updateEvent(eventId, {
        status: duplicateEvent ? "duplicate" : "processed",
        commerce_order_id: order.id,
        processed_at: new Date().toISOString(),
        error_message: null,
      });
    }

    return {
      ok: true,
      status: created ? 201 : 200,
      duplicate: duplicateEvent && !created,
      created,
      orderId: order.id,
      shopifyOrderId: order.shopify_order_id,
      lineCount: lines.length,
      mappedLineCount: mapped,
      unmappedLineCount: lines.length - mapped,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to ingest order";
    if (eventId) {
      try {
        await repo.updateEvent(eventId, {
          status: "failed",
          error_message: message.slice(0, 500),
          processed_at: new Date().toISOString(),
        });
      } catch {
        // ignore secondary failure
      }
    }
    return { ok: false, status: 500, error: message };
  }
}

async function upsertOrderFromPayload(
  payload: ShopifyOrderIngestPayload,
  shopDomain: string,
  repo: CommerceRepository
): Promise<{ order: CommerceOrder; lines: CommerceOrderLine[]; created: boolean }> {
  const existing = await repo.findOrderByShopifyId(shopDomain, payload.order.shopifyOrderId);
  const order = await repo.upsertOrder({
    shop_domain: shopDomain,
    shopify_order_id: payload.order.shopifyOrderId,
    shopify_order_number: payload.order.orderNumber ?? null,
    shopify_order_name: payload.order.name,
    customer_name: payload.order.customer?.name ?? null,
    customer_email: payload.order.customer?.email ?? null,
    financial_status: payload.order.financialStatus,
    fulfillment_status: payload.order.fulfillmentStatus,
    currency: payload.order.currency,
    subtotal: payload.order.subtotal,
    total: payload.order.total,
    ordered_at: payload.order.orderedAt ?? null,
    shopify_updated_at: payload.order.updatedAt ?? null,
  });

  const lineInputs = [];
  for (const item of payload.order.lineItems) {
    let polishId: string | null = null;
    if (item.shopifyVariantId) {
      polishId = await repo.findPolishIdForVariant({
        shop_domain: shopDomain,
        shopify_variant_id: item.shopifyVariantId,
      });
    }
    lineInputs.push({
      shopify_line_item_id: item.shopifyLineItemId,
      shopify_product_id: item.shopifyProductId,
      shopify_variant_id: item.shopifyVariantId,
      sku: item.sku,
      product_title: item.productTitle,
      variant_title: item.variantTitle,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      polish_id: polishId,
    });
  }

  const lines = await repo.syncOrderLines(order.id, lineInputs);
  return { order, lines, created: !existing };
}

export async function saveVariantPolishMapping(
  input: {
    shopDomain?: string | null;
    shopifyProductId?: string | null;
    shopifyVariantId: string;
    sku?: string | null;
    polishId: string;
  },
  repo: CommerceRepository
): Promise<{ mappingId: string; linesUpdated: number }> {
  if (!(await repo.polishExists(input.polishId))) {
    throw new Error("Polish not found");
  }
  const shopDomain = resolveShopDomain(input.shopDomain);
  const mapping = await repo.upsertProductMapping({
    shop_domain: shopDomain,
    shopify_product_id: input.shopifyProductId ?? null,
    shopify_variant_id: input.shopifyVariantId,
    sku: input.sku ?? null,
    polish_id: input.polishId,
  });
  const linesUpdated = await repo.applyMappingToUnmappedLines({
    shop_domain: shopDomain,
    shopify_variant_id: input.shopifyVariantId,
    polish_id: input.polishId,
  });
  return { mappingId: mapping.id, linesUpdated };
}
