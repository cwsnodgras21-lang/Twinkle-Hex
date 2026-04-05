/**
 * Community channels data layer.
 * Where Supabase table community_channels will be queried.
 */

import type { CommunityChannel } from "@/types/community";

export async function getChannels(): Promise<CommunityChannel[]> {
  return [];
}

export async function getChannelBySlug(slug: string): Promise<CommunityChannel | null> {
  return null;
}

export async function getChannelById(id: string): Promise<CommunityChannel | null> {
  return null;
}

export async function createChannel(
  data: Omit<CommunityChannel, "id" | "created_at" | "updated_at">
): Promise<CommunityChannel> {
  throw new Error("Not implemented");
}

export async function updateChannel(
  id: string,
  data: Partial<CommunityChannel>
): Promise<CommunityChannel> {
  throw new Error("Not implemented");
}
