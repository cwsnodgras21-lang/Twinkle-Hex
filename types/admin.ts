/**
 * Admin domain models - Supabase-ready TypeScript types.
 * Use these for forms, tables, and API responses.
 *
 * This app answers three questions, and the types below are organized
 * around them rather than by leftover feature names:
 *  1. What's in finished stock       -> FinishedInventoryItem
 *  2. What's in ingredients          -> Ingredient (raw materials, pigments,
 *                                        and supplies all live in one table,
 *                                        distinguished by `category`)
 *  3. How is each polish made        -> Polish + PolishRecipeLine
 */

// --- Ingredients: raw materials, pigments, and supplies in one place ---
export type IngredientCategory = "ingredient" | "pigment" | "supply";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  sku?: string;
  supplier?: string;
  /** Pigment-specific: e.g. "Deep navy with gold shimmer". */
  color_description?: string;
  unit: string;
  quantity_on_hand: number;
  reorder_point?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** MSDS/SDS PDF attached to an ingredient (typically a pigment). */
export interface IngredientMsdsDocument {
  id: string;
  ingredient_id: string;
  file_name: string;
  storage_path: string;
  file_size?: number;
  mime_type: string;
  notes?: string;
  uploaded_at: string;
}

// --- Polishes: how each shade is made ---
export interface Polish {
  id: string;
  name: string;
  sort_order: number;
  /** Swatch color for the UI, e.g. "#cb508f". */
  color_hex?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** One line in a polish recipe (ingredient + amount in ounces) */
export interface PolishRecipeLine {
  id: string;
  polish_id: string;
  sort_order: number;
  ingredient_name: string;
  amount_oz: number;
  created_at: string;
  updated_at: string;
}

// --- Finished stock ---
export interface FinishedInventoryItem {
  id: string;
  name: string;
  sku?: string;
  /** Which polish/recipe this stock is — the link back to Recipes. */
  polish_id?: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
