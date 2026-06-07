/**
 * Batches CRUD - Supabase data layer.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { Batch } from "@/types/admin";

function mapRow(row: Record<string, unknown>): Batch {
  return {
    id: row.id as string,
    batch_number: row.batch_number as string,
    product_id: (row.product_id as string) ?? undefined,
    status: (row.status as Batch["status"]) ?? "planned",
    planned_date: (row.planned_date as string) ?? undefined,
    completed_at: (row.completed_at as string) ?? undefined,
    quantity_produced:
      row.quantity_produced != null ? Number(row.quantity_produced) : undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listBatches(): Promise<Batch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .order("planned_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getBatchById(id: string): Promise<Batch | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data != null ? mapRow(data as Record<string, unknown>) : null;
}

export interface CreateBatchInput {
  batch_number: string;
  product_id?: string | null;
  status: Batch["status"];
  planned_date?: string | null;
  completed_at?: string | null;
  quantity_produced?: number | null;
  notes?: string | null;
}

export async function createBatch(input: CreateBatchInput): Promise<Batch> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("batches")
    .insert({
      name: input.batch_number,
      batch_number: input.batch_number,
      product_id: input.product_id ?? null,
      status: input.status ?? "planned",
      planned_date: input.planned_date ?? null,
      completed_at: input.completed_at ?? null,
      quantity_produced: input.quantity_produced ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export interface UpdateBatchInput {
  batch_number?: string;
  product_id?: string | null;
  status?: Batch["status"];
  planned_date?: string | null;
  completed_at?: string | null;
  quantity_produced?: number | null;
  notes?: string | null;
}

export async function updateBatch(id: string, input: UpdateBatchInput): Promise<Batch> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("batches")
    .update({
      ...(input.batch_number !== undefined && { batch_number: input.batch_number }),
      ...(input.product_id !== undefined && { product_id: input.product_id }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.planned_date !== undefined && { planned_date: input.planned_date }),
      ...(input.completed_at !== undefined && { completed_at: input.completed_at }),
      ...(input.quantity_produced !== undefined && {
        quantity_produced: input.quantity_produced,
      }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
