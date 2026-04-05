import type { CommunityReply } from "@/types/community";

interface ReplyItemProps {
  reply: CommunityReply;
}

/**
 * Single reply in a thread.
 * Future: Author profile link, badges, nested replies.
 */
export function ReplyItem({ reply }: ReplyItemProps) {
  return (
    <div className="p-4 rounded-lg border border-ink/10 bg-white">
      <p className="text-ink">{reply.body}</p>
      <p className="mt-2 text-xs text-ink/50">
        {new Date(reply.created_at).toLocaleString()}
      </p>
    </div>
  );
}
