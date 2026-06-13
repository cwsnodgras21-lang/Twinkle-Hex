import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { PigmentForm } from "@/components/admin/pigments/PigmentForm";

export default function NewPigmentPage() {
  return (
    <AdminPageShell
      title="Add Pigment"
      description="Create a new pigment. You can attach MSDS sheets after saving."
    >
      <FormShell
        title="Pigment details"
        actions={
          <>
            <button
              type="submit"
              form="pigment-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Save
            </button>
            <Link
              href="/admin/pigments"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Cancel
            </Link>
          </>
        }
      >
        <PigmentForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
