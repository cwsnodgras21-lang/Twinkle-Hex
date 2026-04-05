import Link from "next/link";
import { AdminPageShell, TableShell, StatusBadge, EmptyState } from "@/components/admin";
import { listSocialPosts } from "@/lib/admin/social";

export default async function AdminSocialPage() {
  const posts = await listSocialPosts();

  return (
    <AdminPageShell
      title="Social Media"
      description="Plan and schedule social posts."
      actions={
        <Link
          href="/admin/social/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          New Post
        </Link>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Platform", "Type", "Status", "Scheduled", "Published"]}
          empty={posts.length === 0}
          emptyContent={
            <EmptyState
              title="No posts planned"
              description="Schedule social content for releases and campaigns."
              action={
                <Link
                  href="/admin/social/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  New Post
                </Link>
              }
            />
          }
        >
          {posts.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 capitalize">{p.platform}</td>
              <td className="px-4 py-3 text-ink/70">{p.content_type ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={p.status}
                  variant={
                    p.status === "published"
                      ? "success"
                      : p.status === "scheduled"
                        ? "info"
                        : "neutral"
                  }
                />
              </td>
              <td className="px-4 py-3 text-ink/70">
                {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3 text-ink/70">
                {p.published_at ? new Date(p.published_at).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
