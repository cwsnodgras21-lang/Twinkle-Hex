import Link from "next/link";
import { AdminPageShell, TableShell, EmptyState } from "@/components/admin";
import { getChannels } from "@/lib/community/channels";

export default async function AdminCommunityChannelsPage() {
  const channels = await getChannels();

  return (
    <AdminPageShell
      title="Channels"
      description="Manage community topic channels."
      actions={
        <button
          type="button"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          Add channel
        </button>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Name", "Slug", "Order", "Archived"]}
          empty={channels.length === 0}
          emptyContent={
            <EmptyState
              title="No channels yet"
              description="Create channels for polish discussions, destash, swatcher photos, etc."
            />
          }
        >
          {channels.map((ch) => (
            <tr key={ch.id}>
              <td className="px-4 py-3">
                <Link href={`/community/channels/${ch.slug}`} className="text-teal hover:underline">
                  {ch.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-ink/70">{ch.slug}</td>
              <td className="px-4 py-3">{ch.sort_order}</td>
              <td className="px-4 py-3">{ch.is_archived ? "Yes" : "No"}</td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
