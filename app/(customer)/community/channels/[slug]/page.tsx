import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PostList, PostCard, CommunityEmptyState } from "@/components/community";
import { getChannelBySlug } from "@/lib/community/channels";
import { getPostsByChannel } from "@/lib/community/posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ChannelPage({ params }: Props) {
  const { slug } = await params;
  const channel = await getChannelBySlug(slug);
  if (!channel) notFound();

  const posts = await getPostsByChannel(channel.id);

  return (
    <>
      <PageHeader
        title={channel.name}
        description={channel.description}
      />
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/community/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium w-fit"
        >
          New post
        </Link>
      </div>
      <div className="mt-6">
        <PostList
          empty={posts.length === 0}
          emptyContent={
            <CommunityEmptyState
              title="No posts in this channel"
              description="Be the first to start a discussion!"
              action={
                <Link
                  href="/community/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  New post
                </Link>
              }
            />
          }
        >
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </PostList>
      </div>
    </>
  );
}
