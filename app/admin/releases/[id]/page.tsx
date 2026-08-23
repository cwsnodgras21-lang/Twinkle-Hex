import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, StatusBadge } from "@/components/admin";
import { ReleaseForm } from "@/components/admin/releases/ReleaseForm";
import {
  getReleaseById,
  listReleasePolishes,
  countRemainingBatchesForRelease,
} from "@/lib/admin/releases";
import { listPolishes } from "@/lib/admin/polishes";
import { projectProductionPlan } from "@/lib/ops/production-plan";
import { evaluateReleaseRisk } from "@/lib/ops/release-risk";
import { todayDateString } from "@/lib/admin/supabase-write";
import { AddPolishToReleaseForm } from "@/components/admin/releases/AddPolishToReleaseForm";
import { ReleasePolishRowActions } from "@/components/admin/releases/ReleasePolishRowActions";
import { getOpsSettings } from "@/lib/admin/ops-settings";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReleaseDetailPage({ params }: Props) {
  const { id } = await params;
  const release = await getReleaseById(id).catch(() => null);
  if (!release) notFound();

  const [members, allPolishes, counts, settings] = await Promise.all([
    listReleasePolishes(id).catch(() => []),
    listPolishes().catch(() => []),
    countRemainingBatchesForRelease(id).catch(() => ({
      polishCount: 0,
      remainingBatches: 0,
      missingFormulaCount: 0,
    })),
    getOpsSettings(),
  ]);

  const today = todayDateString();
  const risk = evaluateReleaseRisk({
    name: release.name,
    today,
    productionCompleteBy: release.production_complete_by ?? null,
    swatcherSendBy: release.swatcher_send_by ?? null,
    remainingProductionBatches: counts.remainingBatches,
    maxBatchesPerDay: settings.max_batches_per_day,
  });

  const plan =
    release.production_complete_by && counts.remainingBatches > 0
      ? projectProductionPlan({
          remainingBatches: counts.remainingBatches,
          today,
          deadline: release.production_complete_by,
          maxBatchesPerDay: settings.max_batches_per_day,
          weekdays: settings.production_weekdays,
        })
      : null;

  const memberIds = new Set(members.map((m) => m.polish_id));
  const available = allPolishes.filter((p) => !memberIds.has(p.id));

  return (
    <AdminPageShell title={release.name} description="Deadlines, polish membership, and production plan.">
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <Link href="/admin/releases" className="text-sm text-teal hover:underline">
          ← Back to releases
        </Link>
        {risk.atRisk ? <StatusBadge label="At risk" variant="warning" /> : <StatusBadge label="On track" variant="success" />}
      </div>

      {risk.reasons.length > 0 ? (
        <div className="mb-6 border border-magenta/30 bg-magenta/5 rounded-xl px-4 py-3">
          <p className="font-medium text-ink mb-1">Why this release is at risk</p>
          <ul className="list-disc pl-5 text-sm text-magenta space-y-1">
            {risk.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan ? (
        <div className="mb-6 bg-white border border-ink/10 rounded-xl p-4 shadow-sm">
          <p className="font-medium text-ink">Production plan</p>
          <p className="text-sm text-ink/60 mt-1">{plan.explanation}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {plan.days.map((d) => (
              <li key={d.date} className="text-xs px-2.5 py-1 rounded-md bg-teal/10 text-teal">
                {d.date}: {d.batches} batch{d.batches === 1 ? "" : "es"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-8 bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink mb-3">
          Polishes ({counts.polishCount}) · {counts.remainingBatches} remaining
          {counts.missingFormulaCount > 0 ? ` · ${counts.missingFormulaCount} missing formulas` : ""}
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-ink/60 mb-4">No polishes assigned yet.</p>
        ) : (
          <ul className="divide-y divide-ink/10 mb-4">
            {members.map((m) => (
              <li key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/admin/polishes/${m.polish_id}`} className="font-medium text-ink hover:text-plum">
                    {m.polish_name ?? m.polish_id}
                  </Link>
                  <p className="text-xs text-ink/50">{m.production_status.replace("_", " ")}</p>
                </div>
                <ReleasePolishRowActions releaseId={id} releasePolishId={m.id} status={m.production_status} />
              </li>
            ))}
          </ul>
        )}
        <AddPolishToReleaseForm releaseId={id} polishes={available.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink mb-4">Edit deadlines</h2>
        <ReleaseForm
          mode="edit"
          releaseId={release.id}
          defaults={{
            name: release.name,
            description: release.description,
            status: release.status,
            target_launch_date: release.target_launch_date,
            production_complete_by: release.production_complete_by,
            swatcher_send_by: release.swatcher_send_by,
            swatch_return_by: release.swatch_return_by,
            marketing_ready_by: release.marketing_ready_by,
            notes: release.notes,
          }}
        />
      </div>
    </AdminPageShell>
  );
}
