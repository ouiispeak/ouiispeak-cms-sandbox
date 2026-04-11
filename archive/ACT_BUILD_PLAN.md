# OuiiSpeak Activity Slides — Build Plan
**Status: PENDING RAYCHEL APPROVAL**
**Agents: A (Codex) + B (Claude) | Revised: 2026-04-08**

---

## ⚠️ Anti-Drift Rule (Read First)

**The CMS sandbox is the final system. It is not a prototype.**

This build plan exists to move forward toward a clean, correct architecture — not to port, replicate, or reference patterns from the original CMS. Every decision must be justified by current code in the current target repo. No legacy patterns carry forward by default.

Rules:
- Every file reference in this plan includes an absolute repo path and line number in the **exact target repo**.
- No activity routing tables, hardcoded component maps, or ACT-id-to-component bindings from the original CMS are carried forward.
- If an agent references a file that cannot be found in the current target repo, that agent must re-audit before executing.
- **Findings from `Developer/ouiispeak-cms-sandbox` cannot be used as authority for `Desktop/ouiispeak-cms`, and vice versa. These are different repos.**

### Repo Map (Canonical Reference)
| Repo | Path | Role |
|------|------|------|
| CMS Sandbox | `Developer/ouiispeak-cms-sandbox/` | **Target build repo** — this is the final system |
| Lesson Player | `ouiispeak/` | Player runtime — source of truth for dispatch/render behavior |
| Old CMS | `Desktop/ouiispeak-cms/` | **Do not reference** — archived, not the target |

---

## ⚠️ Pre-C0 Decision Required (Blocking)

**Before any C0 work begins, Raychel must make one explicit decision on activity slide data storage.**

### The Fork

**Current state:**
- CMS sandbox stores activity slides in a **dedicated table**: `activity_slides` + `activity_slide_field_values`
  - Source: `Developer/ouiispeak-cms-sandbox/supabase/manual/016_activity_slides_setup.sql` lines 7, 15
  - Dedicated lib: `Developer/ouiispeak-cms-sandbox/lib/activitySlides.ts`
  - Dedicated API routes: `Developer/ouiispeak-cms-sandbox/app/api/activity-slides/`
- Lesson player mock provider reads activity slides from **`slides` + `slide_field_values`**
  - Source: `ouiispeak/src/lib/lesson-provider/player-provider.ts` lines 370–385

These two paths do not connect. A slide written by the CMS sandbox into `activity_slides` cannot be read by the player's mock provider without a provider update.

**Option A — Stay on `slides` + `slide_field_values` for now:**
- Requires removing/bypassing the sandbox's dedicated `activity_slides` tables for the lab testing lane.
- Player mock provider works today with no changes.
- Lower integration cost for C0 testing, but defers the `activity_slides` architecture question.

**Option B — Commit to `activity_slides` and update the provider:**
- Requires updating `ouiispeak/src/lib/lesson-provider/player-provider.ts` to read from `activity_slides` + `activity_slide_field_values`.
- More work before C0, but aligns the final data architecture now.
- Correct long-term choice if `activity_slides` is the intended permanent table.

**This decision must be made explicitly. The plan cannot proceed with an implicit assumption either way.**

---

## Known Bug Status: `activity_row_tool` Default (Resolved)

This item is no longer a blocker.

Current CMS edit defaults now seed valid tool names (not ACT id strings) in:
- `Developer/ouiispeak-cms-sandbox/app/edit-activity-slide/[activitySlideId]/page.tsx`

Examples now in code:
- ACT-001 -> `"ChipSequencePlayer"`
- ACT-002 -> `"ChipSelector"`
- ACT-003 -> `"MinimalPairSelector"`
- ACT-004 -> `"ChipSelector"`
- ACT-005 -> `"SequentialRecorder"`

Rule remains: `activity_row_tool` must always be a valid `ActivityRowTool` value. ACT ids are never valid tool names.

---

## Agreed Architecture (All Three Agents)

These rules are locked. No agent disputes any of them.

