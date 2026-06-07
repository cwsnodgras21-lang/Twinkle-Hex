/**
 * Swatchers & assignments CRUD - Supabase data layer.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { Swatcher, SwatcherAssignment } from "@/types/admin";

function mapSwatcherRow(row: Record<string, unknown>): Swatcher {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) ?? undefined,
    social_handle: (row.social_handle as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapAssignmentRow(row: Record<string, unknown>): SwatcherAssignment {
  return {
    id: row.id as string,
    swatcher_id: row.swatcher_id as string,
    release_id: row.release_id as string,
    shade_name: (row.shade_name as string) ?? undefined,
    status: (row.status as SwatcherAssignment["status"]) ?? "pending",
    sent_at: (row.sent_at as string) ?? undefined,
    feedback_notes: (row.feedback_notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listSwatchers(): Promise<Swatcher[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("swatchers")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapSwatcherRow(row as Record<string, unknown>));
}

export async function getSwatcherById(id: string): Promise<Swatcher | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("swatchers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data != null ? mapSwatcherRow(data as Record<string, unknown>) : null;
}

export interface CreateSwatcherInput {
  name: string;
  email?: string | null;
  social_handle?: string | null;
  notes?: string | null;
}

export async function createSwatcher(input: CreateSwatcherInput): Promise<Swatcher> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("swatchers")
    .insert({
      name: input.name,
      email: input.email ?? null,
      social_handle: input.social_handle ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapSwatcherRow(data as Record<string, unknown>);
}

export async function updateSwatcher(
  id: string,
  input: Partial<CreateSwatcherInput>
): Promise<Swatcher> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("swatchers")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.social_handle !== undefined && { social_handle: input.social_handle }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapSwatcherRow(data as Record<string, unknown>);
}

export async function listAssignmentsByRelease(releaseId: string): Promise<SwatcherAssignment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("swatcher_assignments")
    .select("*")
    .eq("release_id", releaseId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapAssignmentRow(row as Record<string, unknown>));
}

export type CreateAssignmentInput = Omit<
  SwatcherAssignment,
  "id" | "created_at" | "updated_at"
> & {
  shade_name?: string | null;
  sent_at?: string | null;
  feedback_notes?: string | null;
};

export async function createAssignment(input: CreateAssignmentInput): Promise<SwatcherAssignment> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("swatcher_assignments")
    .insert({
      swatcher_id: input.swatcher_id,
      release_id: input.release_id,
      shade_name: input.shade_name ?? null,
      status: input.status ?? "pending",
      sent_at: input.sent_at ?? null,
      feedback_notes: input.feedback_notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapAssignmentRow(data as Record<string, unknown>);
}
