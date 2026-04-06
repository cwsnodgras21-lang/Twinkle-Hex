/**
 * Admin domain models - Supabase-ready TypeScript types.
 * Use these for forms, tables, and API responses.
 * Supabase tables will map to these shapes.
 */

// --- Ingredients (raw materials for polish) ---
export interface Ingredient {
  id: string;
  name: string;
  sku?: string;
  supplier?: string;
  unit: string;
  quantity_on_hand: number;
  reorder_point?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Supplies (packaging, labels, misc) ---
export interface Supply {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  quantity_on_hand: number;
  reorder_point?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Batches (production runs) ---
export type BatchStatus = "planned" | "in_progress" | "completed" | "cancelled";

export interface Batch {
  id: string;
  batch_number: string;
  product_id?: string; // Shopify product ID when linked
  status: BatchStatus;
  planned_date?: string;
  completed_at?: string;
  quantity_produced?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Finished inventory (post-production stock) ---
export interface FinishedInventoryItem {
  id: string;
  name: string;
  sku?: string;
  /** Optional link to a release plan */
  release_id?: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  location?: string;
  /** Shopify product / variant when synced */
  product_id?: string;
  variant_id?: string;
  batch_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Releases (launch pipeline) ---
export const RELEASE_STATUSES = [
  "concept",
  "formula_development",
  "testing",
  "swatcher_phase",
  "photography",
  "marketing",
  "launch_ready",
  "live",
  "archived",
] as const;

export type ReleaseStatus =
  | "concept"
  | "formula_development"
  | "testing"
  | "swatcher_phase"
  | "photography"
  | "marketing"
  | "launch_ready"
  | "live"
  | "archived";

export interface Release {
  id: string;
  name: string;
  collection?: string;
  description?: string;
  status: ReleaseStatus;
  target_launch_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** Polish / shade row under a release */
export interface ReleasePolish {
  id: string;
  release_id: string;
  name: string;
  sort_order: number;
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

// --- Swatchers (testers for new shades) ---
export interface Swatcher {
  id: string;
  name: string;
  email?: string;
  social_handle?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SwatcherAssignment {
  id: string;
  swatcher_id: string;
  release_id: string;
  shade_name?: string;
  status?: "pending" | "sent" | "received" | "feedback";
  sent_at?: string;
  feedback_notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Social media planning ---
export type SocialPlatform = "instagram" | "tiktok" | "twitter" | "other";

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  content_type?: string;
  scheduled_at?: string;
  published_at?: string;
  status: "draft" | "scheduled" | "published" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Retail partners ---
export interface RetailPartner {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status?: "active" | "inactive" | "pending";
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Events / expos ---
export interface Event {
  id: string;
  name: string;
  event_type?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  booth?: string;
  status?: "planned" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Charity polish tracking ---
export interface CharityPolish {
  id: string;
  name: string;
  product_id?: string;
  charity_name: string;
  donation_per_unit?: number;
  total_raised?: number;
  status?: "active" | "completed" | "paused";
  notes?: string;
  created_at: string;
  updated_at: string;
}
