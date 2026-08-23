# Twinkle & Hex Ops

A lean internal admin tool for an indie nail polish brand. It answers three
questions and nothing else: what's in finished stock, what's in ingredients
(raw materials, pigments, and supplies), and how each polish is made.
Built with Next.js 14+, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (database, auth, storage)
- **Deployment:** Vercel

## Project Structure

The app is organized around its three gravitational centers — Stock,
Ingredients, and Polishes/Recipes — instead of one route per sub-feature.

```
├── app/
│   ├── admin/
│   │   ├── page.tsx          # Dashboard: stock, low ingredients, recent recipes
│   │   ├── inventory/        # Finished Stock
│   │   ├── ingredients/      # Ingredients (raw materials, pigments, supplies)
│   │   ├── polishes/         # Polishes — recipe lives on the polish's own page
│   │   ├── settings/         # Admin user management
│   │   └── actions.ts        # Server actions for all three areas
│   ├── login/                # Admin sign-in
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Redirects to /admin
├── components/
│   ├── admin/
│   │   ├── ingredients/      # IngredientForm, MsdsDocumentsPanel
│   │   ├── inventory/        # InventoryForm
│   │   ├── polishes/         # PolishForm, RecipeEditor, PolishDetail, PolishSwatch
│   │   └── ...                # Shared shell components (AdminPageShell, TableShell, ...)
│   └── layout/                # AdminSidebar
├── lib/
│   ├── admin/                 # Data layer: ingredients.ts, polishes.ts, inventory.ts
│   └── auth/                  # Auth helpers, roles
├── types/
│   └── admin.ts                # Ingredient, Polish, PolishRecipeLine, FinishedInventoryItem
├── hooks/
├── supabase/                   # Supabase clients (browser, server, middleware) + migrations
└── public/
```

## Local Development

> **Note:** If you encounter path issues on Windows (e.g. folder names with `&`), consider cloning or moving the project to a path without special characters (e.g. `twinkle-hex`).

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your Supabase URL and anon key.

3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Vercel Deployment

1. **Connect your repo** to Vercel (GitHub, GitLab, or Bitbucket).

2. **Add environment variables** in Vercel Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Deploy:**
   - Push to your main branch for automatic deploys, or
   - Run `vercel` from the project root for manual deploy.

4. **Build command:** `npm run build` (default)
5. **Output directory:** `.next` (Next.js default)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key used for admin writes and MSDS storage. **Never** expose this to the browser. |

## Admin Access

`/admin` requires a signed-in Supabase user whose JWT carries an
`app_metadata.role = "admin"` claim. `app_metadata` can only be written with
the service-role key, so it can't be self-granted by a user - promote
yourself in the Supabase SQL editor:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email = 'you@example.com';
```

Then run the migrations in `supabase/migrations/` against your project (SQL
editor or CLI), in numeric order. `011_admin_role_rls.sql` locks every admin
table's Row Level Security down to that claim, replacing the earlier MVP
policies that allowed full read/write access to anyone holding the public
anon key. `012_simplify_to_core_ops.sql` folds ingredients/pigments/supplies
into one `ingredients` table, drops the Releases/Batches/Marketing/Community
tables, and repoints finished stock and polishes accordingly.

Sign in at `/login`. There is no public self-serve signup for admin - create
additional users via the Supabase dashboard (Authentication → Users → Invite)
and promote them with the SQL above.

## Brand Palette

- **Cyan:** `#4ac3ce`
- **Teal:** `#066782`
- **Ink:** `#2e333f`
- **Plum:** `#59486d`
- **Magenta:** `#cb508f`

