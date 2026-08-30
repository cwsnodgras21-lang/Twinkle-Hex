/**
 * Simple copyable ingredient list for subscription/box reporting.
 */

export type IngredientListLine = {
  ingredient_name: string;
  amount_oz?: number;
};

/**
 * Produce a plain-text INCI-style list: names joined by commas, largest first when amounts given.
 */
export function formatIngredientList(lines: IngredientListLine[]): string {
  const cleaned = lines
    .map((l) => ({
      name: (l.ingredient_name || "").trim(),
      amount_oz: l.amount_oz != null ? Number(l.amount_oz) : undefined,
    }))
    .filter((l) => l.name.length > 0);

  const sorted = [...cleaned].sort((a, b) => {
    const aa = a.amount_oz;
    const bb = b.amount_oz;
    if (aa != null && bb != null && aa !== bb) return bb - aa;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((l) => l.name).join(", ");
}
