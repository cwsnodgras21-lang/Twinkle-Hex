import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";

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
          <>
            <button
              type="submit"
              form="batch-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Create
            </button>
            <Link
              href="/admin/batches"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Cancel
            </Link>
          </>
        }
      >
        <form id="batch-form" className="space-y-4">
          <div>
            <label htmlFor="batch_number" className="block text-sm font-medium text-ink mb-1">
              Batch number
            </label>
            <input
              id="batch_number"
              name="batch_number"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono"
              placeholder="e.g. B-2024-001"
            />
          </div>
          <div>
            <label htmlFor="planned_date" className="block text-sm font-medium text-ink mb-1">
              Planned date
            </label>
            <input
              id="planned_date"
              name="planned_date"
              type="date"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="product_id" className="block text-sm font-medium text-ink mb-1">
              Shopify product ID (optional)
            </label>
            <input
              id="product_id"
              name="product_id"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
              placeholder="Where Shopify product links in"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
