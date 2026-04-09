#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const SOURCE_DIRS = ["app", "lib"];
const EXTENSIONS = new Set([".ts", ".tsx"]);

const APPROVED_BOUNDARY_FILES = new Set([path.join("lib", "activitySlides.ts")]);

const FORBIDDEN_PATTERNS = [
  {
    label: 'direct RPC call "import_activity_slides_create_atomic"',
    pattern: /import_activity_slides_create_atomic/g,
  },
  {
    label: 'direct RPC call "import_activity_slides_update_atomic"',
    pattern: /import_activity_slides_update_atomic/g,
  },
  {
    label: 'direct table write reference "activity_slides"',
    pattern: /\b(createCoreRow|updateCoreRow|ensureCoreRowExists)\s*\(\s*["'`]activity_slides["'`]/g,
  },
  {
    label: 'direct table write reference "activity_slide_field_values"',
    pattern: /\bupsertDynamicFieldRows\s*\(\s*["'`]activity_slide_field_values["'`]/g,
  },
  {
    label: 'direct REST path write reference "/rest/v1/activity_slides"',
    pattern: /\/rest\/v1\/activity_slides\b/g,
  },
  {
    label: 'direct REST path write reference "/rest/v1/activity_slide_field_values"',
    pattern: /\/rest\/v1\/activity_slide_field_values\b/g,
  },
];

function listFiles(dirRelative) {
  const absolute = path.join(REPO_ROOT, dirRelative);
  if (!fs.existsSync(absolute)) {
    return [];
  }

  const files = [];
  const stack = [absolute];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absoluteEntry = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absoluteEntry);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (!EXTENSIONS.has(path.extname(entry.name))) {
        continue;
      }

      files.push(absoluteEntry);
    }
  }

  return files;
}

function toRelative(absolutePath) {
  return path.relative(REPO_ROOT, absolutePath);
}

const sourceFiles = SOURCE_DIRS.flatMap((dir) => listFiles(dir));
const violations = [];

for (const absoluteFilePath of sourceFiles) {
  const relativeFilePath = toRelative(absoluteFilePath);
  const source = fs.readFileSync(absoluteFilePath, "utf8");
  const isApprovedBoundaryFile = APPROVED_BOUNDARY_FILES.has(relativeFilePath);

  for (const { label, pattern } of FORBIDDEN_PATTERNS) {
    const matches = source.match(pattern);
    if (!matches || matches.length === 0) {
      continue;
    }

    if (isApprovedBoundaryFile) {
      continue;
    }

    violations.push({
      file: relativeFilePath,
      label,
      count: matches.length,
    });
  }
}

if (violations.length > 0) {
  console.error("Activity RPC boundary violations found:");
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.label} (${violation.count})`);
  }
  process.exit(1);
}

console.log("Activity RPC boundary check passed.");