### Dispatch Authority
- `runtimeContractV1.interaction.activity_row_tool` is the render dispatch key **in the current `ActivitySlide` runtime path**.
- Source: `ouiispeak/src/components/slides/ActivitySlide.tsx` — comment reads: *"Dispatches strictly by canonical runtime contract interaction metadata, never by ACT id routing tables."*
- The activity registry (`ouiispeak/src/lib/activity/activity-registry.ts`) is referenced only for error message hints, not for rendering.

### `activityId` Role
- Still required on every activity slide.
- Serves identity, telemetry (IR-7 enforcement), audit, and governance.
- Is not the render switch in the current ActivitySlide path.

### `lines` Status for ACT-001
- **Not retired. Currently active.** `ChipSequencePlayerScene` reads `rawProps.lines` directly.
- Source: `ouiispeak/src/components/lesson/activity/ToolRuntimeSurface.tsx`
- `ouiispeak/src/lessons/types.ts` comment: *"The CMS now sends `lines: AudioLabelCell[][]` directly."*
- Required content payload. Missing `lines` for ACT-001 must **fail contract validation** — not mount empty. Fail closed.

### No-Fallback / Fail-Closed Policy
- Missing or malformed `runtimeContractV1` → hard stop, error message, nothing renders.
- Missing required ACT content payload (e.g. `lines` for ACT-001) → **fails contract validation before render**.
- No silent defaults. No graceful degradation.

---

## P1 Bug: Schema/Runtime Mismatch (Fix in Pre-C0 Gate)

### The Problem
`ouiispeak/src/contracts/lesson/lesson-contract.v1.ts` defines `activitySlideSchema` with:
```ts
propsJson: z.record(z.string(), z.unknown()).optional()
```
This allows a `type: "activity"` slide to pass schema validation with no `propsJson` at all.

`ouiispeak/src/components/slides/ActivitySlide.tsx` requires `propsJson.runtimeContractV1.interaction.activity_row_tool` to be present and valid to render anything.

**Result:** A slide can pass schema validation, write to DB, import/export cleanly, and then hard-fail at render time. Round-trip tests will not catch this.

### The Fix
Tighten `activitySlideSchema` in `ouiispeak/src/contracts/lesson/lesson-contract.v1.ts` for `type: "activity"` slides:

1. `propsJson` is **required** (not optional).
2. `propsJson.runtimeContractV1` is **required**.
3. `propsJson.runtimeContractV1.contractVersion` is **required** and must equal `"v1"` (canonical value: `LESSON_CONTRACT_V1_VERSION`).
4. `propsJson.runtimeContractV1.interaction` is **required**.
5. `propsJson.runtimeContractV1.interaction.activity_row_tool` is **required** and must be a valid `ActivityRowTool` value — **never an ACT id string**.
6. `propsJson.runtimeContractV1.interaction.command_row_controls` is **required** (empty array `[]` is valid).
7. `propsJson.runtimeContractV1.interaction.status` is **required**, must be `"active"` or `"inactive"`.
8. `activityId` remains required as identity/governance key.
9. ACT-specific payload checks added in phases (C1: `lines` required for ACT-001, with explicit validity: at least one row, at least one cell per row, all cells with non-empty required content — "present but unusable" fails at contract time).

**Interaction field strictness: STRICT MODE.** All interaction subfields required. No runtime defaults.

**`contractVersion` lock: `"v1"` only** for this lane. `ouiispeak/src/lessons/types.ts` currently allows `'v1' | '1.0.0' | string` (broad). This plan narrows it to `"v1"`.

**`status: "inactive"` render path:** Already implemented in `ouiispeak/src/components/slides/ActivitySlide.tsx`. Not deferred.

---

## Minimum Valid ACT-001 `propsJson`

```json
{
  "runtimeContractV1": {
    "contractVersion": "v1",
    "interaction": {
      "activity_row_tool": "ChipSequencePlayer",
      "command_row_controls": ["play", "pause"],
      "status": "active"
    }
  },
  "lines": [
    [
      {
        "label": "Bonjour",
        "speech": {
          "mode": "tts",
          "lang": "fr",
          "text": "Bonjour"
        }
      }
    ]
  ]
}
```

