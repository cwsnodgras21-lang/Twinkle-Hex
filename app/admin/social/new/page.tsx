import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";

export default function NewSocialPostPage() {
  return (
    <AdminPageShell
      title="New Social Post"
      description="Plan a social media post."
    >
      <FormShell
        title="Post details"
        actions={
          <>
            <button
              type="submit"
              form="social-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Save
            </button>
            <Link
              href="/admin/social"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Cancel
            </Link>
          </>
        }
      >
        <form id="social-form" className="space-y-4">
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-ink mb-1">
              Platform
            </label>
            <select
              id="platform"
              name="platform"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">Twitter</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="scheduled_at" className="block text-sm font-medium text-ink mb-1">
              Scheduled at
            </label>
            <input
              id="scheduled_at"
              name="scheduled_at"
              type="datetime-local"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
