Authority Role: archive
Artifact Type: retired-orchestration-plan
Canonical Source: archive/central/FACTORY_RESET_ORCHESTRATION_PLAN.md
Constitution Reference: central/CONSTITUTION.md

Retired From Active Authority Path: 2026-04-11

# FACTORY_RESET_ORCHESTRATION_PLAN

Date: 2026-04-10
Last Updated: 2026-04-10
Owner: CMS Platform (Sandbox Data Lane)
Repository: ouiispeak-cms-sandbox

## Purpose
Coordinate the factory-reset transfer from legacy lane data shape to sandbox authority shape with evidence-first sequencing and explicit blast-radius control.
Protect telemetry integrity and L6 input contract correctness as hard cutover gates.

## Scope
1. Producer lane: `Desktop/ouiispeak-cms`
2. Consumer lane: `/Users/raycheljohnson/isolated/ouiispeak-player-isolated`
3. Authority target: `ouiispeak-cms-sandbox` contracts and schema

## Verified Baseline (Evidence-Backed)
1. Legacy producer writes ACT payload into `slides`-lane columns (`props_json`, `activity_id`, `aid_hook`) instead of `activity_slide_field_values`:
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:22`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:521`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:530`
2. Canonical player DB loader still reads `lessons + lesson_groups + slides` with legacy slide columns:
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/loadLessonFromDb.ts:44`
3. Mock127 provider already reads split ACT tables (`activity_slides` + `activity_slide_field_values`) together with other boundary tables:
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lesson-provider/mock127-provider.ts:552`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lesson-provider/mock127-provider.ts:594`
4. Legacy producer migrations in repo are additive to `slides` columns; no dedicated `activity_slides` migration chain is present there:
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/supabase/migrations/20260314_add_activity_model_columns.sql:5`

## Producer Lane Delta Snapshot (Original CMS Audit)
### Current Producer Data Model
1. Runtime authoring model is centered on `modules`, `lessons`, `lesson_groups`, and `slides`; title/lesson-end/activity exist as slide types in this lane.
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/modules.ts:581`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/lessons.ts:637`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/groups.ts:650`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:22`
2. Activity payload persists on `slides` (`type`, `activity_id`, `is_activity`, `props_json`) and activity content is folded into `propsJson` before write.
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:271`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:521`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:530`
3. Ingest path enforces `propsJson.runtimeContractV1.interaction` for `activity_slides`, while non-ingest write-time auto-injection is ACT-001-specific.
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/ingest/validatePayload.ts:347`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:223`
4. App code uses RPC transaction calls, but RPC SQL definitions are not present in scanned migration files in this repo.
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/utils/transactions.ts:36`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:1215`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/supabase/migrations/20260314_add_activity_model_columns.sql:5`

### Current Producer Break Risks (Confidence-Graded)
1. `blocking` `proven`: producer writes activities into `slides` lane; target authority requires isolated `activity_slides` + `activity_slide_field_values`.
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:22`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:521`
2. `high` `likely`: UUID-canonical cutover can break producer assumptions where IDs remain string-typed in docs and only partially guarded in app paths.
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/docs/schema.slides.sql:1`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/docs/schema.lessons.sql:1`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:842`
3. `high` `proven`: title-slide and lesson-end creation/editing can still run through group-scoped slide insertion paths, conflicting with strict boundary separation target.
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/app/(main)/group-slides/[groupId]/page.tsx:170`
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/app/(main)/group-slides/[groupId]/page.tsx:356`
4. `medium` `proven`: runtime envelope generation is not uniform for all ACT IDs in non-ingest producer writes (ACT-001 special-case).
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/data/slides.ts:223`
5. `medium` `unknown`: missing in-repo SQL definitions for transaction RPCs/triggers creates cutover readiness uncertainty for rollback and write-boundary guarantees.
   - `/Users/raycheljohnson/Desktop/ouiispeak-cms/lib/utils/transactions.ts:36`

### Producer Unknowns Requiring Proof Before Cutover
1. Authoritative production DDL for base tables and FK/UUID constraints (repo SQL appears additive/partial).
2. SQL bodies for transaction RPC functions invoked by producer (`delete_*_transaction`, `insert_slide_at_index_transaction`, `swap_slides_order_transaction`).
3. Producer-side trigger side-effects for content writes are not defined in repo SQL history (catalog inventory captured; source-controlled trigger definitions remain unresolved).

## Consumer Lane Delta Snapshot (Revised Isolated Player Audit)
### Route Family Split
1. Canonical player lane (`/lecons/[module]/[lesson]`) resolves through `resolveLessonFromSlug -> loadLesson -> getLessonBySlug -> loadLessonFromDb`, and reads legacy `slides` columns:
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/loadLessonFromDb.ts:44`
2. Lab/mock127 lane (`/lab/lesson/[id]`) resolves through `getMock127LessonContractByLessonId` and reads isolated ACT tables:
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lesson-provider/mock127-provider.ts:562`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lesson-provider/mock127-provider.ts:595`
3. Canonical lane remains slug-sensitive for module/lesson resolution:
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lessons/findLessonBySlug.ts:29`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lessons/findLessonBySlug.ts:47`

