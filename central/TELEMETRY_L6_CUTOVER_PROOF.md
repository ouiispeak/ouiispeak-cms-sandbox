Authority Role: canonical
Artifact Type: telemetry-l6-cutover-proof
Canonical Source: central/TELEMETRY_L6_CUTOVER_PROOF.md
Constitution Reference: central/CONSTITUTION.md

# Telemetry + L6 Cutover Proof Packet

Date: 2026-04-11
Owner: CMS Platform (Sandbox Data Lane)
Repository: ouiispeak-cms-sandbox

## Purpose
Provide deterministic evidence that telemetry integration is operational and that L6-required signals remain intact across the cutover gates.

## Canonical Run Root
`/Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover-backups/20260410-235434/reapply-20260411-001839`

## Gate Outcome
Source: `ws6-telemetry-l6/ws6-gate-status.final.env`

Result:
1. `ws6_status=PASS`

## Deterministic WS6 Exit Codes
Source: `ws6-telemetry-l6/exit-codes.final.env`

Results:
1. `lv2_vitest_exit=0`
2. `lv2_handshake_e_exit=0`
3. `tele_handshake_d_exit=0`
4. `tele_wp43_exit=0`

## Telemetry DB Readiness Evidence
Sources:
1. `ws6-telemetry-l6/00-tele-migrations-apply.log`
2. `ws6-telemetry-l6/00-tele-schema-check.txt`
3. `ws6-telemetry-l6/20-tele-grants.log`

Result:
1. Required telemetry tables/views are present.
2. Required grants for validator/read-model smokes are applied.

## Fresh Player Cross-Check (R6/R0.6)
Source directory:
`r6-r06-fresh-player-20260411-004918/`

Gate source: `r6-r06-fresh-player-20260411-004918/08-gate-status.env`

Result:
1. `r6_r06_fresh_status=PASS`

Exit-code source: `r6-r06-fresh-player-20260411-004918/07-exit-codes.env`

Results:
1. `check_types_exit=0`
2. `vitest_bundle_exit=0`
3. `whisper_health_exit=0`
4. `check_speaking_stack_pass_exit=0`
5. `check_speaking_stack_missing_env_exit=1` (expected fail-closed)
6. `check_speaking_stack_unreachable_exit=1` (expected fail-closed)
7. `route_smoke_exit=0`
8. `lecons_exit=0`
9. `lecons_canonical_exit=0`
10. `lab_lesson_exit=0`

## Conclusion
Telemetry + L6 cutover proof is complete and deterministic for this run.
