import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { getChannels } from "@/lib/community/channels";

export default async function NewPostPage() {
  const channels = await getChannels();

  return (
    <>
      <PageHeader
        title="New Post"
        description="Start a new discussion."
      />
      <div className="mt-6 max-w-2xl">
        <form className="space-y-4">
          <div>
            <label htmlFor="channel" className="block text-sm font-medium text-ink mb-1">
              Channel
            </label>
            <select
              id="channel"
              name="channel_id"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            >
              {channels.length > 0 ? (
                channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))
              ) : (
                <option value="">No channels yet</option>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-ink mb-1">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
              placeholder="What's on your mind?"
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-ink mb-1">
              Content
            </label>
            <textarea
              id="body"
              name="body"
              rows={6}
              required
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
              placeholder="Share your thoughts..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Post
            </button>
            <Link
              href="/community"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Cancel
            </Link>
          </div>
        </form>
        {/* Future: createPost server action, auth required */}
      </div>
    </>
  );
}
