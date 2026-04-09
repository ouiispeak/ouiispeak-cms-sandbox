Authority Role: guide
Artifact Type: agent-operating-rules
Canonical Source: central/CONSTITUTION.md
Constitution Reference: central/CONSTITUTION.md

# Agent Rules

Date: 2026-04-05
Repository: ouiispeak-cms-sandbox

## Rules

1. Do not assume you can improve the system or implement things beyond the requested scope.
2. Do not treat two routes or surfaces as equivalent without verifying the actual route contract in code first (for example, "curriculum hierarchy page" is not automatically the same as "/levels"). If the instruction names one surface, change only that surface.
3. If a requested change requires a prerequisite that is not explicitly requested (for example, creating a new table, schema object, migration, or backend contract), stop and report back first. Do not implement that prerequisite until the user explicitly approves it.
4. Naming law: repo-side names must use camelCase; database-side names must follow Supabase/Postgres naming conventions (snake_case).
5. When behavior changes, update laws and operation-order docs in the same turn so repository rules stay aligned with implementation.
6. No bandaid fixes when a full long-term solution is available. If a temporary workaround is considered, stop and ask for explicit user approval first, and justify why the workaround is necessary (for example, compatibility uncertainty, staged stability validation, or blocked dependency constraints).
7. Agent/developer interpretation is not allowed as a final decision authority. If a behavior, UX, or architecture decision is not explicitly specified, propose the decision to the user first and wait for explicit approval before implementing it.
8. No fallbacks, no legacy compatibility layers, no dual-write paths, and no parallel old/new contracts are allowed in this repo unless explicitly approved by the user in advance for a narrowly scoped exception. This repo defines the baseline contract; implementations must be direct, singular, and authoritative.
