import { AdminPageShell } from "@/components/admin";

export default function AdminCommunityPage() {
  return (
    <AdminPageShell
      title="Community"
      description="Moderate and manage community content."
    >
      {/* Future: Moderation queue, reported posts, user management */}
      <p className="text-plum">Community moderation coming soon.</p>
    </AdminPageShell>
  );
}
