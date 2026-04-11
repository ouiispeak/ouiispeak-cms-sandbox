Authority Role: canonical
Artifact Type: open-items-log
Canonical Source: central/OPEN_ITEMS.md
Constitution Reference: central/CONSTITUTION.md

# OPEN_ITEMS

Date: 2026-04-09
Last Updated: 2026-04-11
Owner: CMS Platform (Sandbox Data Lane)
Repository: ouiispeak-cms-sandbox

## Purpose
Track known unresolved items so decisions and required fixes cannot disappear between sessions.

## Open Items
1. LV2 naming mismatch cleanup is intentionally deferred to post-cutover LV2 rehaul and must not block telemetry/L6 gate closure.
   Owner: Raychel Johnson
   Target: Post-cutover

## 100% Completion Checklist (Binary Exit Gates)
Status Rule: Every item below must be complete. If any item is incomplete, overall status is not 100%.

1. Lock policy decisions in authority docs.
   Exit Gate: `central/CONSTITUTION.md` explicitly defines requiredness semantics (`required_from_lv2`, `required_at_ingest`, `required_in_db`, `required_for_runtime`, `system_generated`, `generator_owner`), sandbox authority precedence, slug policy, version policy, sourceVersion policy, and no-assumption rule.
   Owner: CMS Platform (Sandbox Data Lane)
   Status: Closed (2026-04-10)

2. Complete canonical requiredness matrix with no unknowns.
   Exit Gate: `central/REQUIREDNESS_MATRIX.csv` contains complete field x component x ACT requiredness flags plus evidence refs, with 0 `UNKNOWN` rows.
   Owner: CMS Platform (Sandbox Data Lane)
   Status: Closed (2026-04-10)

3. Implement system-generated ownership end to end.
   Exit Gate: Runtime behavior matches canonical owner assignments for generated fields (`moduleId`, `lessonId`, `groupId`, `slideId`, `lastUpdatedAt`, `targetLanguage`, `orderIndex`) and final slug/version/sourceVersion ownership policy.
   Owner: CMS Platform (Sandbox Data Lane)
   Status: Closed (2026-04-10)

4. Implement slug policy end to end.
   Exit Gate: Create-time generation (when missing), uniqueness handling, and update-time stability/override rules are enforced and tested.
   Owner: CMS Platform (Sandbox Data Lane)
   Status: Closed (2026-04-10)

5. Implement version/sourceVersion policy end to end.
   Exit Gate: `version` follows CMS revision rules and `sourceVersion` follows current LV2/default policy, with deterministic ingest/export behavior and tests.
   Owner: CMS Platform (Sandbox Data Lane)
   Status: Closed (2026-04-10)

6. Bind ingest gate to canonical matrix.
   Exit Gate: Create/update/import APIs reject missing/invalid required fields using deterministic rule source and deterministic rejection codes.
   Owner: CMS Platform (Sandbox Data Lane)
   Status: Closed (2026-04-10) - `activity_slides` ACT shape-lock ingest derives from `central/REQUIREDNESS_MATRIX.csv` via `lib/requirednessMatrix.ts`, and non-activity component import requiredness now binds to matrix `category_payload` rows (filtered to active config fields) in `lib/hierarchyComponentEngine.ts`.

7. Bind post-write DB validation gate to canonical matrix.
   Exit Gate: Accepted writes verify required DB invariants and generated fields before success response.
   Owner: CMS Platform (Sandbox Data Lane)
   Status: Closed (2026-04-10) - post-write DB validation now runs in `lib/hierarchyComponentEngine.ts` for save/import write paths when canonical `slug` authority is active, using matrix-driven `required_in_db OR system_generated` category payload invariants from `lib/requirednessMatrix.ts`; fail-closed coverage added in `tests/system-assigned-fields.test.ts`.

8. Bind export/runtime gate to canonical matrix.
   Exit Gate: Export/player payload generation fails closed when `required_for_runtime` fields are missing.
   Owner: CMS Platform (Sandbox Data Lane)
   Status: Closed (2026-04-10) - runtime export gate added in `lib/exportRuntimeGate.ts` and wired into all export endpoints (`/api/*/export-json` and nested lesson export). Matrix-driven category/runtime and ACT props checks fail closed; coverage added in `tests/export-runtime-gate.test.ts`.

