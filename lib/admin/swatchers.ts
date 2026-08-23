/**
 * Swatcher workflow — timeline-oriented, release-linked.
 */

import { createClient } from "@/supabase/server";
import { resolveWriteClient } from "@/lib/admin/supabase-write";
import type { Swatcher, SwatcherAssignment, SwatcherAssignmentStatus } from "@/types/admin";

function mapSwatcher(row: Record<string, unknown>): Swatcher {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) ?? undefined,
    social_handle: (row.social_handle as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    active: row.active !== false,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapAssignment(row: Record<string, unknown>): SwatcherAssignment {
  return {
    id: row.id as string,
    swatcher_id: row.swatcher_id as string,
    release_id: row.release_id as string,
    polish_id: (row.polish_id as string) ?? undefined,
    status: (row.status as SwatcherAssignmentStatus) ?? "planned",
    send_by: (row.send_by as string) ?? undefined,
    sent_at: (row.sent_at as string) ?? undefined,
    expected_return_at: (row.expected_return_at as string) ?? undefined,
    returned_at: (row.returned_at as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listSwatchers(): Promise<Swatcher[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("swatchers").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapSwatcher(r as Record<string, unknown>));
}

export async function createSwatcher(input: {
  name: string;
  email?: string | null;
  social_handle?: string | null;
  notes?: string | null;
}): Promise<Swatcher> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("swatchers")
    .insert({
      name: input.name.trim(),
      email: input.email ?? null,
      social_handle: input.social_handle ?? null,
      notes: input.notes ?? null,
      active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSwatcher(data as Record<string, unknown>);
}

export async function updateSwatcher(
  id: string,
  input: Partial<{ name: string; email: string | null; social_handle: string | null; notes: string | null; active: boolean }>
): Promise<Swatcher> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase.from("swatchers").update(input).eq("id", id).select().single();
  if (error) throw error;
  return mapSwatcher(data as Record<string, unknown>);
}

export type AssignmentWithNames = SwatcherAssignment & {
  swatcher_name?: string;
  release_name?: string;
  polish_name?: string;
};

export async function listSwatcherAssignments(releaseId?: string): Promise<AssignmentWithNames[]> {
  const supabase = await createClient();
  let query = supabase
    .from("swatcher_assignments")
    .select("*, swatchers ( name ), releases ( name ), polishes ( name )")
    .order("send_by", { ascending: true, nullsFirst: false });
  if (releaseId) query = query.eq("release_id", releaseId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => {
    const base = mapAssignment(row);
    const sw = row.swatchers as { name?: string } | null;
    const rel = row.releases as { name?: string } | null;
    const pol = row.polishes as { name?: string } | null;
    return {
      ...base,
      swatcher_name: sw?.name,
      release_name: rel?.name,
      polish_name: pol?.name,
    };
  });
}

export async function createSwatcherAssignment(input: {
  swatcher_id: string;
  release_id: string;
  polish_id?: string | null;
  send_by?: string | null;
  expected_return_at?: string | null;
  notes?: string | null;
}): Promise<SwatcherAssignment> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("swatcher_assignments")
    .insert({
      swatcher_id: input.swatcher_id,
      release_id: input.release_id,
      polish_id: input.polish_id ?? null,
      send_by: input.send_by ?? null,
      expected_return_at: input.expected_return_at ?? null,
      notes: input.notes ?? null,
      status: "planned",
    })
    .select()
    .single();
  if (error) throw error;
  return mapAssignment(data as Record<string, unknown>);
}

export async function updateSwatcherAssignment(
  id: string,
  input: Partial<{
    status: SwatcherAssignmentStatus;
    send_by: string | null;
    sent_at: string | null;
    expected_return_at: string | null;
    returned_at: string | null;
    notes: string | null;
    polish_id: string | null;
  }>
): Promise<SwatcherAssignment> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("swatcher_assignments")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapAssignment(data as Record<string, unknown>);
}

export async function deleteSwatcherAssignment(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("swatcher_assignments").delete().eq("id", id);
  if (error) throw error;
}

/** True when any planned assignment's send_by has passed without a sent_at. */
export async function isSwatcherShipmentOverdue(releaseId: string, today: string): Promise<boolean> {
  const assignments = await listSwatcherAssignments(releaseId);
  return assignments.some(
    (a) =>
      a.status === "planned" &&
      !!a.send_by &&
      a.send_by < today &&
      !a.sent_at
  );
}
