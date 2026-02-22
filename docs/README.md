# OuiiSpeak CMS Documentation Index

**Purpose:** Central index of documentation for developers.  
**Last updated:** 2025-02-19

---

## Start Here

| Document | Description |
|----------|-------------|
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | **Engineering overview** — data model, systems, LaDy ingestion, player integration |
| [SITEMAP.md](./SITEMAP.md) | **Route map** — all pages and API routes with purpose |
| [SETUP_ENV_VARIABLES.md](./SETUP_ENV_VARIABLES.md) | **Environment setup** — required and optional env vars |

---

## Core Systems

| Document | Description |
|----------|-------------|
| [CMS_CONSTITUTION.md](./CMS_CONSTITUTION.md) | Field sections, slide config contracts, migration policy |
| [CMS_PAGE_INVENTORY.md](./CMS_PAGE_INVENTORY.md) | Page → file → table mapping (create, edit, browse) |
| [NAVIGATION_SPEC.md](../NAVIGATION_SPEC.md) | Canonical routes and entity → page navigation rules |

---

## Schema & Data

| Document | Description |
|----------|-------------|
| [schema.lessons.md](./schema.lessons.md) | Lesson schema |
| [schema.groups.md](./schema.groups.md) | Group schema |
| [schema.slides.md](./schema.slides.md) | Slide schema |
| [migrations/README_APPLY_MIGRATIONS.md](./migrations/README_APPLY_MIGRATIONS.md) | How to apply database migrations |

---

## LaDy Ingestion (P8)

| Document | Description |
|----------|-------------|
| [P8_IMPLEMENTATION_LOG.md](./P8_IMPLEMENTATION_LOG.md) | Step-by-step implementation, phases, branch setup |
| [P8_Phase4_Execution_Workflow.md](./P8_Phase4_Execution_Workflow.md) | Schema reference, execution workflow, slide types |

**Pipeline test:** `./scripts/test-pipeline.sh` — runs Tier D (per-component tests) and Tier B (Lady → CMS). Use `LADY_REPO_PATH` to point at lesson-compiler-core. See plan: Pipeline Test Suite — Validation Before Build Plan.

---

## Player & Integration

| Document | Description |
|----------|-------------|
| [PLAYER_INVENTORY.md](./PLAYER_INVENTORY.md) | Player integration, lesson loading, slide types |

---

## Development

| Document | Description |
|----------|-------------|
| [REFACTOR_SLIDE_FORM_SYSTEM.md](./REFACTOR_SLIDE_FORM_SYSTEM.md) | Configuration-driven form system |
| [ENABLE_DYNAMIC_FORMS_GUIDE.md](./ENABLE_DYNAMIC_FORMS_GUIDE.md) | Dynamic form feature flags |
| [TEST_COVERAGE_PROGRESS.md](./TEST_COVERAGE_PROGRESS.md) | Test coverage status |
| [adr/001-slide-field-persistence.md](./adr/001-slide-field-persistence.md) | ADR: slide field persistence |

---

## Debugging

| Document | Description |
|----------|-------------|
| [DEBUGGING_SAVE_ISSUE.md](./DEBUGGING_SAVE_ISSUE.md) | Slide save debugging |
| [DEBUGGING_DATA_LOADING.md](./DEBUGGING_DATA_LOADING.md) | Data loading debugging |
| [DEBUGGING_NETWORK_REQUESTS.md](./DEBUGGING_NETWORK_REQUESTS.md) | Network request debugging |
