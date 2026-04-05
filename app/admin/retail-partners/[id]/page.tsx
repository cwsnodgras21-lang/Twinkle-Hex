import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { getRetailPartnerById } from "@/lib/admin/retail-partners";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRetailPartnerPage({ params }: Props) {
  const { id } = await params;
  const partner = await getRetailPartnerById(id);
  if (!partner) notFound();

  return (
    <AdminPageShell
      title={`Edit: ${partner.name}`}
      description="Update retail partner details."
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
              Back
            </Link>
          </>
        }
      >
        <form id="partner-form" className="space-y-4">
          <input type="hidden" name="id" value={partner.id} />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={partner.name}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={partner.status ?? "active"}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
