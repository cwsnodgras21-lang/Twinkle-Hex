import Link from "next/link";
import { AdminPageShell, StatusBadge } from "@/components/admin";
import { listSwatchers, listSwatcherAssignments } from "@/lib/admin/swatchers";
import { listReleases } from "@/lib/admin/releases";
import { listPolishes } from "@/lib/admin/polishes";
import { SwatcherForms } from "@/components/admin/swatchers/SwatcherForms";
import { AssignmentActions } from "@/components/admin/swatchers/AssignmentActions";
import { todayDateString } from "@/lib/admin/supabase-write";

interface Props {
  searchParams: Promise<{ release?: string }>;
}

export default async function SwatchersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const releaseFilter = sp.release;

  const [swatchers, assignments, releases, polishes] = await Promise.all([
    listSwatchers().catch(() => []),
    listSwatcherAssignments(releaseFilter).catch(() => []),
    listReleases().catch(() => []),
    listPolishes().catch(() => []),
  ]);
  const today = todayDateString();

  return (
    <AdminPageShell
      title="Swatchers"
      description="Ship early enough for photography and marketing — timeline over status boards."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SwatcherForms
          swatchers={swatchers.map((s) => ({ id: s.id, name: s.name }))}
          releases={releases.map((r) => ({
            id: r.id,
            name: r.name,
            swatcher_send_by: r.swatcher_send_by,
            swatch_return_by: r.swatch_return_by,
          }))}
          polishes={polishes.map((p) => ({ id: p.id, name: p.name }))}
          defaultReleaseId={releaseFilter}
        />
      </div>

      <section className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Assignments</h2>
          {releaseFilter ? (
            <Link href="/admin/swatchers" className="text-sm text-teal hover:underline">
              Clear filter
            </Link>
          ) : null}
        </div>
        {assignments.length === 0 ? (
          <p className="text-sm text-ink/60 py-6 text-center">No assignments yet.</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {assignments.map((a) => {
              const overdue =
                a.status === "planned" && !!a.send_by && a.send_by < today && !a.sent_at;
              return (
                <li key={a.id} className="py-3 flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      {a.swatcher_name} → {a.release_name}
                      {a.polish_name ? ` · ${a.polish_name}` : ""}
                    </p>
                    <p className="text-sm text-ink/60">
                      Send by {a.send_by ?? "—"}
                      {a.sent_at ? ` · Sent ${a.sent_at}` : ""}
                      {a.expected_return_at ? ` · Return ${a.expected_return_at}` : ""}
                      {a.returned_at ? ` · Returned ${a.returned_at}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {overdue ? <StatusBadge label="Overdue" variant="warning" /> : null}
                    <StatusBadge label={a.status} variant="info" />
                    <AssignmentActions id={a.id} status={a.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {swatchers.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-ink/60 mb-2">Swatcher roster</h2>
          <ul className="flex flex-wrap gap-2">
            {swatchers.map((s) => (
              <li key={s.id} className="text-sm px-3 py-1 rounded-lg bg-ink/5 text-ink">
                {s.name}
                {s.social_handle ? ` · ${s.social_handle}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AdminPageShell>
  );
}
