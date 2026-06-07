import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell, RetailPartnerForm } from "@/components/admin";
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
          <Link
            href="/admin/retail-partners"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Back
          </Link>
        }
      >
        <RetailPartnerForm partner={partner} mode="edit" />
      </FormShell>
    </AdminPageShell>
  );
}
