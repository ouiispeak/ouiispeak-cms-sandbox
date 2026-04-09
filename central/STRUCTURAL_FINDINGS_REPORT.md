Authority Role: audit
Artifact Type: structural-findings-report
Canonical Source: central/STRUCTURAL_FINDINGS_REPORT.md
Constitution Reference: central/CONSTITUTION.md

# Structural Findings Report

Date: 2026-04-09
Repository: ouiispeak-cms-sandbox
Status: all findings fixed now (no defer bucket)

## Scope
1. Duplicate audit: files, definitions, overlapping logic
2. SQL chain audit: merged/ordered migration set and retirement-safe history
3. Constraint parity audit for `_field_values` tables
4. Simplification audit for immediate, safe reductions

## Must-Fix Findings (Resolved)
1. Constraint parity hardening gap in boundary components:
   - `supabase/manual/013_title_slide_boundary_setup.sql` lacked idempotent backfill for `title_slide_field_values_no_system_slide_id_check`.
   - `supabase/manual/016_activity_slides_setup.sql` lacked idempotent backfill for `activity_slide_field_values_no_system_slide_id_check`.
   - Fix applied: both migrations now include `DO` blocks with `IF NOT EXISTS` before `ALTER TABLE ... ADD CONSTRAINT ... CHECK (field_name <> 'slideId')`.

2. SQL chain duplication drift vector in guide docs:
   - Full migration list was duplicated in non-authority docs.
   - Fix applied: guide docs now reference canonical chain instead of restating it.
   - Updated:
     - `README.md`
     - `docs/LOCAL_SUPABASE_MANUAL_SETUP.md`

## Audit Results
1. Duplicate file-content audit across `app`, `lib`, `central`, `docs`, `supabase`, `tests` found no exact duplicate files.
2. SQL chain order is internally consistent:
   - `central/CONSTITUTION.md` `setup_sql_order` matches `supabase/manual` directory sequence.
3. Constraint parity is now explicit across all runtime `_field_values` tables.
4. Overlapping logic in component libs is intentional and centralized through shared engine patterns; no unsafe duplication requiring immediate refactor.

## Simplification Outcome
1. Immediate safe simplification completed: removed duplicate SQL-order definitions from non-authority docs.
2. No additional low-risk simplifications were found that can be applied now without introducing refactor risk.

## Verification
1. `npm run lint` passed.
2. `npm run typecheck` passed.
3. `npm run test` passed (44/44).
4. `npm run check:activity-rpc-boundary` passed.
5. `npm run build` passed.

## Defer Bucket
None.
