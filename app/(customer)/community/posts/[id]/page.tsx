import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReplyThread, ReplyItem, ModerationMenu } from "@/components/community";
import { getPost } from "@/lib/community/posts";
import { getRepliesByPost } from "@/lib/community/replies";
import { getChannelById } from "@/lib/community/channels";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const [post, replies] = await Promise.all([
    getPost(id),
    getRepliesByPost(id),
  ]);

  if (!post) notFound();

  const channel = await getChannelById(post.channel_id);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <PageHeader title={post.title} />
          {channel && (
            <Link
              href={`/community/channels/${channel.slug}`}
              className="text-sm text-teal hover:underline"
            >
              #{channel.name}
            </Link>
          )}
        </div>
        <ModerationMenu contentId={post.id} contentType="post" />
      </div>

      <div className="mt-6 p-4 rounded-lg border border-ink/10 bg-white">
        <p className="text-ink whitespace-pre-wrap">{post.body}</p>
        <p className="mt-4 text-sm text-ink/50">
          {new Date(post.created_at).toLocaleString()} · {post.reply_count} replies
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink mb-4">Replies</h2>
        <ReplyThread>
          {replies.map((r) => (
            <ReplyItem key={r.id} reply={r} />
          ))}
        </ReplyThread>

        {/* Reply input placeholder - Future: createReply form, auth required */}
        {/* Future: potential real-time updates for new replies */}
        <div className="mt-6 p-4 rounded-lg border border-dashed border-ink/20 bg-ink/5">
          <p className="text-sm text-ink/60">
            Reply input coming soon. Future: createReply(), auth required.
          </p>
        </div>
      </section>
    </>
  );
}