### Current Player Break Risks (Confidence-Graded)
1. `blocking` `proven`: canonical loader expects activities in `slides` rows; isolated ACT-only cutover will leave canonical lane without activity content unless compatibility/read-path migration is implemented.
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/loadLessonFromDb.ts:44`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/loadLessonFromDb.ts:114`
2. `high` `proven`: canonical route depends on slug lookup (`modules.slug` / `lessons.slug`) and can 404 when slug identity is absent or not unique.
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lessons/findLessonBySlug.ts:29`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lessons/findLessonBySlug.ts:47`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/app/(app)/lecons/[module]/[lesson]/page.tsx:78`
3. `medium` `likely`: runtime interaction extraction can fail if activity runtime contract exists only in nested shape not surfaced by canonical loader path.
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/loadLessonFromDb.ts:27`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/loadLessonFromDb.ts:151`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/components/slides/ActivitySlide.tsx:79`
4. `high` `proven` (conditional on contaminated data): mock127 lane fails closed when non-text `slide_field_values` contamination is present.
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lesson-provider/mock127-provider.ts:397`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lesson-provider/mock127-provider.ts:428`
5. `high` `proven`: mock/local endpoints are hardcoded in some player read surfaces and can fail outside local-lane environments.
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/lib/lesson-provider/mock127-provider.ts:7`
   - `/Users/raycheljohnson/isolated/ouiispeak-player-isolated/src/app/(app)/lecons/page.tsx:11`

### Confidence Notes (Revised Audit Clarifications)
1. Canonical player data dependency is explicitly `lessons -> lesson_groups -> slides`; this is already reflected in the break matrix and remains the primary blocking delta.
2. Runtime-contract mismatch is intentionally graded `medium likely` (not deterministic blocking): canonical loader can surface top-level `runtimeContractV1` when present, so failure depends on post-cutover payload shape.
3. Mock127 contamination failure is `high proven` but conditional on contaminated data; clean-lane data keeps this path stable.

### Consumer Unknowns Requiring Proof Before Cutover
1. Whether `/lab/lesson/[id]` is cutover-critical or explicitly dev-only for go-live decisions.
2. Whether canonical nested relation queries require explicit `.range()` protection under production Supabase row-limit policy.
3. Whether UUID strictness is fully enforced at DB boundary for all player-facing API write paths.

## Live DB Introspection Snapshot (Read-Only, 2026-04-10 UTC)
Source: direct catalog and row-count introspection against remote Supabase (`db.kruyntsonpjvtlxffeuz.supabase.co`) and local sandbox.

### Remote DB (Current Legacy Lane) — Verified Counts
1. Core content counts:
   - `modules=2`
   - `lessons=11`
   - `lesson_groups=29`
   - `slides=101`
2. Split ACT tables are absent in remote:
   - `activity_slides=missing`
   - `activity_slide_field_values=missing`
   - `slide_field_values=missing`
3. Legacy activity-in-slides shape is confirmed in remote:
   - `slides_type_activity_rows=84`
   - `slides_legacy_act_type_rows=0`
   - `slides_with_activity_id=84`
   - `slides_with_props_json=101`
4. Compatibility views for slide/activity bridging:
   - `0 rows` (none present)

### Remote User-Linked Data (Preservation Risk Assessment)
1. User-linked counts:
   - `auth.users=2`
   - `profiles=1`
   - `user_lessons=9`
   - `lesson_notes=0`
   - `lesson_bookmarks=0`
2. Orphan checks:
   - `orphan_user_lessons_by_lesson=0`
   - `orphan_notes_by_lesson_slug=0`
   - `orphan_notes_by_slide_id=0`
   - `orphan_bookmarks_by_lesson_slug=0`
   - `orphan_bookmarks_by_slide_id=0`
3. Schema note:
   - `lesson_notes` and `lesson_bookmarks` are slug-linked (`lesson_slug`, `slide_id`) in current remote schema.

### Sandbox DB (Target Split Lane) — Verified Shape
1. Split tables are present in sandbox:
   - `activity_slides=present`
   - `activity_slide_field_values=present`
   - `slide_field_values=present`
2. Legacy `slides` activity columns are absent in sandbox (`type/activity_id/props_json` not available in `public.slides`).
3. Contamination signal in sandbox:
   - `slide_field_values` type-activity contamination count = `0`.
4. Atomic import RPCs for split model are present (`import_*_create_atomic`, `import_*_update_atomic` family).

### Operational Posture (Owner-Confirmed)
1. System is not live; no external users.
2. Existing accounts are test-only.
3. Auth is not currently activated for production usage.

### Decision Impact
1. Compatibility bridge for preserving active learners is not required by current operating posture.
2. Clean-cut factory reset is supported by current data posture (minimal user-linked data, zero notes/bookmarks).
3. If preserving test progress is unnecessary, `user_lessons` can be dropped/reset with content lanes during cutover.

## Target Model (Transfer Destination)
1. ACT data authority in `activity_slides` + `activity_slide_field_values`
2. Runtime envelope authority in `propsJson.runtimeContractV1.interaction`
3. `slides` contamination with `type=activity` must remain `0` in target lane
4. Identity and requiredness semantics remain bound to sandbox authority docs and matrix

## Workstreams

### WS1 — Read Surface Inventory
Goal: freeze exact producer/consumer query and write surfaces before any cutover changes.

Deliverables:
1. Legacy producer write-surface inventory (table, columns, function, route)
2. Player read-surface inventory by route family (`db` loader path vs mock127 path)
3. File+line evidence appendix for every surface

Exit Gate:
1. Deterministic artifact exists: `cutover-backups/<ts>/ws1-read-surface-inventory.md`.
2. Deterministic check command:
```bash
UNKNOWN_COUNT=$(rg -n '\bUNKNOWN\b' "cutover-backups/<ts>/ws1-read-surface-inventory.md" | wc -l | tr -d ' ')
test "$UNKNOWN_COUNT" -eq 0
```

### WS2 — Delta And Blast-Radius Matrix
Goal: map every producer/consumer dependency against sandbox destination shape.

Deliverables:
1. Break matrix (`blocking/high/medium/low`) with failure mode + affected route
2. Route ownership matrix (which lane must change for each break)
3. Ordered cutover sequence with dependency edges

Exit Gate:
1. Deterministic artifact exists: `cutover-backups/<ts>/ws2-break-matrix.csv`.
2. CSV columns are exactly: `id,severity,status,evidence_path,owner,execution_order`.
3. Deterministic check command:
```bash
awk -F, '
  NR==1 { next }
  $2=="blocking" && ($3!="closed" || $4=="" || $5=="" || $6=="") { print; bad=1 }
  END { exit bad }
