import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";

export default function NewRetailPartnerPage() {
  return (
    <AdminPageShell
      title="Add Retail Partner"
      description="Add a new retail account."
    >
      <FormShell
        title="Partner details"
        actions={
          <>
            <button
              type="submit"
              form="partner-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Save
            </button>
            <Link
              href="/admin/retail-partners"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Cancel
            </Link>
          </>
        }
      >
        <form id="partner-form" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium text-ink mb-1">
              Contact email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
