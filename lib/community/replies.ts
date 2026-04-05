/**
 * Community replies data layer.
 * Where Supabase table community_replies will be queried.
 */

import type { CommunityReply } from "@/types/community";

export async function getRepliesByPost(postId: string): Promise<CommunityReply[]> {
  return [];
}

export async function getReply(id: string): Promise<CommunityReply | null> {
  return null;
}

export async function createReply(
  data: Omit<CommunityReply, "id" | "created_at" | "updated_at">
): Promise<CommunityReply> {
  throw new Error("Not implemented");
}

export async function updateReply(id: string, data: Partial<CommunityReply>): Promise<CommunityReply> {
  throw new Error("Not implemented");
}
