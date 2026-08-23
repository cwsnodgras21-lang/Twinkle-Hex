/**
 * Normalized n8n → app Shopify order ingest contract.
 * Runtime validation via Zod; do not trust monetary values or IDs blindly.
 */

import { z } from "zod";

const optionalTrimmed = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return null;
    const t = String(v).trim();
    return t.length ? t : null;
  });

const moneySchema = z.coerce.number().finite().min(0).max(1_000_000_000);

const lineItemSchema = z.object({
  shopifyLineItemId: z.coerce.string().trim().min(1).max(64),
  shopifyProductId: optionalTrimmed,
  shopifyVariantId: optionalTrimmed,
  sku: optionalTrimmed,
  productTitle: optionalTrimmed,
  variantTitle: optionalTrimmed,
  quantity: z.coerce.number().int().min(0).max(100_000),
  unitPrice: moneySchema,
});

const customerSchema = z
  .object({
    name: optionalTrimmed,
    email: z
      .union([z.string().email(), z.literal(""), z.null(), z.undefined()])
      .transform((v) => {
        if (v == null || v === "") return null;
        return v.trim().toLowerCase();
      }),
  })
  .optional()
  .nullable();

const orderSchema = z.object({
  shopifyOrderId: z.coerce.string().trim().min(1).max(64),
  orderNumber: z.coerce.number().int().min(0).max(2_147_483_647).nullable().optional(),
  name: optionalTrimmed,
  customer: customerSchema,
  financialStatus: optionalTrimmed,
  fulfillmentStatus: optionalTrimmed,
  currency: z
    .string()
    .trim()
    .min(1)
    .max(8)
    .default("USD")
    .transform((c) => c.toUpperCase()),
  subtotal: moneySchema,
  total: moneySchema,
  orderedAt: z.string().datetime({ offset: true }).nullable().optional(),
  updatedAt: z.string().datetime({ offset: true }).nullable().optional(),
  lineItems: z.array(lineItemSchema).max(500),
});

export const shopifyOrderIngestSchema = z.object({
  provider: z.literal("shopify"),
  event: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(256),
  receivedAt: z.string().datetime({ offset: true }).optional(),
  shopDomain: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .transform((v) => (v && v.length ? v.toLowerCase() : undefined)),
  order: orderSchema,
});

export type ShopifyOrderIngestPayload = z.infer<typeof shopifyOrderIngestSchema>;
export type ShopifyIngestLineItem = z.infer<typeof lineItemSchema>;

export function parseShopifyOrderIngest(input: unknown):
  | { ok: true; data: ShopifyOrderIngestPayload }
  | { ok: false; error: string; issues?: z.ZodIssue[] } {
  const result = shopifyOrderIngestSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.length ? first.path.join(".") : "payload";
    return {
      ok: false,
      error: `${path}: ${first?.message ?? "Invalid payload"}`,
      issues: result.error.issues,
    };
  }
  return { ok: true, data: result.data };
}
