import Link from "next/link";
import { AdminPageShell, TableShell, EmptyState } from "@/components/admin";
import { listSwatchers } from "@/lib/admin/swatchers";

export default async function AdminSwatchersPage() {
  const swatchers = await listSwatchers();

  return (
    <AdminPageShell
      title="Swatchers"
      description="Testers for new shade releases."
      actions={
        <Link
          href="/admin/swatchers/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          Add Swatcher
        </Link>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Name", "Email", "Social"]}
          empty={swatchers.length === 0}
          emptyContent={
            <EmptyState
              title="No swatchers yet"
              description="Add swatchers to coordinate with releases."
              action={
                <Link
                  href="/admin/swatchers/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  Add Swatcher
                </Link>
              }
            />
          }
        >
          {swatchers.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/swatchers/${s.id}`} className="text-teal hover:underline">
                  {s.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70">{s.email ?? "—"}</td>
              <td className="px-4 py-3 text-ink/70">{s.social_handle ?? "—"}</td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
