"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminUser } from "@/lib/admin/users";
import { getErrorMessage } from "@/lib/errors";

export type CreateAdminUserResult =
  | { ok: true; email: string; tempPassword: string }
  | { ok: false; error: string };

/**
 * Creates a new admin account and grants it the admin role in one step.
 * This grants full admin access, so it's explicitly re-guarded here even
 * though middleware + the admin layout already require an admin session -
 * privilege-escalation actions get defense in depth beyond the usual CRUD.
 */
export async function createAdminUserAction(formData: FormData): Promise<CreateAdminUserResult> {
  try {
    await requireAdmin();

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    if (!email) return { ok: false, error: "Email is required" };

    const result = await createAdminUser(email);

    revalidatePath("/admin/settings");
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to create admin user") };
  }
}
