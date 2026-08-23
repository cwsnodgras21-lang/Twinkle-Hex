import Link from "next/link";
import { AdminPageShell, StatusBadge } from "@/components/admin";
import { loadCommandCenter } from "@/lib/admin/command-center-data";

export default async function AdminDashboardPage() {
  const cc = await loadCommandCenter();

  return (
    <AdminPageShell
      title="Command Center"
      description="What needs attention, what to do today, and whether upcoming launches are at risk."
    >
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">
          Needs attention
        </h2>
        {cc.attention.length === 0 ? (
          <p className="text-sm text-ink/60 border border-ink/10 rounded-xl bg-white px-4 py-5">
            Nothing flagged right now. Upcoming releases look on track from the data we have.
          </p>
        ) : (
          <ul className="space-y-2">
            {cc.attention.map((item) => (
              <li
                key={item.id}
                className={`rounded-xl border px-4 py-3 ${
                  item.severity === "critical"
                    ? "border-magenta/40 bg-magenta/5"
                    : item.severity === "warning"
                      ? "border-plum/30 bg-plum/5"
                      : "border-ink/10 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-sm text-ink/70 mt-0.5">{item.detail}</p>
                  </div>
                  {item.href ? (
                    <Link href={item.href} className="text-sm text-teal hover:underline shrink-0">
                      Open →
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink mb-4">Today</h2>
          {cc.todayQueue.length === 0 ? (
            <p className="text-sm text-ink/60 py-4 text-center">No forced work for today.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {cc.todayQueue.map((item) => (
                <li key={item.id} className="py-3">
                  {item.href ? (
                    <Link href={item.href} className="block group">
                      <p className="font-medium text-ink group-hover:text-plum">{item.action}</p>
                      <p className="text-sm text-ink/60 mt-0.5">{item.detail}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="font-medium text-ink">{item.action}</p>
                      <p className="text-sm text-ink/60 mt-0.5">{item.detail}</p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink mb-4">This week</h2>
          {cc.thisWeek.length === 0 ? (
            <p className="text-sm text-ink/60 py-4 text-center">No scheduled work in the next 7 days.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {cc.thisWeek.map((item) => (
                <li key={item.id} className="py-3 flex gap-3">
                  <span className="text-xs text-ink/50 w-20 shrink-0 pt-0.5">{item.due ?? "—"}</span>
                  <div className="min-w-0">
                    {item.href ? (
                      <Link href={item.href} className="font-medium text-ink hover:text-plum">
                        {item.action}
                      </Link>
                    ) : (
                      <p className="font-medium text-ink">{item.action}</p>
                    )}
                    <p className="text-sm text-ink/60">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-ink">Upcoming releases</h2>
          <Link href="/admin/releases" className="text-sm text-teal hover:underline">
            All releases →
          </Link>
        </div>
        {cc.upcomingReleases.length === 0 ? (
          <p className="text-sm text-ink/60 border border-ink/10 rounded-xl bg-white px-4 py-5">
            No active collections yet.{" "}
            <Link href="/admin/releases/new" className="text-teal hover:underline">
              Plan a release
            </Link>{" "}
            to start seeing production timelines here.
          </p>
        ) : (
          <ul className="space-y-3">
            {cc.upcomingReleases.map((r) => (
              <li key={r.id} className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/releases/${r.id}`}
                      className="text-base font-semibold text-ink hover:text-plum"
                    >
                      {r.name}
                    </Link>
                    <p className="text-sm text-ink/60 mt-1">
                      Launch {r.target_launch_date ?? "TBD"} · Production by{" "}
                      {r.production_complete_by ?? "TBD"} · Swatchers{" "}
                      {r.swatcher_send_by ?? "TBD"}
                    </p>
                    <p className="text-sm text-ink/70 mt-1">
                      {r.progressLabel}
                      {r.remainingBatches > 0
                        ? ` · ${r.remainingBatches} batch${r.remainingBatches === 1 ? "" : "es"} remaining`
                        : ""}
                    </p>
                  </div>
                  {r.atRisk ? (
                    <StatusBadge label="At risk" variant="warning" />
                  ) : (
                    <StatusBadge label="On track" variant="success" />
                  )}
                </div>
                {r.riskReasons.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {r.riskReasons.map((reason) => (
                      <li key={reason} className="text-sm text-magenta">
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {cc.productionPlanByRelease.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-ink mb-3">Production plan</h2>
          <div className="space-y-4">
            {cc.productionPlanByRelease.map((plan) => (
              <div key={plan.releaseId} className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm">
                <p className="font-medium text-ink">{plan.releaseName}</p>
                <p className="text-sm text-ink/60 mt-1">{plan.explanation}</p>
                {plan.planDays.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {plan.planDays.slice(0, 10).map((d) => (
                      <li
                        key={d.date}
                        className="text-xs px-2.5 py-1 rounded-md bg-teal/10 text-teal"
                      >
                        {d.date}: {d.batches}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </AdminPageShell>
  );
}
