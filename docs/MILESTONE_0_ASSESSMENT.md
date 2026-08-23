# Milestone 0 — Repository Assessment

Twinkle & Hex Ops is a Next.js 14 + Supabase single-tenant admin app.
There are **no** NolTurn Software Factory artifacts in this repository
(`/canon`, ADRs, capability registry, AGENTS.md, organizational-gravity
standards). Governing constraints for this work:

1. Organizational Gravity / reductive improvement principles from the
   product brief.
2. Existing app conventions in `README.md` and `CHANGES.md` (three
   gravitational centers: Stock, Ingredients, Polishes/Recipes).

**Standards conflict (documented):** Migration `012` and `CHANGES.md`
intentionally *removed* Releases, Batches, and Swatchers as gravity.
Tracey’s stated operational bottleneck requires those capabilities back —
but as a **lean production OS**, not as the old CRM/kanban/marketing suite.
Resolution: reintroduce only operational entities; keep Polishes as a
standalone center (not nested under Releases); derive the work queue from
deadlines instead of a parallel task CRM.

---

## Architecture map (current)

| Layer | What exists |
| --- | --- |
| Routes | `/admin` dashboard, `/admin/inventory`, `/admin/ingredients`, `/admin/polishes`, `/admin/settings`, `/login` |
| Data | `lib/admin/{ingredients,polishes,inventory,users}.ts` |
| Actions | `app/admin/actions.ts`, `app/admin/settings/actions.ts` |
| Auth | Supabase auth + `app_metadata.role = admin`; **login currently disabled** (`ADMIN_LOGIN_DISABLED = true`) |
| Storage | Private `msds-sheets` bucket for SDS PDFs |
| RLS | Admin-only policies (migration 011 / 012); writes often use service-role |
| Tests | **None** (no vitest/jest script) |
| Deploy | Vercel (`vercel.json` present) |

### Canonical tables (post-012 intent)

- `ingredients` (+ `ingredient_msds_documents`)
- `polishes` + `polish_recipe_lines` (free-text `ingredient_name`, amounts in oz)
- `finished_inventory_items` (optional `polish_id`)

### Dropped by 012 (historical — tables no longer in live schema after apply)

releases, batches, swatchers/assignments, community, marketing, Shopify stubs.

**Migration risk:** `012` may not yet be applied to live Supabase. New work
must be additive (`013+`) and tolerate both pre/post-012 naming where
practical; prefer assuming 012 is the code baseline.

---

## Capability map vs Tracey’s needs

### Existing — keep

- Unified ingredients + pigment SDS uploads (storage already exists).
- Standalone polish + recipe editor (oz amounts).
- Finished stock linked to polish.
- Brand palette / admin shell / RLS pattern / single-tenant admin model.

### Partially useful — extend

| Capability | Gap |
| --- | --- |
| Dashboard | Counts stock/recipes; does **not** answer “what next?” |
| Recipes | No versions; no batch-time snapshot; no ingredient FK / eligibility |
| Ingredients | No R&D lifecycle (`experimental` → `approved`); qty tracking optional but unconstrained |
| Auth | Login disabled — open URL risk |

### Missing — required

- Production Command Center (attention + today/this-week queue)
- Release/collection planning with derived deadlines
- Deterministic production planner (workload → workdays)
- Formula version preservation on batches
- R&D lab (prototypes, review dates, promotion gate)
- Swatcher workflow + release risk
- Unified 30–90 day ops calendar
- Core replenishment (defer unless trivial)

---

## Organizational Gravity findings

1. **Prior overbuild then over-cut:** Old app had parallel CRM/community;
   012 removed *too much* for Tracey’s real bottleneck (production lead time).
2. **Dashboard as data display** — metric cards, not decisions.
3. **Recipe ↔ ingredient disconnect** — free-text names prevent eligibility
   and honest material checks; keep free-text allowed, add *optional* FK.
4. **Service-role writes bypass RLS** — existing pattern; do not expand casually;
   keep admin checks on actions.
5. **No test harness** — planning/risk math must be pure functions + tests.
6. **Do not nest polishes under releases again** — that was gravity; use a join.
7. **Do not invent a second task system** — derive actions from deadlines;
   optional thin calendar notes only when needed.
8. **Do not rebuild warehouse ERP** — track ingredients only when meaningful.

### Dangerous rewrite areas

- Do not rename/drop `polishes` / `polish_recipe_lines` / `ingredients` /
  MSDS storage — live recipe and SDS data depend on them.
- Do not re-enable destructive migration edits to 000–012.
- Do not flip `ADMIN_LOGIN_DISABLED` until a real admin user exists.

---

## Proposed reuse

| Need | Reuse |
| --- | --- |
| SDS/pigment docs | `ingredient_msds_documents` + `msds-sheets` |
| Polish identity | `polishes` |
| Current formula | `polish_recipe_lines` as *current* formula |
| Stock | `finished_inventory_items` |
| UI shell | AdminSidebar, AdminPageShell, forms, brand colors |
| Auth/RLS | Same admin JWT claim + `_lock` policy pattern |

## Proposed changes (reductive)

1. Additive migration `013_production_operating_system.sql`.
2. Pure `lib/ops/*` for scaling, deadline derivation, production plan, risk,
   command-center queue generation.
3. Data modules for releases, batches, R&D, swatchers, calendar projection.
4. Replace `/admin` with Command Center; add Releases, R&D, Swatchers, Calendar.
5. “Make Batch” on polish detail with 32 oz default + formula snapshot.
6. Vitest for deterministic ops logic only.

### Intentionally deferred

- Core stock-target replenishment forecasting
- Full ingredient consumption ledger for every batch
- Multi-tenancy, AI agents, Shopify/ecommerce, MRP, purchasing
- Re-enabling admin login (ops note only)

### Explicit defaults (until configurable UI exists)

Documented in `ops_settings` / code constants:

- Default batch: **32 oz**
- Workdays: Mon–Fri
- Lead times from launch (days before): marketing 7, swatch return 21,
  swatcher send 35, production complete 42

---

## Migration risk

| Risk | Mitigation |
| --- | --- |
| 012 not applied live | 013 is additive; docs call out apply 012 then 013 |
| Recreating `releases`/`swatchers` | New lean columns; no community/marketing tables |
| Recipe history | Snapshot JSONB on batch; do not rewrite recipe tables destructively |
| Experimental ingredients in formulas | Eligibility check only when `ingredient_id` set |
