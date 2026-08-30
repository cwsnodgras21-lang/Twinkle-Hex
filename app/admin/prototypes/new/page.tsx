import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { PrototypeForm } from "@/components/admin/prototypes";

export default function NewPrototypePage() {
  return (
    <AdminPageShell
      title="New Polish Prototype"
      description="15 mL development formula — formula lines and observations, separate from ingredient R&D."
    >
      <div className="mb-6">
        <Link href="/admin/prototypes" className="text-sm text-teal hover:underline">
          ← Back to prototypes
        </Link>
      </div>
      <FormShell title="Prototype details">
        <PrototypeForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
