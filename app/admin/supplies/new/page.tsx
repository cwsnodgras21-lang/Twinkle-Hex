import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { SupplyForm } from "@/components/admin/supplies/SupplyForm";

export default function NewSupplyPage() {
  return (
    <AdminPageShell
      title="Add Supply"
      description="Create a new supply entry."
    >
      <FormShell
        title="Supply details"
        actions={
          <>
            <button
              type="submit"
              form="supply-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Save
            </button>
            <Link
              href="/admin/supplies"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Cancel
            </Link>
          </>
        }
      >
        <SupplyForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
