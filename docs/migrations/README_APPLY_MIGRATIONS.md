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

## Migration 002: Performance Indexes (Tier 1.1)

**File:** `002_add_performance_indexes.sql`

**What it does:**
- Creates indexes on foreign keys (slides.lesson_id, slides.group_id, lessons.module_id, lesson_groups.lesson_id)
- Creates composite indexes for ordering (e.g. slides by lesson_id + order_index)
- Uses `IF NOT EXISTS` — safe to run multiple times

**Apply manually via Dashboard:**
1. Supabase Dashboard → SQL Editor → New query
2. Paste the contents of `docs/migrations/002_add_performance_indexes.sql`
3. Run

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

## Migration 006: Fix Delete Lesson Ambiguity

**File:** `006_fix_delete_lesson_ambiguity.sql`

**What it does:** Fixes "column reference 'lesson_id' is ambiguous" in `delete_lesson_transaction`.

## Migration 007: Pedagogical Appendices (Layer 5 RAG)

**File:** `007_create_pedagogical_appendices.sql`

**What it does:**
- Creates `pedagogical_appendices` table for proven anecdotes and teaching tips
- Tagged by `target_type` (node/slice/edge) and `target_key` (canonical_node_key or targetSliceRef)
- LaDy's generator reads these via export script and injects into the prompt

**Apply manually via Dashboard:**
1. Supabase Dashboard → SQL Editor → New query
2. Paste the contents of `docs/migrations/007_create_pedagogical_appendices.sql`
3. Run

## Migration 008: Pedagogical Appendices Enhance (asset_type, is_active, target_l1)

**File:** `008_pedagogical_appendices_enhance.sql`

**What it does:** Adds `asset_type`, `is_active`, `target_l1` to `pedagogical_appendices`. Run after 007. (If 007 was created with the enhanced schema, columns may already exist; `ADD COLUMN IF NOT EXISTS` is safe.)

## Migration 009: Atomic Slide Ordering (ouiispeak-cms audit #1)

**File:** `009_atomic_slide_ordering.sql`

**What it does:**
- Adds `insert_slide_at_index_transaction` — atomically shifts existing slides and inserts a new slide at a given index
- Adds `swap_slides_order_transaction` — atomically swaps `order_index` of two slides in the same group
- Prevents partial failures that corrupt `order_index` when create/reorder were split across multiple updates

**Apply manually via Dashboard:**
1. Supabase Dashboard → SQL Editor → New query
2. Paste the contents of `docs/migrations/009_atomic_slide_ordering.sql`
3. Run

---

## LaDy Ingestion (Phase 2)

Before running the ingestion script:

1. Create a module with slug `incoming` in the CMS (or set `LADY_INGEST_MODULE_SLUG` to an existing module slug)
2. Run migrations 004 and 005
3. Run: `npx tsx scripts/ingest-lady-lesson.ts scripts/sample-lady-lesson.json`
