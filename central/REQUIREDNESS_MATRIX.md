Authority Role: canonical
Artifact Type: requiredness-matrix-spec
Canonical Source: central/REQUIREDNESS_MATRIX.csv
Constitution Reference: central/CONSTITUTION.md

# REQUIREDNESS_MATRIX

Date: 2026-04-10
Last Updated: 2026-04-10
Owner: CMS Platform (Sandbox Data Lane)
Repository: ouiispeak-cms-sandbox

## Purpose
`central/REQUIREDNESS_MATRIX.csv` is the canonical requiredness matrix for ingest, DB, and runtime/export gates.

## Columns
1. `field_key`
2. `component_name`
3. `act_id` (blank when ACT-specific scoping does not apply)
4. `operation` (`category_payload`, `propsJson`, or other explicit lane marker)
5. `required_from_lv2`
6. `required_at_ingest`
7. `required_in_db`
8. `required_for_runtime`
9. `system_generated`
10. `generator_owner` (`lv2`, `cms`, `db`, `unknown`)
11. `evidence_source`
12. `evidence_reference`
13. `decision_status` (`locked`, `provisional`, `blocked`)

## Allowed Values
For requiredness flags (`required_from_lv2`, `required_at_ingest`, `required_in_db`, `required_for_runtime`):
1. `true`
2. `false`
3. `unknown`
4. `conditional_one_of` (only when a one-of group is explicitly enforced by authority code)

For `system_generated`:
1. `true`
2. `false`
3. `unknown`

## No-Assumption Rule
1. `unknown` means evidence is missing and the row cannot be treated as final.
2. Rows marked `provisional` must not be silently promoted to `locked` without evidence updates.
3. Evidence must cite concrete source files/tables in this repo/lane.
