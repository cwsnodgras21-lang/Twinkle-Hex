import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell, StatusBadge } from "@/components/admin";
import { ReleaseForm } from "@/components/admin/releases";
import { getReleaseById } from "@/lib/admin/releases";
import { listPolishesForRelease } from "@/lib/admin/polishes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReleaseDetailPage({ params }: Props) {
  const { id } = await params;
  const release = await getReleaseById(id);
  if (!release) notFound();
  const polishes = await listPolishesForRelease(id);

  return (
    <AdminPageShell
      title={release.name}
      description="Release details and coordination."
    >
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <StatusBadge
          label={release.status.replace(/_/g, " ")}
          variant={
            release.status === "live"
              ? "success"
              : release.status === "launch_ready"
                ? "info"
                : "neutral"
          }
        />
        {release.target_launch_date && (
          <span className="text-sm text-ink/70">
            Target launch: {new Date(release.target_launch_date).toLocaleDateString()}
          </span>
        )}
        <Link
          href={`/admin/releases/${id}/swatchers`}
          className="text-sm text-teal hover:underline"
        >
          Manage swatchers →
        </Link>
      </div>

      <FormShell
        title="Release details"
        actions={
          <Link
            href="/admin/releases"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Back
          </Link>
        }
      >
        <ReleaseForm release={release} mode="edit" />
      </FormShell>

      <div className="mt-8 space-y-6">
        <section className="bg-white border border-ink/10 rounded-lg p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold text-ink">Shades / Polishes</h2>
            <Link
              href={`/admin/releases/${id}/polishes/new`}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm bg-teal text-white rounded-lg hover:opacity-90 shrink-0"
            >
              Add polish
            </Link>
          </div>
          {polishes.length === 0 ? (
            <p className="text-sm text-ink/60">
              No polishes linked to this release yet.
            </p>
          ) : (
            <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">
              {polishes.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/releases/${id}/polishes/${p.id}`}
                    className="flex min-h-[44px] items-center px-4 py-3 text-sm text-ink hover:bg-ink/[0.03] active:bg-ink/[0.06] transition-colors"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-auto text-teal text-xs shrink-0">View recipe →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-ink/10 rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold text-ink mb-2">Swatchers</h2>
          <p className="text-sm text-ink/60 mb-3">
            Assign swatchers to shades for this release.
          </p>
          <Link
            href={`/admin/releases/${id}/swatchers`}
            className="text-sm text-teal hover:underline"
          >
            Manage swatchers →
          </Link>
        </section>

        <section className="bg-white border border-ink/10 rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold text-ink mb-2">Social posts</h2>
          <p className="text-sm text-ink/60">
            Plan social content for this launch. Coming soon.
          </p>
        </section>
      </div>
    </AdminPageShell>
  );
}
