/**
 * Shopify webhook authenticity — HMAC-SHA256 over the raw request body.
 * Server-only. Never expose SHOPIFY_CLIENT_SECRET to the browser.
 */

import { createHmac, timingSafeEqual } from "crypto";

export const SHOPIFY_CLIENT_SECRET_ENV = "SHOPIFY_CLIENT_SECRET";
export const SHOPIFY_SHOP_DOMAIN_ENV = "SHOPIFY_SHOP_DOMAIN";

export type ShopifyVerifyResult =
  | { ok: true; shopDomain: string }
  | { ok: false; status: 401 | 403 | 503; error: string };

function normalizeShopDomain(value: string | null | undefined): string | null {
  if (!value) return null;
  const t = value.trim().toLowerCase();
  return t.length ? t : null;
}

/**
 * Verify X-Shopify-Hmac-Sha256 against the exact raw body bytes Shopify signed.
 * Do not re-stringify parsed JSON.
 */
export function verifyShopifyWebhookHmac(
  rawBody: Buffer,
  hmacHeader: string | null,
  secret: string
): boolean {
  if (!hmacHeader?.trim() || !secret) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  const expected = Buffer.from(digest, "utf8");
  const provided = Buffer.from(hmacHeader.trim(), "utf8");
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export function authorizeShopifyWebhook(input: {
  rawBody: Buffer;
  hmacHeader: string | null;
  shopDomainHeader: string | null;
  env?: NodeJS.ProcessEnv;
}): ShopifyVerifyResult {
  const env = input.env ?? process.env;
  const secret = env[SHOPIFY_CLIENT_SECRET_ENV]?.trim();
  if (!secret) {
    return { ok: false, status: 503, error: "Webhook endpoint is not configured" };
  }

  if (!verifyShopifyWebhookHmac(input.rawBody, input.hmacHeader, secret)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const incomingShop = normalizeShopDomain(input.shopDomainHeader);
  if (!incomingShop) {
    return { ok: false, status: 401, error: "Missing shop domain" };
  }

  const expectedShop = normalizeShopDomain(env[SHOPIFY_SHOP_DOMAIN_ENV]);
  if (expectedShop && incomingShop !== expectedShop) {
    return { ok: false, status: 403, error: "Unexpected shop" };
  }

  return { ok: true, shopDomain: incomingShop };
}

/** Case-insensitive header helper for Shopify webhook metadata. */
export function getShopifyHeader(
  headers: Headers,
  name: string
): string | null {
  const value = headers.get(name);
  return value?.trim() ? value.trim() : null;
}
