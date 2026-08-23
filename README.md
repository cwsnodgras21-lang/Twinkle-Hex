# Twinkle & Hex Ops

Internal production operating system for an indie nail polish brand.
Primary question: **What should Tracey do next?**

Still answers the three gravitational centers (stock, ingredients, recipes),
and adds release planning, production batches, R&D, swatchers, and a unified
calendar so production stays ahead of photography and launch.

Built with Next.js 14+, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (database, auth, storage)
- **Deployment:** Vercel
- **Tests:** Vitest (`npm test`) for deterministic ops logic

## Project Structure

```
├── app/admin/
│   ├── page.tsx              # Command Center
│   ├── releases/             # Collections + deadlines
│   ├── polishes/             # Recipes + Make Batch
│   ├── ingredients/          # Materials + SDS + lifecycle
│   ├── rd/                   # R&D prototypes
│   ├── swatchers/            # Swatcher timeline
│   ├── calendar/             # Unified operating calendar
│   ├── inventory/            # Finished stock
│   └── settings/
├── lib/ops/                  # Pure planning/risk/scaling logic
├── lib/admin/                # Supabase data layer
├── docs/                     # Assessment + architecture
└── supabase/migrations/      # 000–013 (apply in order)
```

## Local Development

1. `npm install`
2. `cp .env.example .env.local` and set Supabase keys
3. Apply migrations `012` then `013` in Supabase SQL editor / CLI
4. `npm run dev` → [http://localhost:3000](http://localhost:3000)
5. `npm test` for planning/risk/formula unit tests

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server writes + SDS storage (never expose to browser) |

## Admin Access

`/admin` expects `app_metadata.role = "admin"`. Login enforcement may be
temporarily disabled (`ADMIN_LOGIN_DISABLED` in `lib/auth/admin-check.ts`) —
re-enable once a real admin user exists. See `docs/ARCHITECTURE.md`.

## Brand Palette

- **Cyan:** `#4ac3ce`
- **Teal:** `#066782`
- **Ink:** `#2e333f`
- **Plum:** `#59486d`
- **Magenta:** `#cb508f`

## Docs

- `docs/MILESTONE_0_ASSESSMENT.md` — gap analysis / reuse plan
- `docs/ARCHITECTURE.md` — canonical sources, planning rules, risk rules
- `CHANGES.md` — session history
