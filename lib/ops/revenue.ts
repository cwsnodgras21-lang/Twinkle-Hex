/**
 * Monthly revenue rollup toward Twinkle & Hex $1500 goal.
 * Report by business source — not payment method.
 */

export type RevenueSourceKey = "shopify" | "LLB" | "SOU" | "LBOH" | "other";

export type MonthRevenueInput = {
  year: number;
  month: number; // 1-12
  goal: number;
  shopifyTotal: number;
  programEntries: Array<{ source: string; amount: number }>;
  /** Prior calendar month totals for MoM (optional). */
  priorShopifyTotal?: number;
  priorProgramEntries?: Array<{ source: string; amount: number }>;
};

export type MonthRevenueReport = {
  year: number;
  month: number;
  goal: number;
  by_source: Record<RevenueSourceKey, number>;
  total: number;
  progress_ratio: number;
  remaining_to_goal: number;
  prior_total: number | null;
  mom_delta: number | null;
  mom_pct: number | null;
};

function sumBySource(
  shopifyTotal: number,
  entries: Array<{ source: string; amount: number }>
): Record<RevenueSourceKey, number> {
  const by: Record<RevenueSourceKey, number> = {
    shopify: Number(shopifyTotal) || 0,
    LLB: 0,
    SOU: 0,
    LBOH: 0,
    other: 0,
  };
  for (const e of entries) {
    const amt = Number(e.amount) || 0;
    if (e.source === "LLB" || e.source === "SOU" || e.source === "LBOH" || e.source === "other") {
      by[e.source] += amt;
    } else {
      by.other += amt;
    }
  }
  return by;
}

function totalOf(by: Record<RevenueSourceKey, number>): number {
  return by.shopify + by.LLB + by.SOU + by.LBOH + by.other;
}

export function buildMonthRevenueReport(input: MonthRevenueInput): MonthRevenueReport {
  const by_source = sumBySource(input.shopifyTotal, input.programEntries);
  const total = totalOf(by_source);
  const goal = Math.max(0, Number(input.goal) || 0);
  const progress_ratio = goal > 0 ? total / goal : 0;
  const remaining_to_goal = Math.max(0, goal - total);

  let prior_total: number | null = null;
  let mom_delta: number | null = null;
  let mom_pct: number | null = null;

  if (input.priorShopifyTotal != null || input.priorProgramEntries) {
    const prior = sumBySource(input.priorShopifyTotal ?? 0, input.priorProgramEntries ?? []);
    prior_total = totalOf(prior);
    mom_delta = total - prior_total;
    mom_pct = prior_total > 0 ? mom_delta / prior_total : null;
  }

  return {
    year: input.year,
    month: input.month,
    goal,
    by_source,
    total: round2(total),
    progress_ratio,
    remaining_to_goal: round2(remaining_to_goal),
    prior_total: prior_total != null ? round2(prior_total) : null,
    mom_delta: mom_delta != null ? round2(mom_delta) : null,
    mom_pct,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function monthBounds(year: number, month: number): { start: string; endExclusive: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endExclusive = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, endExclusive };
}
