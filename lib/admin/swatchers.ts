/**
 * Swatchers & assignments CRUD - Supabase data layer.
 */

import type { Swatcher, SwatcherAssignment } from "@/types/admin";

export async function listSwatchers(): Promise<Swatcher[]> {
  return [];
}

export async function getSwatcherById(id: string): Promise<Swatcher | null> {
  return null;
}

export async function createSwatcher(data: Omit<Swatcher, "id" | "created_at" | "updated_at">): Promise<Swatcher> {
  throw new Error("Not implemented");
}

export async function listAssignmentsByRelease(releaseId: string): Promise<SwatcherAssignment[]> {
  return [];
}

export async function createAssignment(data: Omit<SwatcherAssignment, "id" | "created_at" | "updated_at">): Promise<SwatcherAssignment> {
  throw new Error("Not implemented");
}
