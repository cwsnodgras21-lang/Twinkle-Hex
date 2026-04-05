import Link from "next/link";
import { AdminPageShell, TableShell, StatusBadge, EmptyState } from "@/components/admin";
import { listBatches } from "@/lib/admin/batches";

export default async function AdminBatchesPage() {
  const batches = await listBatches();

  return (
    <AdminPageShell
      title="Batches"
      description="Production batch tracking."
      actions={
        <Link
          href="/admin/batches/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          New Batch
        </Link>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Batch #", "Status", "Planned", "Quantity", "Product"]}
          empty={batches.length === 0}
          emptyContent={
            <EmptyState
              title="No batches yet"
              description="Create a batch to track production runs."
              action={
                <Link
                  href="/admin/batches/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  New Batch
                </Link>
              }
            />
          }
        >
          {batches.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/batches/${b.id}`} className="text-teal hover:underline font-mono">
                  {b.batch_number}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={b.status}
                  variant={
                    b.status === "completed"
                      ? "success"
                      : b.status === "in_progress"
                        ? "info"
                        : "neutral"
                  }
                />
              </td>
              <td className="px-4 py-3 text-ink/70">
                {b.planned_date ? new Date(b.planned_date).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3">{b.quantity_produced ?? "—"}</td>
              <td className="px-4 py-3 text-ink/70">{b.product_id ?? "—"}</td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
