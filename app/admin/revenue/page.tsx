import { AdminPageShell } from "@/components/admin";
import { RevenueDashboard, RevenueEntryForm } from "@/components/admin/revenue";
import { getMonthRevenueReport, listRevenueEntries } from "@/lib/admin/revenue";

export default async function RevenuePage() {
  const [report, entries] = await Promise.all([
    getMonthRevenueReport().catch(() => null),
    listRevenueEntries().catch(() => []),
  ]);

  return (
    <AdminPageShell
      title="Revenue"
      description="Monthly program revenue toward the $1,500 goal — Shopify rolls up automatically; log LLB, SOU, LBOH, and other revenue here."
    >
      <div className="space-y-8">
        {report ? (
          <RevenueDashboard report={report} entries={entries} />
        ) : (
          <p className="text-sm text-ink/60 border border-ink/10 rounded-xl bg-white px-4 py-8 text-center">
            Could not load the revenue report.
          </p>
        )}

        <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm max-w-xl">
          <h2 className="text-lg font-semibold text-ink mb-4">Log revenue</h2>
          <RevenueEntryForm />
        </div>
      </div>
    </AdminPageShell>
  );
}
