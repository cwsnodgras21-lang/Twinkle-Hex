/**
 * Supplies CRUD - Supabase data layer.
 */

import type { Supply } from "@/types/admin";

export async function listSupplies(): Promise<Supply[]> {
  return [];
}

export async function getSupplyById(id: string): Promise<Supply | null> {
  return null;
}

export async function createSupply(data: Omit<Supply, "id" | "created_at" | "updated_at">): Promise<Supply> {
  throw new Error("Not implemented");
}

export async function updateSupply(id: string, data: Partial<Supply>): Promise<Supply> {
  throw new Error("Not implemented");
}

export async function deleteSupply(id: string): Promise<void> {
  throw new Error("Not implemented");
}
