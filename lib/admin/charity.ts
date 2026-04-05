/**
 * Charity polishes CRUD - Supabase data layer.
 */

import type { CharityPolish } from "@/types/admin";

export async function listCharityPolishes(): Promise<CharityPolish[]> {
  return [];
}

export async function getCharityPolishById(id: string): Promise<CharityPolish | null> {
  return null;
}

export async function createCharityPolish(data: Omit<CharityPolish, "id" | "created_at" | "updated_at">): Promise<CharityPolish> {
  throw new Error("Not implemented");
}

export async function updateCharityPolish(id: string, data: Partial<CharityPolish>): Promise<CharityPolish> {
  throw new Error("Not implemented");
}
