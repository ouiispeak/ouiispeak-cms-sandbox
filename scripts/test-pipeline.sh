#!/usr/bin/env bash
#
# Pipeline Test Suite — Validation Before Build Plan
#
# Runs Tier D (per-component tests) and Tier B/C (Lady → CMS → ouiispeak pipeline).
#
# Usage:
#   ./scripts/test-pipeline.sh [--tier-d-only | --tier-b-only | --skip-ingest]
#
# Prerequisites:
#   - Lady (lesson-compiler-core): npm install, data/graphStore.json present
#   - CMS: Supabase configured, migrations 004–009 applied, module "incoming" exists
#   - ouiispeak: NEXT_PUBLIC_USE_CMS_CONTENT=true, CMS API URL in .env.local
#
# Env (optional):
#   LADY_REPO_PATH    - Path to lesson-compiler-core (default: ../lesson-compiler-core from CMS root)
#   LADY_INGEST_MODULE_SLUG - Module slug (default: incoming)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# Resolve Lady path: env > ../Lady/lesson-compiler-core > ../lesson-compiler-core > ../../Desktop/Lady/lesson-compiler-core
resolve_lady() {
  [ -n "$LADY_REPO_PATH" ] && [ -d "$LADY_REPO_PATH" ] && echo "$LADY_REPO_PATH" && return
  for p in "$CMS_ROOT/../Lady/lesson-compiler-core" "$CMS_ROOT/../lesson-compiler-core" "$CMS_ROOT/../../Desktop/Lady/lesson-compiler-core"; do
    [ -d "$p" ] && echo "$p" && return
  done
  echo ""
}
LADY_PATH="$(resolve_lady)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

run_tier_d=true
run_tier_b=true
skip_ingest=false

for arg in "$@"; do
  case "$arg" in
    --tier-d-only) run_tier_b=false ;;
    --tier-b-only) run_tier_d=false ;;
    --skip-ingest) skip_ingest=true ;;
  esac
done

echo "============================================================"
echo "Pipeline Test Suite — Validation Before Build Plan"
echo "============================================================"

# --- Tier D: Per-Component Tests ---
if [ "$run_tier_d" = true ]; then
  echo ""
  echo "--- Tier D: Per-Component Tests ---"

  # Lady
  if [ -d "$LADY_PATH" ]; then
    echo ""
    echo "[Lady] Running tests..."
    (cd "$LADY_PATH" && npm run build 2>/dev/null) && echo -e "${GREEN}✓ Lady build${NC}" || echo -e "${RED}✗ Lady build failed${NC}"
    (cd "$LADY_PATH" && npm run test-enrichment 2>/dev/null) && echo -e "${GREEN}✓ test-enrichment${NC}" || echo -e "${RED}✗ test-enrichment failed${NC}"
    (cd "$LADY_PATH" && npm run test-telemetry 2>/dev/null) && echo -e "${GREEN}✓ test-telemetry${NC}" || echo -e "${RED}✗ test-telemetry failed${NC}"
    (cd "$LADY_PATH" && npm run test-generator-config 2>/dev/null) && echo -e "${GREEN}✓ test-generator-config${NC}" || echo -e "${RED}✗ test-generator-config failed${NC}"
    (cd "$LADY_PATH" && npm run test-idempotency 2>/dev/null) && echo -e "${GREEN}✓ test-idempotency${NC}" || echo -e "${RED}✗ test-idempotency failed${NC}"
    (cd "$LADY_PATH" && npm run test-slice-resolution 2>/dev/null) && echo -e "${GREEN}✓ test-slice-resolution${NC}" || echo -e "${RED}✗ test-slice-resolution failed${NC}"
    (cd "$LADY_PATH" && npm run test-reservation 2>/dev/null) && echo -e "${GREEN}✓ test-reservation${NC}" || echo -e "${RED}✗ test-reservation failed${NC}"
    (cd "$LADY_PATH" && npm run test-review-queue 2>/dev/null) && echo -e "${GREEN}✓ test-review-queue${NC}" || echo -e "${RED}✗ test-review-queue failed${NC}"
  else
    echo -e "${YELLOW}[Lady] LADY_REPO_PATH not set or not found, skipping Lady tests${NC}"
  fi

  # ouiispeak
  OUIISPEAK_PATH="$(cd "$CMS_ROOT/../ouiispeak" 2>/dev/null || echo "")"
  if [ -d "$OUIISPEAK_PATH" ]; then
    echo ""
    echo "[ouiispeak] Running tests..."
    (cd "$OUIISPEAK_PATH" && npm test 2>/dev/null) && echo -e "${GREEN}✓ ouiispeak tests${NC}" || echo -e "${YELLOW}⚠ ouiispeak tests had failures (see output)${NC}"
  fi

  # ouiispeak-cms
  echo ""
  echo "[ouiispeak-cms] Running build..."
  (cd "$CMS_ROOT" && npm run build 2>/dev/null) && echo -e "${GREEN}✓ CMS build${NC}" || echo -e "${RED}✗ CMS build failed${NC}"
