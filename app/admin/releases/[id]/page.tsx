import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell, StatusBadge } from "@/components/admin";
import { ReleaseForm } from "@/components/admin/releases";
import { getReleaseById } from "@/lib/admin/releases";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReleaseDetailPage({ params }: Props) {
  const { id } = await params;
  const release = await getReleaseById(id);
  if (!release) notFound();

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
          <h2 className="text-lg font-semibold text-ink mb-2">Shades / Polishes</h2>
          <p className="text-sm text-ink/60">
            Link shades and polishes to this release. Coming soon.
          </p>
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
