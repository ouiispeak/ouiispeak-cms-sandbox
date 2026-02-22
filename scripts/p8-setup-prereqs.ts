#!/usr/bin/env npx tsx
/**
 * P8 Phase 0: Ensure prerequisites for LaDy ingestion
 *
 * - Creates module with slug "incoming" if it doesn't exist
 * - Prints reminder to run migrations 004 and 005 if not yet applied
 *
 * Usage: npx tsx scripts/p8-setup-prereqs.ts
 *
 * Env: LADY_INGEST_MODULE_SLUG (optional, default: "incoming")
 */

import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { loadModuleBySlug, createModule } from "../lib/data/modules";
import { getSupabaseAdmin } from "../lib/supabaseAdmin";

const MODULE_SLUG = process.env.LADY_INGEST_MODULE_SLUG || "incoming";

async function main() {
  console.log(`P8 Setup: Ensuring module "${MODULE_SLUG}" exists...\n`);

  // Use admin client when available (finds modules created via SQL that RLS hides from anon)
  const adminClient = getSupabaseAdmin();
  const existing = await loadModuleBySlug(MODULE_SLUG, adminClient ?? undefined);

  if (existing.data) {
    console.log(`✓ Module "${MODULE_SLUG}" already exists (id: ${existing.data.id})`);
    console.log(`  Label: ${existing.data.label}`);
    return;
  }

  if (existing.error && !existing.error.includes("No module found")) {
    console.error(`Error checking module: ${existing.error}`);
    process.exit(1);
  }

  console.log(`Creating module "${MODULE_SLUG}"...`);

  const { data, error } = await createModule(
    {
      label: "Incoming (LaDy)",
      title: "Incoming",
      slug: MODULE_SLUG,
      level: "A0",
      order_index: 9999,
    },
    adminClient ?? undefined
  );

  if (error) {
    if (error.includes("duplicate key") && error.includes("modules_slug_key")) {
      // Module was created via SQL or another process; treat as success
      const refetch = await loadModuleBySlug(MODULE_SLUG, adminClient ?? undefined);
      if (refetch.data) {
        console.log(`✓ Module "${MODULE_SLUG}" already exists (id: ${refetch.data.id})`);
        return;
      }
    }
    console.error(`Failed to create module: ${error}`);
    if (error.includes("row-level security") && !adminClient) {
      console.error(`
RLS is blocking the insert. Add your Supabase service role key to .env.local:
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

Find it: Supabase Dashboard → Settings → API → service_role (secret)
`);
    }
    process.exit(1);
  }

  console.log(`✓ Created module "${MODULE_SLUG}" (id: ${data!.id})`);

  console.log(`
Before ingesting, ensure migrations 004 and 005 are applied:
  1. Supabase Dashboard → SQL Editor
  2. Run docs/migrations/004_add_lesson_status_column.sql
  3. Run docs/migrations/005_add_lesson_metadata_column.sql

Then run: npx tsx scripts/ingest-lady-lesson.ts <path-to-lesson.json>
`);
}

main();
