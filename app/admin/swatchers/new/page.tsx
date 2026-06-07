import Link from "next/link";
import { AdminPageShell, FormShell, SwatcherForm } from "@/components/admin";

export default function NewSwatcherPage() {
  return (
    <AdminPageShell
      title="Add Swatcher"
      description="Add a new swatcher to your network."
    >
      <FormShell
        title="Swatcher details"
        actions={
          <Link
            href="/admin/swatchers"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Cancel
          </Link>
        }
      >
        <SwatcherForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
