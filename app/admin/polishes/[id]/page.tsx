import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin";
import { PolishDetail } from "@/components/admin/polishes";
import { getPolishDetail } from "@/lib/admin/polishes";
import { listBatchesForPolish } from "@/lib/admin/batches";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PolishDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getPolishDetail(id);
  if (!detail) notFound();

  const { polish, lines } = detail;
  let batches: Awaited<ReturnType<typeof listBatchesForPolish>> = [];
  try {
    batches = await listBatchesForPolish(id);
  } catch {
    batches = [];
  }

  return (
    <AdminPageShell
      title={polish.name}
      description="Recipe, make a batch, and frozen formula history."
    >
      <div className="mb-6">
        <Link
          href="/admin/polishes"
          className="text-sm text-teal hover:underline inline-flex min-h-[44px] items-center"
        >
          ← Back to polishes
        </Link>
      </div>

      <PolishDetail polish={polish} lines={lines} batches={batches} />
    </AdminPageShell>
  );
}