' "cutover-backups/<ts>/ws2-break-matrix.csv"
```
4. Deterministic check command (no unresolved blocking/high rows before GO):
```bash
awk -F, '
  NR==1 { next }
  ($2=="blocking" || $2=="high") && $3!="closed" { print; bad=1 }
  END { exit bad }
' "cutover-backups/<ts>/ws2-break-matrix.csv"
```

### WS2-A — Consolidated Break Matrix (Owner Assigned)
Owner roles:
1. `DATA-LANE` = CMS sandbox schema/import authority (`ouiispeak-cms-sandbox`)
2. `PLAYER-LANE` = lesson player canonical/lab routes (`/Users/raycheljohnson/isolated/ouiispeak-player-isolated`)
3. `LEGACY-LANE` = original CMS retirement lane (`Desktop/ouiispeak-cms`)
4. `OPERATOR` = cutover executor and GO/NO-GO signer

Current assignment snapshot:
1. `DATA-LANE` -> Agent B
2. `PLAYER-LANE` -> Agent A
3. `LEGACY-LANE` -> Original CMS lane agent (TBD if not yet assigned)
4. `OPERATOR` -> Raychel Johnson

| ID | Severity | Current Dependency | Target Mismatch | Owner | Execution Order | Exit Proof |
|---|---|---|---|---|---|---|
| B1 | blocking | Producer persists activities in `slides` (`type/activity_id/props_json`) | Target isolates ACT content in `activity_slides` + `activity_slide_field_values` | DATA-LANE + LEGACY-LANE | 1 | Introspection: remote target has split tables and no ACT-in-`slides` dependency |
| B2 | blocking | Canonical player loader reads lesson content from `lessons -> lesson_groups -> slides` | After cutover, activity payload must come from split ACT tables | PLAYER-LANE | 2 | Canonical route loads ACTs without reading activity rows from `slides` |
| B3 | high | Canonical route resolves by module/lesson slug | UUID-canonical cutover can fail if slug assumptions drift | PLAYER-LANE | 3 | `/lecons/[module]/[lesson]` resolves on post-cutover dataset with deterministic 200 |
| B4 | medium | Runtime interaction may be surfaced from top-level shape on canonical lane | Target authority is `propsJson.runtimeContractV1.interaction` | PLAYER-LANE | 4 | Activity render path passes when contract exists in canonical nested shape only |
| B5 | high | Hardcoded local endpoints in read surfaces | Cutover environment requires environment-driven URLs/keys | PLAYER-LANE | 5 | No hardcoded localhost dependency on cutover routes |
| B6 | high | Title/Lesson-end creation can still traverse group-scoped insertion flows in legacy lane | Target boundary model is split + lane-specific tables | LEGACY-LANE | 6 | Legacy lane is retired for content writes post-cutover |
| B7 | medium | RPC transaction functions called in app code but SQL bodies not source-controlled in legacy repo | Cutover rollback confidence depends on known DB execution semantics | OPERATOR + LEGACY-LANE | 7 | Catalog export includes active RPC signatures + trigger inventory archived with cutover snapshot |
| B8 | medium | Canonical nested relation reads may depend on default row limits | Production row limits can truncate unresolved relations | PLAYER-LANE | 8 | Row-limit behavior tested and bounded (explicit range/pagination where required) |
| B9 | low | `/lab/lesson/[id]` scope relative to production is not explicitly fixed | Ambiguous runtime obligations at cutover | OPERATOR + PLAYER-LANE | 9 | Written decision: lab route is prod-critical or dev-only |

### WS2-B — Ordered Dependency Edges
1. B1 and B2 are hard blockers and must both close before GO.
2. B3 depends on B2 completion (canonical route migration first, then slug validation).
3. B4 depends on B2 completion (contract surface validated on migrated loader path).
4. B5 should close before final runtime verification to avoid environment false negatives.
5. B7 must close before destructive reset execution.
6. B8 and B9 must close before final GO/NO-GO signoff.

### WS2-C — Ownership Handoff Packet Requirements
1. Every break row must include:
   - owner
   - commit or migration reference
   - validation command
   - pass/fail result
2. No break row can be marked closed without evidence artifact path.

### WS3 — Cutover Readiness Proof
Goal: prove target-lane invariants before transfer execution.

Deliverables:
1. SQL checks proving split-table availability and guard constraints
2. Query checks proving contamination rule compliance (`slides` lane ACT rows = 0 in target)
3. Runtime route checks proving player can resolve target data path

Exit Gate:
1. Proof packet complete with deterministic pass/fail outputs.

### WS4 — Transfer Execution Runbook
Goal: execute transfer with deterministic rollback posture.

Deliverables:
1. Step-by-step runbook with command list and checkpoints
2. Pause/resume checkpoints after each critical boundary
3. Post-cutover verification checklist (data, runtime, docs)

Exit Gate:
1. GO/NO-GO decision block completed and signed.

### WS5 — Speaking Lane Contract + Whisper Reliability Hardening
Goal: preserve speaking-lane behavior and scoring accuracy while reducing drift and operational fragility.

Deliverables:
1. Provider-agnostic speaking contract freeze for ACT speaking lanes (`ACT-020`, `ACT-021`, `ACT-022`, `ACT-024`, `ACT-026`) with explicit required/optional fields and runtime semantics.
2. Drift gate alignment across:
   - `central/FIELD_DICTIONARY.csv`
   - `central/REQUIREDNESS_MATRIX.csv`
   - sandbox ingest/preflight authority (`lib/activitySlidePreflight.ts`)
   - player runtime contract/parser for speaking lanes.
3. Tiered test strategy:
   - minimal conformance tests per speaking ACT (valid + fail-closed invalid payloads),
   - shared scorer tests (single scorer authority, no duplicated ACT-specific scorer logic),
   - golden audio regression fixtures with deterministic expected result bands.
4. Whisper reliability envelope:
   - health/readiness check endpoint and startup gate,
   - standardized env contract (`WHISPER_BASE_URL`, `WHISPER_TIMEOUT_MS`),
   - bounded retry/timeout behavior and explicit degraded-state messaging.
5. Scoring stability policy:
   - locked normalization pipeline,
   - accepted-variant/alias map governance,
   - per-ACT threshold policy (no single global threshold assumption),
   - low-quality audio gate before scoring.
6. Single-command preflight for speaking stack (env validation + Whisper reachability + sample transcribe + sample scoring check).

Exit Gate:
1. Speaking-lane conformance suite passes for all active speaking ACT lanes.
2. Whisper health/readiness and scoring preflight pass in local-only isolation mode.
3. No contract drift across dictionary/matrix/preflight/player contract for speaking fields.
4. Command-pinned hard gate (all must pass):
```bash
# Sandbox drift + contract gates
cd /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox
npx tsx --test tests/drift-gates.test.ts

