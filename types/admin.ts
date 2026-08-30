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
  /** Exactly one supplier per pigment/ingredient row. */
  supplier?: string;
  supplier_identifier?: string;
  /** Pigment-specific: e.g. "Deep navy with gold shimmer". */
  color_description?: string;
  received_date?: string;
  lot_number?: string;
  unit: string;
  quantity_on_hand: number;
  reorder_point?: number;
  /** What was paid for the last purchase lot. */
  purchase_cost?: number;
  /** Quantity purchased (in `unit`) for that cost. */
  purchase_quantity?: number;
  /** Cost per `unit`. Prefer explicit; else purchase_cost / purchase_quantity. */
  unit_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type IngredientSdsSource = "supabase_storage" | "google_drive";

/** SDS/MSDS: Google Drive is canonical; Supabase Storage uploads are legacy. */
export interface IngredientMsdsDocument {
  id: string;
  ingredient_id: string;
  file_name: string;
  storage_path?: string;
  file_size?: number;
  mime_type: string;
  source: IngredientSdsSource;
  google_drive_file_id?: string;
  google_drive_url?: string;
  verified_at?: string;
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
  /** Optional link to the polish prototype this was promoted from. */
  source_prototype_id?: string;
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

// --- Collaboration / box programs (hard-coded) ---
export type CollaborationProgram = "LLB" | "SOU" | "LBOH";

export const COLLABORATION_PROGRAMS: CollaborationProgram[] = ["LLB", "SOU", "LBOH"];

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
  /** Photo upload deadline (esp. LLB / SOU / LBOH). */
  photo_upload_by?: string;
  collaboration_program?: CollaborationProgram;
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
  /** Legacy / planned size — preserved. Prefer total_bulk_oz for produced bulk. */
  batch_size_oz: number;
  /** Total bulk polish ounces produced. */
  total_bulk_oz: number;
  bottles_filled: number;
  fill_oz_per_bottle?: number;
  ounces_used_for_bottles?: number;
  bulk_remaining_oz?: number;
  /** Human-readable lot e.g. TH-2026-0830-001. Immutable after create. */
  lot_number?: string;
  status: ProductionBatchStatus;
  planned_date?: string;
  completed_at?: string;
  formula_version: number;
  formula_snapshot: FormulaSnapshotLine[];
  inventory_consumed_at?: string;
  estimated_cost_per_bottle?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ProductionInventoryMovementKind =
  | "ingredient_consume"
  | "packaging_consume"
  | "finished_bottle_increase";

export interface ProductionInventoryMovement {
  id: string;
  production_batch_id: string;
  movement_kind: ProductionInventoryMovementKind;
  ingredient_id?: string;
  finished_inventory_item_id?: string;
  quantity_delta: number;
  unit?: string;
  notes?: string;
  created_at: string;
}

// --- Packaging BOM (supplies per finished bottle) ---
export interface PackagingBom {
  id: string;
  name: string;
  polish_id?: string;
  is_default: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PackagingBomLine {
  id: string;
  packaging_bom_id: string;
  ingredient_id: string;
  quantity_per_bottle: number;
  sort_order: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Ingredient R&D (materials testing — not polish prototypes) ---
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

// --- Polish prototypes (15 ml development — separate from ingredient R&D) ---
export type PolishPrototypeStatus = "testing" | "selected" | "rejected" | "archived";

export interface PolishPrototype {
  id: string;
  name: string;
  created_date: string;
  target_size_ml: number;
  status: PolishPrototypeStatus;
  notes?: string;
  observations?: string;
  promoted_polish_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PolishPrototypeLine {
  id: string;
  prototype_id: string;
  sort_order: number;
  ingredient_name: string;
  amount_oz: number;
  ingredient_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PolishPrototypePhoto {
  id: string;
  prototype_id: string;
  file_name: string;
  storage_path: string;
  file_size?: number;
  mime_type: string;
  caption?: string;
  sort_order: number;
  uploaded_at: string;
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
  default_fill_oz_per_bottle: number;
  lead_marketing_days: number;
  lead_swatch_return_days: number;
  lead_swatcher_send_days: number;
  lead_production_complete_days: number;
  lead_photo_upload_days: number;
  monthly_revenue_goal: number;
  production_weekdays: number[];
  max_batches_per_day: number;
  updated_at: string;
}

export interface DailyTask {
  id: string;
  title: string;
  tag?: string;
  time_label?: string;
  item_date: string;
  done: boolean;
  sort_order: number;
  created_at: string;
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

// --- Manual program revenue (PayPal-derived) ---
export type RevenueSource = "LLB" | "SOU" | "LBOH" | "other";

export interface RevenueEntry {
  id: string;
  received_date: string;
  amount: number;
  source: RevenueSource;
  payment_method?: string;
  external_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** SDS compliance summary for a polish formula. */
export interface SdsComplianceStatus {
  pigment_count: number;
  with_sds_count: number;
  missing: Array<{ ingredient_id?: string; name: string }>;
  ok: boolean;
  summary: string;
}
