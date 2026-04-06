import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin";
import { PolishDetailPanels } from "@/components/admin/releases";
import { getPolishDetail } from "@/lib/admin/polishes";

interface Props {
  params: Promise<{ id: string; polishId: string }>;
}

export default async function PolishDetailPage({ params }: Props) {
  const { id: releaseId, polishId } = await params;
  const detail = await getPolishDetail(polishId, releaseId);
  if (!detail) notFound();

  const { polish, release, lines } = detail;

  return (
    <AdminPageShell
      title={polish.name}
      description="Read-only view by default — use Edit or Edit recipe to make changes."
    >
      <div className="mb-6">
        <Link
          href={`/admin/releases/${releaseId}`}
          className="text-sm text-teal hover:underline inline-flex min-h-[44px] items-center"
        >
          ← Back to release
        </Link>
      </div>

      <div className="text-sm text-ink/70 mb-6 space-y-1">
        <p>
          <span className="text-ink/60">Collection: </span>
          {release.collection?.trim() || release.name}
        </p>
        {release.collection?.trim() ? (
          <p>
            <span className="text-ink/60">Release: </span>
            {release.name}
          </p>
        ) : null}
      </div>

      <PolishDetailPanels releaseId={releaseId} polish={polish} lines={lines} />
    </AdminPageShell>
  );
}
