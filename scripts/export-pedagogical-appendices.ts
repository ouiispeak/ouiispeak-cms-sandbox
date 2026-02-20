#!/usr/bin/env npx tsx
/**
 * Export pedagogical appendices to JSON for LaDy (Layer 5 Reference RAG).
 *
 * LaDy reads data/pedagogical_appendices.json before generating. Run this
 * script to sync CMS table → LaDy file before a batch generation.
 *
 * Usage:
 *   npx tsx scripts/export-pedagogical-appendices.ts [output-path]
 *   npx tsx scripts/export-pedagogical-appendices.ts --target-l1=fr
 *   npx tsx scripts/export-pedagogical-appendices.ts --target-l1 fr [output-path]
 *
 * Options:
 *   --target-l1=fr   Filter to entries for French L1 (or target_l1 IS NULL)
 *   --include-inactive  Include is_active=false entries (default: active only)
 *
 * Default output: LADY_REPO_PATH/data/pedagogical_appendices.json
 * Env: LADY_REPO_PATH, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { loadPedagogicalAppendices } from "../lib/data/pedagogicalAppendices";

function parseArgs(): {
  outputPath: string | null;
  targetL1: string | undefined;
  activeOnly: boolean;
} {
  const args = process.argv.slice(2);
  let outputPath: string | null = null;
  let targetL1: string | undefined;
  let activeOnly = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--target-l1=")) {
      targetL1 = arg.slice("--target-l1=".length).trim() || undefined;
    } else if (arg === "--target-l1" && args[i + 1]) {
      targetL1 = args[++i].trim() || undefined;
    } else if (arg === "--include-inactive") {
      activeOnly = false;
    } else if (!arg.startsWith("-")) {
      outputPath = arg;
    }
  }

  return { outputPath, targetL1, activeOnly };
}

async function main() {
  const { outputPath: outputArg, targetL1, activeOnly } = parseArgs();
  const ladyRepoPath = process.env.LADY_REPO_PATH;
  const defaultPath = ladyRepoPath
    ? resolve(ladyRepoPath, "data", "pedagogical_appendices.json")
    : null;

  const data = await loadPedagogicalAppendices({ activeOnly, targetL1 });
  const json = JSON.stringify(data, null, 2);

  if (outputArg) {
    const outPath = resolve(process.cwd(), outputArg);
    writeFileSync(outPath, json, "utf8");
    console.log(`Exported ${data.entries.length} entries to ${outPath}`);
  } else if (defaultPath) {
    writeFileSync(defaultPath, json, "utf8");
    console.log(`Exported ${data.entries.length} entries to ${defaultPath}`);
  } else {
    process.stdout.write(json);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
