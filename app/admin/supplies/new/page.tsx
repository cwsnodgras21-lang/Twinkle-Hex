import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";

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
        <form id="supply-form" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
              placeholder="e.g. 15ml bottles"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-ink mb-1">
              Category
            </label>
            <input
              id="category"
              name="category"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
              placeholder="e.g. Packaging"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-ink mb-1">
                Unit
              </label>
              <input
                id="unit"
                name="unit"
                type="text"
                className="w-full border border-ink/20 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-ink mb-1">
                Quantity on hand
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                className="w-full border border-ink/20 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
