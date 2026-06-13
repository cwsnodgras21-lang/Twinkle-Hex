import Link from "next/link";
import { AdminPageShell, TableShell, EmptyState } from "@/components/admin";
import { countPigmentMsdsDocuments, listPigments } from "@/lib/admin/pigments";

export default async function AdminPigmentsPage() {
  const pigments = await listPigments();
  const msdsCounts = await countPigmentMsdsDocuments(pigments.map((p) => p.id));

  return (
    <AdminPageShell
      title="Pigments"
      description="Color pigments and micas. Attach MSDS safety sheets to each pigment."
      actions={
        <Link
          href="/admin/pigments/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          Add Pigment
        </Link>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Name", "Supplier", "Color", "Quantity", "Unit", "MSDS"]}
          empty={pigments.length === 0}
          emptyContent={
            <EmptyState
              title="No pigments yet"
              description="Add pigments to track colorants and attach their MSDS sheets."
              action={
                <Link
                  href="/admin/pigments/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  Add Pigment
                </Link>
              }
            />
          }
        >
          {pigments.map((pigment) => (
            <tr key={pigment.id}>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/pigments/${pigment.id}`}
                  className="text-teal hover:underline"
                >
                  {pigment.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70">{pigment.supplier ?? "—"}</td>
              <td className="px-4 py-3 text-ink/70">{pigment.color_description ?? "—"}</td>
              <td className="px-4 py-3">{pigment.quantity_on_hand}</td>
              <td className="px-4 py-3">{pigment.unit}</td>
              <td className="px-4 py-3">
                {(msdsCounts.get(pigment.id) ?? 0) > 0 ? (
                  <span className="text-sm text-teal">
                    {msdsCounts.get(pigment.id)} sheet
                    {(msdsCounts.get(pigment.id) ?? 0) === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className="text-sm text-ink/40">None</span>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
