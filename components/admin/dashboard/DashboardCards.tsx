import Link from "next/link";
import type { DashboardAtRiskItem, DashboardStat, DashboardSwatcherRow } from "@/lib/admin/command-center-data";

const STAT_BAR: Record<DashboardStat["tone"], string> = {
  pink: "border-t-dash-pink",
  purple: "border-t-dash-purple",
  danger: "border-t-dash-danger",
  neutral: "border-t-dash-border",
};

const STAT_SUB_COLOR: Record<DashboardStat["tone"], string> = {
  pink: "text-dash-pinkDark",
  purple: "text-dash-purpleDark",
  danger: "text-dash-danger",
  neutral: "text-dash-muted",
};

export function StatsRow({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`bg-dash-surface border border-dash-border rounded-[10px] p-4 border-t-[3px] ${STAT_BAR[s.tone]}`}
        >
          <div className="font-display text-[26px] font-bold leading-none text-dash-text">{s.value}</div>
          <div className="mt-1.5 text-[12.5px] font-semibold text-dash-text">{s.label}</div>
          <div className={`mt-0.5 text-[11.5px] ${STAT_SUB_COLOR[s.tone]}`}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

export function AtRiskCard({ atRisk }: { atRisk: DashboardAtRiskItem[] }) {
  return (
    <section className="bg-dash-surface border border-dash-border rounded-xl px-[18px] pt-[18px] pb-4">
      <h2 className="font-display text-[14.5px] font-semibold mb-0.5 text-dash-text">At Risk</h2>
      <p className="text-[11.5px] text-dash-muted mb-3">Needs attention now.</p>
      {atRisk.length === 0 ? (
        <p className="text-[12.5px] text-dash-muted">Nothing at risk right now.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {atRisk.map((r) => (
            <div key={r.name} className="border border-dash-border rounded-lg px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-dash-text">{r.name}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    r.level === "HIGH" ? "bg-dash-dangerSoft text-dash-danger" : "bg-dash-warnSoft text-dash-warnDark"
                  }`}
                >
                  {r.level}
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] text-dash-muted">{r.detail}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const SWATCHER_STATUS_STYLE: Record<DashboardSwatcherRow["status"], string> = {
  Planned: "bg-dash-purpleSoft text-dash-purpleDark",
  Sent: "bg-dash-pinkSoft text-dash-pinkDark",
  Returned: "bg-dash-blank text-dash-muted",
};

export function SwatchersCard({ swatchers }: { swatchers: DashboardSwatcherRow[] }) {
  return (
    <section className="bg-dash-surface border border-dash-border rounded-xl px-[22px] pt-[18px] pb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-[15px] font-semibold text-dash-text">Swatchers</h2>
        <Link href="/admin/swatchers" className="text-xs font-semibold text-dash-pink hover:text-dash-pinkDark">
          View all &rarr;
        </Link>
      </div>
      {swatchers.length === 0 ? (
        <p className="text-[12.5px] text-dash-muted">No active swatcher assignments.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Swatcher", "Collection", "Due", "Status"].map((c) => (
                <th
                  key={c}
                  className="text-left text-[10.5px] font-bold tracking-wide text-dash-muted pb-2 border-b border-dash-border"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {swatchers.map((w) => (
              <tr key={`${w.name}-${w.collection}`}>
                <td className="py-2.5 text-[12.5px] font-semibold border-b border-dash-borderLight text-dash-text">
                  {w.name}
                </td>
                <td className="py-2.5 text-[12.5px] border-b border-dash-borderLight text-dash-text">
                  {w.collection}
                </td>
                <td className="py-2.5 text-[12.5px] border-b border-dash-borderLight text-dash-text">{w.due}</td>
                <td className="py-2.5 border-b border-dash-borderLight">
                  <span
                    className={`text-[11px] font-semibold px-[9px] py-[3px] rounded-full ${SWATCHER_STATUS_STYLE[w.status]}`}
                  >
                    {w.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
