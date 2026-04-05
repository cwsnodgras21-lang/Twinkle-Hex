/**
 * Events CRUD - Supabase data layer.
 */

import type { Event } from "@/types/admin";

export async function listEvents(): Promise<Event[]> {
  return [];
}

export async function getEventById(id: string): Promise<Event | null> {
  return null;
}

export async function createEvent(data: Omit<Event, "id" | "created_at" | "updated_at">): Promise<Event> {
  throw new Error("Not implemented");
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event> {
  throw new Error("Not implemented");
}