**Rules:**
- `activity_row_tool` must be `"ChipSequencePlayer"` — the tool name, not `"ACT-001"`.
- `lines` is `AudioLabelCell[][]` — array of rows, each row an array of cells.
- `command_row_controls` is required (can be `[]`).
- `status` is required (`"active"` or `"inactive"`).
- `contractVersion` must be `"v1"`.

---

## Build Phases

### Pre-C0 Gate — Hard Prerequisites (Do These First)
**All items in this gate must be resolved before C0 begins.**

- [ ] **[Decision]** Raychel selects Option A or Option B for activity slide data storage (see Pre-C0 Decision above).
- [x] **[Resolved]** Default seed now uses valid `activity_row_tool` values in `Developer/ouiispeak-cms-sandbox/app/edit-activity-slide/[activitySlideId]/page.tsx`.
- [ ] **[Schema fix]** Update `activitySlideSchema` in `ouiispeak/src/contracts/lesson/lesson-contract.v1.ts` per the fix above.
- [ ] Lock `contractVersion` to `"v1"` for this lane.
- [ ] Add strict validation for all `interaction` subfields.
- [ ] If Option B selected: update `ouiispeak/src/lib/lesson-provider/player-provider.ts` to read from `activity_slides` + `activity_slide_field_values`.
- [ ] Add renderability tests (see test suite below).
- [ ] **No import, no DB write, no render** proceeds unless all of the above are done.

---

### C0 — JSON-First ACT-001 Path
**Scope:** Validate the full pipeline with raw JSON. No CMS UI editor yet.

- [ ] POST `Developer/ouiispeak-cms-sandbox/app/api/activity-slides/import-json` with `mode=create` accepts and writes a valid ACT-001 payload.
- [ ] POST with `mode=update` accepts `slideId` at top level and updates correctly.
- [ ] Slide writes to DB with correct `activityId`, `runtimeContractV1`, `lines`, and parent `groupId`.
- [ ] `runtimeContractV1` persists without loss or transformation.
- [ ] `lines` persists without loss or transformation.
- [ ] Export round-trip: exported JSON matches imported JSON exactly (no field loss, no silent defaults).
- [ ] Slide renders correctly in lesson player (`ChipSequencePlayer` mounts, lines play).
- [ ] Telemetry: IR-7 enforced — `activityId` present in emitted events when `isActivitySlide=true`.

---

### C1 — ACT-001 Shape-Lock + CMS UI Editor
**Scope:** Build the authoring UI that produces the exact same JSON shape C0 validated.

- [ ] `lines` editor: add row, remove row, per-cell label + audio mode + TTS language controls.
- [ ] Editor writes activity slide fields in identical shape to the C0 JSON.
- [ ] No generic mapper. Full UI clone of original CMS `lines` component pattern.
- [ ] Live controls only — no dead/preview-only controls.
- [ ] Editor output passes the same schema validation as JSON import.
- [ ] Import/export parity test: editor-authored slide and JSON-imported slide produce identical field values.
- [ ] Add ACT-001-specific contract check: `lines` required and valid (at least one row, one cell, non-empty content).

---

### C2+ — Subsequent ACT Rollout
**Scope:** After ACT-001 is fully validated end-to-end, apply same pattern to remaining activities.

- Each ACT gets JSON-first path first (same C0 pattern).
- Each ACT gets its own shape-lock (required fields documented in activity field lists).
- CMS UI editor for each ACT built to match shape-locked JSON.
- Same no-fallback, fail-closed rules apply to every ACT.
- No ACT-id routing tables introduced at any point.

---

## Required Test Suite

