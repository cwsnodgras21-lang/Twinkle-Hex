import Link from "next/link";
import { AdminPageShell, StatusBadge } from "@/components/admin";
import { listReleases, countRemainingBatchesForRelease } from "@/lib/admin/releases";
import { evaluateReleaseRisk } from "@/lib/ops/release-risk";
import { todayDateString } from "@/lib/admin/supabase-write";

export default async function ReleasesPage() {
  let releases: Awaited<ReturnType<typeof listReleases>> = [];
  try {
    releases = await listReleases();
  } catch {
    releases = [];
  }
  const today = todayDateString();

  const rows = [];
  for (const r of releases) {
    let remaining = 0;
    let polishCount = 0;
    try {
      const c = await countRemainingBatchesForRelease(r.id);
      remaining = c.remainingBatches;
      polishCount = c.polishCount;
    } catch {
      /* empty */
    }
    const risk = evaluateReleaseRisk({
      name: r.name,
      today,
      productionCompleteBy: r.production_complete_by ?? null,
      swatcherSendBy: r.swatcher_send_by ?? null,
      remainingProductionBatches: remaining,
    });
    rows.push({ r, remaining, polishCount, risk });
  }

  return (
    <AdminPageShell
      title="Releases"
      description="Collections with launch, production, and swatcher deadlines."
      actions={
        <Link
          href="/admin/releases/new"
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          New release
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-ink/60 border border-ink/10 rounded-xl bg-white px-4 py-8 text-center">
          No releases yet. Create a collection (e.g. Deep Sea) with a launch date — upstream
          deadlines fill in from documented lead times.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ r, remaining, polishCount, risk }) => (
            <li key={r.id} className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/admin/releases/${r.id}`} className="font-semibold text-ink hover:text-plum">
                    {r.name}
                  </Link>
                  <p className="text-sm text-ink/60 mt-1">
                    Launch {r.target_launch_date ?? "TBD"} · Prod by {r.production_complete_by ?? "TBD"} ·
                    Swatchers {r.swatcher_send_by ?? "TBD"}
                  </p>
                  <p className="text-sm text-ink/70 mt-1">
                    {polishCount} polish{polishCount === 1 ? "" : "es"} · {remaining} remaining
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge label={r.status.replace("_", " ")} variant="info" />
                  {risk.atRisk ? <StatusBadge label="At risk" variant="warning" /> : null}
                </div>
              </div>
              {risk.reasons[0] ? <p className="text-sm text-magenta mt-2">{risk.reasons[0]}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </AdminPageShell>
  );
}
