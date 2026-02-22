# Setting Up Environment Variables

The application needs Supabase credentials to connect to the database. Optional variables control LaDy ingestion, player links, and feature flags.

**Last updated:** 2025-02-19

---

## Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

Create `.env.local` in the project root (same directory as `package.json`):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Finding credentials:** Supabase Dashboard → Settings → API → Project URL and anon/public key.

---

## Optional Variables

### LaDy Ingestion (scripts)

| Variable | Default | Description |
|----------|---------|-------------|
| `LADY_INGEST_MODULE_SLUG` | `incoming` | Module slug where ingested lessons are placed |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Service role key for scripts that bypass RLS (e.g. creating modules). Find: Dashboard → Settings → API → service_role. **Never commit.** |
| `LADY_REPO_PATH` | — | Path to lesson-compiler-core (for `run-lady-and-ingest.sh`) |
| `LADY_OUTPUT_PATH` | — | Explicit path to LaDy JSON file or directory |
| `LADY_CMS_OUTPUT_DIR` | — | Override CMS output dir when using `LADY_REPO_PATH` |

### Player Integration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_PLAYER_BASE_URL` | (empty) | Base URL for player links (e.g. `http://localhost:3000/lecons/db`) |

Used on edit-lesson, edit-group, edit-slide pages for "View in player" links. When empty, links are hidden.

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_USE_DYNAMIC_FORM` | `false` | Master switch for configuration-driven slide forms |
| `NEXT_PUBLIC_DYNAMIC_FORM_TYPES` | (empty) | Comma-separated slide types (e.g. `text-slide,ai-speak-repeat`). Empty = all types when master is on |
| `NEXT_PUBLIC_ENABLE_DEBUG` | `false` | Enable debug routes (e.g. `/debug/lesson-preview`) |

**Note:** Do not enable `NEXT_PUBLIC_ENABLE_DEBUG` in production.

---

## Example .env.local

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional — LaDy
LADY_INGEST_MODULE_SLUG=incoming

# Optional — Player links
NEXT_PUBLIC_PLAYER_BASE_URL=http://localhost:3000/lecons/db

# Optional — Feature flags
NEXT_PUBLIC_USE_DYNAMIC_FORM=true
NEXT_PUBLIC_ENABLE_DEBUG=false
```

---

## Verify Setup

```bash
npx tsx scripts/verify-slide-config-migration.ts
```

---

## Troubleshooting

- **Variables not loading:** Ensure `.env.local` is in the project root; restart dev server after changes.
- **Client-side access:** Variables used in browser must start with `NEXT_PUBLIC_`.
- **Never commit** `.env.local` (it's in `.gitignore`).
