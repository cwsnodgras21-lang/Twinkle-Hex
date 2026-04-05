import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, TableShell, StatusBadge, EmptyState } from "@/components/admin";
import { getReleaseById } from "@/lib/admin/releases";
import { listAssignmentsByRelease } from "@/lib/admin/swatchers";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReleaseSwatchersPage({ params }: Props) {
  const { id } = await params;
  const release = await getReleaseById(id);
  if (!release) notFound();

  const assignments = await listAssignmentsByRelease(id);

  return (
    <AdminPageShell
      title={`Swatchers: ${release.name}`}
      description="Assign swatchers to shades for this release."
    >
      <div className="mb-4">
        <Link href={`/admin/releases/${id}`} className="text-sm text-teal hover:underline">
          ← Back to release
        </Link>
      </div>
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Swatcher", "Shade", "Status", "Sent"]}
          empty={assignments.length === 0}
          emptyContent={
            <EmptyState
              title="No assignments yet"
              description="Assign swatchers to shades for this release."
            />
          }
        >
          {assignments.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3">{a.swatcher_id}</td>
              <td className="px-4 py-3">{a.shade_name ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge label={a.status ?? "pending"} variant="neutral" />
              </td>
              <td className="px-4 py-3 text-ink/70">
                {a.sent_at ? new Date(a.sent_at).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
