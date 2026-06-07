import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, BatchForm, FormShell, StatusBadge } from "@/components/admin";
import { getBatchById } from "@/lib/admin/batches";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BatchDetailPage({ params }: Props) {
  const { id } = await params;
  const batch = await getBatchById(id);
  if (!batch) notFound();

  return (
    <AdminPageShell
      title={`Batch ${batch.batch_number}`}
      description="View and update batch."
    >
      <div className="mb-6">
        <StatusBadge
          label={batch.status}
          variant={
            batch.status === "completed"
              ? "success"
              : batch.status === "in_progress"
                ? "info"
                : "neutral"
          }
        />
      </div>
      <FormShell
        title="Batch details"
        actions={
          <Link
            href="/admin/batches"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Back
          </Link>
        }
      >
        <BatchForm batch={batch} mode="edit" />
      </FormShell>
    </AdminPageShell>
  );
}
