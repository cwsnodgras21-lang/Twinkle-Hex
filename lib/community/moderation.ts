/**
 * Community moderation data layer.
 * Where Supabase table moderation_reports will be queried.
 * Future: Moderation workflows.
 * Future: Notifications to moderators when content is reported.
 */

import type { ModerationReport } from "@/types/community";

export async function getReports(status?: string): Promise<ModerationReport[]> {
  return [];
}

export async function getReportById(id: string): Promise<ModerationReport | null> {
  return null;
}

export async function reportContent(
  data: Omit<ModerationReport, "id" | "status" | "reviewed_by" | "reviewed_at" | "created_at" | "updated_at">
): Promise<ModerationReport> {
  throw new Error("Not implemented");
}

export async function updateReportStatus(
  id: string,
  status: ModerationReport["status"],
  reviewedBy?: string
): Promise<ModerationReport> {
  throw new Error("Not implemented");
}
