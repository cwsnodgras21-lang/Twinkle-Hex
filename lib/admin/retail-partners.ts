/**
 * Retail partners CRUD - Supabase data layer.
 */

import type { RetailPartner } from "@/types/admin";

export async function listRetailPartners(): Promise<RetailPartner[]> {
  return [];
}

export async function getRetailPartnerById(id: string): Promise<RetailPartner | null> {
  return null;
}

export async function createRetailPartner(data: Omit<RetailPartner, "id" | "created_at" | "updated_at">): Promise<RetailPartner> {
  throw new Error("Not implemented");
}

export async function updateRetailPartner(id: string, data: Partial<RetailPartner>): Promise<RetailPartner> {
  throw new Error("Not implemented");
}
