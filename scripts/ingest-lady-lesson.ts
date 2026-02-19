#!/usr/bin/env npx tsx
/**
 * LaDy Lesson Ingestion Script (P8 — CMS Ingestion, Phase 2)
 *
 * Reads LaDy JSON output and creates Lesson → Groups → Slides in the CMS.
 * Lesson is created with status = waiting_review (visible only on Queued page).
 *
 * Usage: npx tsx scripts/ingest-lady-lesson.ts <path-to-lesson.json>
 *
 * Env:
 *   LADY_INGEST_MODULE_SLUG - Module slug for incoming lessons (default: "incoming")
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY - from .env.local
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { isValidLadyLesson } from "../lib/types/ladyLesson";
import { mapLadyToCms } from "../lib/mappers/ladyToCmsMapper";
import { createLesson, loadLessonOrderIndexesByModule } from "../lib/data/lessons";
import { createGroup } from "../lib/data/groups";
import { createSlide } from "../lib/data/slides";
import { loadModuleBySlug } from "../lib/data/modules";

const MODULE_SLUG = process.env.LADY_INGEST_MODULE_SLUG || "incoming";

function gatherLessonFiles(pathArg: string): string[] {
  const resolved = resolve(pathArg);
  const stat = statSync(resolved);
  if (stat.isFile()) {
    return resolved.endsWith(".json") ? [resolved] : [];
  }
  if (stat.isDirectory()) {
    return readdirSync(resolved)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(resolved, f));
  }
  return [];
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: npx tsx scripts/ingest-lady-lesson.ts <path-to-lesson.json> [path2 ...]");
    console.error("       npx tsx scripts/ingest-lady-lesson.ts <path-to-dir-with-cms-lessons>");
    process.exit(1);
  }

  const files: string[] = [];
  for (const arg of args) {
    files.push(...gatherLessonFiles(arg));
  }

  if (files.length === 0) {
    console.error("No JSON files found.");
    process.exit(1);
  }

  let ok = 0;
  let fail = 0;
  for (const filePath of files) {
    let raw: string;
    try {
      raw = readFileSync(filePath, "utf-8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to read "${filePath}": ${msg}`);
      fail++;
      continue;
    }

    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error(`Invalid JSON in "${filePath}"`);
      fail++;
      continue;
    }

    if (!isValidLadyLesson(data)) {
      console.error(`Invalid LaDy shape in "${filePath}". Required: lessonId, targetNodeIds, slides (type title|text).`);
      fail++;
      continue;
    }

    try {
      await runIngest(data as import("../lib/types/ladyLesson").LadyLessonOutput);
      ok++;
    } catch (e) {
      console.error(`Ingest failed for "${filePath}":`, e);
      fail++;
    }
  }

  if (files.length > 1) {
    console.log(`Batch: ${ok} succeeded, ${fail} failed`);
  }
  if (fail > 0) process.exit(1);
}

async function runIngest(ladyLesson: import("../lib/types/ladyLesson").LadyLessonOutput) {
  // Resolve target module
  const moduleResult = await loadModuleBySlug(MODULE_SLUG);
  if (moduleResult.error || !moduleResult.data) {
    console.error(
      `Module slug "${MODULE_SLUG}" not found. Create a module with slug "${MODULE_SLUG}" or set LADY_INGEST_MODULE_SLUG.`
    );
    console.error(moduleResult.error || "No module found");
    process.exit(1);
  }

  const module_ = moduleResult.data;
  const orderResult = await loadLessonOrderIndexesByModule(module_.id);
  const maxOrder =
    orderResult.data?.reduce((max, n) => Math.max(max, n), 0) ?? 0;
  const nextOrderIndex = maxOrder + 1;

  const { lesson, slideMappings } = mapLadyToCms(
    ladyLesson,
    module_.id,
    module_.slug ?? MODULE_SLUG,
    nextOrderIndex
  );

  // Create lesson
  const lessonResult = await createLesson(lesson);
  if (lessonResult.error || !lessonResult.data) {
    console.error("Failed to create lesson:", lessonResult.error);
    process.exit(1);
  }

  const lessonId = lessonResult.data.id;
  console.log(`Created lesson ${lessonId} (${lesson.label})`);

  let groupCount = 0;
  let slideCount = 0;

  for (const { group, slideTemplates } of slideMappings) {
    const groupResult = await createGroup({
      ...group,
      lesson_id: lessonId,
    });

    if (groupResult.error || !groupResult.data) {
      console.error(`Failed to create group: ${groupResult.error}`);
      process.exit(1);
    }

    groupCount++;
    const groupId = groupResult.data.id;

    for (const template of slideTemplates) {
      const slideResult = await createSlide({
        ...template,
        lesson_id: lessonId,
        group_id: groupId,
      });

      if (slideResult.error || !slideResult.data) {
        console.error(`Failed to create slide: ${slideResult.error}`);
        process.exit(1);
      }
      slideCount++;
    }
  }

  console.log(`Done. Lesson ${lessonId}: ${groupCount} groups, ${slideCount} slides.`);
  console.log("View on Queued page: /queued");
}

main();
