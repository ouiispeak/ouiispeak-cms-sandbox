#!/usr/bin/env bash
#
# P8 Phase 4: Run LaDy generation, then ingest into CMS.
#
# Usage:
#   ./scripts/run-lady-and-ingest.sh [path-to-lesson.json | path-to-dir]
#
# If path is omitted:
#   1. If LADY_REPO_PATH set: runs LaDy, then npm run emit-release-cms, then batch ingests
#   2. Else uses LADY_OUTPUT_PATH (file or dir)
#
# Env (optional):
#   LADY_REPO_PATH       - Path to lesson-compiler-core (e.g. ../lesson-compiler-core)
#   LADY_OUTPUT_PATH     - Explicit file or dir (skips LaDy run)
#   LADY_CMS_OUTPUT_DIR  - Dir with .cms.json files (default: $LADY_REPO_PATH/scripts/output/cms/<latest-release>)
#
# Examples:
#   ./scripts/run-lady-and-ingest.sh ./scripts/sample-lady-lesson.json
#   ./scripts/run-lady-and-ingest.sh ../lesson-compiler-core/scripts/output/cms/test-run-1
#   LADY_REPO_PATH=../lesson-compiler-core ./scripts/run-lady-and-ingest.sh
#

set -e

CMS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$CMS_ROOT"

# If explicit path given (file or dir), use it and skip LaDy
if [[ -n "$1" ]]; then
  INGEST_PATH="$1"
  if [[ ! -f "$INGEST_PATH" && ! -d "$INGEST_PATH" ]]; then
    echo "Error: Path not found: $INGEST_PATH"
    exit 1
  fi
  echo "Ingesting: $INGEST_PATH"
  npx tsx scripts/ingest-lady-lesson.ts "$INGEST_PATH"
  exit 0
fi

# If explicit output path set (file or dir), use it
if [[ -n "$LADY_OUTPUT_PATH" ]]; then
  if [[ ! -f "$LADY_OUTPUT_PATH" && ! -d "$LADY_OUTPUT_PATH" ]]; then
    echo "Error: LADY_OUTPUT_PATH not found: $LADY_OUTPUT_PATH"
    exit 1
  fi
  echo "Ingesting: $LADY_OUTPUT_PATH"
  npx tsx scripts/ingest-lady-lesson.ts "$LADY_OUTPUT_PATH"
  exit 0
fi

# Run LaDy + emit-release-cms + batch ingest if LADY_REPO_PATH is set
if [[ -n "$LADY_REPO_PATH" ]]; then
  if [[ ! -d "$LADY_REPO_PATH" ]]; then
    echo "Error: LADY_REPO_PATH not found: $LADY_REPO_PATH"
    exit 1
  fi
  echo "Exporting pedagogical appendices (CMS → LaDy)..."
  npx tsx scripts/export-pedagogical-appendices.ts 2>/dev/null || true
  echo "Running LaDy in $LADY_REPO_PATH..."
  (cd "$LADY_REPO_PATH" && node scripts/run-generation.mjs --mode commit 2>/dev/null || true)
  echo "Emitting CMS format..."
  (cd "$LADY_REPO_PATH" && npm run emit-release-cms 2>/dev/null || true)
  CMS_DIR="${LADY_CMS_OUTPUT_DIR}"
  if [[ -z "$CMS_DIR" ]]; then
    # Default: scripts/output/cms/<latest-release>
    LATEST=$(ls -t "$LADY_REPO_PATH/scripts/output/cms" 2>/dev/null | head -1)
    CMS_DIR="$LADY_REPO_PATH/scripts/output/cms/$LATEST"
  fi
  if [[ -d "$CMS_DIR" ]] && ls "$CMS_DIR"/*.json 1>/dev/null 2>&1; then
    echo "Ingesting from $CMS_DIR"
    npx tsx scripts/ingest-lady-lesson.ts "$CMS_DIR"
    exit 0
  fi
  echo "Warning: LaDy ran but no CMS JSON in $CMS_DIR. Run ingest manually with path."
else
  echo "Usage: ./scripts/run-lady-and-ingest.sh [path-to-lesson.json | path-to-dir]"
  echo "   or: LADY_REPO_PATH=../lesson-compiler-core ./scripts/run-lady-and-ingest.sh"
  echo "   or: LADY_OUTPUT_PATH=./path/to/output ./scripts/run-lady-and-ingest.sh"
  exit 1
fi
