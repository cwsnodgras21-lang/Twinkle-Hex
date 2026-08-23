import Link from "next/link";
import { AdminPageShell } from "@/components/admin";
import { ReleaseForm } from "@/components/admin/releases/ReleaseForm";

export default function NewReleasePage() {
  return (
    <AdminPageShell title="New release" description="Plan a collection with launch-driven deadlines.">
      <div className="mb-6">
        <Link href="/admin/releases" className="text-sm text-teal hover:underline">
          ← Back to releases
        </Link>
      </div>
      <ReleaseForm mode="create" />
    </AdminPageShell>
  );
}
