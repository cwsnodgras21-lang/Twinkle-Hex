import Link from "next/link";
import { AdminPageShell, TableShell, StatusBadge, EmptyState } from "@/components/admin";
import { getReports } from "@/lib/community/moderation";

export default async function AdminCommunityReportsPage() {
  const reports = await getReports();

  return (
    <AdminPageShell
      title="Reports"
      description="Content reported by community members."
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Type", "Content", "Reason", "Status", "Reported"]}
          empty={reports.length === 0}
          emptyContent={
            <EmptyState
              title="No reports"
              description="Reported content will appear here for moderation."
            />
          }
        >
          {reports.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 capitalize">{r.content_type}</td>
              <td className="px-4 py-3 text-ink/70 truncate max-w-[120px]">
                {r.content_id}
              </td>
              <td className="px-4 py-3 text-ink/70">{r.reason ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={r.status}
                  variant={
                    r.status === "pending"
                      ? "warning"
                      : r.status === "resolved"
                        ? "success"
                        : "neutral"
                  }
                />
              </td>
              <td className="px-4 py-3 text-ink/70">
                {new Date(r.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
