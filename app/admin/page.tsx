import { AdminPageShell } from "@/components/admin";
import { MetricCard } from "@/components/admin";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <AdminPageShell
      title="Dashboard"
      description="Overview of your store and operations."
    >
      {/* Future: where reporting/analytics could live */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Orders (7d)" value="—" subtitle="Shopify" />
        <MetricCard title="Low Stock" value="—" subtitle="Ingredients + supplies" />
        <MetricCard title="Active Batches" value="—" subtitle="In progress" />
        <MetricCard title="Upcoming Releases" value="—" subtitle="Next 30 days" />
      </div>
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/orders"
              className="px-4 py-2 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors"
            >
              Orders
            </Link>
            <Link
              href="/admin/batches"
              className="px-4 py-2 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors"
            >
              Batches
            </Link>
            <Link
              href="/admin/releases"
              className="px-4 py-2 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors"
            >
              Releases
            </Link>
            <Link
              href="/admin/inventory"
              className="px-4 py-2 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors"
            >
              Inventory
            </Link>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
