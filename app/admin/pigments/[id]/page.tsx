import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { MsdsDocumentsPanel } from "@/components/admin/pigments/MsdsDocumentsPanel";
import { PigmentForm } from "@/components/admin/pigments/PigmentForm";
import { getPigmentById, listPigmentMsdsDocuments } from "@/lib/admin/pigments";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPigmentPage({ params }: Props) {
  const { id } = await params;
  const pigment = await getPigmentById(id);
  if (!pigment) notFound();

  const msdsDocuments = await listPigmentMsdsDocuments(id);

  return (
    <AdminPageShell
      title={`Edit: ${pigment.name}`}
      description="Update pigment details and manage MSDS safety sheets."
    >
      <div className="space-y-6">
        <FormShell
          title="Pigment details"
          actions={
            <>
              <button
                type="submit"
                form="pigment-form"
                className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
              >
                Save
              </button>
              <Link
                href="/admin/pigments"
                className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
              >
                Cancel
              </Link>
            </>
          }
        >
          <PigmentForm pigment={pigment} mode="edit" />
        </FormShell>

        <FormShell title="MSDS sheets">
          <MsdsDocumentsPanel pigmentId={id} documents={msdsDocuments} />
        </FormShell>
      </div>
    </AdminPageShell>
  );
}
