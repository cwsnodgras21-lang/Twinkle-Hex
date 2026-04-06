-- Atomically replace all recipe lines for a polish (single transaction).
-- Used by the admin batch "Save recipe" action.

CREATE OR REPLACE FUNCTION replace_polish_recipe_lines(p_polish_id uuid, p_lines jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM polish_recipe_lines WHERE polish_id = p_polish_id;
  IF p_lines IS NOT NULL AND jsonb_typeof(p_lines) = 'array' AND jsonb_array_length(p_lines) > 0 THEN
    INSERT INTO polish_recipe_lines (polish_id, sort_order, ingredient_name, amount_oz)
    SELECT p_polish_id,
           (t.ord - 1)::int,
           trim((t.elem->>'ingredient_name')::text),
           (t.elem->>'amount_oz')::numeric
    FROM jsonb_array_elements(p_lines) WITH ORDINALITY AS t(elem, ord);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION replace_polish_recipe_lines(uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION replace_polish_recipe_lines(uuid, jsonb) TO authenticated;
