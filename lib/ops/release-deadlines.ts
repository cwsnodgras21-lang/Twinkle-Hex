/**
 * Derive upstream release deadlines from a launch date using explicit lead times.
 * All lead times are days BEFORE target_launch_date.
 */

export type LeadTimeDefaults = {
  lead_marketing_days: number;
  lead_swatch_return_days: number;
  lead_swatcher_send_days: number;
  lead_production_complete_days: number;
  lead_photo_upload_days: number;
};

/** Documented defaults until ops_settings UI exists. */
export const DEFAULT_LEAD_TIMES: LeadTimeDefaults = {
  lead_marketing_days: 7,
  lead_swatch_return_days: 21,
  lead_swatcher_send_days: 35,
  lead_production_complete_days: 42,
  lead_photo_upload_days: 14,
};

function parseDateOnly(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function subtractDays(isoDate: string, days: number): string {
  const d = parseDateOnly(isoDate);
  d.setUTCDate(d.getUTCDate() - days);
  return formatDateOnly(d);
}

export type DerivedDeadlines = {
  target_launch_date: string;
  marketing_ready_by: string;
  swatch_return_by: string;
  swatcher_send_by: string;
  production_complete_by: string;
  photo_upload_by: string;
};

export function deriveDeadlinesFromLaunch(
  targetLaunchDate: string,
  leads: LeadTimeDefaults = DEFAULT_LEAD_TIMES
): DerivedDeadlines {
  return {
    target_launch_date: targetLaunchDate,
    marketing_ready_by: subtractDays(targetLaunchDate, leads.lead_marketing_days),
    swatch_return_by: subtractDays(targetLaunchDate, leads.lead_swatch_return_days),
    swatcher_send_by: subtractDays(targetLaunchDate, leads.lead_swatcher_send_days),
    production_complete_by: subtractDays(targetLaunchDate, leads.lead_production_complete_days),
    photo_upload_by: subtractDays(targetLaunchDate, leads.lead_photo_upload_days),
  };
}

/**
 * Prefer explicitly set dates; fill missing ones from launch + lead times.
 */
export function coalesceReleaseDeadlines(input: {
  target_launch_date?: string | null;
  production_complete_by?: string | null;
  swatcher_send_by?: string | null;
  swatch_return_by?: string | null;
  marketing_ready_by?: string | null;
  photo_upload_by?: string | null;
  leads?: LeadTimeDefaults;
}): {
  production_complete_by: string | null;
  swatcher_send_by: string | null;
  swatch_return_by: string | null;
  marketing_ready_by: string | null;
  photo_upload_by: string | null;
} {
  const leads = input.leads ?? DEFAULT_LEAD_TIMES;
  const derived = input.target_launch_date
    ? deriveDeadlinesFromLaunch(input.target_launch_date, leads)
    : null;

  return {
    production_complete_by:
      input.production_complete_by ?? derived?.production_complete_by ?? null,
    swatcher_send_by: input.swatcher_send_by ?? derived?.swatcher_send_by ?? null,
    swatch_return_by: input.swatch_return_by ?? derived?.swatch_return_by ?? null,
    marketing_ready_by: input.marketing_ready_by ?? derived?.marketing_ready_by ?? null,
    photo_upload_by: input.photo_upload_by ?? derived?.photo_upload_by ?? null,
  };
}
