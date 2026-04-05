/**
 * Community profiles data layer.
 * Where Supabase table community_profiles will be queried.
 * Future: Link to Shopify customer for verified purchaser badge.
 */

import type { CommunityProfile } from "@/types/community";

export async function getProfileByUsername(username: string): Promise<CommunityProfile | null> {
  return null;
}

export async function getProfileByUserId(userId: string): Promise<CommunityProfile | null> {
  return null;
}

export async function createProfile(
  data: Omit<CommunityProfile, "id" | "created_at" | "updated_at">
): Promise<CommunityProfile> {
  throw new Error("Not implemented");
}

export async function updateProfile(
  id: string,
  data: Partial<CommunityProfile>
): Promise<CommunityProfile> {
  throw new Error("Not implemented");
}
