import Link from "next/link";
import type { CommerceDemandStats } from "@/types/commerce";

type Props = {
  demand: CommerceDemandStats;
};

/**
 * Restrained dashboard strip for Shopify order demand + mapping backlog.
 */
export function OrderDemandStrip({ demand }: Props) {
  return (
    <section className="bg-dash-surface border border-dash-border rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold tracking-wide uppercase text-dash-muted">
          Open order demand
        </div>
        <div className="mt-0.5 text-[13.5px] text-dash-text">
          <span className="font-semibold">{demand.openOrderCount}</span> unfulfilled order
          {demand.openOrderCount === 1 ? "" : "s"}
          <span className="text-dash-muted"> · </span>
          <span className="font-semibold">{demand.openBottleCount}</span> bottle
          {demand.openBottleCount === 1 ? "" : "s"}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold tracking-wide uppercase text-dash-muted">
          Needs product mapping
        </div>
        <div className="mt-0.5 text-[13.5px] text-dash-text">
          <span
            className={`font-semibold ${demand.needsMappingLineCount > 0 ? "text-dash-danger" : ""}`}
          >
            {demand.needsMappingLineCount}
          </span>{" "}
          unmapped line{demand.needsMappingLineCount === 1 ? "" : "s"}
          <span className="text-dash-muted"> · </span>
          {demand.needsMappingVariantCount} variant
          {demand.needsMappingVariantCount === 1 ? "" : "s"}
        </div>
      </div>
      <Link
        href="/admin/orders"
        className="text-xs font-semibold text-dash-pink hover:text-dash-pinkDark shrink-0"
      >
        View orders →
      </Link>
    </section>
  );
}
