import Link from "next/link";
import { AdminPageShell, BatchForm, FormShell } from "@/components/admin";

export default function NewBatchPage() {
  return (
    <AdminPageShell
      title="New Batch"
      description="Create a production batch."
    >
      <FormShell
        title="Batch details"
        description="Link to Shopify product when available."
        actions={
          <Link
            href="/admin/batches"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Cancel
          </Link>
        }
      >
        <BatchForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
