/**
 * Community posts data layer.
 * Where Supabase table community_posts will be queried.
 */

import type { CommunityPost } from "@/types/community";

export async function getPostsByChannel(channelId: string): Promise<CommunityPost[]> {
  return [];
}

export async function getPost(id: string): Promise<CommunityPost | null> {
  return null;
}

export async function getRecentPosts(limit?: number): Promise<CommunityPost[]> {
  return [];
}

export async function createPost(
  data: Omit<CommunityPost, "id" | "reply_count" | "view_count" | "last_activity_at" | "created_at" | "updated_at">
): Promise<CommunityPost> {
  throw new Error("Not implemented");
}

export async function updatePost(id: string, data: Partial<CommunityPost>): Promise<CommunityPost> {
  throw new Error("Not implemented");
}
