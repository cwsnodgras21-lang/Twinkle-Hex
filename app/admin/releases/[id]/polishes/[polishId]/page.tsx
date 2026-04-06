import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { PolishForm, RecipeLinesEditor } from "@/components/admin/releases";
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
    <AdminPageShell title={polish.name} description="Edit polish and recipe (ounces).">
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

      <div className="space-y-8">
        <FormShell title="Polish details" description="Name and sort order on the release list.">
          <PolishForm releaseId={releaseId} polish={polish} mode="edit" />
        </FormShell>

        <FormShell title="Recipe" description="Ingredients and amounts in ounces.">
          <RecipeLinesEditor releaseId={releaseId} polishId={polish.id} lines={lines} />
        </FormShell>
      </div>
    </AdminPageShell>
  );
}
