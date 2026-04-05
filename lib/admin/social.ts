/**
 * Social posts CRUD - Supabase data layer.
 */

import type { SocialPost } from "@/types/admin";

export async function listSocialPosts(): Promise<SocialPost[]> {
  return [];
}

export async function createSocialPost(data: Omit<SocialPost, "id" | "created_at" | "updated_at">): Promise<SocialPost> {
  throw new Error("Not implemented");
}

export async function updateSocialPost(id: string, data: Partial<SocialPost>): Promise<SocialPost> {
  throw new Error("Not implemented");
}
