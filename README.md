# SUPER QUINIELAS

World Cup 2026 family bracket challenge leaderboard — Next.js 14, Tailwind, Supabase.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # optional: add Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Create a public Storage bucket named `avatars`
4. Copy URL and anon key into `.env.local` (see `.env.local.example`)

Without Supabase, the app runs with static quiniela data; match scores and avatar uploads need Supabase.

## Deploy

### Vercel

1. Run `vercel link` to connect the local project to my Vercel account
2. Run `vercel env add` for each variable in `.env.local.example`
3. Run `vercel --prod` to deploy

### GitHub

The repo is initialized locally on `main` with an initial commit. To publish to GitHub (one-time auth required):

```bash
gh auth login
gh repo create super-quinielas --public --source=. --remote=origin --push --description "SUPER QUINIELAS — World Cup 2026 family bracket challenge leaderboard"
```

### GitHub Actions (auto-deploy on push to `main`)

Add these secrets in your GitHub repo (**Settings → Secrets and variables → Actions**):

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Team/user ID from Vercel project settings |
| `VERCEL_PROJECT_ID` | Project ID from Vercel project settings |

Every push to `main` runs `.github/workflows/deploy.yml` and deploys to Vercel production.

### Environment variables

Copy the example file and fill in your Supabase credentials locally:

```bash
cp .env.local.example .env.local
```

Required variables (see `.env.local.example` for placeholders):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

Never commit `.env.local` — it is gitignored. Add the same variables in Vercel via `vercel env add` or the Vercel dashboard.

## Features

- Animated leaderboard with podium, stat cards, rank changes
- All 27 quinielas with sort/filter/search
- WC 2026 group stage (12 groups, 48 teams) with admin score entry
- Player profiles with share card download
- Spanish/English i18n, dark/light theme, active player cookie
- Mobile bottom nav, PWA manifest