# Player speaking/Whisper lanes (exact command list owned by PLAYER-LANE packet)
cd /Users/raycheljohnson/isolated/ouiispeak-player-isolated
npm run -s check:types
npx vitest run src/lib/lesson-provider/mock127-provider.test.ts src/lib/telemetry/emitTelemetry.payload.test.ts
```

### WS6 — Telemetry + L6 Input Integrity Gate
Goal: guarantee cutover cannot corrupt telemetry event pipelines or L6 input requirements.

Deliverables:
1. Telemetry contract matrix with authoritative allowed event types, required event fields, and producer ownership by route.
2. L6 input matrix with required/optional fields bound to sandbox authority docs (`central/INGEST_CONTRACT.md`, `central/REQUIREDNESS_MATRIX.csv`).
3. Deterministic integration checks:
   - ingest payload -> CMS write -> export payload parity for required L6 fields,
   - player runtime event emission -> telemetry API acceptance for allowed event types,
   - fail-closed assertions for malformed telemetry payloads and malformed L6 inputs.
4. Cutover freeze rule: LV2 naming mismatch cleanup is out of scope for this run and must not block telemetry/L6 gate closure.
5. Verification command set (must be recorded in proof packet):
   - LV2 contract/scoring tests:
     - `npx vitest run "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 4 Grading/scripts/__tests__/grading-engine.test.ts" "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 4 Grading/scripts/__tests__/grading-replay.contract.test.ts" "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 7 Shipping/scripts/__tests__/lesson-design-to-cms.test.ts"`
   - LV2 telemetry replay smoke:
     - `cd "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 4 Grading/scripts" && npx tsx handshake-e-grading-replay-smoke.ts`
   - Telemetry validator/read-model smokes:
     - `cd /Users/raycheljohnson/Desktop/Tele && npx tsx scripts/handshake-d-validator-smoke.ts`
     - `cd /Users/raycheljohnson/Desktop/Tele && node scripts/wp43-read-models-smoke.ts`

Exit Gate:
1. Telemetry integration tests pass with no rejected valid events for the active event set.
2. L6 required input fields are proven end-to-end present at ingest and export boundaries.
3. No open `blocking` or `high` findings remain in telemetry or L6 lanes.

### WS4-A — Command-Level Clean-Cut Runbook (No Legacy Bridge)
Decision Basis: current operating posture is non-live, test-only accounts, no production auth usage.

#### R0. Preflight Lock
1. Freeze write activity in both repos (`Desktop/ouiispeak-cms`, `/Users/raycheljohnson/isolated/ouiispeak-player-isolated`) for cutover window.
2. Confirm CLI/tooling:
   - `supabase --version`
   - `psql --version`
3. Confirm target policy:
   - `preserve-none` or `preserve-test-accounts-only`
4. Record start timestamp in this plan before execution.
5. Enforce DB write freeze at source (operator lane):
```bash
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 -c "ALTER DATABASE postgres SET default_transaction_read_only = on;"
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 -c "SELECT pg_reload_conf();"
```
6. Freeze smoke (must fail closed):
```bash
if psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 -c "UPDATE public.modules SET id=id WHERE false;"; then
  echo "FAIL: source DB is still writable"
  exit 1
