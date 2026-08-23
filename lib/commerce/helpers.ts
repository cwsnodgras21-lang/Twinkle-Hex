/**
 * Pure helpers for commerce mapping / demand signals.
 */

import type { CommerceMappingStatus } from "@/types/commerce";

export function mappingStatusForLines(
  lines: Array<{ polish_id: string | null }>
): CommerceMappingStatus {
  if (lines.length === 0) return "fully_mapped";
  return lines.some((l) => !l.polish_id) ? "needs_mapping" : "fully_mapped";
}

export function sumBottleCount(lines: Array<{ quantity: number }>): number {
  return lines.reduce((sum, l) => sum + (Number.isFinite(l.quantity) ? l.quantity : 0), 0);
}

/** Fulfillment statuses treated as still open demand (not fulfilled/cancelled). */
export function isOpenFulfillmentStatus(status: string | null | undefined): boolean {
  if (!status) return true;
  const s = status.trim().toLowerCase();
  if (!s) return true;
  return !["fulfilled", "cancelled", "canceled", "restocked"].includes(s);
}

export function defaultShopDomain(env: NodeJS.ProcessEnv = process.env): string {
  const fromEnv = env.SHOPIFY_SHOP_DOMAIN?.trim().toLowerCase();
  return fromEnv && fromEnv.length ? fromEnv : "primary";
}
