import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
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
              Back
            </Link>
          </>
        }
      >
        <form id="swatcher-form" className="space-y-4">
          <input type="hidden" name="id" value={swatcher.id} />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={swatcher.name}
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
              defaultValue={swatcher.email ?? ""}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