else
  echo "PASS: source DB write freeze enforced"
fi
```

#### R0.5 Local-Only Isolation Gate (Mock Completeness Proof)
1. Force both CMS sandbox and player to local Supabase endpoints only:
   - API: `http://127.0.0.1:54321`
   - DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
2. Remove/disable remote Supabase URL/key envs for the validation window.
3. Block outbound access to `*.supabase.co` during validation (hosts/firewall rule) to fail fast on accidental remote calls.
4. Provision local storage dependency for file-mode audio (deterministic + idempotent):
   - create/confirm public bucket `lesson-audio` in local Supabase
   - seed required audio fixtures from a fixed manifest (`AUDIO_FIXTURE_MANIFEST`)
   - verify local public object URLs return HTTP `200` for each required fixture
5. Run core checks in local-only mode:
   - CMS: import/export + requiredness/runtime gates
   - Player: canonical lesson route + lab route + ACT chain smoke + file-mode audio smoke
6. Capture proof artifacts (command output + timestamps) under `cutover-backups/<ts>/local-only-proof/`.
7. Deterministic isolation + storage-proof commands:
```bash
REMOTE_DB_HOST=$(echo "$REMOTE_DB_URL" | sed -E 's#.*@([^:/?]+).*#\1#')
echo "remote host: $REMOTE_DB_HOST"

# Local-only env guard
rg -n "supabase\\.co" /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/.env.local /Users/raycheljohnson/isolated/ouiispeak-player-isolated/.env.local

# Host block proof (must fail to connect after block is applied)
if nc -z -w 2 "$REMOTE_DB_HOST" 5432; then
  echo "FAIL: remote DB host still reachable"
  exit 1
else
  echo "PASS: remote DB host unreachable in local-only window"
fi

# Local storage dependency guard (lesson-audio bucket + fixture URLs)
: "${SANDBOX_DB_URL:=postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
: "${LOCAL_SUPABASE_API:=http://127.0.0.1:54321}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY required for local storage writes}"
: "${AUDIO_FIXTURE_DIR:?set AUDIO_FIXTURE_DIR to local audio fixture folder}"
: "${AUDIO_FIXTURE_MANIFEST:?set AUDIO_FIXTURE_MANIFEST to required fixture list (one relative path per line)}"

psql "$SANDBOX_DB_URL" -v ON_ERROR_STOP=1 -c "
insert into storage.buckets (id, name, public)
values ('lesson-audio', 'lesson-audio', true)
on conflict (id) do update set public = excluded.public;
"

psql "$SANDBOX_DB_URL" -v ON_ERROR_STOP=1 -Atc "
select id || ',' || public
from storage.buckets
where id = 'lesson-audio';
" | grep -q '^lesson-audio,t$'

while IFS= read -r fixture; do
  [ -z "$fixture" ] && continue
  case "$fixture" in \#*) continue ;; esac

  test -f "$AUDIO_FIXTURE_DIR/$fixture"

  curl -fsS -X POST \
    "$LOCAL_SUPABASE_API/storage/v1/object/lesson-audio/$fixture" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "x-upsert: true" \
    -H "Content-Type: application/octet-stream" \
    --data-binary @"$AUDIO_FIXTURE_DIR/$fixture" >/dev/null

  curl -fsS \
    "$LOCAL_SUPABASE_API/storage/v1/object/public/lesson-audio/$fixture" \
    >/dev/null
done < "$AUDIO_FIXTURE_MANIFEST"
```

Checkpoint R0.5 PASS Criteria:
1. All required CMS and player checks pass with remote Supabase blocked.
2. No successful outbound calls to remote Supabase during test window.
3. Local public bucket `lesson-audio` exists.
4. Every required fixture in `AUDIO_FIXTURE_MANIFEST` resolves from local public storage URL.
5. Player file-mode audio smoke passes in local-only mode without fallback/missing-audio UI state.

#### R0.6 Speaking Stack Hard Gate (Whisper + Scoring)
1. Verify player-side Whisper env contract is present for cutover environment:
   - `WHISPER_BASE_URL`
   - `WHISPER_TIMEOUT_MS` (optional override; default accepted when unset)
2. Verify Whisper service reachability and response:
   - health/readiness probe (if provided),
   - sample `/transcribe` request returns JSON with non-empty `text`.
3. Verify scoring path determinism:
   - run player typing/tests for pronunciation scoring path,
   - run speaking-lane contract tests for active speaking ACTs,
   - verify degraded-state message path when Whisper is intentionally unavailable.
4. Archive proof outputs under `cutover-backups/<ts>/local-only-proof/speaking-stack/`.
5. Command-pinned checks:
```bash
# LV2 scoring + replay contract lane
npx vitest run "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 4 Grading/scripts/__tests__/grading-engine.test.ts" "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 4 Grading/scripts/__tests__/grading-replay.contract.test.ts" "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 7 Shipping/scripts/__tests__/lesson-design-to-cms.test.ts"
cd "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 4 Grading/scripts" && npx tsx handshake-e-grading-replay-smoke.ts

# Telemetry validator + read-model smokes
cd /Users/raycheljohnson/Desktop/Tele && npx tsx scripts/handshake-d-validator-smoke.ts
cd /Users/raycheljohnson/Desktop/Tele && node scripts/wp43-read-models-smoke.ts
```

