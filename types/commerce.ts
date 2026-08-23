/**
 * Commerce / Shopify order domain types.
 * Canonical product link is polish_id → polishes.
 */

export type CommerceMappingStatus = "fully_mapped" | "needs_mapping";

export type CommerceIntegrationEventStatus =
  | "received"
  | "processed"
  | "duplicate"
  | "failed";

export interface CommerceOrder {
  id: string;
  shop_domain: string;
  shopify_order_id: string;
  shopify_order_number: number | null;
  shopify_order_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  currency: string;
  subtotal: number;
  total: number;
  ordered_at: string | null;
  shopify_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommerceOrderLine {
  id: string;
  commerce_order_id: string;
  shopify_line_item_id: string;
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
  sku: string | null;
  product_title: string | null;
  variant_title: string | null;
  quantity: number;
  unit_price: number;
  polish_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommerceOrderLineWithPolish extends CommerceOrderLine {
  polish_name?: string | null;
  polish_color_hex?: string | null;
}

export interface CommerceOrderListItem extends CommerceOrder {
  line_count: number;
  bottle_count: number;
  unmapped_line_count: number;
  mapping_status: CommerceMappingStatus;
}

export interface CommerceOrderDetail extends CommerceOrder {
  lines: CommerceOrderLineWithPolish[];
  mapping_status: CommerceMappingStatus;
  bottle_count: number;
}

export interface CommerceProductMapping {
  id: string;
  provider: "shopify";
  shop_domain: string;
  shopify_product_id: string | null;
  shopify_variant_id: string;
  sku: string | null;
  polish_id: string;
  created_at: string;
  updated_at: string;
}

export interface CommerceIntegrationEvent {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  shop_domain: string;
  status: CommerceIntegrationEventStatus;
  commerce_order_id: string | null;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommerceDemandStats {
  openOrderCount: number;
  openBottleCount: number;
  needsMappingLineCount: number;
  needsMappingVariantCount: number;
}
