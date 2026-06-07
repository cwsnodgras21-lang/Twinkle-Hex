import Link from "next/link";
import { AdminPageShell, CharityPolishForm, FormShell } from "@/components/admin";

export default function NewCharityPolishPage() {
  return (
    <AdminPageShell
      title="Add Charity Polish"
      description="Track a charity polish campaign."
    >
      <FormShell
        title="Charity polish details"
        actions={
          <Link
            href="/admin/charity"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Cancel
          </Link>
        }
      >
        <CharityPolishForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