Checkpoint R0.6 PASS Criteria:
1. Whisper service is reachable from player runtime path and sample transcribe succeeds.
2. Pronunciation scorer + speaking-lane contract tests pass.
3. Degraded-state behavior is verified and user-visible error messaging is deterministic.

#### R1. Safety Snapshot (Required Before Any Destructive Step)
1. Create backup directory:
```bash
mkdir -p ./cutover-backups/$(date +%Y%m%d-%H%M%S)
```
2. Capture schema snapshot (remote):
```bash
pg_dump "$REMOTE_DB_URL" --schema-only > ./cutover-backups/<ts>/remote-schema.sql
```
3. Capture minimal data snapshot (remote content + user-linked):
```bash
pg_dump "$REMOTE_DB_URL" \
  --data-only \
  --table=public.modules \
  --table=public.lessons \
  --table=public.lesson_groups \
  --table=public.slides \
  --table=public.user_lessons \
  --table=public.lesson_notes \
  --table=public.lesson_bookmarks \
  --table=public.profiles \
  > ./cutover-backups/<ts>/remote-data-subset.sql
```
4. Copy latest introspection outputs into same backup directory.
5. Capture retention baseline counts:
```bash
{
  echo "profiles_count=$(psql \"$REMOTE_DB_URL\" -At -c \"select count(*) from public.profiles;\")"
  echo "user_lessons_count=$(psql \"$REMOTE_DB_URL\" -At -c \"select count(*) from public.user_lessons;\")"
  echo "lesson_notes_count=$(psql \"$REMOTE_DB_URL\" -At -c \"select count(*) from public.lesson_notes;\")"
  echo "lesson_bookmarks_count=$(psql \"$REMOTE_DB_URL\" -At -c \"select count(*) from public.lesson_bookmarks;\")"
} > ./cutover-backups/<ts>/retention-baseline.env
```

Checkpoint R1 PASS Criteria:
1. Backup files exist and are non-empty.
2. Latest introspection files are archived with timestamp.

#### R1.5 Canonical Seed Snapshot (Pinned Source Path)
1. Create seed directory:
```bash
mkdir -p ./cutover-backups/<ts>/seed
```
2. Export canonical payloads from CMS sandbox API (single authority source):
```bash
curl -fsS "http://127.0.0.1:3000/api/modules/export-json" -o ./cutover-backups/<ts>/seed/modules.json
curl -fsS "http://127.0.0.1:3000/api/lessons/export-json" -o ./cutover-backups/<ts>/seed/lessons.json
curl -fsS "http://127.0.0.1:3000/api/groups/export-json" -o ./cutover-backups/<ts>/seed/groups.json
curl -fsS "http://127.0.0.1:3000/api/slides/export-json" -o ./cutover-backups/<ts>/seed/slides.json
curl -fsS "http://127.0.0.1:3000/api/activity-slides/export-json" -o ./cutover-backups/<ts>/seed/activity-slides.json
curl -fsS "http://127.0.0.1:3000/api/title-slides/export-json" -o ./cutover-backups/<ts>/seed/title-slides.json
curl -fsS "http://127.0.0.1:3000/api/lesson-ends/export-json" -o ./cutover-backups/<ts>/seed/lesson-ends.json
```
3. Validate JSON files are parseable:
```bash
for f in ./cutover-backups/<ts>/seed/*.json; do
  jq empty "$f"
done
```

Checkpoint R1.5 PASS Criteria:
1. Every seed file exists and is valid JSON.
2. Seed source path is pinned to `cutover-backups/<ts>/seed/` for R5.

#### R2. Branch/Repo Freeze Snapshot
1. Capture exact commit SHAs:
```bash
git -C /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox rev-parse HEAD
git -C /Users/raycheljohnson/Desktop/ouiispeak-cms rev-parse HEAD
git -C /Users/raycheljohnson/isolated/ouiispeak-player-isolated rev-parse HEAD
```
2. Save SHAs into a `cutover-backups/<ts>/sha-snapshot.txt`.

Checkpoint R2 PASS Criteria:
1. Three repo SHAs recorded.

#### R3. Target DB Reset and Migration Apply
1. Link sandbox repo to target project (if not linked):
```bash
cd /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox
supabase link --project-ref <target-project-ref>
```
2. Disable source freeze immediately before reset:
```bash
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 -c "ALTER DATABASE postgres SET default_transaction_read_only = off;"
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 -c "SELECT pg_reload_conf();"
```
3. Deterministic destructive reset (clean cut, `public` schema only):
```bash
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
SQL
```
4. Apply sandbox schema/migrations to target:
```bash
supabase db push
```
5. If migration chain requires manual SQL order, apply in canonical order from sandbox `supabase/manual/` as documented in `central/SCHEMA.md`.
6. Post-migration introspection:
```bash
mkdir -p ./cutover-backups/<ts>/post-migration
psql "$REMOTE_DB_URL" -f /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover_introspection.sql > ./cutover-backups/<ts>/post-migration/introspection.txt
```

