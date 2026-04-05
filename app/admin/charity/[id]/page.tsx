import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { getCharityPolishById } from "@/lib/admin/charity";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCharityPolishPage({ params }: Props) {
  const { id } = await params;
  const item = await getCharityPolishById(id);
  if (!item) notFound();

  return (
    <AdminPageShell
      title={`Edit: ${item.name}`}
      description="Update charity polish campaign."
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
              Back
            </Link>
          </>
        }
      >
        <form id="charity-form" className="space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={item.status ?? "active"}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div>
            <label htmlFor="total_raised" className="block text-sm font-medium text-ink mb-1">
              Total raised ($)
            </label>
            <input
              id="total_raised"
              name="total_raised"
              type="number"
              min="0"
              step="0.01"
              defaultValue={item.total_raised ?? ""}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
