import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell, SwatcherForm } from "@/components/admin";
import { getSwatcherById } from "@/lib/admin/swatchers";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSwatcherPage({ params }: Props) {
  const { id } = await params;
  const swatcher = await getSwatcherById(id);
  if (!swatcher) notFound();

  return (
    <AdminPageShell
      title={`Edit: ${swatcher.name}`}
      description="Update swatcher details."
    >
      <FormShell
        title="Swatcher details"
        actions={
          <Link
            href="/admin/swatchers"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Back
          </Link>
        }
      >
        <SwatcherForm swatcher={swatcher} mode="edit" />
      </FormShell>
    </AdminPageShell>
  );
}
