import Link from "next/link";
import { AdminPageShell, TableShell, StatusBadge, EmptyState } from "@/components/admin";
import { listRetailPartners } from "@/lib/admin/retail-partners";

export default async function AdminRetailPartnersPage() {
  const partners = await listRetailPartners();

  return (
    <AdminPageShell
      title="Retail Partners"
      description="Track retail accounts and stockists."
      actions={
        <Link
          href="/admin/retail-partners/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          Add Partner
        </Link>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Name", "Contact", "Status", "Location"]}
          empty={partners.length === 0}
          emptyContent={
            <EmptyState
              title="No retail partners yet"
              description="Add stockists and retail accounts."
              action={
                <Link
                  href="/admin/retail-partners/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  Add Partner
                </Link>
              }
            />
          }
        >
          {partners.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/retail-partners/${p.id}`} className="text-teal hover:underline">
                  {p.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70">{p.contact_email ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={p.status ?? "active"}
                  variant={p.status === "active" ? "success" : "neutral"}
                />
              </td>
              <td className="px-4 py-3 text-ink/70 truncate max-w-[150px]">
                {p.address ?? "—"}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
