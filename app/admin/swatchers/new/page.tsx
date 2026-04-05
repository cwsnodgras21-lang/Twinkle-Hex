import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";

export default function NewSwatcherPage() {
  return (
    <AdminPageShell
      title="Add Swatcher"
      description="Add a new swatcher to your network."
    >
      <FormShell
        title="Swatcher details"
        actions={
          <>
            <button
              type="submit"
              form="swatcher-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Save
            </button>
            <Link
              href="/admin/swatchers"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Cancel
            </Link>
          </>
        }
      >
        <form id="swatcher-form" className="space-y-4">
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
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="social_handle" className="block text-sm font-medium text-ink mb-1">
              Social handle
            </label>
            <input
              id="social_handle"
              name="social_handle"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
              placeholder="@username"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