Checkpoint R3 PASS Criteria:
1. `activity_slides`, `activity_slide_field_values`, `slide_field_values`, `title_slides`, `lesson_ends`, `groups` exist.
2. `lesson_groups` legacy dependency is removed from active runtime path.
3. Destructive reset command log and migration log are archived.

#### R4. Retention Profile Execution
1. `preserve-none`:
   - Clear user-linked test tables (`user_lessons`, `lesson_notes`, `lesson_bookmarks`, optionally `profiles`).
   - Keep no legacy learner state.
2. `preserve-test-accounts-only`:
   - Preserve `auth.users` and `profiles`.
   - Clear `user_lessons`, `lesson_notes`, `lesson_bookmarks`.
3. Do not carry legacy lesson content rows into split-lane tables unless explicitly re-imported via sandbox contracts.
4. Deterministic commands (`preserve-none`):
```bash
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE TABLE public.user_lessons, public.lesson_notes, public.lesson_bookmarks RESTART IDENTITY;
TRUNCATE TABLE public.profiles RESTART IDENTITY;
SQL
```
5. Deterministic commands (`preserve-test-accounts-only`):
```bash
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE TABLE public.user_lessons, public.lesson_notes, public.lesson_bookmarks RESTART IDENTITY;
SQL
```
6. Deterministic row-count assertions:
```bash
test "$(psql "$REMOTE_DB_URL" -At -c "select count(*) from public.user_lessons;")" = "0"
test "$(psql "$REMOTE_DB_URL" -At -c "select count(*) from public.lesson_notes;")" = "0"
test "$(psql "$REMOTE_DB_URL" -At -c "select count(*) from public.lesson_bookmarks;")" = "0"
```

Checkpoint R4 PASS Criteria:
1. Selected retention profile applied and row counts match expected policy.
2. Retention execution SQL and row-count outputs are archived in `cutover-backups/<ts>/retention/`.

#### R5. Seed Canonical Baseline Content
1. Import canonical sandbox payloads using RPC/atomic import paths only.
2. Confirm active lane coverage for components and ACT set in current authority docs.
3. Enforce contamination rule:
   - `slide_field_values` with `field_name='type' AND field_value='activity'` must remain `0`.
4. Pinned payload source path:
   - `cutover-backups/<ts>/seed/modules.json`
   - `cutover-backups/<ts>/seed/lessons.json`
   - `cutover-backups/<ts>/seed/groups.json`
   - `cutover-backups/<ts>/seed/slides.json`
   - `cutover-backups/<ts>/seed/activity-slides.json`
   - `cutover-backups/<ts>/seed/title-slides.json`
   - `cutover-backups/<ts>/seed/lesson-ends.json`
5. Deterministic import command sequence:
```bash
curl -fsS -o /tmp/modules-import.out -w "%{http_code}" -X POST -F "mode=create" -F "file=@cutover-backups/<ts>/seed/modules.json" "http://127.0.0.1:3000/api/modules/import-json"
curl -fsS -o /tmp/lessons-import.out -w "%{http_code}" -X POST -F "mode=create" -F "file=@cutover-backups/<ts>/seed/lessons.json" "http://127.0.0.1:3000/api/lessons/import-json"
curl -fsS -o /tmp/groups-import.out -w "%{http_code}" -X POST -F "mode=create" -F "file=@cutover-backups/<ts>/seed/groups.json" "http://127.0.0.1:3000/api/groups/import-json"
curl -fsS -o /tmp/slides-import.out -w "%{http_code}" -X POST -F "mode=create" -F "file=@cutover-backups/<ts>/seed/slides.json" "http://127.0.0.1:3000/api/slides/import-json"
curl -fsS -o /tmp/activity-slides-import.out -w "%{http_code}" -X POST -F "mode=create" -F "file=@cutover-backups/<ts>/seed/activity-slides.json" "http://127.0.0.1:3000/api/activity-slides/import-json"
curl -fsS -o /tmp/title-slides-import.out -w "%{http_code}" -X POST -F "mode=create" -F "file=@cutover-backups/<ts>/seed/title-slides.json" "http://127.0.0.1:3000/api/title-slides/import-json"
curl -fsS -o /tmp/lesson-ends-import.out -w "%{http_code}" -X POST -F "mode=create" -F "file=@cutover-backups/<ts>/seed/lesson-ends.json" "http://127.0.0.1:3000/api/lesson-ends/import-json"
```
6. Deterministic contamination check:
```bash
psql "$REMOTE_DB_URL" -At -c "select count(*) from public.slide_field_values where field_name='type' and lower(field_value)='activity';"
```

Checkpoint R5 PASS Criteria:
1. Canonical sample lesson loads in sandbox shape.
2. Contamination guard remains zero.
3. Every import call returns redirect code (`303`) or structured rejection JSON (non-303 is fail).

#### R6. Player/Consumer Cutover
1. Update canonical player lane to read isolated ACT tables (not activity rows inside `slides`).
2. Keep runtime envelope resolution on `propsJson.runtimeContractV1.interaction`.
3. Remove reliance on local hardcoded mock endpoints for cutover routes.
4. Deterministic smoke commands:
```bash
cd /Users/raycheljohnson/isolated/ouiispeak-player-isolated
npm run -s check:types
npx vitest run src/lib/lesson-provider/mock127-provider.test.ts src/lib/telemetry/emitTelemetry.payload.test.ts
curl -fsS "http://127.0.0.1:3000/lecons" >/tmp/player-lecons.html
curl -fsS "http://127.0.0.1:3000/lab/lesson/<lessonId>" >/tmp/player-lab-lesson.html
```

