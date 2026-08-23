"use server";

/**
 * Admin actions for Shopify variant → polish mapping.
 */

import { revalidatePath } from "next/cache";
import { saveVariantPolishMapping } from "@/lib/commerce/ingest";
import { createSupabaseCommerceRepository } from "@/lib/commerce/repository";
import { getErrorMessage } from "@/lib/errors";

export type MapVariantResult =
  | { ok: true; linesUpdated: number }
  | { ok: false; error: string };

export async function mapShopifyVariantToPolishAction(
  formData: FormData
): Promise<MapVariantResult> {
  try {
    const shopifyVariantId = String(formData.get("shopify_variant_id") ?? "").trim();
    const polishId = String(formData.get("polish_id") ?? "").trim();
    const shopDomain = String(formData.get("shop_domain") ?? "").trim() || null;
    const shopifyProductId = String(formData.get("shopify_product_id") ?? "").trim() || null;
    const sku = String(formData.get("sku") ?? "").trim() || null;

    if (!shopifyVariantId) return { ok: false, error: "Shopify variant id is required" };
    if (!polishId) return { ok: false, error: "Select a polish" };

    const repo = createSupabaseCommerceRepository();
    const result = await saveVariantPolishMapping(
      {
        shopDomain,
        shopifyProductId,
        shopifyVariantId,
        sku,
        polishId,
      },
      repo
    );

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true, linesUpdated: result.linesUpdated };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Could not save mapping") };
  }
}
