import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const RUNTIME_DIRS = ["app", "lib"] as const;
const SQL_CONTRACT_FILES = ["supabase/manual/009_uuid_identity_reset.sql"] as const;

const FORBIDDEN_LEGACY_KEYS = [
  /\bexternalId\b/,
  /\bmoduleExternalId\b/,
  /\blessonExternalId\b/,
  /\blevel#\b/,
];

const FORBIDDEN_SCOPED_KEYS = [/\b(id|title|subtitle|text|level)(Module|Lesson|Group)\b/];

function listSourceFiles(dir: string): string[] {
  const absoluteDir = path.join(REPO_ROOT, dir);
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(path.join(dir, entry.name)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!/\.(ts|tsx|sql)$/.test(entry.name)) {
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

function findMatches(filePath: string, patterns: RegExp[]): string[] {
  const contents = fs.readFileSync(filePath, "utf8");
  const hits: string[] = [];

  for (const pattern of patterns) {
    const match = contents.match(pattern);
    if (match) {
      hits.push(match[0]);
    }
  }

  return hits;
}

test("runtime contract files reject legacy and scoped key patterns", () => {
  const files = [
    ...RUNTIME_DIRS.flatMap((dir) => listSourceFiles(dir)),
    ...SQL_CONTRACT_FILES.map((file) => path.join(REPO_ROOT, file)),
  ];

  const violations: string[] = [];

  for (const file of files) {
    const legacyHits = findMatches(file, FORBIDDEN_LEGACY_KEYS);
    const scopedHits = findMatches(file, FORBIDDEN_SCOPED_KEYS);
    for (const hit of [...legacyHits, ...scopedHits]) {
      violations.push(`${path.relative(REPO_ROOT, file)} -> ${hit}`);
    }
  }

  assert.equal(
    violations.length,
    0,
    `Legacy/scoped key contract violations found:\n${violations.join("\n")}`
  );
});

test("single canonical mapping boundary exists and is used by hierarchy components", () => {
  const canonicalMapPath = path.join(REPO_ROOT, "lib/canonicalFieldMap.ts");
  assert.equal(fs.existsSync(canonicalMapPath), true, "Missing lib/canonicalFieldMap.ts");

  const modulesSource = fs.readFileSync(path.join(REPO_ROOT, "lib/modules.ts"), "utf8");
  const lessonsSource = fs.readFileSync(path.join(REPO_ROOT, "lib/lessons.ts"), "utf8");
  const groupsSource = fs.readFileSync(path.join(REPO_ROOT, "lib/groups.ts"), "utf8");
  const slidesSource = fs.readFileSync(path.join(REPO_ROOT, "lib/slides.ts"), "utf8");

  assert.match(modulesSource, /CANONICAL_COMPONENT_FIELD_MAP\.modules/);
  assert.match(lessonsSource, /CANONICAL_COMPONENT_FIELD_MAP\.lessons/);
  assert.match(groupsSource, /CANONICAL_COMPONENT_FIELD_MAP\.groups/);
  assert.match(slidesSource, /CANONICAL_COMPONENT_FIELD_MAP\.slides/);
});
