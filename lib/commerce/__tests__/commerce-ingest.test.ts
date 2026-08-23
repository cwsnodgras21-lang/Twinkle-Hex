import { beforeEach, describe, expect, it } from "vitest";
import { authorizeN8nIngest, N8N_INGEST_SECRET_ENV } from "@/lib/commerce/auth";
import { parseShopifyOrderIngest } from "@/lib/commerce/contract";
import {
  isOpenFulfillmentStatus,
  mappingStatusForLines,
  sumBottleCount,
} from "@/lib/commerce/helpers";
import { ingestShopifyOrder, saveVariantPolishMapping } from "@/lib/commerce/ingest";
import { createMemoryCommerceRepository } from "@/lib/commerce/repository";

const POLISH_A = "11111111-1111-1111-1111-111111111111";
const POLISH_B = "22222222-2222-2222-2222-222222222222";
const SHOP = "twinkle-hex.myshopify.com";

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    provider: "shopify" as const,
    event: "orders/create",
    eventId: "evt-1",
    receivedAt: "2026-08-23T20:00:00.000Z",
    shopDomain: SHOP,
    order: {
      shopifyOrderId: "5678",
      orderNumber: 1847,
      name: "#1847",
      customer: { name: "Jane Doe", email: "jane@example.com" },
      financialStatus: "paid",
      fulfillmentStatus: "unfulfilled",
      currency: "USD",
      subtotal: 45,
      total: 50.12,
      orderedAt: "2026-08-23T19:55:00.000Z",
      updatedAt: "2026-08-23T19:56:00.000Z",
      lineItems: [
        {
          shopifyLineItemId: "li-1",
          shopifyProductId: "prod-1",
          shopifyVariantId: "var-disco",
          sku: "TH-DISCO",
          productTitle: "Disco Possum",
          variantTitle: "Default Title",
          quantity: 2,
          unitPrice: 15,
        },
        {
          shopifyLineItemId: "li-2",
          shopifyProductId: "prod-2",
          shopifyVariantId: "var-hex",
          sku: "TH-HEX",
          productTitle: "Hex Glow",
          variantTitle: "Default Title",
          quantity: 1,
          unitPrice: 15,
        },
      ],
    },
    ...overrides,
  };
}

describe("commerce auth", () => {
  it("rejects incorrect secret", () => {
    const result = authorizeN8nIngest("Bearer wrong", {
      NODE_ENV: "test",
      [N8N_INGEST_SECRET_ENV]: "correct-secret",
    } as NodeJS.ProcessEnv);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("rejects when secret is not configured", () => {
    const result = authorizeN8nIngest("Bearer anything", {
      NODE_ENV: "test",
    } as NodeJS.ProcessEnv);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });

  it("accepts matching bearer token", () => {
    const result = authorizeN8nIngest("Bearer correct-secret", {
      NODE_ENV: "test",
      [N8N_INGEST_SECRET_ENV]: "correct-secret",
    } as NodeJS.ProcessEnv);
    expect(result.ok).toBe(true);
  });
});

describe("commerce contract validation", () => {
  it("rejects malformed payload", () => {
    const parsed = parseShopifyOrderIngest({ provider: "shopify" });
    expect(parsed.ok).toBe(false);
  });

  it("accepts a valid n8n payload", () => {
    const parsed = parseShopifyOrderIngest(basePayload());
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.order.shopifyOrderId).toBe("5678");
      expect(parsed.data.order.lineItems).toHaveLength(2);
    }
  });
});

