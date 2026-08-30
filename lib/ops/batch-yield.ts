/**
 * Production bulk / bottle math.
 * A batch can fill some bottles and still leave unfinished bulk.
 */

export const DEFAULT_FILL_OZ_PER_BOTTLE = 0.5;

export type BulkFillInput = {
  total_bulk_oz: number;
  bottles_filled: number;
  fill_oz_per_bottle?: number | null;
  /** Optional explicit override for ounces poured into bottles. */
  ounces_used_for_bottles?: number | null;
};

export type BulkFillResult = {
  total_bulk_oz: number;
  bottles_filled: number;
  fill_oz_per_bottle: number | null;
  ounces_used_for_bottles: number | null;
  bulk_remaining_oz: number;
};

/**
 * Derive ounces used for bottles and remaining bulk.
 * Prefer explicit ounces_used_for_bottles; else bottles × fill size.
 */
export function computeBulkRemaining(input: BulkFillInput): BulkFillResult {
  const total = Math.max(0, Number(input.total_bulk_oz) || 0);
  const bottles = Math.max(0, Math.floor(Number(input.bottles_filled) || 0));
  const fill =
    input.fill_oz_per_bottle != null && Number(input.fill_oz_per_bottle) > 0
      ? Number(input.fill_oz_per_bottle)
      : null;

  let used: number | null = null;
  if (input.ounces_used_for_bottles != null && Number(input.ounces_used_for_bottles) >= 0) {
    used = Number(input.ounces_used_for_bottles);
  } else if (fill != null && bottles > 0) {
    used = bottles * fill;
  } else if (bottles === 0) {
    used = 0;
  }

  const remaining = used != null ? Math.max(0, total - used) : total;

  return {
    total_bulk_oz: total,
    bottles_filled: bottles,
    fill_oz_per_bottle: fill,
    ounces_used_for_bottles: used,
    bulk_remaining_oz: remaining,
  };
}

/** Format lot number parts — mirrors DB allocate_production_lot_number. */
export function formatLotNumber(isoDate: string, seq: number): string {
  const [y, m, d] = isoDate.split("-");
  const n = Math.max(1, Math.floor(seq));
  return `TH-${y}-${m}${d}-${String(n).padStart(3, "0")}`;
}
