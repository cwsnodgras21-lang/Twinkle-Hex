# Twinkle & Hex

Production-ready web platform for an indie nail polish brand. Built with Next.js 14+, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (database, auth, storage)
- **Deployment:** Vercel

## Project Structure

```
├── app/
│   ├── (customer)/          # Public & customer-facing pages
│   │   ├── shop/
│   │   ├── about/
│   │   ├── account/
│   │   └── community/
│   ├── admin/               # Admin dashboard
│   ├── globals.css
│   └── layout.tsx
├── components/
│   └── layout/              # Header, Footer, AdminSidebar, etc.
├── lib/
│   ├── auth/                # Auth helpers, roles
│   ├── api/                 # Data access layer
│   └── shopify/             # Shopify integration (placeholder)
├── types/
├── hooks/
├── styles/
├── supabase/                # Supabase clients (browser, server, middleware)
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
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Future | Shopify store domain |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Future | Shopify Storefront API token |

## Brand Palette

- **Cyan:** `#4ac3ce`
- **Teal:** `#066782`
- **Ink:** `#2e333f`
- **Plum:** `#59486d`
- **Magenta:** `#cb508f`

## Future Phases

- Customer-facing storefront (product catalog, cart, checkout)
- Admin dashboard (products, orders, customers, inventory)
- Community/forum area
- Shopify integration
- Auth (Supabase) with role-based access
