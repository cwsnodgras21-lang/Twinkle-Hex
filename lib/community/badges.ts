/**
 * Community badges data layer.
 * Where Supabase table community_badges will be queried.
 * Future: verified_purchaser - check Shopify order history before granting.
 */

import type { CommunityBadge } from "@/types/community";

export async function getBadges(): Promise<CommunityBadge[]> {
  return [];
}

export async function getBadgeById(id: string): Promise<CommunityBadge | null> {
  return null;
}

export async function getBadgesForProfile(profileId: string): Promise<CommunityBadge[]> {
  return [];
}
