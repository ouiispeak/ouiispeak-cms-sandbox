Authority Role: canonical
Artifact Type: cms-closeout-report
Canonical Source: central/CMS_CLOSEOUT_REPORT.md
Constitution Reference: central/CONSTITUTION.md

# CMS Closeout Report

Date: 2026-04-10
Last Updated: 2026-04-11
Owner: CMS Platform (Sandbox Data Lane)
Repository: ouiispeak-cms-sandbox

## Purpose
Publish one deterministic closeout artifact with proof outputs for:
1. Full gate health
2. Drift-gate health
3. SQL verification
4. Import/export parity
5. Explicit GO/NO-GO signoff

## Proof Commands And Results

### 1) Full gate set
Command:
```bash
npm run check
```
Result:
1. Pass (`lint`, `typecheck`, `test`, `check:activity-rpc-boundary`, `build`)
2. `check:activity-rpc-boundary` output: `Activity RPC boundary check passed.`

### 2) Drift gate snapshot
Command:
```bash
npm test -- tests/drift-gates.test.ts
```
Result:
1. Pass
2. Summary: `tests=100, pass=100, fail=0`

### 3) Parity snapshot
Command:
```bash
npm test -- tests/import-export-parity.test.ts
```
Result:
1. Pass
2. Active ACT parity lane test present and passing:
   - `activity_slides import/export parity is deterministic across active ACT lanes`

### 4) SQL verification snapshot (local Supabase)
Tables:
```sql
select tablename from pg_tables where schemaname='public' order by tablename;
```
Result:
1. 22 public tables present, including:
   - `component_config_fields`
   - `activity_slide_field_values`
   - `title_slide_field_values`
   - `lesson_end_field_values`

Views:
```sql
select table_name from information_schema.views where table_schema='public' order by table_name;
```
Result:
1. `config_component_fields`
2. `config_universal_fields`

Guard triggers:
```sql
select event_object_table as table_name, trigger_name, action_timing
from information_schema.triggers
where trigger_schema='public'
  and trigger_name in (
    'field_dictionary_sync_to_universal',
    'field_dictionary_component_rules_sync',
    'activity_slide_structured_payload_guard'
  )
order by event_object_table, trigger_name;
```
Result:
1. All three named guard triggers are present.

Critical no-system-id constraints:
```sql
select conname
from pg_constraint
where conname in (
  'lesson_end_field_values_no_system_slide_id_check',
  'activity_slide_field_values_no_system_slide_id_check',
  'title_slide_field_values_no_system_slide_id_check'
)
order by conname;
```
Result:
1. All three constraints are present.

Atomic import RPC surface:
```sql
select proname
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and proname like 'import\_%\_atomic' escape '\'
order by proname;
```
Result:
1. 14 atomic RPC functions present (`create` + `update` for modules, lessons, groups, slides, activity_slides, title_slides, lesson_ends).

### 5) Telemetry + L6 cutover proof packet
Source:
1. `central/TELEMETRY_L6_CUTOVER_PROOF.md`

Result:
1. PASS evidence recorded for WS6 (`lv2_vitest_exit=0`, `lv2_handshake_e_exit=0`, `tele_handshake_d_exit=0`, `tele_wp43_exit=0`).
2. Fresh player cross-check recorded for R6/R0.6 (`r6_r06_fresh_status=PASS`).

## Authority Doc Synchronization Status (#12)
Status: complete

Verified synchronized docs:
1. `central/INGEST_CONTRACT.md`
2. `central/ACTIVITY_PROFILES.md`
3. `central/FIELD_DICTIONARY.md`
4. `central/SCHEMA.md`
5. `central/OPEN_ITEMS.md`

Verification basis:
1. Drift-gate assertions covering doc/code consistency are passing.
2. No contradiction findings remained in the final manual sweep.

## Explicit Signoff
Timestamp (local): 2026-04-11 00:34:00 CEST (+0200)
Timestamp (UTC): 2026-04-10 22:34:00 UTC

Engineering readiness (repo behavior gates): GO

Retirement freeze readiness (operational closeout prerequisites): GO

Owner-signed GO record:
1. `cutover-backups/20260410-235434/reapply-20260411-001839/r8-go-no-go-signoff.md`

## Next Required Owner Actions
1. Record original CMS backup reference in repo docs.
2. Keep LV2 naming mismatch cleanup in deferred post-cutover rehaul lane (non-blocking).
