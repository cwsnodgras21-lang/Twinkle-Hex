import { AdminPageShell } from "@/components/admin";
import { AddAdminUserForm } from "@/components/admin/settings/AddAdminUserForm";
import { listAdminUsers } from "@/lib/admin/users";

export default async function AdminSettingsPage() {
  const admins = await listAdminUsers();

  return (
    <AdminPageShell
      title="Settings"
      description="Configure your store and integrations."
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Admin users</h2>
          <p className="text-sm text-ink/70 mb-4">
            Anyone added here gets full access to this dashboard - orders, inventory,
            recipes, and everything else under /admin.
          </p>

          <div className="bg-white border border-ink/10 rounded-lg divide-y divide-ink/10 mb-4">
            {admins.length === 0 ? (
              <p className="p-4 text-sm text-ink/60">No admin users yet.</p>
            ) : (
              admins.map((admin) => (
                <div key={admin.id} className="p-4 flex items-center justify-between text-sm">
                  <span className="text-ink">{admin.email}</span>
                  <span className="text-ink/50">
                    {admin.last_sign_in_at
                      ? `Last signed in ${new Date(admin.last_sign_in_at).toLocaleDateString()}`
                      : "Never signed in"}
                  </span>
                </div>
              ))
            )}
          </div>

          <AddAdminUserForm />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-2">Integrations</h2>
          <p className="text-sm text-ink/70">Shopify, Supabase, and other integrations will be configured here.</p>
        </section>
      </div>
    </AdminPageShell>
  );
}
