"use client";

import Link from "next/link";
import type { MonthRevenueReport } from "@/lib/ops/revenue";

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function RevenueGoalStrip({ report }: { report: MonthRevenueReport }) {
  const pct = Math.min(100, Math.round(report.progress_ratio * 100));
  const monthLabel = new Date(Date.UTC(report.year, report.month - 1, 1)).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric", timeZone: "UTC" }
  );

  return (
    <div className="rounded-xl border border-dash-border bg-dash-surface px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-dash-muted m-0">{monthLabel} revenue</p>
          <p className="font-display text-xl font-semibold text-dash-text m-0 mt-0.5">
            {money(report.total)}{" "}
            <span className="text-sm font-medium text-dash-muted">/ {money(report.goal)} goal</span>
          </p>
        </div>
        <Link
          href="/admin/revenue"
          className="text-[13px] font-medium text-dash-pinkDark hover:underline"
        >
          Revenue detail →
        </Link>
      </div>
      <div className="mt-3 h-2 rounded-full bg-dash-border overflow-hidden">
        <div
          className="h-full rounded-full bg-dash-pink"
          style={{ width: `${pct}%` }}
          aria-label={`${pct}% of monthly goal`}
        />
      </div>
      <p className="mt-2 text-[12.5px] text-dash-muted m-0">
        Shopify {money(report.by_source.shopify)} · LLB {money(report.by_source.LLB)} · SOU{" "}
        {money(report.by_source.SOU)} · LBOH {money(report.by_source.LBOH)}
        {report.mom_delta != null
          ? ` · MoM ${report.mom_delta >= 0 ? "+" : ""}${money(report.mom_delta)}`
          : ""}
      </p>
    </div>
  );
}
