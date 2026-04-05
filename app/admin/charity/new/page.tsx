import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";

export default function NewCharityPolishPage() {
  return (
    <AdminPageShell
      title="Add Charity Polish"
      description="Track a charity polish campaign."
    >
      <FormShell
        title="Charity polish details"
        actions={
          <>
            <button
              type="submit"
              form="charity-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Save
            </button>
            <Link
              href="/admin/charity"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Cancel
            </Link>
          </>
        }
      >
        <form id="charity-form" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Polish name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="charity_name" className="block text-sm font-medium text-ink mb-1">
              Charity name
            </label>
            <input
              id="charity_name"
              name="charity_name"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="donation_per_unit" className="block text-sm font-medium text-ink mb-1">
              Donation per unit ($)
            </label>
            <input
              id="donation_per_unit"
              name="donation_per_unit"
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
