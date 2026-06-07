/**
 * Charity polishes CRUD - Supabase data layer.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { CharityPolish } from "@/types/admin";

function mapRow(row: Record<string, unknown>): CharityPolish {
  return {
    id: row.id as string,
    name: row.name as string,
    product_id: (row.product_id as string) ?? undefined,
    charity_name: row.charity_name as string,
    donation_per_unit:
      row.donation_per_unit != null ? Number(row.donation_per_unit) : undefined,
    total_raised: row.total_raised != null ? Number(row.total_raised) : undefined,
    status: (row.status as CharityPolish["status"]) ?? "active",
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listCharityPolishes(): Promise<CharityPolish[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("charity_polishes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getCharityPolishById(id: string): Promise<CharityPolish | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("charity_polishes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data != null ? mapRow(data as Record<string, unknown>) : null;
}

export interface CreateCharityPolishInput {
  name: string;
  product_id?: string | null;
  charity_name: string;
  donation_per_unit?: number | null;
  total_raised?: number | null;
  status?: CharityPolish["status"];
  notes?: string | null;
}

export async function createCharityPolish(
  input: CreateCharityPolishInput
): Promise<CharityPolish> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("charity_polishes")
    .insert({
      name: input.name,
      product_id: input.product_id ?? null,
      charity_name: input.charity_name,
      donation_per_unit: input.donation_per_unit ?? null,
      total_raised: input.total_raised ?? null,
      status: input.status ?? "active",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updateCharityPolish(
  id: string,
  input: Partial<CreateCharityPolishInput>
): Promise<CharityPolish> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("charity_polishes")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.product_id !== undefined && { product_id: input.product_id }),
      ...(input.charity_name !== undefined && { charity_name: input.charity_name }),
      ...(input.donation_per_unit !== undefined && {
        donation_per_unit: input.donation_per_unit,
      }),
      ...(input.total_raised !== undefined && { total_raised: input.total_raised }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
