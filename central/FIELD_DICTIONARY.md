Authority Role: canonical
Artifact Type: field-dictionary-completion
Canonical Source: central/FIELD_DICTIONARY.md
Constitution Reference: central/CONSTITUTION.md

# FIELD_DICTIONARY

Date: 2026-04-09
Last Updated: 2026-04-10
Owner: CMS Platform (Sandbox Data Lane)
Repository: ouiispeak-cms-sandbox
Machine companion: central/FIELD_DICTIONARY.csv

## Deliverable Status
1. Active fields covered from public.field_dictionary: 208
2. Uncategorized active fields: 0
3. Definitions populated in machine companion: 208
4. Definitions requiring source input: 0
5. Lesson Player requiredness explicitly sourced in repo: 36
6. LV2 requiredness explicitly sourced in repo: 178

## Columns In Machine Companion
1. definition/description
2. type
3. component scope
4. requiredness for lesson_player + supabase
5. requiredness for lv2
6. affects lineage tags (telemetry/lv2/player/ingest/supabase)
7. usage rationale (runtime/ingest intent summary)
8. evidence paths (canonical source file references for traceability)

## Source Notes
1. Canonical machine companion definitions are populated for all active fields from staged user input.
2. This promotion updated `central/FIELD_DICTIONARY.csv`; DB authority table `public.field_dictionary.definition` remains a separate sync step.
3. The matrix does not invent missing states. When repo sources are silent, entries are marked not_specified_in_repo.
4. Exit gate check: 100% active field coverage is met.
5. Exit gate check: zero uncategorized active fields is met.
