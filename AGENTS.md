<!-- OMC:START -->
<!-- OMC:VERSION:1.0.0 -->

# UIT Knowledge — Repo Guide

Vanilla HTML/CSS/JS static landing page + Supabase back-end. No framework, no build step beyond env injection.

## Project Structure

```
index.html  →  styles.css  +  script.js       # Landing page (public)
helloworld.html  →  helloworld.css   +  helloworld.js         # Admin panel (hardened, Supabase Auth-gated CRUD)
supabase.js                                    # Supabase client config (GENERATED — see below)
schema.sql                                     # Full DB schema & RLS policies
replace-env.js                                 # Build-time env injector
verify-animations.mjs                          # Smoke-test runner
DESIGN_merged.md                               # Authoritative design source
```

## Key Files

- **`supabase.js`** — `replace-env.js` overwrites `SUPABASE_URL`/`SUPABASE_ANON_KEY` in-place via regex. Do NOT manually edit the injected values; change `.env` then re-run `npm run build`.
- **`.env`** — Contains Supabase anon credentials (NOT a service-role secret). It's gitignored but present locally. Handle env changes with care.
- **`DESIGN_merged.md`** — Authoritative design reference. Montserrat font, accent `#3ecf8e`, light/dark mode. The file `design-system/uit-knowledge/MASTER.md` appears stale/alternate — prefer `DESIGN_merged.md` when in doubt.
- **`styles.css.bak`** — Stale backup, not in use. Delete if cleanup is on the roadmap.

## Database (Supabase)

- **Tables** in `schema.sql`: `videos`, `courses`, `merch`, `audit_logs`
- **RLS**: `SELECT` public for all, `ALL` gated to `authenticated` role
- **Storage buckets**: `courses`, `merch` — public read, authenticated write

## Commands

| Command | What it does |
|---|---|
| `npm run dev` / `npm start` | `npx -y serve .` (static file server) |
| `npm run build` | `node replace-env.js` (injects env into `supabase.js`) |
| `node verify-animations.mjs` | Quick smoke test (file existence, CSS/JS syntax, key class checks) |
| `vercel.json` | Edge headers, rewrites (/admin → /helloworld), security policies |

No lint, type-check, or test framework discovered. `verify-animations.mjs` is your best signal for a focused pre-commit check.

## Agent Tooling

`.agent/` contains Antigravity Kit (AI agent tooling), not app source. Do not modify unless the task explicitly targets agent configuration.

## Design Rules

- **Font**: Montserrat (headings), system sans-serif (body)
- **Accent**: `#3ecf8e` (green)
- **Mode**: light/dark via `prefers-color-scheme` — UI elements should toggle appropriately
- **Source of truth**: `DESIGN_merged.md`

<!-- OMC:END -->
