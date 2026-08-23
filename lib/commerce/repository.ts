/**
 * Commerce persistence port — Supabase impl + in-memory for tests.
 */

import type {
  CommerceIntegrationEvent,
  CommerceIntegrationEventStatus,
  CommerceOrder,
  CommerceOrderLine,
  CommerceProductMapping,
} from "@/types/commerce";
import { createAdminClient } from "@/supabase/admin";
import { resolveDataClient, resolveWriteClient } from "@/lib/admin/supabase-write";
import { defaultShopDomain } from "@/lib/commerce/helpers";

export type UpsertOrderInput = {
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
};

export type UpsertLineInput = {
  shopify_line_item_id: string;
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
  sku: string | null;
  product_title: string | null;
  variant_title: string | null;
  quantity: number;
  unit_price: number;
  polish_id: string | null;
};

export type MappingLookupKey = {
  shop_domain: string;
  shopify_variant_id: string;
};

export interface CommerceRepository {
  findEventByProviderEventId(
    provider: string,
    eventId: string
  ): Promise<CommerceIntegrationEvent | null>;
  insertEvent(input: {
    provider: string;
    event_id: string;
    event_type: string;
    shop_domain: string;
    status: CommerceIntegrationEventStatus;
    received_at: string;
  }): Promise<CommerceIntegrationEvent>;
  updateEvent(
    id: string,
    patch: Partial<{
      status: CommerceIntegrationEventStatus;
      commerce_order_id: string | null;
      error_message: string | null;
      processed_at: string | null;
    }>
  ): Promise<void>;
  findOrderByShopifyId(
    shopDomain: string,
    shopifyOrderId: string
  ): Promise<CommerceOrder | null>;
  upsertOrder(input: UpsertOrderInput): Promise<CommerceOrder>;
  listLinesForOrder(orderId: string): Promise<CommerceOrderLine[]>;
  syncOrderLines(orderId: string, lines: UpsertLineInput[]): Promise<CommerceOrderLine[]>;
  findPolishIdForVariant(key: MappingLookupKey): Promise<string | null>;
  upsertProductMapping(input: {
    shop_domain: string;
    shopify_product_id: string | null;
    shopify_variant_id: string;
    sku: string | null;
    polish_id: string;
  }): Promise<CommerceProductMapping>;
  applyMappingToUnmappedLines(input: {
    shop_domain: string;
    shopify_variant_id: string;
    polish_id: string;
  }): Promise<number>;
  polishExists(polishId: string): Promise<boolean>;
}

