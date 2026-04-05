import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { ReleaseForm } from "@/components/admin/releases";

export default function NewReleasePage() {
  return (
    <AdminPageShell
      title="New Release"
      description="Plan a new polish launch."
    >
      <FormShell
        title="Release details"
        description="Track your release through concept to launch."
        actions={
          <Link
            href="/admin/releases"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Cancel
          </Link>
        }
      >
        <ReleaseForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
