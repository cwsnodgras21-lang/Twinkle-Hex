import { AdminPageShell } from "@/components/admin";

export default function AdminSettingsPage() {
  return (
    <AdminPageShell
      title="Settings"
      description="Configure your store and integrations."
    >
      {/* Future: Store settings, Shopify connection, Supabase config */}
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Integrations</h2>
          <p className="text-sm text-ink/70">Shopify, Supabase, and other integrations will be configured here.</p>
        </section>
      </div>
    </AdminPageShell>
  );
}
