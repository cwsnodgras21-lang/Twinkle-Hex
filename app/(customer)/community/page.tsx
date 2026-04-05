import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChannelCard, PostList, PostCard, CommunityEmptyState } from "@/components/community";
import { getChannels } from "@/lib/community/channels";
import { getRecentPosts } from "@/lib/community/posts";

export default async function CommunityPage() {
  const [channels, posts] = await Promise.all([
    getChannels(),
    getRecentPosts(10),
  ]);

  return (
    <>
      <PageHeader
        title="Community"
        description="Connect with fellow nail polish enthusiasts."
      />
      <div className="mt-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">Channels</h2>
            <Link
              href="/community/channels"
              className="text-sm text-teal hover:underline"
            >
              View all
            </Link>
          </div>
          {channels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.slice(0, 6).map((ch) => (
                <ChannelCard key={ch.id} channel={ch} />
              ))}
            </div>
          ) : (
            <CommunityEmptyState
              title="No channels yet"
              description="Channels will appear here. Future: polish discussions, destash, swatcher photos."
            />
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">Recent Posts</h2>
            <Link
              href="/community/new"
              className="text-sm text-teal hover:underline"
            >
              New post
            </Link>
          </div>
          <PostList empty={posts.length === 0} emptyContent={
            <CommunityEmptyState
              title="No posts yet"
              description="Start a discussion!"
              action={
                <Link
                  href="/community/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  New post
                </Link>
              }
            />
          }>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </PostList>
        </section>
      </div>
    </>
  );
}
