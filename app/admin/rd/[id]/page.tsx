import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, StatusBadge } from "@/components/admin";
import { getRdPrototype } from "@/lib/admin/rd";
import { RdResolveButtons } from "@/components/admin/rd/RdResolveButtons";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RdDetailPage({ params }: Props) {
  const { id } = await params;
  const proto = await getRdPrototype(id).catch(() => null);
  if (!proto) notFound();

  return (
    <AdminPageShell title={proto.name} description="R&D observation — not production until approved.">
      <div className="mb-6">
        <Link href="/admin/rd" className="text-sm text-teal hover:underline">
          ← Back to R&D
        </Link>
      </div>

      <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={proto.status.replace("_", " ")} variant="info" />
          {proto.ingredient_lifecycle ? (
            <StatusBadge label={`Ingredient: ${proto.ingredient_lifecycle}`} variant="neutral" />
          ) : null}
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-ink/50">Ingredient</dt>
            <dd className="text-ink">
              {proto.ingredient_id ? (
                <Link href={`/admin/ingredients/${proto.ingredient_id}`} className="text-teal hover:underline">
                  {proto.ingredient_name ?? proto.ingredient_id}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-ink/50">Start</dt>
            <dd>{proto.start_date}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Review date</dt>
            <dd>{proto.review_date ?? "—"}</dd>
          </div>
        </dl>
        {proto.observation_notes ? (
          <div>
            <p className="text-sm text-ink/50 mb-1">Observations</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{proto.observation_notes}</p>
          </div>
        ) : null}
        {proto.outcome_notes ? (
          <div>
            <p className="text-sm text-ink/50 mb-1">Outcome</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{proto.outcome_notes}</p>
          </div>
        ) : null}

        {proto.status === "in_progress" ? (
          <div className="pt-2 border-t border-ink/10">
            <p className="text-sm text-ink/60 mb-3">
              Approval is explicit: experimental pigments stay experimental until you promote them here.
            </p>
            <RdResolveButtons id={proto.id} />
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
