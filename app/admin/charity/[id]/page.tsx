import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, CharityPolishForm, FormShell } from "@/components/admin";
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
          <Link
            href="/admin/charity"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Back
          </Link>
        }
      >
        <CharityPolishForm item={item} mode="edit" />
      </FormShell>
    </AdminPageShell>
  );
}
