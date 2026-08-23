import { createHmac } from "crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { parseCommerceOrderInput } from "@/lib/commerce/contract";
import {
  isOpenFulfillmentStatus,
  mappingStatusForLines,
  sumBottleCount,
} from "@/lib/commerce/helpers";
import {
  ingestShopifyOrder,
  isStaleOrderUpdate,
  saveVariantPolishMapping,
} from "@/lib/commerce/ingest";
import { createMemoryCommerceRepository } from "@/lib/commerce/repository";
import {
  authorizeShopifyWebhook,
  SHOPIFY_CLIENT_SECRET_ENV,
  SHOPIFY_SHOP_DOMAIN_ENV,
  verifyShopifyWebhookHmac,
} from "@/lib/commerce/shopify-auth";
import {
  isSupportedOrderTopic,
  normalizeShopifyOrderWebhook,
  SUPPORTED_ORDER_TOPICS,
} from "@/lib/commerce/shopify-normalize";

const POLISH_A = "11111111-1111-1111-1111-111111111111";
const POLISH_B = "22222222-2222-2222-2222-222222222222";
const SHOP = "twinkle-hex.myshopify.com";
const SECRET = "test-shopify-client-secret";

function signBody(raw: string | Buffer, secret = SECRET): string {
  const body = typeof raw === "string" ? Buffer.from(raw, "utf8") : raw;
  return createHmac("sha256", secret).update(body).digest("base64");
}

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

function shopifyOrderBody(overrides: Record<string, unknown> = {}) {
  return {
    id: 5678,
    order_number: 1847,
    name: "#1847",
    email: "jane@example.com",
    financial_status: "paid",
    fulfillment_status: "unfulfilled",
    currency: "USD",
    subtotal_price: "45.00",
    total_price: "50.12",
    created_at: "2026-08-23T19:55:00-04:00",
    updated_at: "2026-08-23T19:56:00-04:00",
    customer: { first_name: "Jane", last_name: "Doe", email: "jane@example.com" },
    line_items: [
      {
        id: 101,
        product_id: 201,
        variant_id: 301,
        sku: "TH-DISCO",
        title: "Disco Possum",
        variant_title: "Default Title",
        quantity: 2,
        price: "15.00",
      },
      {
        id: 102,
        product_id: 202,
        variant_id: 302,
        sku: "TH-HEX",
        title: "Hex Glow",
        variant_title: "Default Title",
        quantity: 1,
        price: "15.00",
      },
    ],
    ...overrides,
  };
}

describe("Shopify webhook HMAC", () => {
  it("accepts a valid HMAC over the raw body", () => {
    const raw = Buffer.from('{"id":1}', "utf8");
    const hmac = signBody(raw);
    expect(verifyShopifyWebhookHmac(raw, hmac, SECRET)).toBe(true);

    const auth = authorizeShopifyWebhook({
      rawBody: raw,
      hmacHeader: hmac,
      shopDomainHeader: SHOP,
      env: {
        NODE_ENV: "test",
        [SHOPIFY_CLIENT_SECRET_ENV]: SECRET,
        [SHOPIFY_SHOP_DOMAIN_ENV]: SHOP,
      } as NodeJS.ProcessEnv,
    });
    expect(auth.ok).toBe(true);
  });

  it("rejects an invalid HMAC", () => {
    const raw = Buffer.from('{"id":1}', "utf8");
    const auth = authorizeShopifyWebhook({
      rawBody: raw,
      hmacHeader: "not-a-valid-hmac========",
      shopDomainHeader: SHOP,
      env: {
        NODE_ENV: "test",
        [SHOPIFY_CLIENT_SECRET_ENV]: SECRET,
        [SHOPIFY_SHOP_DOMAIN_ENV]: SHOP,
      } as NodeJS.ProcessEnv,
    });
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.status).toBe(401);
  });

  it("rejects a missing HMAC", () => {
    const raw = Buffer.from('{"id":1}', "utf8");
    const auth = authorizeShopifyWebhook({
      rawBody: raw,
      hmacHeader: null,
      shopDomainHeader: SHOP,
      env: {
        NODE_ENV: "test",
        [SHOPIFY_CLIENT_SECRET_ENV]: SECRET,
      } as NodeJS.ProcessEnv,
    });
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.status).toBe(401);
  });

  it("rejects an unexpected shop when domain validation is configured", () => {
    const raw = Buffer.from('{"id":1}', "utf8");
    const hmac = signBody(raw);
    const auth = authorizeShopifyWebhook({
      rawBody: raw,
      hmacHeader: hmac,
      shopDomainHeader: "other-shop.myshopify.com",
      env: {
        NODE_ENV: "test",
        [SHOPIFY_CLIENT_SECRET_ENV]: SECRET,
        [SHOPIFY_SHOP_DOMAIN_ENV]: SHOP,
      } as NodeJS.ProcessEnv,
    });
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.status).toBe(403);
  });

  it("keeps the client secret env name server-only", () => {
    expect(SHOPIFY_CLIENT_SECRET_ENV.startsWith("NEXT_PUBLIC_")).toBe(false);
    expect(SHOPIFY_CLIENT_SECRET_ENV).toBe("SHOPIFY_CLIENT_SECRET");
  });
});

