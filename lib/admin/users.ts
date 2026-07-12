/**
 * Admin user management - list/create Supabase Auth users with the
 * app_metadata.role = "admin" claim. Uses the service-role client since
 * supabase.auth.admin.* requires it; every caller here must already be
 * behind requireAdmin() (see app/admin/actions.ts).
 */

import { createAdminClient } from "@/supabase/admin";

export type AdminUserSummary = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;

  return data.users
    .filter((u) => u.app_metadata?.role === "admin")
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function generateTempPassword(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export async function createAdminUser(email: string): Promise<{ email: string; tempPassword: string }> {
  const supabase = createAdminClient();
  const tempPassword = generateTempPassword();

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });

  if (error) throw error;

  return { email, tempPassword };
}
