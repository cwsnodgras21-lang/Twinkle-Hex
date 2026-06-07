/**
 * Retail partners CRUD - Supabase data layer.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { RetailPartner } from "@/types/admin";

function mapRow(row: Record<string, unknown>): RetailPartner {
  return {
    id: row.id as string,
    name: row.name as string,
    contact_email: (row.contact_email as string) ?? undefined,
    contact_phone: (row.contact_phone as string) ?? undefined,
    address: (row.address as string) ?? undefined,
    status: (row.status as RetailPartner["status"]) ?? "active",
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listRetailPartners(): Promise<RetailPartner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("retail_partners")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getRetailPartnerById(id: string): Promise<RetailPartner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("retail_partners")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data != null ? mapRow(data as Record<string, unknown>) : null;
}

export interface CreateRetailPartnerInput {
  name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  status?: RetailPartner["status"];
  notes?: string | null;
}

export async function createRetailPartner(input: CreateRetailPartnerInput): Promise<RetailPartner> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("retail_partners")
    .insert({
      name: input.name,
      contact_email: input.contact_email ?? null,
      contact_phone: input.contact_phone ?? null,
      address: input.address ?? null,
      status: input.status ?? "active",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updateRetailPartner(
  id: string,
  input: Partial<CreateRetailPartnerInput>
): Promise<RetailPartner> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("retail_partners")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.contact_email !== undefined && { contact_email: input.contact_email }),
      ...(input.contact_phone !== undefined && { contact_phone: input.contact_phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
