import Link from "next/link";
import type { CommunityPost } from "@/types/community";

interface PostCardProps {
  post: CommunityPost;
  showChannel?: boolean;
}

/**
 * Post card for list view.
 */
export function PostCard({ post, showChannel }: PostCardProps) {
  return (
    <li>
      <Link
        href={`/community/posts/${post.id}`}
        className="block p-4 hover:bg-ink/5 transition-colors"
      >
        <h3 className="font-medium text-ink">{post.title}</h3>
        <div className="mt-2 flex items-center gap-4 text-sm text-ink/60">
          <span>{post.reply_count} replies</span>
          {post.view_count != null && <span>{post.view_count} views</span>}
          <span>{new Date(post.last_activity_at).toLocaleDateString()}</span>
        </div>
      </Link>
    </li>
  );
}
