import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { SupplyForm } from "@/components/admin/supplies/SupplyForm";
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
        <SupplyForm supply={supply} mode="edit" />
      </FormShell>
    </AdminPageShell>
  );
}
