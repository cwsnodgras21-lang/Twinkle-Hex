import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { SocialPostForm } from "@/components/admin/social/SocialPostForm";

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
        <SocialPostForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