function toNum(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapOrder(row: Record<string, unknown>): CommerceOrder {
  return {
    id: row.id as string,
    shop_domain: row.shop_domain as string,
    shopify_order_id: row.shopify_order_id as string,
    shopify_order_number:
      row.shopify_order_number == null ? null : toNum(row.shopify_order_number),
    shopify_order_name: (row.shopify_order_name as string) ?? null,
    customer_name: (row.customer_name as string) ?? null,
    customer_email: (row.customer_email as string) ?? null,
    financial_status: (row.financial_status as string) ?? null,
    fulfillment_status: (row.fulfillment_status as string) ?? null,
    currency: (row.currency as string) || "USD",
    subtotal: toNum(row.subtotal),
    total: toNum(row.total),
    ordered_at: (row.ordered_at as string) ?? null,
    shopify_updated_at: (row.shopify_updated_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapLine(row: Record<string, unknown>): CommerceOrderLine {
  return {
    id: row.id as string,
    commerce_order_id: row.commerce_order_id as string,
    shopify_line_item_id: row.shopify_line_item_id as string,
    shopify_product_id: (row.shopify_product_id as string) ?? null,
    shopify_variant_id: (row.shopify_variant_id as string) ?? null,
    sku: (row.sku as string) ?? null,
    product_title: (row.product_title as string) ?? null,
    variant_title: (row.variant_title as string) ?? null,
    quantity: toNum(row.quantity),
    unit_price: toNum(row.unit_price),
    polish_id: (row.polish_id as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapMapping(row: Record<string, unknown>): CommerceProductMapping {
  return {
    id: row.id as string,
    provider: "shopify",
    shop_domain: row.shop_domain as string,
    shopify_product_id: (row.shopify_product_id as string) ?? null,
    shopify_variant_id: row.shopify_variant_id as string,
    sku: (row.sku as string) ?? null,
    polish_id: row.polish_id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapEvent(row: Record<string, unknown>): CommerceIntegrationEvent {
  return {
    id: row.id as string,
    provider: row.provider as string,
    event_id: row.event_id as string,
    event_type: row.event_type as string,
    shop_domain: row.shop_domain as string,
    status: row.status as CommerceIntegrationEventStatus,
    commerce_order_id: (row.commerce_order_id as string) ?? null,
    error_message: (row.error_message as string) ?? null,
    received_at: row.received_at as string,
    processed_at: (row.processed_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

/** In-memory repository for unit tests (no Supabase). */
export function createMemoryCommerceRepository(seed?: {
  polishes?: Set<string>;
  mappings?: CommerceProductMapping[];
}): CommerceRepository {
  const orders = new Map<string, CommerceOrder>();
  const linesByOrder = new Map<string, CommerceOrderLine[]>();
  const events = new Map<string, CommerceIntegrationEvent>();
  const mappings = new Map<string, CommerceProductMapping>();
  const polishes = seed?.polishes ?? new Set<string>();

  for (const m of seed?.mappings ?? []) {
    mappings.set(`${m.shop_domain}::${m.shopify_variant_id}`, m);
  }

  const orderKey = (shop: string, shopifyId: string) => `${shop}::${shopifyId}`;

  return {
    async findEventByProviderEventId(provider, eventId) {
      return events.get(`${provider}::${eventId}`) ?? null;
    },
    async insertEvent(input) {
      const key = `${input.provider}::${input.event_id}`;
      if (events.has(key)) {
        const err = new Error("duplicate event") as Error & { code?: string };
        err.code = "23505";
        throw err;
      }
      const row: CommerceIntegrationEvent = {
        id: newId(),
        provider: input.provider,
        event_id: input.event_id,
        event_type: input.event_type,
        shop_domain: input.shop_domain,
        status: input.status,
        commerce_order_id: null,
        error_message: null,
        received_at: input.received_at,
        processed_at: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      events.set(key, row);
      return row;
    },
    async updateEvent(id, patch) {
      for (const [key, ev] of Array.from(events.entries())) {
        if (ev.id === id) {
          events.set(key, { ...ev, ...patch, updated_at: nowIso() });
          return;
        }
      }
    },
    async findOrderByShopifyId(shopDomain, shopifyOrderId) {
      return orders.get(orderKey(shopDomain, shopifyOrderId)) ?? null;
    },
    async upsertOrder(input) {
      const key = orderKey(input.shop_domain, input.shopify_order_id);
      const existing = orders.get(key);
      const row: CommerceOrder = existing
        ? { ...existing, ...input, updated_at: nowIso() }
        : { id: newId(), ...input, created_at: nowIso(), updated_at: nowIso() };
      orders.set(key, row);
      if (!linesByOrder.has(row.id)) linesByOrder.set(row.id, []);
      return row;
    },
    async listLinesForOrder(orderId) {
      return [...(linesByOrder.get(orderId) ?? [])];
    },
    async syncOrderLines(orderId, incoming) {
      const existing = linesByOrder.get(orderId) ?? [];
      const byLineId = new Map(existing.map((l) => [l.shopify_line_item_id, l]));
      const keep = new Set(incoming.map((l) => l.shopify_line_item_id));
      const next: CommerceOrderLine[] = incoming.map((line) => {
        const prev = byLineId.get(line.shopify_line_item_id);
        return prev
          ? { ...prev, ...line, updated_at: nowIso() }
          : {
              id: newId(),
              commerce_order_id: orderId,
              ...line,
              created_at: nowIso(),
              updated_at: nowIso(),
            };
      });
      const filtered = next.filter((l) => keep.has(l.shopify_line_item_id));
      linesByOrder.set(orderId, filtered);
      return filtered;
    },
    async findPolishIdForVariant(key) {
      return mappings.get(`${key.shop_domain}::${key.shopify_variant_id}`)?.polish_id ?? null;
    },
    async upsertProductMapping(input) {
      const key = `${input.shop_domain}::${input.shopify_variant_id}`;
      const existing = mappings.get(key);
      const row: CommerceProductMapping = existing
        ? { ...existing, ...input, provider: "shopify", updated_at: nowIso() }
        : {
            id: newId(),
            provider: "shopify",
            ...input,
            created_at: nowIso(),
            updated_at: nowIso(),
          };
      mappings.set(key, row);
      return row;
    },
    async applyMappingToUnmappedLines(input) {
      let updated = 0;
      for (const [orderId, lines] of Array.from(linesByOrder.entries())) {
        const order = Array.from(orders.values()).find((o) => o.id === orderId);
        if (!order || order.shop_domain !== input.shop_domain) continue;
        linesByOrder.set(
          orderId,
          lines.map((l: CommerceOrderLine) => {
            if (l.shopify_variant_id === input.shopify_variant_id && l.polish_id == null) {
              updated += 1;
              return { ...l, polish_id: input.polish_id, updated_at: nowIso() };
            }
            return l;
          })
        );
      }
      return updated;
    },
    async polishExists(polishId) {
      return polishes.has(polishId);
    },
  };
}

export function createSupabaseCommerceRepository(): CommerceRepository {
  return {
    async findEventByProviderEventId(provider, eventId) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("commerce_integration_events")
        .select("*")
        .eq("provider", provider)
        .eq("event_id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapEvent(data as Record<string, unknown>) : null;
    },
    async insertEvent(input) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("commerce_integration_events")
        .insert({
          provider: input.provider,
          event_id: input.event_id,
          event_type: input.event_type,
          shop_domain: input.shop_domain,
          status: input.status,
          received_at: input.received_at,
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapEvent(data as Record<string, unknown>);
    },
    async updateEvent(id, patch) {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from("commerce_integration_events")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    async findOrderByShopifyId(shopDomain, shopifyOrderId) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("commerce_orders")
        .select("*")
        .eq("shop_domain", shopDomain)
        .eq("shopify_order_id", shopifyOrderId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapOrder(data as Record<string, unknown>) : null;
    },
    async upsertOrder(input) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("commerce_orders")
        .upsert(input, { onConflict: "shop_domain,shopify_order_id" })
        .select("*")
        .single();
      if (error) throw error;
      return mapOrder(data as Record<string, unknown>);
    },
    async listLinesForOrder(orderId) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("commerce_order_lines")
        .select("*")
        .eq("commerce_order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => mapLine(r as Record<string, unknown>));
    },
    async syncOrderLines(orderId, lines) {
      const supabase = createAdminClient();
      const existing = await this.listLinesForOrder(orderId);
      const incomingIds = new Set(lines.map((l) => l.shopify_line_item_id));
      const toDelete = existing
        .filter((l) => !incomingIds.has(l.shopify_line_item_id))
        .map((l) => l.id);

      if (toDelete.length) {
        const { error: delErr } = await supabase
          .from("commerce_order_lines")
          .delete()
          .in("id", toDelete);
        if (delErr) throw delErr;
      }

      if (lines.length) {
        const rows = lines.map((l) => ({
          commerce_order_id: orderId,
          ...l,
        }));
        const { error: upErr } = await supabase.from("commerce_order_lines").upsert(rows, {
          onConflict: "commerce_order_id,shopify_line_item_id",
        });
        if (upErr) throw upErr;
      }

      return this.listLinesForOrder(orderId);
    },
    async findPolishIdForVariant(key) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("commerce_product_mappings")
        .select("polish_id")
        .eq("provider", "shopify")
        .eq("shop_domain", key.shop_domain)
        .eq("shopify_variant_id", key.shopify_variant_id)
        .maybeSingle();
      if (error) throw error;
      return (data?.polish_id as string) ?? null;
    },
    async upsertProductMapping(input) {
      const supabase = await resolveWriteClient();
      const { data, error } = await supabase
        .from("commerce_product_mappings")
        .upsert(
          {
            provider: "shopify",
            shop_domain: input.shop_domain,
            shopify_product_id: input.shopify_product_id,
            shopify_variant_id: input.shopify_variant_id,
            sku: input.sku,
            polish_id: input.polish_id,
          },
          { onConflict: "provider,shop_domain,shopify_variant_id" }
        )
        .select("*")
        .single();
      if (error) throw error;
      return mapMapping(data as Record<string, unknown>);
    },
    async applyMappingToUnmappedLines(input) {
      const supabase = await resolveWriteClient();
      const { data: orderRows, error: orderErr } = await supabase
        .from("commerce_orders")
        .select("id")
        .eq("shop_domain", input.shop_domain);
      if (orderErr) throw orderErr;
      const orderIds = (orderRows ?? []).map((o) => o.id as string);
      if (!orderIds.length) return 0;

      const { data, error } = await supabase
        .from("commerce_order_lines")
        .update({ polish_id: input.polish_id })
        .in("commerce_order_id", orderIds)
        .eq("shopify_variant_id", input.shopify_variant_id)
        .is("polish_id", null)
        .select("id");
      if (error) throw error;
      return data?.length ?? 0;
    },
    async polishExists(polishId) {
      const supabase = await resolveDataClient();
      const { data, error } = await supabase
        .from("polishes")
        .select("id")
        .eq("id", polishId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  };
}

export function resolveShopDomain(explicit?: string | null): string {
  if (explicit && explicit.trim()) return explicit.trim().toLowerCase();
  return defaultShopDomain();
}
