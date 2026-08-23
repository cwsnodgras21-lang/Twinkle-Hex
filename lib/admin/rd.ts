/**
 * R&D prototypes — structurally separate from production batches.
 * Approving a prototype promotes the linked ingredient to `approved`.
 */

import { resolveWriteClient, resolveDataClient } from "@/lib/admin/supabase-write";
import { updateIngredient } from "@/lib/admin/ingredients";
import type { RdPrototype, RdPrototypeStatus } from "@/types/admin";

function mapRow(row: Record<string, unknown>): RdPrototype {
  return {
    id: row.id as string,
    name: row.name as string,
    ingredient_id: (row.ingredient_id as string) ?? undefined,
    start_date: row.start_date as string,
    review_date: (row.review_date as string) ?? undefined,
    observation_notes: (row.observation_notes as string) ?? undefined,
    status: (row.status as RdPrototypeStatus) ?? "in_progress",
    outcome_notes: (row.outcome_notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listRdPrototypes(): Promise<
  Array<RdPrototype & { ingredient_name?: string; ingredient_lifecycle?: string }>
> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("rd_prototypes")
    .select("*, ingredients ( name, lifecycle_status )")
    .order("review_date", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  if (error) {
    console.error("listRdPrototypes", error.message, error.code, error.details, error.hint);
    throw error;
  }
  return (data ?? []).map((row: Record<string, unknown>) => {
    const base = mapRow(row);
    const ing = row.ingredients as { name?: string; lifecycle_status?: string } | null;
    return {
      ...base,
      ingredient_name: ing?.name,
      ingredient_lifecycle: ing?.lifecycle_status,
    };
  });
}

export async function getRdPrototype(id: string): Promise<
  (RdPrototype & { ingredient_name?: string; ingredient_lifecycle?: string }) | null
> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("rd_prototypes")
    .select("*, ingredients ( name, lifecycle_status )")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  if (!data) return null;
  const row = data as Record<string, unknown>;
  const base = mapRow(row);
  const ing = row.ingredients as { name?: string; lifecycle_status?: string } | null;
  return { ...base, ingredient_name: ing?.name, ingredient_lifecycle: ing?.lifecycle_status };
}

export type CreateRdInput = {
  name: string;
  ingredient_id?: string | null;
  start_date?: string;
  review_date?: string | null;
  observation_notes?: string | null;
};

export async function createRdPrototype(input: CreateRdInput): Promise<RdPrototype> {
  const supabase = await resolveWriteClient();

  // Starting R&D on an ingredient marks it experimental if still tracked.
  if (input.ingredient_id) {
    const { data: ing } = await supabase
      .from("ingredients")
      .select("lifecycle_status")
      .eq("id", input.ingredient_id)
      .single();
    if (ing && (ing as { lifecycle_status: string }).lifecycle_status === "tracked") {
      await updateIngredient(input.ingredient_id, { lifecycle_status: "experimental" });
    }
  }

  const { data, error } = await supabase
    .from("rd_prototypes")
    .insert({
      name: input.name.trim(),
      ingredient_id: input.ingredient_id ?? null,
      start_date: input.start_date ?? new Date().toISOString().slice(0, 10),
      review_date: input.review_date ?? null,
      observation_notes: input.observation_notes ?? null,
      status: "in_progress",
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export type UpdateRdInput = {
  name?: string;
  review_date?: string | null;
  observation_notes?: string | null;
  outcome_notes?: string | null;
  status?: RdPrototypeStatus;
};

export async function updateRdPrototype(id: string, input: UpdateRdInput): Promise<RdPrototype> {
  const supabase = await resolveWriteClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.review_date !== undefined) patch.review_date = input.review_date;
  if (input.observation_notes !== undefined) patch.observation_notes = input.observation_notes;
  if (input.outcome_notes !== undefined) patch.outcome_notes = input.outcome_notes;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase.from("rd_prototypes").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

/**
 * Explicit promotion: approve prototype → ingredient.lifecycle_status = approved.
 * Reject → ingredient rejected. Never silent.
 */
export async function resolveRdPrototype(
  id: string,
  outcome: "approved" | "rejected",
  outcomeNotes?: string | null
): Promise<RdPrototype> {
  const existing = await getRdPrototype(id);
  if (!existing) throw new Error("Prototype not found");
  if (existing.status !== "in_progress") throw new Error("Prototype already resolved");

  const updated = await updateRdPrototype(id, {
    status: outcome,
    outcome_notes: outcomeNotes ?? null,
  });

  if (existing.ingredient_id) {
    await updateIngredient(existing.ingredient_id, {
      lifecycle_status: outcome === "approved" ? "approved" : "rejected",
    });
  }

  return updated;
}

export async function deleteRdPrototype(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("rd_prototypes").delete().eq("id", id);
  if (error) throw error;
}
