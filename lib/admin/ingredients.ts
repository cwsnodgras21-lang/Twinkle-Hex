/**
 * Ingredients CRUD - Supabase data layer.
 * Replace with actual Supabase queries when tables exist.
 */

import type { Ingredient } from "@/types/admin";

// Placeholder - where Supabase table `ingredients` will be queried
export async function listIngredients(): Promise<Ingredient[]> {
  return [];
}

export async function getIngredientById(id: string): Promise<Ingredient | null> {
  return null;
}

export async function createIngredient(data: Omit<Ingredient, "id" | "created_at" | "updated_at">): Promise<Ingredient> {
  throw new Error("Not implemented");
}

export async function updateIngredient(id: string, data: Partial<Ingredient>): Promise<Ingredient> {
  throw new Error("Not implemented");
}

export async function deleteIngredient(id: string): Promise<void> {
  throw new Error("Not implemented");
}
