/**
 * Events CRUD - Supabase data layer.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { Event } from "@/types/admin";

function mapRow(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    name: row.name as string,
    event_type: (row.event_type as string) ?? undefined,
    start_date: row.start_date as string,
    end_date: (row.end_date as string) ?? undefined,
    location: (row.location as string) ?? undefined,
    booth: (row.booth as string) ?? undefined,
    status: (row.status as Event["status"]) ?? "planned",
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data != null ? mapRow(data as Record<string, unknown>) : null;
}

export interface CreateEventInput {
  name: string;
  event_type?: string | null;
  start_date: string;
  end_date?: string | null;
  location?: string | null;
  booth?: string | null;
  status?: Event["status"];
  notes?: string | null;
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      name: input.name,
      event_type: input.event_type ?? null,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      location: input.location ?? null,
      booth: input.booth ?? null,
      status: input.status ?? "planned",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updateEvent(id: string, input: Partial<CreateEventInput>): Promise<Event> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.event_type !== undefined && { event_type: input.event_type }),
      ...(input.start_date !== undefined && { start_date: input.start_date }),
      ...(input.end_date !== undefined && { end_date: input.end_date }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.booth !== undefined && { booth: input.booth }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
