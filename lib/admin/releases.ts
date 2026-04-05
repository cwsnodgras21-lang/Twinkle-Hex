/**
 * Releases CRUD - Supabase data layer.
 */

import { createClient } from "@/supabase/server";
import type { Release, ReleaseStatus } from "@/types/admin";
import { RELEASE_STATUSES } from "@/types/admin";

function mapRow(row: Record<string, unknown>): Release {
  return {
    id: row.id as string,
    name: row.name as string,
    collection: (row.collection as string) ?? undefined,
    description: (row.description as string) ?? undefined,
    status: (row.status as ReleaseStatus) ?? "concept",
    target_launch_date: (row.target_launch_date as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listReleases(status?: ReleaseStatus): Promise<Release[]> {
  const supabase = await createClient();
  let query = supabase
    .from("releases")
    .select("*")
    .order("target_launch_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getReleaseById(id: string): Promise<Release | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("releases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data ? mapRow(data) : null;
}

export type CreateReleaseInput = Omit<
  Release,
  "id" | "created_at" | "updated_at"
>;

export async function createRelease(input: CreateReleaseInput): Promise<Release> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("releases")
    .insert({
      name: input.name,
      collection: input.collection ?? null,
      description: input.description ?? null,
      status: input.status ?? "concept",
      target_launch_date: input.target_launch_date ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateRelease(
  id: string,
  input: Partial<CreateReleaseInput>
): Promise<Release> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("releases")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.collection !== undefined && { collection: input.collection }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.target_launch_date !== undefined && {
        target_launch_date: input.target_launch_date,
      }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export function getReleaseStatuses(): ReleaseStatus[] {
  return [...RELEASE_STATUSES] as ReleaseStatus[];
}
