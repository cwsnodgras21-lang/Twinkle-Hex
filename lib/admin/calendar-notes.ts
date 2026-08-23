/**
 * Thin calendar notes — optional marketing milestones only.
 */

import { resolveWriteClient, resolveDataClient } from "@/lib/admin/supabase-write";
import type { OpsCalendarItem, OpsCalendarItemKind } from "@/types/admin";

function mapRow(row: Record<string, unknown>): OpsCalendarItem {
  return {
    id: row.id as string,
    release_id: (row.release_id as string) ?? undefined,
    title: row.title as string,
    item_date: row.item_date as string,
    kind: (row.kind as OpsCalendarItemKind) ?? "marketing",
    notes: (row.notes as string) ?? undefined,
    done: Boolean(row.done),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listCalendarNotes(from: string, to: string): Promise<OpsCalendarItem[]> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("ops_calendar_items")
    .select("*")
    .gte("item_date", from)
    .lte("item_date", to)
    .order("item_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function createCalendarNote(input: {
  title: string;
  item_date: string;
  kind?: OpsCalendarItemKind;
  release_id?: string | null;
  notes?: string | null;
}): Promise<OpsCalendarItem> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("ops_calendar_items")
    .insert({
      title: input.title.trim(),
      item_date: input.item_date,
      kind: input.kind ?? "marketing",
      release_id: input.release_id ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function toggleCalendarNoteDone(id: string, done: boolean): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("ops_calendar_items").update({ done }).eq("id", id);
  if (error) throw error;
}

export async function deleteCalendarNote(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("ops_calendar_items").delete().eq("id", id);
  if (error) throw error;
}
