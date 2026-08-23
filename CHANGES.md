# Twinkle & Hex Admin — Simplification Summary

## What changed

The admin app was rebuilt around exactly three questions:

1. **What do we have in finished stock?**
2. **What do we have in ingredients?**
3. **How is a specific polish made?**

Everything else was removed. What's left is a lean internal ops tool, not a storefront or community platform.

## Removed entirely

- Customer-facing storefront and account pages (`shop`, `about`, `account`) — duplicated the real site at twinklehexpolish.com
- Community forum (channels, posts, replies, moderation, reports) — admin and customer-facing
- Releases (launch planning / kanban board)
- Batches (production run tracking)
- Marketing & Sales: Social posts, Retail Partners, Events, Charity
- Swatchers
- Shopify order/customer/product admin scaffolding (placeholder pages, unused SDK code)

## Restructured around three "gravitational centers"

- **Ingredients** — pigments and supplies merged into a single `ingredients` table/section, split by a `category` field with filter tabs instead of three separate nav items. MSDS document uploads (hazard docs) preserved for pigment-category ingredients.
- **Polishes (Recipes)** — moved out from under Releases to a standalone `/admin/polishes` section. Recipe editing (which ingredients + quantities make a polish) now lives directly on the polish's own page instead of a separate route. Added a `color_hex` field so each polish carries its real swatch color.
- **Finished Stock** — `/admin/inventory` now links each stock item directly to the polish/recipe it came from, instead of an old batch/release reference.

## Visual refresh

Using only the existing brand palette (Cyan `#4ac3ce`, Teal `#066782`, Ink `#2e333f`, Plum `#59486d`, Magenta `#cb508f`):

- Dashboard stat cards with color accents (teal/magenta/plum/cyan)
- Real polish-color swatches on list and detail views
- Magenta-toned low-stock warnings instead of generic red/gray
- Gradient sidebar active-state and wordmark

## Database

- New migration `supabase/migrations/012_simplify_to_core_ops.sql` consolidates ingredients/pigments/supplies into one table, renames `release_polishes` → `polishes` (dropping its `release_id`), adds `polish_id` to finished stock, and drops all now-unused tables (community, releases, batches, social, retail_partners, events, charity, swatchers).
- Historical migration files (000–011) were left untouched — the cleanup is a new forward migration, not an edit to migration history.
- **This migration has not been run against your live Supabase project yet.** It needs to be applied (Supabase SQL editor or CLI) before the schema actually matches the new code. Until then, some queries against removed/renamed tables may fail.

## Admin login — temporarily disabled

Since there were no admin users set up yet, `/admin` was locking everyone out with nothing behind it. Login enforcement is currently **disabled**:

- `lib/auth/admin-check.ts` has a flag, `ADMIN_LOGIN_DISABLED = true`, which makes every access check pass regardless of who's signed in.
- This affects the middleware redirect, the admin layout guard, and server-action checks — the entire app is currently open to anyone with the URL.
- **To re-enable:** set `ADMIN_LOGIN_DISABLED = false` (or remove the flag and restore `return user?.app_metadata?.role === "admin";`) once real admin accounts exist. See `README.md` for how to promote a Supabase user to admin.

## Verification done

- `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass clean.
- Manual click-through against a live Supabase project has **not** been done yet — do this after applying migration 012.

## Pull requests merged

1. **#1 — Strip app down to a lean stock/ingredients/recipes ops tool** (the full restructure above)
2. **#2 — Temporarily disable admin login enforcement**

## Outstanding follow-ups

- [ ] Apply `supabase/migrations/012_simplify_to_core_ops.sql` to the live Supabase project
- [ ] Set up at least one real admin user, then flip `ADMIN_LOGIN_DISABLED` back to `false`
- [ ] Manual click-through of `/admin/inventory`, `/admin/ingredients`, `/admin/polishes` against real data
