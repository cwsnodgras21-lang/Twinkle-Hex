import Link from "next/link";
import { AdminPageShell, FormShell, RetailPartnerForm } from "@/components/admin";

export default function NewRetailPartnerPage() {
  return (
    <AdminPageShell
      title="Add Retail Partner"
      description="Add a new retail account."
    >
      <FormShell
        title="Partner details"
        actions={
          <Link
            href="/admin/retail-partners"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Cancel
          </Link>
        }
      >
        <RetailPartnerForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