### Contract / Schema Tests (Pre-C0 Gate)
| Input | Expected Result |
|-------|----------------|
| Activity slide with no `propsJson` | Fails contract validation |
| Activity slide with `propsJson` but no `runtimeContractV1` | Fails contract validation |
| Activity slide with `runtimeContractV1` but no `interaction` | Fails contract validation |
| Activity slide with `activity_row_tool: "ACT-001"` (ACT id, not tool name) | Fails contract validation |
| Activity slide with invalid `activity_row_tool` | Fails contract validation |
| Activity slide with `contractVersion: "1.0.0"` (wrong value) | Fails contract validation |
| Activity slide with missing `command_row_controls` | Fails contract validation |
| Activity slide with missing `status` | Fails contract validation |
| Activity slide with `status: "inactive"` and valid `activity_row_tool` | Passes schema, renders inactive message in player |
| Valid ACT-001 payload (full required shape) | Passes contract validation |

### ACT-001 Shape-Lock Tests (C1)
| Input | Expected Result |
|-------|----------------|
| ACT-001 payload missing `lines` | Fails contract validation |
| ACT-001 payload with `lines: []` (empty array) | Fails contract validation |
| ACT-001 payload with `lines: [[]]` (row with no cells) | Fails contract validation |
| ACT-001 payload with a cell missing required content (e.g. empty `label`) | Fails contract validation |
| ACT-001 payload with valid `lines` (at least one row, one cell, non-empty content) | Passes, renders ChipSequencePlayer |

### Import/Export Parity Tests (C0)
| Test | Expected Result |
|------|----------------|
| Import ACT-001 JSON → export → compare | No field loss, no silent defaults, identical shape |
| Update ACT-001 via JSON (`mode=update`) → re-export | Changes landed correctly, no regression |

### Render Tests (C0)
| Input | Expected Result |
|-------|----------------|
| Valid ACT-001 payload | Player mounts ChipSequencePlayer, lines render |
| ACT-001 missing `runtimeContractV1` | Player shows error, no tool mounts |
| ACT-001 with `status: "inactive"` | Player shows inactive message |

### Telemetry Tests (C0)
| Test | Expected Result |
|------|----------------|
| ACT-001 slide emits events | `activityId` present (IR-7 compliance) |
| Activity slide missing `activityId` | `enforceIr7ActivityId()` throws |

---

## Locked Rules Summary

| Rule | Source | Status |
|------|--------|--------|
| Render dispatch is by `runtimeContractV1.interaction.activity_row_tool` in ActivitySlide path | `ouiispeak/src/components/slides/ActivitySlide.tsx` | Locked |
| `activityId` is identity/telemetry only, not render dispatch | `ouiispeak/src/components/slides/ActivitySlide.tsx` + `ouiispeak/src/lib/telemetry/emitTelemetry.ts` | Locked |
| `lines` is required content for ACT-001, missing = fail closed | `ouiispeak/src/components/lesson/activity/ToolRuntimeSurface.tsx` + `ouiispeak/src/lessons/types.ts` | Locked |
| `propsJson` must be required for activity slides | **Fix needed** in `ouiispeak/src/contracts/lesson/lesson-contract.v1.ts` | Pre-C0 gate |
| `contractVersion` must be `"v1"` for this lane | `ouiispeak/src/contracts/lesson/lesson-contract.v1.ts` (`LESSON_CONTRACT_V1_VERSION`) | Locked |
| `activity_row_tool` must be a valid tool name, never an ACT id | `ouiispeak/src/components/slides/ActivitySlide.tsx` | Locked |
| `command_row_controls` required (can be `[]`) | This plan — strict mode | Locked |
| `status` required (`"active"` or `"inactive"`) | This plan — strict mode | Locked |
| No fallback rendering — fail closed | `ouiispeak/src/components/slides/ActivitySlide.tsx` | Locked |
| No ACT-id routing tables in new lane | `ouiispeak/src/components/slides/ActivitySlide.tsx` comment | Locked |
| Schema and runtime must enforce identical rules | This plan | Pre-C0 gate |
| Activity slide data storage path (Option A vs B) | **Decision required** | Pre-C0 gate |

---

*Prepared by Agent B (Claude). Verified by Agent A (Codex). All agent edits applied. Pre-C0 decision on data storage path required from Raychel before execution begins.*
