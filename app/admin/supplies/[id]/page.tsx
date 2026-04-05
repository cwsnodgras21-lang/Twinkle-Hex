import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { getSupplyById } from "@/lib/admin/supplies";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSupplyPage({ params }: Props) {
  const { id } = await params;
  const supply = await getSupplyById(id);
  if (!supply) notFound();

  return (
    <AdminPageShell
      title={`Edit: ${supply.name}`}
      description="Update supply details."
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
          <input type="hidden" name="id" value={supply.id} />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={supply.name}
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
              defaultValue={supply.quantity_on_hand}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
