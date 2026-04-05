import Link from "next/link";
import { AdminPageShell, TableShell, StatusBadge, EmptyState } from "@/components/admin";
import { listCharityPolishes } from "@/lib/admin/charity";

export default async function AdminCharityPage() {
  const items = await listCharityPolishes();

  return (
    <AdminPageShell
      title="Charity Polishes"
      description="Track charity polish campaigns and donations."
      actions={
        <Link
          href="/admin/charity/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          Add Charity Polish
        </Link>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Name", "Charity", "Donation/unit", "Total Raised", "Status"]}
          empty={items.length === 0}
          emptyContent={
            <EmptyState
              title="No charity polishes yet"
              description="Track polish campaigns that support charities."
              action={
                <Link
                  href="/admin/charity/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  Add Charity Polish
                </Link>
              }
            />
          }
        >
          {items.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/charity/${c.id}`} className="text-teal hover:underline">
                  {c.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70">{c.charity_name}</td>
              <td className="px-4 py-3">${c.donation_per_unit ?? "—"}</td>
              <td className="px-4 py-3">${c.total_raised ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={c.status ?? "active"}
                  variant={c.status === "active" ? "success" : "neutral"}
                />
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
