"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SocialPost } from "@/types/admin";
import {
  createSocialPostAction,
  updateSocialPostAction,
} from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "Twitter" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS: SocialPost["status"][] = [
  "draft",
  "scheduled",
  "published",
  "cancelled",
];

const STATUS_LABELS: Record<SocialPost["status"], string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  cancelled: "Cancelled",
};

interface SocialPostFormProps {
  post?: SocialPost | null;
  mode: "create" | "edit";
}

export function SocialPostForm({ post, mode }: SocialPostFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (mode === "create") {
        const result = await createSocialPostAction(formData);
        if (result.ok) {
          router.push(`/admin/social/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (post) {
        const result = await updateSocialPostAction(post.id, formData);
        if (result.ok) {
          router.refresh();
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      id="social-post-form"
      onSubmit={handleSubmit}
      method="post"
      className="space-y-4"
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-ink mb-1">
            Platform *
          </label>
          <select
            id="platform"
            name="platform"
            required
            defaultValue={post?.platform ?? "instagram"}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          >
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={post?.status ?? "draft"}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="content_type" className="block text-sm font-medium text-ink mb-1">
          Content type
        </label>
        <input
          id="content_type"
          name="content_type"
          type="text"
          defaultValue={post?.content_type}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. teaser, swatch collage, launch post"
        />
      </div>
      <div>
        <label htmlFor="scheduled_at" className="block text-sm font-medium text-ink mb-1">
          Scheduled at
        </label>
        <input
          id="scheduled_at"
          name="scheduled_at"
          type="datetime-local"
          defaultValue={
            post?.scheduled_at
              ? new Date(post.scheduled_at).toISOString().slice(0, 16)
              : ""
          }
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="published_at" className="block text-sm font-medium text-ink mb-1">
          Published at
        </label>
        <input
          id="published_at"
          name="published_at"
          type="datetime-local"
          defaultValue={
            post?.published_at
              ? new Date(post.published_at).toISOString().slice(0, 16)
              : ""
          }
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={post?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Internal notes"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}
