import Link from "next/link";
import { AdminPageShell, TableShell, EmptyState, StatusBadge } from "@/components/admin";
import { listIngredients } from "@/lib/admin/ingredients";
import type { IngredientCategory } from "@/types/admin";

const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  ingredient: "Ingredient",
  pigment: "Pigment",
  supply: "Supply",
};

const CATEGORY_DOT: Record<IngredientCategory, string> = {
  ingredient: "bg-teal",
  pigment: "bg-plum",
  supply: "bg-cyan",
};

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function AdminIngredientsPage({ searchParams }: Props) {
  const { category: categoryParam } = await searchParams;
  const activeCategory =
    categoryParam === "ingredient" || categoryParam === "pigment" || categoryParam === "supply"
      ? (categoryParam as IngredientCategory)
      : undefined;

  const all = await listIngredients();
  const items = activeCategory ? all.filter((i) => i.category === activeCategory) : all;

  const counts = {
    all: all.length,
    ingredient: all.filter((i) => i.category === "ingredient").length,
    pigment: all.filter((i) => i.category === "pigment").length,
    supply: all.filter((i) => i.category === "supply").length,
  };

  const tabs: { key: string; label: string; count: number; href: string }[] = [
    { key: "all", label: "All", count: counts.all, href: "/admin/ingredients" },
    { key: "ingredient", label: "Ingredients", count: counts.ingredient, href: "/admin/ingredients?category=ingredient" },
    { key: "pigment", label: "Pigments", count: counts.pigment, href: "/admin/ingredients?category=pigment" },
    { key: "supply", label: "Supplies", count: counts.supply, href: "/admin/ingredients?category=supply" },
  ];

  return (
    <AdminPageShell
      title="Ingredients"
      description="Everything that goes into a polish: raw ingredients, pigments, and supplies — one list, filterable by type."
      actions={
        <Link
          href="/admin/ingredients/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium transition-colors"
        >
          New ingredient
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((tab) => {
          const isActive = (tab.key === "all" && !activeCategory) || tab.key === activeCategory;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive ? "bg-plum text-white" : "bg-ink/5 text-ink/70 hover:bg-ink/10"
              }`}
            >
              {tab.label} <span className="opacity-70">{tab.count}</span>
            </Link>
          );
        })}
      </div>

      <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm">
        <TableShell
          headers={["Name", "Type", "SKU", "Supplier", "Qty on hand", "Stock"]}
          empty={items.length === 0}
          emptyContent={
            <EmptyState
              title="No ingredients yet"
              description="Add raw materials, pigments, or supplies to start tracking what goes into your recipes."
              action={
                <Link
                  href="/admin/ingredients/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  New ingredient
                </Link>
              }
            />
          }
        >
          {items.map((item) => {
            const low = item.reorder_point != null && item.quantity_on_hand <= item.reorder_point;
            return (
              <tr key={item.id} className="hover:bg-ink/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/ingredients/${item.id}`}
                    className="font-medium text-ink hover:text-teal transition-colors"
                  >
                    {item.name}
                  </Link>
                  {item.color_description && (
                    <p className="text-xs text-ink/50 mt-0.5">{item.color_description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink/70">
                    <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[item.category]}`} aria-hidden="true" />
                    {CATEGORY_LABEL[item.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/70 font-mono text-sm">{item.sku ?? "—"}</td>
                <td className="px-4 py-3 text-ink/70">{item.supplier ?? "—"}</td>
                <td className="px-4 py-3 text-ink/80 tabular-nums">
                  {item.quantity_on_hand} {item.unit}
                </td>
                <td className="px-4 py-3">
                  {low ? (
                    <StatusBadge label="Low stock" variant="warning" />
                  ) : (
                    <StatusBadge label="OK" variant="success" />
                  )}
                </td>
              </tr>
            );
          })}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
