import { AdminPageShell } from "@/components/admin";

export default function AdminCommunityModerationPage() {
  return (
    <AdminPageShell
      title="Moderation"
      description="Moderation queue and tools."
    >
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Moderation Queue</h2>
          <p className="text-sm text-ink/70">
            Future: Pending reports, flagged content, bulk actions.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Actions</h2>
          <p className="text-sm text-ink/70">
            Future: Pin, lock, hide posts. Ban users. Moderation workflows.
          </p>
        </section>
        {/* Future: Moderation workflows, notifications to moderators */}
      </div>
    </AdminPageShell>
  );
}
