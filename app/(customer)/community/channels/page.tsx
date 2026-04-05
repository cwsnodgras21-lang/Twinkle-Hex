import { PageHeader } from "@/components/layout/PageHeader";
import { ChannelCard, CommunityEmptyState } from "@/components/community";
import { getChannels } from "@/lib/community/channels";

export default async function ChannelsPage() {
  const channels = await getChannels();

  return (
    <>
      <PageHeader
        title="Channels"
        description="Browse discussion topics."
      />
      <div className="mt-6">
        {channels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <ChannelCard key={ch.id} channel={ch} />
            ))}
          </div>
        ) : (
          <CommunityEmptyState
            title="No channels yet"
            description="Channels will be created by admins. Future: polish discussions, destash, swatcher photos, brand announcements."
          />
        )}
      </div>
    </>
  );
}
