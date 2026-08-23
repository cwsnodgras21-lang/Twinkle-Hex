# Twinkle & Hex — Change Log

## Production Operating System (this branch)

Turned the lean stock/ingredients/recipes admin into Tracey’s production OS
without rewriting the gravitational centers.

### Added

- **Command Center** (`/admin`) — needs attention, today, this week, upcoming
  releases with plain-language risk, production plan projection
- **Releases** — collections with launch + derived upstream deadlines
- **Production planner** — deterministic workday batch spreading + reproject
- **Make Batch** on polish detail — 32 oz default, formula version snapshot
- **Ingredient lifecycle** — tracked / experimental / approved / rejected / archived
- **R&D Lab** — prototypes, review dates, explicit approve/reject promotion
- **Swatchers** — assignments with send/return dates and overdue flags
- **Operating calendar** — derived timeline + thin marketing notes
- Migration `013_production_operating_system.sql`
- Vitest suite for scaling, planning, risk, eligibility (`npm test`)
- Docs: `docs/MILESTONE_0_ASSESSMENT.md`, `docs/ARCHITECTURE.md`

### Reused

- `polishes` / `polish_recipe_lines`, `ingredients` + SDS storage, finished stock,
  admin shell, brand palette, admin RLS pattern

### Intentionally not built

- Core replenishment automation, full consumption ledger, multi-tenancy, AI,
  Shopify/ERP, re-enabling admin login

### Apply on live Supabase

1. `012_simplify_to_core_ops.sql` (if not already)
2. `013_production_operating_system.sql`

---

## Prior: Admin simplification

The admin app was rebuilt around exactly three questions:

1. **What do we have in finished stock?**
2. **What do we have in ingredients?**
3. **How is a specific polish made?**

Removed storefront, community, old releases/batches/swatchers/marketing CRM.
See git history for PRs #1–#3. Login enforcement remains temporarily disabled
until a real admin user exists.
