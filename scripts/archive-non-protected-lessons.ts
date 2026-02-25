#!/usr/bin/env npx tsx
/**
 * Archive Non-Protected Lessons (Lady/CMS Graph Clean)
 *
 * 1. Deletes all lessons except those in PROTECTED_LESSON_IDS
 * 2. Strips graph metadata (canonical_node_key, run_id, lessonSku, targetSliceRef) from protected lessons
 * 3. Truncates pedagogical_appendices (all entries reference old graph)
 *
 * Usage: npx tsx scripts/archive-non-protected-lessons.ts [--dry-run] [--yes]
 *
 * Env: .env.local with PROTECTED_LESSON_IDS, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { getSupabaseAdmin } from "../lib/supabaseAdmin";

const PROTECTED_IDS = [
  "057d6c22-ebcc-41e9-b2af-c14de4ef9151",
  "22475d69-5bea-403b-9fa5-901bcb654eb2",
];

function getProtectedIds(): Set<string> {
  const raw = process.env.PROTECTED_LESSON_IDS;
  if (!raw || typeof raw !== "string") return new Set(PROTECTED_IDS);
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const yes = process.argv.includes("--yes");

  if (dryRun) {
    console.log("DRY RUN — no changes will be made.\n");
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error(
      "Error: SUPABASE_SERVICE_ROLE_KEY required. Add to .env.local (Supabase Dashboard → Settings → API → service_role)."
    );
    process.exit(1);
  }

  const protectedIds = getProtectedIds();
  console.log("Protected lesson IDs:", [...protectedIds].join(", "));

  // 1. Fetch all lessons
  const { data: lessons, error: fetchError } = await admin
    .from("lessons")
    .select("id, label, metadata");

  if (fetchError) {
    console.error("Failed to fetch lessons:", fetchError.message);
    process.exit(1);
  }

  const toDelete = (lessons ?? []).filter((l) => !protectedIds.has(l.id));
  const toStrip = (lessons ?? []).filter((l) => protectedIds.has(l.id));

  console.log(`\nLessons to delete: ${toDelete.length}`);
  if (toDelete.length > 0) {
    toDelete.forEach((l) => console.log(`  - ${l.id} (${l.label ?? "no label"})`));
  }

  console.log(`\nProtected lessons to strip metadata: ${toStrip.length}`);
  toStrip.forEach((l) => console.log(`  - ${l.id} (${l.label ?? "no label"})`));

  if (!dryRun && (toDelete.length > 0 || toStrip.length > 0)) {
    if (!yes) {
      console.log("\nRun with --yes to apply changes.");
      process.exit(0);
    }
  }

  // 2. Delete non-protected lessons
  if (toDelete.length > 0 && !dryRun) {
    const ids = toDelete.map((l) => l.id);
    const { error: deleteError } = await admin.from("lessons").delete().in("id", ids);

    if (deleteError) {
      console.error("Failed to delete lessons:", deleteError.message);
      process.exit(1);
    }
    console.log(`\nDeleted ${ids.length} lessons.`);
  }

  // 3. Strip metadata on protected lessons
  for (const lesson of toStrip) {
    const meta = (lesson.metadata as Record<string, unknown>) ?? {};
    const hasGraphFields =
      meta.canonical_node_key != null ||
      meta.run_id != null ||
      meta.lessonSku != null ||
      meta.targetSliceRef != null;

    if (!hasGraphFields) continue;

    const stripped = { ...meta };
    delete stripped.canonical_node_key;
    delete stripped.run_id;
    delete stripped.lessonSku;
    delete stripped.targetSliceRef;

    if (!dryRun) {
      const { error: updateError } = await admin
        .from("lessons")
        .update({ metadata: stripped })
        .eq("id", lesson.id);

      if (updateError) {
        console.error(`Failed to strip metadata for ${lesson.id}:`, updateError.message);
      } else {
        console.log(`Stripped metadata for ${lesson.id}`);
      }
    }
  }

  // 4. Truncate pedagogical_appendices
  const { count: paCount } = await admin
    .from("pedagogical_appendices")
    .select("*", { count: "exact", head: true });

  console.log(`\nPedagogical appendices rows: ${paCount ?? 0}`);

  if ((paCount ?? 0) > 0 && !dryRun) {
    const { data: paRows } = await admin.from("pedagogical_appendices").select("id");
    const paIds = (paRows ?? []).map((r) => r.id);
    if (paIds.length > 0) {
      const { error: deleteError } = await admin
        .from("pedagogical_appendices")
        .delete()
        .in("id", paIds);

      if (deleteError) {
        console.error("Failed to truncate pedagogical_appendices:", deleteError.message);
        process.exit(1);
      }
      console.log(`Truncated pedagogical_appendices (${paIds.length} rows).`);
    }
  }

  console.log("\nDone.");
}

main();
