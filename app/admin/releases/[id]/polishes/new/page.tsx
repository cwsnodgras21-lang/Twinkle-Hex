import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { PolishForm } from "@/components/admin/releases";
import { getReleaseById } from "@/lib/admin/releases";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewReleasePolishPage({ params }: Props) {
  const { id: releaseId } = await params;
  const release = await getReleaseById(releaseId);
  if (!release) notFound();

  return (
    <AdminPageShell title="New polish" description={`For release: ${release.name}`}>
      <div className="mb-6">
        <Link
          href={`/admin/releases/${releaseId}`}
          className="text-sm text-teal hover:underline inline-flex min-h-[44px] items-center"
        >
          ← Back to release
        </Link>
      </div>

      <FormShell
        title="Polish details"
        actions={
          <Link
            href={`/admin/releases/${releaseId}`}
            className="px-4 py-2 min-h-[44px] inline-flex items-center border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Cancel
          </Link>
        }
      >
        <PolishForm releaseId={releaseId} mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
