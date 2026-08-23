import Link from "next/link";
import { AdminPageShell, MetricCard, StatusBadge } from "@/components/admin";
import { PolishSwatch } from "@/components/admin/polishes";
import { listIngredients } from "@/lib/admin/ingredients";
import { listPolishesWithLineCount } from "@/lib/admin/polishes";
import { listFinishedInventoryItemsWithPolish } from "@/lib/admin/inventory";

export default async function AdminDashboardPage() {
  const [ingredients, polishes, stock] = await Promise.all([
    listIngredients().catch(() => []),
    listPolishesWithLineCount().catch(() => []),
    listFinishedInventoryItemsWithPolish().catch(() => []),
  ]);

  const lowIngredients = ingredients.filter(
    (i) => i.reorder_point != null && i.quantity_on_hand <= i.reorder_point
  );
  const totalStockOnHand = stock.reduce((sum, s) => sum + s.quantity_on_hand, 0);
  const lowStockItems = stock.filter((s) => s.quantity_on_hand - s.reserved_quantity <= 0);
  const missingRecipes = polishes.filter((p) => p.line_count === 0);
  const recentPolishes = [...polishes]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  return (
    <AdminPageShell
      title="Dashboard"
      description="Stock, ingredients, and recipes — the three things this tool tracks."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Finished stock on hand"
          value={totalStockOnHand}
          subtitle={`${stock.length} SKU${stock.length === 1 ? "" : "s"}`}
          accent="teal"
          icon="🧴"
        />
        <MetricCard
          title="Low / out of stock"
          value={lowStockItems.length}
          subtitle="Available ≤ 0"
          accent="magenta"
          icon="⚠️"
        />
        <MetricCard
          title="Ingredients to reorder"
          value={lowIngredients.length}
          subtitle={`of ${ingredients.length} total`}
          accent="plum"
          icon="🧪"
        />
        <MetricCard
          title="Polishes"
          value={polishes.length}
          subtitle={`${missingRecipes.length} missing a recipe`}
          accent="cyan"
          icon="💅"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">Recent polishes</h2>
            <Link href="/admin/polishes" className="text-sm text-teal hover:underline">
              View all →
            </Link>
          </div>
          {recentPolishes.length === 0 ? (
            <p className="text-sm text-ink/60 py-6 text-center">No polishes yet.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {recentPolishes.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/polishes/${p.id}`}
                    className="flex items-center gap-3 py-2.5 group"
                  >
                    <PolishSwatch colorHex={p.color_hex} />
                    <span className="flex-1 min-w-0 truncate text-ink group-hover:text-plum transition-colors">
                      {p.name}
                    </span>
                    {p.line_count === 0 ? (
                      <StatusBadge label="No recipe" variant="warning" />
                    ) : (
                      <span className="text-xs text-ink/50">{p.line_count} ingredients</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">Ingredients to reorder</h2>
            <Link href="/admin/ingredients" className="text-sm text-teal hover:underline">
              View all →
            </Link>
          </div>
          {lowIngredients.length === 0 ? (
            <p className="text-sm text-ink/60 py-6 text-center">Everything&apos;s above its reorder point. 🎉</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {lowIngredients.slice(0, 6).map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/admin/ingredients/${i.id}`}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <span className="text-ink group-hover:text-plum transition-colors truncate pr-3">
                      {i.name}
                    </span>
                    <StatusBadge label={`${i.quantity_on_hand} ${i.unit} left`} variant="warning" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-ink/60 mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/inventory"
            className="px-4 py-2 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors text-sm font-medium"
          >
            Finished Stock
          </Link>
          <Link
            href="/admin/ingredients"
            className="px-4 py-2 bg-plum/10 text-plum rounded-lg hover:bg-plum/20 transition-colors text-sm font-medium"
          >
            Ingredients
          </Link>
          <Link
            href="/admin/polishes"
            className="px-4 py-2 bg-magenta/10 text-magenta rounded-lg hover:bg-magenta/20 transition-colors text-sm font-medium"
          >
            Polishes &amp; Recipes
          </Link>
        </div>
      </section>
    </AdminPageShell>
  );
}