Checkpoint R6 PASS Criteria:
1. `/lecons/[module]/[lesson]` resolves lesson with ACT content from split tables.
2. `/lab/lesson/[id]` remains healthy on split schema.
3. Player route smoke artifacts are archived in `cutover-backups/<ts>/player/`.

#### R7. Verification Suite (Hard Gate)
1. DB invariants:
   - Split table existence
   - Required constraints present
   - Contamination = 0
2. App/runtime:
   - Canonical route 200
   - Lab route 200
   - Deterministic slide chain and ACT rendering
3. CMS checks:
   - import/export round-trip
   - rejection envelope behavior
4. Deterministic verification commands:
```bash
# DB invariants
psql "$REMOTE_DB_URL" -f /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover_introspection.sql > ./cutover-backups/<ts>/verification/introspection.txt

# CMS hard gates
cd /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox
npx tsx --test tests/drift-gates.test.ts
npm run test

# Telemetry + L6 hard gates
npx vitest run "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 4 Grading/scripts/__tests__/grading-engine.test.ts" "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 4 Grading/scripts/__tests__/grading-replay.contract.test.ts" "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 7 Shipping/scripts/__tests__/lesson-design-to-cms.test.ts"
cd "/Users/raycheljohnson/LV2/lesson-compiler-core-v2/Station 4 Grading/scripts" && npx tsx handshake-e-grading-replay-smoke.ts
cd /Users/raycheljohnson/Desktop/Tele && npx tsx scripts/handshake-d-validator-smoke.ts
cd /Users/raycheljohnson/Desktop/Tele && node scripts/wp43-read-models-smoke.ts
```

Checkpoint R7 PASS Criteria:
1. All verification checks pass with captured outputs.
2. Verification logs are archived in `cutover-backups/<ts>/verification/`.

#### R8. GO/NO-GO Decision
1. GO only if WS1, WS2, WS3, WS4, WS5, WS6 and R0, R0.5, R0.6, R1, R1.5, R2, R3, R4, R5, R6, R7 all pass.
2. NO-GO if any blocking check fails.
3. Record decision with timestamp and owner signature block in this plan.

R8 Execution Record (Signed):
- Decision: GO
- Signed by: Raychel Johnson
- Signed date: April 11, 2026
- Signed packet: `/Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover-backups/20260410-235434/reapply-20260411-001839/r8-go-no-go-signoff.md`
- Run root: `/Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover-backups/20260410-235434/reapply-20260411-001839`
- R3/R4/R5/R6/R7 status: PASS
- WS6 (Telemetry + L6) status: PASS
- Retention profile used: `preserve-test-accounts-only`

#### R9. Rollback Path (If NO-GO)
1. Restore schema/data from `cutover-backups/<ts>/remote-schema.sql` + `remote-data-subset.sql`.
2. Revert repos to recorded SHA snapshot.
3. Re-run introspection to verify pre-cutover state restored.
4. Deterministic restore commands:
```bash
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
SQL
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 -f ./cutover-backups/<ts>/remote-schema.sql
psql "$REMOTE_DB_URL" -v ON_ERROR_STOP=1 -f ./cutover-backups/<ts>/remote-data-subset.sql
psql "$REMOTE_DB_URL" -f /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover_introspection.sql > ./cutover-backups/<ts>/rollback/introspection.txt
```
5. Deterministic post-restore smoke:
```bash
test "$(psql "$REMOTE_DB_URL" -At -c "select count(*) from public.modules;")" = "2"
test "$(psql "$REMOTE_DB_URL" -At -c "select count(*) from public.lessons;")" = "11"
test "$(psql "$REMOTE_DB_URL" -At -c "select count(*) from public.lesson_groups;")" = "29"
test "$(psql "$REMOTE_DB_URL" -At -c "select count(*) from public.slides;")" = "101"
```

Rollback PASS Criteria:
1. Core counts match pre-cutover snapshot (`modules=2`, `lessons=11`, `lesson_groups=29`, `slides=101` in current baseline unless new baseline snapshot supersedes).
2. Rollback command logs and row-count proofs are archived.

## Immediate Next Actions
1. Mark both lane scans as complete WS1 inputs (producer and consumer confidence-graded snapshots now captured in this plan).
2. Publish consolidated WS2 break matrix with owner assignment per `blocking` row across both lanes.
3. Lock clean-cut policy decision (no compatibility bridge) with explicit scope: preserve-none vs preserve-test-accounts-only.
4. Execute pre-reset backup snapshot (operator-owned) for rollback safety, then schedule reset window.
5. Lock implementation order for canonical player loader migration + producer write-path retirement before factory-reset run.
6. Start WS5 with speaking-lane contract freeze and drift-gate implementation (`dictionary -> preflight -> player contract`).
7. Add R0.6 speaking-stack hard gate to cutover checklist execution artifacts before GO/NO-GO.
8. Execute WS6 telemetry + L6 integrity gate; defer LV2 naming mismatch cleanup to post-cutover rehaul lane.

## Notes
1. This document is an orchestration artifact for active transfer work.
2. Final state should absorb resolved decisions into canonical authority docs; this plan is temporary.