fi

# --- Tier B/C: Short Pipeline ---
if [ "$run_tier_b" = true ] && [ -d "$LADY_PATH" ]; then
  echo ""
  echo "--- Tier B: Short Pipeline (Lady → CMS) ---"

  # 1. Lady: golden run (or use existing release)
  echo ""
  echo "[1/4] Lady: golden-run..."
  if (cd "$LADY_PATH" && LADY_REFINEMENT_PHASE=1 npm run golden-run 2>/dev/null); then
    echo -e "${GREEN}✓ golden-run${NC}"
  else
    echo -e "${YELLOW}⚠ golden-run (may have been already_installed)${NC}"
  fi

  # 2. Lady: emit CMS format
  echo ""
  echo "[2/4] Lady: emit-release-cms..."
  RELEASE_DIR=""
  if [ -d "$LADY_PATH/releases" ]; then
    RELEASE_DIR=$(ls -t "$LADY_PATH/releases" 2>/dev/null | head -1)
    # Prefer release with lessons/
    for d in $(ls -t "$LADY_PATH/releases" 2>/dev/null); do
      if [ -d "$LADY_PATH/releases/$d/lessons" ] && [ "$(ls -A "$LADY_PATH/releases/$d/lessons" 2>/dev/null)" ]; then
        RELEASE_DIR="$d"
        break
      fi
    done
  fi
  if [ -n "$RELEASE_DIR" ] && [ -d "$LADY_PATH/releases/$RELEASE_DIR/lessons" ]; then
    (cd "$LADY_PATH" && npm run emit-release-cms -- "releases/$RELEASE_DIR" 2>/dev/null) && echo -e "${GREEN}✓ emit-release-cms → scripts/output/cms/$RELEASE_DIR${NC}" || echo -e "${RED}✗ emit-release-cms failed${NC}"
    CMS_OUTPUT="$LADY_PATH/scripts/output/cms/$RELEASE_DIR"
  else
    echo -e "${YELLOW}⚠ No release with lessons found, skipping emit${NC}"
    CMS_OUTPUT=""
  fi

  # 3. CMS: ingest
  if [ "$skip_ingest" = false ] && [ -n "$CMS_OUTPUT" ] && [ -d "$CMS_OUTPUT" ]; then
    echo ""
    echo "[3/4] CMS: ingest..."
    if (cd "$CMS_ROOT" && npx tsx scripts/ingest-lady-lesson.ts "$CMS_OUTPUT" 2>/dev/null); then
      echo -e "${GREEN}✓ Ingest succeeded — lesson on /queued${NC}"
    else
      echo -e "${YELLOW}⚠ Ingest failed (check: module 'incoming' exists, migrations applied, Supabase configured)${NC}"
      echo "  Run: npx tsx scripts/p8-setup-prereqs.ts"
    fi
  else
    echo ""
    echo "[3/4] CMS: ingest skipped (--skip-ingest or no CMS output)"
  fi

  echo ""
  echo "[4/4] Manual: Approve lesson on /queued, then open in ouiispeak player"
  echo "  → cd ouiispeak && npm run dev"
  echo "  → http://localhost:3000/lecons/incoming/<lesson-slug>"
fi

echo ""
echo "Note: Tier A (L6 → Lady → CMS → ouiispeak) is not automated."
echo "  L6 outputs to Graph Store (Sheets); Lady reads data/graphStore.json."
echo "  Run L6 pipeline, export to graphStore.json, then run Tier B."
echo ""
echo "============================================================"
echo "Pipeline Test Suite complete"
echo "============================================================"