describe("commerce contract validation", () => {
  it("rejects a malformed payload", () => {
    const parsed = parseCommerceOrderInput({ provider: "shopify" });
    expect(parsed.ok).toBe(false);
  });

  it("accepts a valid CommerceOrderInput", () => {
    const parsed = parseCommerceOrderInput(basePayload());
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.order.shopifyOrderId).toBe("5678");
      expect(parsed.data.order.lineItems).toHaveLength(2);
    }
  });
});

describe("Shopify normalize", () => {
  it("lists supported order topics", () => {
    expect(SUPPORTED_ORDER_TOPICS).toContain("orders/create");
    expect(SUPPORTED_ORDER_TOPICS).toContain("orders/updated");
    expect(SUPPORTED_ORDER_TOPICS).toContain("orders/edited");
    expect(isSupportedOrderTopic("products/create")).toBe(false);
  });

  it("normalizes a Shopify order webhook into CommerceOrderInput", () => {
    const result = normalizeShopifyOrderWebhook({
      topic: "orders/create",
      shopDomain: SHOP,
      webhookId: "wh-1",
      body: shopifyOrderBody(),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.eventId).toBe("wh-1");
    expect(result.data.order.shopifyOrderId).toBe("5678");
    expect(result.data.order.lineItems).toHaveLength(2);
    expect(result.data.order.lineItems[0].shopifyVariantId).toBe("301");
  });

  it("rejects a malformed Shopify payload", () => {
    const result = normalizeShopifyOrderWebhook({
      topic: "orders/create",
      shopDomain: SHOP,
      webhookId: "wh-1",
      body: { name: "missing id" },
    });
    expect(result.ok).toBe(false);
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

  it("creates an order with line items from a supported create payload", async () => {
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
    expect(lines.find((l) => l.shopify_variant_id === "var-disco")?.polish_id).toBe(
      POLISH_A
    );
    expect(lines.find((l) => l.shopify_variant_id === "var-hex")?.polish_id).toBeNull();
  });

  it("ingests unknown variants as Needs Mapping (unmapped)", async () => {
    const result = await ingestShopifyOrder(basePayload(), repo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.unmappedLineCount).toBe(1);
  });

  it("does not duplicate on retry of the same Shopify webhook id", async () => {
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

  it("updates existing order state on a later update event", async () => {
    await ingestShopifyOrder(basePayload(), repo);
    const updatedPayload = basePayload({
      eventId: "evt-2",
      event: "orders/updated",
    });
    (updatedPayload as { order: Record<string, unknown> }).order = {
      ...basePayload().order,
      fulfillmentStatus: "partial",
      total: 55,
      updatedAt: "2026-08-23T20:10:00.000Z",
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
    expect(lines.find((l) => l.shopify_variant_id === "var-hex")?.polish_id).toBe(
      POLISH_B
    );
  });

  it("skips stale updates so older events cannot overwrite newer order state", async () => {
    await ingestShopifyOrder(basePayload(), repo);
    await ingestShopifyOrder(
      basePayload({
        eventId: "evt-newer",
        event: "orders/updated",
        order: {
          ...basePayload().order,
          total: 99,
          updatedAt: "2026-08-23T21:00:00.000Z",
        },
      }),
      repo
    );

    const stale = await ingestShopifyOrder(
      basePayload({
        eventId: "evt-stale",
        event: "orders/updated",
        order: {
          ...basePayload().order,
          total: 1,
          updatedAt: "2026-08-23T19:50:00.000Z",
        },
      }),
      repo
    );
    expect(stale.ok).toBe(true);
    if (!stale.ok) return;
    expect(stale.skippedStale).toBe(true);

    const order = await repo.findOrderByShopifyId(SHOP, "5678");
    expect(order?.total).toBe(99);
  });

  it("does not mutate commerce data for unsupported topics at the normalize gate", () => {
    expect(isSupportedOrderTopic("app/uninstalled")).toBe(false);
    const normalized = normalizeShopifyOrderWebhook({
      topic: "app/uninstalled",
      shopDomain: SHOP,
      webhookId: "wh-x",
      body: shopifyOrderBody(),
    });
    expect(normalized.ok).toBe(false);
  });
});

describe("freshness helper", () => {
  it("detects older incoming timestamps", () => {
    expect(
      isStaleOrderUpdate(
        { shopify_updated_at: "2026-08-23T21:00:00.000Z" },
        "2026-08-23T20:00:00.000Z"
      )
    ).toBe(true);
    expect(
      isStaleOrderUpdate(
        { shopify_updated_at: "2026-08-23T20:00:00.000Z" },
        "2026-08-23T21:00:00.000Z"
      )
    ).toBe(false);
  });
});

describe("commerce security boundaries", () => {
  it("does not allow mapping to a missing polish", async () => {
    const repo = createMemoryCommerceRepository({ polishes: new Set([POLISH_A]) });
    await expect(
      saveVariantPolishMapping({ shopifyVariantId: "var-x", polishId: POLISH_B }, repo)
    ).rejects.toThrow(/not found/i);
  });
});