9. Enforce deterministic rejection envelope across all ingest paths.
   Exit Gate: Validation failures and RPC failures return the same structured envelope with stable codes and field-path targeting.
   Owner: CMS Platform (Sandbox Data Lane)
   Status: Closed (2026-04-10) - generic ingest rejection envelope v1 is now emitted by all import APIs via `lib/importGate.ts` (`buildImportRejectionEnvelope` + `buildImportRejectionResponse`) with deterministic code/field classification and RPC normalization; coverage added in `tests/import-rejection-envelope.test.ts` plus existing activity envelope tests.

10. Complete deterministic import -> DB -> export parity suite.
    Exit Gate: Parity tests pass for each active component family and active ACT lane (`ACT-001..ACT-005`, `ACT-009..ACT-026`).
    Owner: CMS Platform (Sandbox Data Lane)
    Status: Closed (2026-04-10) - parity suite now includes component-family parity plus active ACT sweep (`ACT-001..ACT-005`, `ACT-009..ACT-026`) in `tests/import-export-parity.test.ts`; full `npm run check` passes with parity coverage active.

11. Complete drift CI gates.
    Exit Gate: CI fails on divergence between dictionary requiredness, shape-lock, activation rules, preflight/ingest validators, and authority docs.
    Owner: CMS Platform (Sandbox Data Lane)
    Status: Closed (2026-04-10) - drift CI now enforces matrix/activation consistency for non-activity ingest-required fields, activity preflight wiring to shape-lock boundaries, and ACT status-table alignment in `central/ACTIVITY_PROFILES.md`, in addition to existing naming/seed/shape-lock drift assertions (`tests/drift-gates.test.ts`); full `npm run check` passes.

12. Synchronize authority docs.
    Exit Gate: `central/INGEST_CONTRACT.md`, `central/ACTIVITY_PROFILES.md`, `central/FIELD_DICTIONARY.md`, `central/SCHEMA.md`, and `central/OPEN_ITEMS.md` contain no contradictions against implemented behavior.
    Owner: CMS Platform (Sandbox Data Lane)
    Status: Closed (2026-04-10) - authority-doc contradiction sweep completed and normalized; drift assertions for doc/code consistency pass in `tests/drift-gates.test.ts`.

13. Publish final proof packet and closeout signoff.
    Exit Gate: One closeout artifact includes test output, drift-gate output, SQL verification output, parity output, and explicit GO/NO-GO signoff.
    Owner: CMS Platform (Sandbox Data Lane)
    Status: Closed (2026-04-11) - closeout artifact published at `central/CMS_CLOSEOUT_REPORT.md` with owner-signed GO packet linked from `cutover-backups/20260410-235434/reapply-20260411-001839/r8-go-no-go-signoff.md`.

## Recently Closed
1. `ACT-NAMING-001`: canonical slide-family update key is `slideId`; `slideUuid` forbidden.
2. `CMP-NAMING-001`: canonical component token is `lesson_ends`; naming-layer rules locked.
3. `lesson_end_field_values` constraint parity: `lesson_end_field_values_no_system_slide_id_check` explicit and present.
4. Retirement closeout owner-side GO/NO-GO acceptance signed (`GO`) in `cutover-backups/20260410-235434/reapply-20260411-001839/r8-go-no-go-signoff.md`.
5. Post-cutover cleanup completed: temporary orchestration artifact retired from active authority path (`central/FACTORY_RESET_ORCHESTRATION_PLAN.md` moved to `archive/central/FACTORY_RESET_ORCHESTRATION_PLAN.md`).
6. Telemetry + L6 cutover proof packet published at `central/TELEMETRY_L6_CUTOVER_PROOF.md` with deterministic PASS evidence links.
7. Original CMS backup reference recorded and closed at `central/ORIGINAL_CMS_BACKUP_REFERENCE.md` with immutable bundle checksum and storage path.

## Reopen Rule
If any contract, schema, naming, or requiredness drift is discovered, add a new item here before merging additional behavior changes.
