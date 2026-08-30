/**
 * Manual program revenue (LLB / SOU / LBOH) + Shopify rollup for the monthly goal.
 */

import { resolveWriteClient, resolveDataClient, num } from "@/lib/admin/supabase-write";
import { getOpsSettings } from "@/lib/admin/ops-settings";
import {
  buildMonthRevenueReport,
  monthBounds,
  type MonthRevenueReport,
} from "@/lib/ops/revenue";
import type { RevenueEntry, RevenueSource } from "@/types/admin";

function mapEntry(row: Record<string, unknown>): RevenueEntry {
  return {
    id: row.id as string,
    received_date: row.received_date as string,
    amount: num(row.amount),
    source: row.source as RevenueSource,
    payment_method: (row.payment_method as string) ?? undefined,
    external_reference: (row.external_reference as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listRevenueEntries(opts?: {
  from?: string;
  toExclusive?: string;
}): Promise<RevenueEntry[]> {
  const supabase = await resolveDataClient();
  let query = supabase.from("revenue_entries").select("*").order("received_date", {
    ascending: false,
  });
  if (opts?.from) query = query.gte("received_date", opts.from);
  if (opts?.toExclusive) query = query.lt("received_date", opts.toExclusive);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => mapEntry(r as Record<string, unknown>));
}

export async function createRevenueEntry(input: {
  received_date: string;
  amount: number;
  source: RevenueSource;
  payment_method?: string | null;
  external_reference?: string | null;
  notes?: string | null;
}): Promise<RevenueEntry> {
  if (!input.received_date) throw new Error("Date received is required");
  if (!(input.amount >= 0)) throw new Error("Amount must be >= 0");
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("revenue_entries")
    .insert({
      received_date: input.received_date,
      amount: input.amount,
      source: input.source,
      payment_method: input.payment_method ?? "paypal",
      external_reference: input.external_reference ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapEntry(data as Record<string, unknown>);
}

export async function deleteRevenueEntry(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("revenue_entries").delete().eq("id", id);
  if (error) throw error;
}

async function sumShopifyRevenue(from: string, toExclusive: string): Promise<number> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("commerce_orders")
    .select("total, ordered_at")
    .gte("ordered_at", from)
    .lt("ordered_at", toExclusive);
  if (error) {
    // Table may be empty / unavailable in some envs
    console.error("sumShopifyRevenue", error.message);
    return 0;
  }
  return (data ?? []).reduce((sum, row) => sum + Number((row as { total?: number }).total ?? 0), 0);
}

export async function getMonthRevenueReport(
  year?: number,
  month?: number
): Promise<MonthRevenueReport> {
  const now = new Date();
  const y = year ?? now.getUTCFullYear();
  const m = month ?? now.getUTCMonth() + 1;
  const settings = await getOpsSettings();
  const { start, endExclusive } = monthBounds(y, m);

  const priorMonth = m === 1 ? 12 : m - 1;
  const priorYear = m === 1 ? y - 1 : y;
  const prior = monthBounds(priorYear, priorMonth);

  const [entries, shopifyTotal, priorEntries, priorShopify] = await Promise.all([
    listRevenueEntries({ from: start, toExclusive: endExclusive }),
    sumShopifyRevenue(start, endExclusive),
    listRevenueEntries({ from: prior.start, toExclusive: prior.endExclusive }),
    sumShopifyRevenue(prior.start, prior.endExclusive),
  ]);

  return buildMonthRevenueReport({
    year: y,
    month: m,
    goal: settings.monthly_revenue_goal,
    shopifyTotal,
    programEntries: entries.map((e) => ({ source: e.source, amount: e.amount })),
    priorShopifyTotal: priorShopify,
    priorProgramEntries: priorEntries.map((e) => ({ source: e.source, amount: e.amount })),
  });
}
