import Link from "next/link";
import { AdminPageShell, TableShell, EmptyState } from "@/components/admin";
import { listSupplies } from "@/lib/admin/supplies";

export default async function AdminSuppliesPage() {
  const supplies = await listSupplies();

  return (
    <AdminPageShell
      title="Supplies"
      description="Packaging, labels, and misc supplies."
      actions={
        <Link
          href="/admin/supplies/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          Add Supply
        </Link>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Name", "Category", "Quantity", "Unit", "Reorder Point"]}
          empty={supplies.length === 0}
          emptyContent={
            <EmptyState
              title="No supplies yet"
              description="Add packaging and other supplies to track inventory."
              action={
                <Link
                  href="/admin/supplies/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  Add Supply
                </Link>
              }
            />
          }
        >
          {supplies.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/supplies/${s.id}`} className="text-teal hover:underline">
                  {s.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70">{s.category ?? "—"}</td>
              <td className="px-4 py-3">{s.quantity_on_hand}</td>
              <td className="px-4 py-3">{s.unit}</td>
              <td className="px-4 py-3">{s.reorder_point ?? "—"}</td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
