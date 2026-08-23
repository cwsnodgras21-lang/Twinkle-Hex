import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin";
import { PolishDetail } from "@/components/admin/polishes";
import { getPolishDetail } from "@/lib/admin/polishes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PolishDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getPolishDetail(id);
  if (!detail) notFound();

  const { polish, lines } = detail;

  return (
    <AdminPageShell
      title={polish.name}
      description="Read-only view by default — use Edit or Edit recipe to make changes."
    >
      <div className="mb-6">
        <Link href="/admin/polishes" className="text-sm text-teal hover:underline inline-flex min-h-[44px] items-center">
          ← Back to polishes
        </Link>
      </div>

      <PolishDetail polish={polish} lines={lines} />
    </AdminPageShell>
  );
}