describe("commerce helpers", () => {
  it("flags needs_mapping when any line lacks polish", () => {
    expect(mappingStatusForLines([{ polish_id: null }])).toBe("needs_mapping");
    expect(mappingStatusForLines([{ polish_id: POLISH_A }])).toBe("fully_mapped");
  });

  it("sums bottle counts", () => {
    expect(sumBottleCount([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
  });

  it("treats missing fulfillment as open demand", () => {
    expect(isOpenFulfillmentStatus(null)).toBe(true);
    expect(isOpenFulfillmentStatus("fulfilled")).toBe(false);
  });
});

describe("shopify order ingest", () => {
  let repo: ReturnType<typeof createMemoryCommerceRepository>;

  beforeEach(() => {
    repo = createMemoryCommerceRepository({
      polishes: new Set([POLISH_A, POLISH_B]),
      mappings: [
        {
          id: "map-1",
          provider: "shopify",
          shop_domain: SHOP,
          shopify_product_id: "prod-1",
          shopify_variant_id: "var-disco",
          sku: "TH-DISCO",
          polish_id: POLISH_A,
          created_at: "2026-08-23T00:00:00.000Z",
          updated_at: "2026-08-23T00:00:00.000Z",
        },
      ],
    });
  });

  it("creates an order with line items", async () => {
    const result = await ingestShopifyOrder(basePayload(), repo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.created).toBe(true);
    expect(result.lineCount).toBe(2);

    const order = await repo.findOrderByShopifyId(SHOP, "5678");
    expect(order).not.toBeNull();
    const lines = await repo.listLinesForOrder(order!.id);
    expect(lines).toHaveLength(2);
  });

  it("maps known Shopify variants to the correct polish", async () => {
    const result = await ingestShopifyOrder(basePayload(), repo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mappedLineCount).toBe(1);
    expect(result.unmappedLineCount).toBe(1);

    const order = await repo.findOrderByShopifyId(SHOP, "5678");
    const lines = await repo.listLinesForOrder(order!.id);
    expect(lines.find((l) => l.shopify_variant_id === "var-disco")?.polish_id).toBe(POLISH_A);
    expect(lines.find((l) => l.shopify_variant_id === "var-hex")?.polish_id).toBeNull();
  });

  it("ingests unknown variants as unmapped", async () => {
    const result = await ingestShopifyOrder(basePayload(), repo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.unmappedLineCount).toBe(1);
  });

  it("does not duplicate on retry of the same event", async () => {
    const first = await ingestShopifyOrder(basePayload(), repo);
    const second = await ingestShopifyOrder(basePayload(), repo);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.duplicate).toBe(true);
    expect(second.orderId).toBe(first.orderId);

    const order = await repo.findOrderByShopifyId(SHOP, "5678");
    const lines = await repo.listLinesForOrder(order!.id);
    expect(lines).toHaveLength(2);
  });

  it("updates existing order state on a later event", async () => {
    await ingestShopifyOrder(basePayload(), repo);
    const updatedPayload = basePayload({
      eventId: "evt-2",
      event: "orders/updated",
    });
    (updatedPayload as { order: Record<string, unknown> }).order = {
      ...basePayload().order,
      fulfillmentStatus: "partial",
      total: 55,
      lineItems: [
        {
          shopifyLineItemId: "li-1",
          shopifyProductId: "prod-1",
          shopifyVariantId: "var-disco",
          sku: "TH-DISCO",
          productTitle: "Disco Possum",
          variantTitle: "Default Title",
          quantity: 3,
          unitPrice: 15,
        },
      ],
    };

    const updated = await ingestShopifyOrder(updatedPayload, repo);
    expect(updated.ok).toBe(true);

    const order = await repo.findOrderByShopifyId(SHOP, "5678");
    expect(order?.fulfillment_status).toBe("partial");
    expect(order?.total).toBe(55);
    const lines = await repo.listLinesForOrder(order!.id);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
  });

  it("associates existing unmapped lines when a mapping is saved", async () => {
    await ingestShopifyOrder(basePayload(), repo);
    const mapped = await saveVariantPolishMapping(
      {
        shopDomain: SHOP,
        shopifyProductId: "prod-2",
        shopifyVariantId: "var-hex",
        sku: "TH-HEX",
        polishId: POLISH_B,
      },
      repo
    );
    expect(mapped.linesUpdated).toBe(1);

    const order = await repo.findOrderByShopifyId(SHOP, "5678");
    const lines = await repo.listLinesForOrder(order!.id);
    expect(lines.every((l) => l.polish_id)).toBe(true);
    expect(lines.find((l) => l.shopify_variant_id === "var-hex")?.polish_id).toBe(POLISH_B);
  });
});

describe("commerce security boundaries", () => {
  it("keeps ingest secret env name server-only (not NEXT_PUBLIC_)", () => {
    expect(N8N_INGEST_SECRET_ENV.startsWith("NEXT_PUBLIC_")).toBe(false);
    expect(N8N_INGEST_SECRET_ENV).toBe("TWINKLE_N8N_INGEST_SECRET");
  });

  it("does not allow mapping to a missing polish", async () => {
    const repo = createMemoryCommerceRepository({ polishes: new Set([POLISH_A]) });
    await expect(
      saveVariantPolishMapping({ shopifyVariantId: "var-x", polishId: POLISH_B }, repo)
    ).rejects.toThrow(/not found/i);
  });
});
