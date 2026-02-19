# Applying Migrations to Supabase

## Option 1: Supabase Dashboard (SQL Editor)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Open **SQL Editor**
4. Copy the contents of the migration file (e.g. `004_add_lesson_status_column.sql`)
5. Paste into the editor and click **Run**

## Option 2: Supabase CLI

If you use the Supabase CLI locally:

```bash
supabase db push
```

Or run a specific migration:

```bash
supabase migration up
```

## Migration 004: Lesson Status Column

**File:** `004_add_lesson_status_column.sql`

**What it does:**
- Adds `status` column to `lessons` table with values: `draft`, `waiting_review`, `published`
- Sets default `draft` for existing rows (they remain visible in the CMS)
- Creates index for performance

**Apply manually via Dashboard:**
1. Supabase Dashboard → SQL Editor → New query
2. Paste the contents of `docs/migrations/004_add_lesson_status_column.sql`
3. Run

## Migration 005: Lesson Metadata Column

**File:** `005_add_lesson_metadata_column.sql`

**What it does:**
- Adds `metadata` JSONB column to `lessons` for P7 telemetry loop
- Stores `canonical_node_key`, `run_id`, `lessonSku` (and other keys as needed)
- Creates indexes for querying by `run_id` and `canonical_node_key`

**Apply manually via Dashboard:**
1. Supabase Dashboard → SQL Editor → New query
2. Paste the contents of `docs/migrations/005_add_lesson_metadata_column.sql`
3. Run

---

## LaDy Ingestion (Phase 2)

Before running the ingestion script:

1. Create a module with slug `incoming` in the CMS (or set `LADY_INGEST_MODULE_SLUG` to an existing module slug)
2. Run migrations 004 and 005
3. Run: `npx tsx scripts/ingest-lady-lesson.ts scripts/sample-lady-lesson.json`
