/**
 * Admin domain models - Supabase-ready TypeScript types.
 *
 * Gravitational centers remain Stock, Ingredients, and Polishes.
 * Production OS entities (releases, batches, R&D, swatchers) hang off those
 * centers without nesting polishes under releases.
 */

// --- Ingredients: raw materials, pigments, and supplies in one place ---
export type IngredientCategory = "ingredient" | "pigment" | "supply";

export type IngredientLifecycleStatus =
  | "tracked"
  | "experimental"
  | "approved"
  | "rejected"
  | "archived";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  lifecycle_status: IngredientLifecycleStatus;
  sku?: string;
  supplier?: string;
  supplier_identifier?: string;
  /** Pigment-specific: e.g. "Deep navy with gold shimmer". */
  color_description?: string;
  received_date?: string;
  lot_number?: string;
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
  /** Increments when the current recipe is replaced. */
  formula_version: number;
  /** Core/repeat sellers vs launch-driven. */
  is_core: boolean;
  stock_target?: number;
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
  /** Optional link into ingredients for eligibility / tracking. */
  ingredient_id?: string;
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

// --- Releases / collections ---
export type ReleaseStatus =
  | "planned"
  | "in_production"
  | "swatching"
  | "marketing"
  | "launched"
  | "archived";

export interface Release {
  id: string;
  name: string;
  description?: string;
  status: ReleaseStatus;
  target_launch_date?: string;
  production_complete_by?: string;
  swatcher_send_by?: string;
  swatch_return_by?: string;
  marketing_ready_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ReleasePolishProductionStatus = "needed" | "formula_ready" | "batched" | "complete";

export interface ReleasePolish {
  id: string;
  release_id: string;
  polish_id: string;
  sort_order: number;
  production_status: ReleasePolishProductionStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Production batches ---
export type ProductionBatchStatus = "planned" | "in_progress" | "completed" | "cancelled";

export interface FormulaSnapshotLine {
  ingredient_name: string;
  amount_oz: number;
  ingredient_id?: string;
}

export interface ProductionBatch {
  id: string;
  polish_id: string;
  release_id?: string;
  batch_size_oz: number;
  status: ProductionBatchStatus;
  planned_date?: string;
  completed_at?: string;
  formula_version: number;
  formula_snapshot: FormulaSnapshotLine[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- R&D ---
export type RdPrototypeStatus = "in_progress" | "approved" | "rejected";

export interface RdPrototype {
  id: string;
  name: string;
  ingredient_id?: string;
  start_date: string;
  review_date?: string;
  observation_notes?: string;
  status: RdPrototypeStatus;
  outcome_notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Swatchers ---
export interface Swatcher {
  id: string;
  name: string;
  email?: string;
  social_handle?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type SwatcherAssignmentStatus = "planned" | "sent" | "returned" | "cancelled";

export interface SwatcherAssignment {
  id: string;
  swatcher_id: string;
  release_id: string;
  polish_id?: string;
  status: SwatcherAssignmentStatus;
  send_by?: string;
  sent_at?: string;
  expected_return_at?: string;
  returned_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Ops settings + thin calendar notes ---
export interface OpsSettings {
  id: number;
  default_batch_oz: number;
  lead_marketing_days: number;
  lead_swatch_return_days: number;
  lead_swatcher_send_days: number;
  lead_production_complete_days: number;
  production_weekdays: number[];
  max_batches_per_day: number;
  updated_at: string;
}

export type OpsCalendarItemKind = "marketing" | "email" | "post" | "other";

export interface OpsCalendarItem {
  id: string;
  release_id?: string;
  title: string;
  item_date: string;
  kind: OpsCalendarItemKind;
  notes?: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}
