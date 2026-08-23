/**
 * Admin read models for commerce orders + demand stats.
 */

import { num, resolveDataClient } from "@/lib/admin/supabase-write";
import {
  isOpenFulfillmentStatus,
  mappingStatusForLines,
  sumBottleCount,
} from "@/lib/commerce/helpers";
import type {
  CommerceDemandStats,
  CommerceOrder,
  CommerceOrderDetail,
  CommerceOrderLineWithPolish,
  CommerceOrderListItem,
} from "@/types/commerce";

function mapOrder(row: Record<string, unknown>): CommerceOrder {
  return {
    id: row.id as string,
    shop_domain: row.shop_domain as string,
    shopify_order_id: row.shopify_order_id as string,
    shopify_order_number:
      row.shopify_order_number == null ? null : num(row.shopify_order_number),
    shopify_order_name: (row.shopify_order_name as string) ?? null,
    customer_name: (row.customer_name as string) ?? null,
    customer_email: (row.customer_email as string) ?? null,
    financial_status: (row.financial_status as string) ?? null,
    fulfillment_status: (row.fulfillment_status as string) ?? null,
    currency: (row.currency as string) || "USD",
    subtotal: num(row.subtotal),
    total: num(row.total),
    ordered_at: (row.ordered_at as string) ?? null,
    shopify_updated_at: (row.shopify_updated_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listCommerceOrders(): Promise<CommerceOrderListItem[]> {
  const supabase = await resolveDataClient();
  const { data: orders, error } = await supabase
    .from("commerce_orders")
    .select("*")
    .order("ordered_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  if (!orders?.length) return [];

  const orderIds = orders.map((o) => o.id as string);
  const { data: lines, error: lineErr } = await supabase
    .from("commerce_order_lines")
    .select("commerce_order_id, quantity, polish_id")
    .in("commerce_order_id", orderIds);
  if (lineErr) throw lineErr;

  const byOrder = new Map<string, Array<{ quantity: number; polish_id: string | null }>>();
  for (const line of lines ?? []) {
    const oid = line.commerce_order_id as string;
    const bucket = byOrder.get(oid) ?? [];
    bucket.push({
      quantity: num(line.quantity),
      polish_id: (line.polish_id as string) ?? null,
    });
    byOrder.set(oid, bucket);
  }

  return orders.map((row) => {
    const order = mapOrder(row as Record<string, unknown>);
    const orderLines = byOrder.get(order.id) ?? [];
    const unmapped = orderLines.filter((l) => !l.polish_id).length;
    return {
      ...order,
      line_count: orderLines.length,
      bottle_count: sumBottleCount(orderLines),
      unmapped_line_count: unmapped,
      mapping_status: mappingStatusForLines(orderLines),
    };
  });
}

export async function getCommerceOrderDetail(
  orderId: string
): Promise<CommerceOrderDetail | null> {
  const supabase = await resolveDataClient();
  const { data: orderRow, error } = await supabase
    .from("commerce_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!orderRow) return null;

  const { data: lineRows, error: lineErr } = await supabase
    .from("commerce_order_lines")
    .select("*, polishes(id, name, color_hex)")
    .eq("commerce_order_id", orderId)
    .order("created_at", { ascending: true });
  if (lineErr) throw lineErr;

  const lines: CommerceOrderLineWithPolish[] = (lineRows ?? []).map((row) => {
    const polish = row.polishes as
      | { id: string; name: string; color_hex: string | null }
      | null
      | undefined;
    return {
      id: row.id as string,
      commerce_order_id: row.commerce_order_id as string,
      shopify_line_item_id: row.shopify_line_item_id as string,
      shopify_product_id: (row.shopify_product_id as string) ?? null,
      shopify_variant_id: (row.shopify_variant_id as string) ?? null,
      sku: (row.sku as string) ?? null,
      product_title: (row.product_title as string) ?? null,
      variant_title: (row.variant_title as string) ?? null,
      quantity: num(row.quantity),
      unit_price: num(row.unit_price),
      polish_id: (row.polish_id as string) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      polish_name: polish?.name ?? null,
      polish_color_hex: polish?.color_hex ?? null,
    };
  });

  const order = mapOrder(orderRow as Record<string, unknown>);
  return {
    ...order,
    lines,
    bottle_count: sumBottleCount(lines),
    mapping_status: mappingStatusForLines(lines),
  };
}

export async function getCommerceDemandStats(): Promise<CommerceDemandStats> {
  const empty: CommerceDemandStats = {
    openOrderCount: 0,
    openBottleCount: 0,
    needsMappingLineCount: 0,
    needsMappingVariantCount: 0,
  };

  try {
    const supabase = await resolveDataClient();
    const { data: orders, error } = await supabase
      .from("commerce_orders")
      .select("id, fulfillment_status");
    if (error) throw error;
    if (!orders?.length) return empty;

    const openOrders = orders.filter((o) =>
      isOpenFulfillmentStatus(o.fulfillment_status as string | null)
    );
    const openIds = new Set(openOrders.map((o) => o.id as string));

    const { data: lines, error: lineErr } = await supabase
      .from("commerce_order_lines")
      .select("commerce_order_id, quantity, polish_id, shopify_variant_id");
    if (lineErr) throw lineErr;

    let openBottleCount = 0;
    let needsMappingLineCount = 0;
    const unmappedVariants = new Set<string>();

    for (const line of lines ?? []) {
      const qty = num(line.quantity);
      if (openIds.has(line.commerce_order_id as string)) {
        openBottleCount += qty;
      }
      if (!line.polish_id) {
        needsMappingLineCount += 1;
        if (line.shopify_variant_id) {
          unmappedVariants.add(line.shopify_variant_id as string);
        }
      }
    }

    return {
      openOrderCount: openOrders.length,
      openBottleCount,
      needsMappingLineCount,
      needsMappingVariantCount: unmappedVariants.size,
    };
  } catch {
    return empty;
  }
}
