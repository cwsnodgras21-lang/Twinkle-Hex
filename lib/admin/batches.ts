/**
 * Batches CRUD - Supabase data layer.
 */

import type { Batch } from "@/types/admin";

export async function listBatches(): Promise<Batch[]> {
  return [];
}

export async function getBatchById(id: string): Promise<Batch | null> {
  return null;
}

export async function createBatch(data: Omit<Batch, "id" | "created_at" | "updated_at">): Promise<Batch> {
  throw new Error("Not implemented");
}

export async function updateBatch(id: string, data: Partial<Batch>): Promise<Batch> {
  throw new Error("Not implemented");
}
