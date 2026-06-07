/**
 * Social posts CRUD - Supabase data layer.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { SocialPost } from "@/types/admin";

function mapRow(row: Record<string, unknown>): SocialPost {
  return {
    id: row.id as string,
    platform: row.platform as SocialPost["platform"],
    content_type: (row.content_type as string) ?? undefined,
    scheduled_at: (row.scheduled_at as string) ?? undefined,
    published_at: (row.published_at as string) ?? undefined,
    status: (row.status as SocialPost["status"]) ?? "draft",
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listSocialPosts(): Promise<SocialPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getSocialPostById(id: string): Promise<SocialPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function createSocialPost(
  data: Omit<SocialPost, "id" | "created_at" | "updated_at">
): Promise<SocialPost> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data: row, error } = await supabase
    .from("social_posts")
    .insert({
      platform: data.platform ?? "instagram",
      content_type: data.content_type ?? null,
      scheduled_at: data.scheduled_at ?? null,
      published_at: data.published_at ?? null,
      status: data.status ?? "draft",
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(row as Record<string, unknown>);
}

export type UpdateSocialPostInput = Partial<
  Omit<SocialPost, "content_type" | "scheduled_at" | "published_at" | "notes">
> & {
  content_type?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  notes?: string | null;
};

export async function updateSocialPost(
  id: string,
  data: UpdateSocialPostInput
): Promise<SocialPost> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data: row, error } = await supabase
    .from("social_posts")
    .update({
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.content_type !== undefined && { content_type: data.content_type }),
      ...(data.scheduled_at !== undefined && { scheduled_at: data.scheduled_at }),
      ...(data.published_at !== undefined && { published_at: data.published_at }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(row as Record<string, unknown>);
}

export async function deleteSocialPost(id: string): Promise<void> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { error } = await supabase.from("social_posts").delete().eq("id", id);
  if (error) throw error;
}
