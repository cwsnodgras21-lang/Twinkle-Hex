/**
 * Today's Plan checklist — a per-day task list for the ops dashboard.
 */

import { resolveWriteClient, resolveDataClient } from "@/lib/admin/supabase-write";
import type { DailyTask } from "@/types/admin";

function mapRow(row: Record<string, unknown>): DailyTask {
  return {
    id: row.id as string,
    title: row.title as string,
    tag: (row.tag as string) ?? undefined,
    time_label: (row.time_label as string) ?? undefined,
    item_date: row.item_date as string,
    done: Boolean(row.done),
    sort_order: (row.sort_order as number) ?? 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listDailyTasks(from: string, to: string): Promise<DailyTask[]> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("ops_daily_tasks")
    .select("*")
    .gte("item_date", from)
    .lte("item_date", to)
    .order("item_date", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function createDailyTask(input: {
  title: string;
  tag?: string | null;
  time_label?: string | null;
  item_date: string;
}): Promise<DailyTask> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("ops_daily_tasks")
    .insert({
      title: input.title.trim(),
      tag: input.tag ?? null,
      time_label: input.time_label ?? null,
      item_date: input.item_date,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function toggleDailyTask(id: string, done: boolean): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("ops_daily_tasks").update({ done }).eq("id", id);
  if (error) throw error;
}

export async function deleteDailyTask(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("ops_daily_tasks").delete().eq("id", id);
  if (error) throw error;
}
