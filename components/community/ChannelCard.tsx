import Link from "next/link";
import type { CommunityChannel } from "@/types/community";

interface ChannelCardProps {
  channel: CommunityChannel;
}

/**
 * Channel card for grid/list display.
 */
export function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <Link
      href={`/community/channels/${channel.slug}`}
      className="block p-4 rounded-lg border border-ink/10 hover:border-teal/30 hover:bg-teal/5 transition-colors"
    >
      <h3 className="font-semibold text-ink">{channel.name}</h3>
      {channel.description && (
        <p className="mt-1 text-sm text-ink/70 line-clamp-2">{channel.description}</p>
      )}
    </Link>
  );
}
