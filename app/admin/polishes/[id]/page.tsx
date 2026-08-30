import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin";
import { PolishDetail } from "@/components/admin/polishes";
import { getPolishDetail } from "@/lib/admin/polishes";
import { listBatchesForPolish, previewBatch } from "@/lib/admin/batches";
import { getPolishSdsCompliance } from "@/lib/admin/sds-compliance";
import { getOpsSettings } from "@/lib/admin/ops-settings";
import { getPolishPrototype } from "@/lib/admin/prototypes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PolishDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getPolishDetail(id);
  if (!detail) notFound();

  const { polish, lines } = detail;
  let batches: Awaited<ReturnType<typeof listBatchesForPolish>> = [];
  let sds = null;
  let estimatedCostPerBottle: number | null = null;
  let sourcePrototypeName: string | null = null;
  const settings = await getOpsSettings();

  try {
    batches = await listBatchesForPolish(id);
  } catch {
    batches = [];
  }
  try {
    sds = await getPolishSdsCompliance(id);
  } catch {
    sds = null;
  }
  try {
    if (lines.length > 0) {
      const preview = await previewBatch(id, settings.default_batch_oz);
      estimatedCostPerBottle = preview.estimated_cost_per_bottle ?? null;
    }
  } catch {
    estimatedCostPerBottle = null;
  }
  if (polish.source_prototype_id) {
    try {
      const proto = await getPolishPrototype(polish.source_prototype_id);
      sourcePrototypeName = proto?.name ?? null;
    } catch {
      sourcePrototypeName = null;
    }
  }

  return (
    <AdminPageShell
      title={polish.name}
      description="Recipe, make a batch, lot numbers, SDS, and frozen formula history."
    >
      <div className="mb-6">
        <Link
          href="/admin/polishes"
          className="text-sm text-teal hover:underline inline-flex min-h-[44px] items-center"
        >
          ← Back to polishes
        </Link>
      </div>

      <PolishDetail
        polish={polish}
        lines={lines}
        batches={batches}
        sds={sds}
        estimatedCostPerBottle={estimatedCostPerBottle}
        defaultFillOz={settings.default_fill_oz_per_bottle}
        sourcePrototypeName={sourcePrototypeName}
      />
    </AdminPageShell>
  );
}
