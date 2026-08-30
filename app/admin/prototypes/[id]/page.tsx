import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell, StatusBadge } from "@/components/admin";
import { PrototypeForm, PrototypePhotosPanel, PromotePrototypeButton } from "@/components/admin/prototypes";
import { getPolishPrototype } from "@/lib/admin/prototypes";
import { listPolishes } from "@/lib/admin/polishes";
import type { PolishPrototypeStatus } from "@/types/admin";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_VARIANT: Record<PolishPrototypeStatus, "info" | "success" | "warning" | "neutral"> = {
  testing: "info",
  selected: "success",
  rejected: "warning",
  archived: "neutral",
};

export default async function PrototypeDetailPage({ params }: Props) {
  const { id } = await params;
  const proto = await getPolishPrototype(id).catch(() => null);
  if (!proto) notFound();

  const polishes = await listPolishes().catch(() => []);
  const canPromote = proto.status === "testing" || proto.status === "selected";

  return (
    <AdminPageShell title={proto.name} description="15 mL development formula.">
      <div className="mb-6">
        <Link href="/admin/prototypes" className="text-sm text-teal hover:underline">
          ← Back to prototypes
        </Link>
      </div>

      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={proto.status} variant={STATUS_VARIANT[proto.status] ?? "neutral"} />
          {proto.promoted_polish_id ? (
            <Link href={`/admin/polishes/${proto.promoted_polish_id}`} className="hover:opacity-90">
              <StatusBadge label="View production polish →" variant="success" />
            </Link>
          ) : null}
        </div>

        <FormShell title="Prototype" description="Formula lines, target size, and observations.">
          <PrototypeForm mode="edit" prototype={proto} />
        </FormShell>

        {canPromote ? (
          <FormShell
            title="Promote"
            description="Copy this prototype's formula lines into a production polish recipe."
          >
            <PromotePrototypeButton prototypeId={proto.id} prototypeName={proto.name} polishes={polishes} />
          </FormShell>
        ) : null}

        <FormShell title="Photos" description="Cure progress, swatches, lighting comparisons.">
          <PrototypePhotosPanel prototypeId={proto.id} photos={proto.photos} />
        </FormShell>
      </div>
    </AdminPageShell>
  );
}
