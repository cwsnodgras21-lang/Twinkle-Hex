import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin";
import { getPolishDetail } from "@/lib/admin/polishes";

interface Props {
  params: Promise<{ id: string; polishId: string }>;
}

function formatOunces(oz: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(oz);
  return `${formatted} oz`;
}

export default async function PolishDetailPage({ params }: Props) {
  const { id: releaseId, polishId } = await params;
  const detail = await getPolishDetail(polishId, releaseId);
  if (!detail) notFound();

  const { polish, release, lines } = detail;

  return (
    <AdminPageShell title={polish.name} description="Recipe — amounts in ounces.">
      <div className="mb-6">
        <Link
          href={`/admin/releases/${releaseId}`}
          className="text-sm text-teal hover:underline inline-flex min-h-[44px] items-center"
        >
          ← Back to release
        </Link>
      </div>

      <section className="bg-white border border-ink/10 rounded-lg p-4 md:p-6">
        <div className="text-sm text-ink/70 mb-4 space-y-1">
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

        <h2 className="text-lg font-semibold text-ink mb-1">How it&apos;s made</h2>
        <p className="text-sm text-ink/60 mb-4">Ingredients and amounts (ounces).</p>

        {lines.length === 0 ? (
          <p className="text-sm text-ink/60 py-6 text-center border border-dashed border-ink/15 rounded-lg">
            No recipe recorded for this polish yet.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">
            {lines.map((line) => (
              <li
                key={line.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3 text-sm"
              >
                <span className="text-ink">{line.ingredient_name}</span>
                <span className="text-ink/70 sm:text-right tabular-nums">{formatOunces(line.amount_oz)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminPageShell>
  );
}
