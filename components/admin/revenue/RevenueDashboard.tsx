"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MetricCard, StatusBadge } from "@/components/admin";
import { deleteRevenueEntryAction } from "@/app/admin/ops-actions";
import type { RevenueEntry } from "@/types/admin";
import type { MonthRevenueReport } from "@/lib/ops/revenue";

const SOURCE_LABEL: Record<string, string> = {
  shopify: "Shopify",
  LLB: "LLB",
  SOU: "SOU",
  LBOH: "LBOH",
  other: "Other",
};

function formatCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthName(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

interface RevenueDashboardProps {
  report: MonthRevenueReport;
  entries: RevenueEntry[];
}

/**
 * Month report — total vs $1,500 goal, per-source breakdown, MoM — plus the
 * manually logged entries feeding it (Shopify is rolled up separately and
 * has no delete action here).
 */
export function RevenueDashboard({ report, entries }: RevenueDashboardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const progressPct = Math.min(100, Math.max(0, Math.round(report.progress_ratio * 100)));
  const momUp = report.mom_delta != null && report.mom_delta >= 0;

  function handleDelete(id: string) {
    if (!window.confirm("Delete this revenue entry?")) return;
    setError(null);
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteRevenueEntryAction(id);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h2 className="text-lg font-semibold text-ink">{monthName(report.year, report.month)}</h2>
          {report.mom_pct != null ? (
            <StatusBadge
              label={`${momUp ? "▲" : "▼"} ${Math.abs(Math.round(report.mom_pct * 100))}% MoM`}
              variant={momUp ? "success" : "warning"}
            />
          ) : null}
        </div>
        <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <p className="text-3xl font-bold text-teal tabular-nums">{formatCurrency(report.total)}</p>
            <p className="text-sm text-ink/60">
              of {formatCurrency(report.goal)} goal
              {report.remaining_to_goal > 0
                ? ` · ${formatCurrency(report.remaining_to_goal)} to go`
                : " · Goal reached"}
            </p>
          </div>
          <div className="h-3 rounded-full bg-ink/10 overflow-hidden">
            <div
              className="h-full bg-teal rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-xs text-ink/50 mt-1">{progressPct}% of goal</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard title="Shopify" value={formatCurrency(report.by_source.shopify)} accent="cyan" />
        <MetricCard title="LLB" value={formatCurrency(report.by_source.LLB)} accent="teal" />
        <MetricCard title="SOU" value={formatCurrency(report.by_source.SOU)} accent="plum" />
        <MetricCard title="LBOH" value={formatCurrency(report.by_source.LBOH)} accent="magenta" />
        <MetricCard title="Other" value={formatCurrency(report.by_source.other)} accent="ink" />
      </div>

      {report.prior_total != null ? (
        <p className="text-sm text-ink/60">
          Prior month total: <span className="font-medium text-ink">{formatCurrency(report.prior_total)}</span>
          {report.mom_delta != null
            ? ` · ${momUp ? "+" : ""}${formatCurrency(report.mom_delta)} MoM`
            : ""}
        </p>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">Logged entries</h3>
        {error ? <p className="text-sm text-magenta mb-2">{error}</p> : null}
        {entries.length === 0 ? (
          <p className="text-sm text-ink/60 border border-dashed border-ink/15 rounded-lg px-4 py-6 text-center">
            No manually logged revenue yet — Shopify totals roll up automatically above.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden bg-white">
            {entries.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-ink">{formatCurrency(entry.amount)}</span>
                  <span className="text-ink/60">
                    {" "}
                    · {SOURCE_LABEL[entry.source] ?? entry.source} · {entry.received_date}
                  </span>
                  {entry.notes ? <span className="text-ink/50"> · {entry.notes}</span> : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  disabled={pending && deletingId === entry.id}
                  className="px-3 py-1.5 text-sm text-magenta border border-magenta/30 rounded-lg hover:bg-magenta/5 disabled:opacity-50"
                >
                  {pending && deletingId === entry.id ? "Removing…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
