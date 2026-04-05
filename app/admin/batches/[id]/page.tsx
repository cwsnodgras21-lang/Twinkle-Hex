import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell, StatusBadge } from "@/components/admin";
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
          <>
            <button
              type="submit"
              form="batch-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Save
            </button>
            <Link
              href="/admin/batches"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Back
            </Link>
          </>
        }
      >
        <form id="batch-form" className="space-y-4">
          <input type="hidden" name="id" value={batch.id} />
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={batch.status}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="quantity_produced" className="block text-sm font-medium text-ink mb-1">
              Quantity produced
            </label>
            <input
              id="quantity_produced"
              name="quantity_produced"
              type="number"
              min="0"
              defaultValue={batch.quantity_produced ?? ""}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
