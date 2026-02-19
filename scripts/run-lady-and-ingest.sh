#!/usr/bin/env bash
#
# P8 Phase 4: Run LaDy generation, then ingest into CMS.
#
# Usage:
#   ./scripts/run-lady-and-ingest.sh [path-to-lesson.json]
#
# If path-to-lesson.json is omitted:
#   1. Runs LaDy (if LADY_REPO_PATH is set)
#   2. Uses LADY_OUTPUT_PATH or first .json in LADY_OUTPUT_DIR
#
# Env (optional):
#   LADY_REPO_PATH     - Path to lesson-compiler-core (e.g. ../lesson-compiler-core)
#   LADY_OUTPUT_DIR    - Where LaDy writes output (e.g. releases/ or out/)
#   LADY_OUTPUT_PATH   - Explicit path to a specific JSON file (skips LaDy run)
#
# Examples:
#   LADY_OUTPUT_PATH=./sample.json ./scripts/run-lady-and-ingest.sh
#   ./scripts/run-lady-and-ingest.sh ./scripts/sample-lady-lesson.json
#   LADY_REPO_PATH=../lesson-compiler-core LADY_OUTPUT_DIR=releases ./scripts/run-lady-and-ingest.sh
#

set -e

CMS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$CMS_ROOT"

# If explicit path given, use it and skip LaDy
if [[ -n "$1" ]]; then
  JSON_PATH="$1"
  if [[ ! -f "$JSON_PATH" ]]; then
    echo "Error: File not found: $JSON_PATH"
    exit 1
  fi
  echo "Ingesting: $JSON_PATH"
  npx tsx scripts/ingest-lady-lesson.ts "$JSON_PATH"
  exit 0
fi

# If explicit output path set, use it
if [[ -n "$LADY_OUTPUT_PATH" ]]; then
  if [[ ! -f "$LADY_OUTPUT_PATH" ]]; then
    echo "Error: LADY_OUTPUT_PATH not found: $LADY_OUTPUT_PATH"
    exit 1
  fi
  echo "Ingesting: $LADY_OUTPUT_PATH"
  npx tsx scripts/ingest-lady-lesson.ts "$LADY_OUTPUT_PATH"
  exit 0
fi

# Try to run LaDy if LADY_REPO_PATH is set
if [[ -n "$LADY_REPO_PATH" ]]; then
  if [[ ! -d "$LADY_REPO_PATH" ]]; then
    echo "Error: LADY_REPO_PATH not found: $LADY_REPO_PATH"
    exit 1
  fi
  echo "Running LaDy in $LADY_REPO_PATH..."
  (cd "$LADY_REPO_PATH" && node scripts/run-generation.mjs --mode commit 2>/dev/null || true)
  OUTPUT_DIR="${LADY_OUTPUT_DIR:-$LADY_REPO_PATH/releases}"
  if [[ -d "$OUTPUT_DIR" ]]; then
    # Use most recently modified .json file (ls -t = sort by mtime, newest first)
    JSON_PATH=$(ls -t "$OUTPUT_DIR"/*.json 2>/dev/null | head -1)
    if [[ -n "$JSON_PATH" && -f "$JSON_PATH" ]]; then
      echo "Ingesting latest output: $JSON_PATH"
      npx tsx scripts/ingest-lady-lesson.ts "$JSON_PATH"
      exit 0
    fi
  fi
  echo "Warning: LaDy ran but no JSON found in $OUTPUT_DIR. Run ingest manually with path."
else
  echo "Usage: ./scripts/run-lady-and-ingest.sh <path-to-lesson.json>"
  echo "   or: LADY_REPO_PATH=../lesson-compiler-core ./scripts/run-lady-and-ingest.sh"
  echo "   or: LADY_OUTPUT_PATH=./path/to/output.json ./scripts/run-lady-and-ingest.sh"
  exit 1
fi
