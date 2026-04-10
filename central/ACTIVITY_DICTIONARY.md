Authority Role: canonical
Artifact Type: activity-dictionary
Canonical Source: central/ACTIVITY_DICTIONARY.md
Constitution Reference: central/CONSTITUTION.md

# ACTIVITY DICTIONARY
# OuiiSpeak — All Activity Types (ACT-001 through ACT-026)
# Last Updated: 2026-04-10
# Purpose: Sandbox-authoritative reference for all activity types (ACT-001..ACT-026) used for CMS ingest/export and downstream handoff.
# Status: Compiled from current code in ouiispeak-cms-sandbox + runtime cross-checks in ouiispeak

---

## Authority Map

| What | Authority | File |
|------|-----------|------|
| Pedagogical metadata (name, category, skill domain, telemetry, grading) | LV2 | `lesson-compiler-core-v2/shared/activity-registry.ts` |
| Runtime component defaults for sandbox authoring (activity_row_tool + command_row_controls) | Sandbox CMS | `lib/activityRuntimeDefaults.ts` (`ACTIVITY_PROFILE_DEFAULTS`) |
| Required payload shape/cardinality (ingest lane) | Sandbox CMS | `lib/activityShapeLock.ts`, `lib/activitySlidePreflight.ts` |
| Required payload shape/cardinality (runtime lane) | Player Contract | `src/contracts/lesson/lesson-contract.v1.ts` |
| Runtime dispatch authority (when runtimeContractV1.interaction is present on a slide) | Player Contract | `src/contracts/lesson/lesson-contract.v1.ts` |
| Authoring UI field configs and validation rules (legacy authoring guidance) | Old CMS | `lib/contract/slideTypeConfigFromContract.ts` |
| DB schema, RPC, and write guards | Sandbox CMS | `supabase/manual/016_activity_slides_setup.sql` |
| Field activation seeds (component rules) | Sandbox CMS | `supabase/manual/012_component_activation_seed.sql` (lines 413, 548) |
| ACT-001 slide field setup | Sandbox CMS | `supabase/manual/015_act_001_slide_setup.sql` |
| Telemetry event validation | Tele | `lib/events.ts` |

---

## Status Summary

| Status | ACTs |
|--------|------|
| Active — system-defined (23) | ACT-001, 002, 003, 004, 005, 009, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022, 023, 024, 025, 026 |
| Inactive / Disabled (3) | ACT-006, ACT-007, ACT-008 (all deprecated in WP-H0 manifest hardening) |
| Sandbox CMS — fully wired (UI + profile + preflight) | ACT-001, 002, 003, 004, 005, 009..026 |

> ✅ **C16 complete (2026-04-09)**: All 23 active ACTs are fully wired in sandbox CMS — `activityProfiles.ts` (`ACTIVITY_PROFILE_EXTRA_FIELDS`), `lib/activityRuntimeDefaults.ts` (`ACTIVITY_PROFILE_DEFAULTS`) plus `edit-activity-slide/page.tsx` (`COMPOSITE_FIELD_GROUPS`), and `activitySlidePreflight.ts` (preflight validation).

---

## Language Policy

- Learner cohort: French L1 students learning **English**.
- Authoring examples in this document use English learning content.
- Sandbox currently system-assigns `targetLanguage = "english"` on ingest/update (`hierarchyComponentEngine.ts`).

---

## Activity Row Tool Reference

| Tool Name | Used By |
|-----------|---------|
| ChipSequencePlayer | ACT-001 |
| ChipSelector | ACT-002, ACT-004, ACT-011, ACT-012 |
| MinimalPairSelector | ACT-003 |
| SequentialRecorder | ACT-005, ACT-006, ACT-007, ACT-008 |
| AudioChoiceSelector | ACT-009, ACT-010 |
| ChipMatchPairs | ACT-013 |
| ChipWordSort | ACT-014, ACT-016 |
| ChipSequenceBuilder | ACT-015 |
| InlineGapTextInput | ACT-017 |
| WordBankInput | ACT-018 |
| ChipRetypeCorrection | ACT-019 |
| FreeRecorder | ACT-020, ACT-022, ACT-026 |
| ChipAudioMatcher | ACT-021 |
| AvatarDialoguePlayer | ACT-023 |
| SpeechComparer | ACT-024 |
| ReorderList | ACT-025 |

---

## Whisper Speech Service Required

> ⚠️ **Cross-repo only — not sandbox-active**: The CMS sandbox has no Whisper integration surface (`.env.example` shows Supabase config only, no Whisper keys). Whisper is a future integration owned by `ouiispeak-whisper`. The ACTs below require Whisper at runtime but this is not enforced or available in the sandbox CMS today.

ACT-005, ACT-006 (inactive), ACT-007 (inactive), ACT-008 (inactive), ACT-020, ACT-021, ACT-022, ACT-026

---

## Category Groups

| Category | ACTs |
|----------|------|
| listen | ACT-001, ACT-002, ACT-003, ACT-004, ACT-025 |
| repeat | ACT-005, ACT-006, ACT-007, ACT-008 |
| choice | ACT-009, ACT-010, ACT-011, ACT-012 |
| construct | ACT-013, ACT-014, ACT-015, ACT-016, ACT-017, ACT-018, ACT-019 |
| speak | ACT-020, ACT-021, ACT-022, ACT-026 |
| game | ACT-023, ACT-024 |

---

## Full Activity Definitions

---

### ACT-001 — Listen Only
- **Status**: Active
- **Category**: listen
- **Skill Domain**: Listening discrimination
- **Description**: Presentation slide with audio waveform animation
- **Activity Row Tool**: ChipSequencePlayer
- **Command Row Controls**: play
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: completion_only
- **Telemetry Fields**: complete (boolean)
- **Grading Mode**: non_scored
- **Completion Policy**: on_playback_end
- **Required Fields**: lines (AudioLabelCell[][] — array of rows, each with audio + label cells)
- **Validation Rules**: None beyond schema
- **CMS Display Name**: "Listen Only"
- **Sources**: Player activity-registry.ts:51–55 · LV2 activity-registry.ts:65–80 · Old CMS slideTypeConfigFromContract.ts:23

---

### ACT-002 — Stress Pattern Identification
- **Status**: Active
- **Category**: listen
- **Skill Domain**: Listening discrimination
- **Description**: Syllable block tap game
- **Activity Row Tool**: ChipSelector
- **Command Row Controls**: play, pause
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: correct (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `correctStressIndex` + at least one syllable source (`body` OR `syllableBreakdown` OR `syllables`)
- **Extra propsJson Fields**: `audioPrompt` (optional playable audio prompt), `syllableBreakdown` (optional structured breakdown)
- **Validation Rules**: Syllable source must resolve to at least one syllable item; `correctStressIndex` must be an integer, 1-based, and must not exceed resolved syllable count (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Stress Pattern Identification"
- **Sources**: Player activity-registry.ts:56–60 · LV2 activity-registry.ts:81–96

---

### ACT-003 — Minimal Pair Detection
- **Status**: Active
- **Category**: listen
- **Skill Domain**: Listening discrimination
- **Description**: Two audio buttons + same/different choice
- **Activity Row Tool**: MinimalPairSelector
- **Command Row Controls**: play
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: correct (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `promptMode` + `choiceElements` (minimum 2)
- **Extra propsJson Fields**: `audioA`, `audioB` (optional per-choice audio objects for pair presentation)
- **Validation Rules**: `promptMode` must be `same_different` or `select_word`; `choiceElements` must satisfy ACT choice schema cardinality; each `choiceElements` item requires a non-empty `label` and valid `speech` payload (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Minimal Pair Detection"
- **Sources**: Player activity-registry.ts:61–65 · LV2 activity-registry.ts:97–112

---

### ACT-004 — Intonation Pattern Match
- **Status**: Active
- **Category**: listen
- **Skill Domain**: Listening discrimination
- **Description**: Audio + icon choice row
- **Activity Row Tool**: ChipSelector
- **Command Row Controls**: play
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: correct (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `intonationOptions` (minimum 2), `correctCurveId`, and playable audio (`audioId` OR `audio.speech`/`audio.fileUrl`/`audio.audioUrl` OR `audioPrompt`)
- **Validation Rules**: `intonationOptions` must be unique; `correctCurveId` must be one of `intonationOptions`; playable audio must resolve via `audioId` or canonical `audio` object. Sandbox preflight accepts `audioPrompt` as alias and normalizes it (`activityPayloadNormalization.ts`, `activitySlidePreflight.ts`).
- **CMS Display Name**: "Intonation Pattern Match"
- **Special Notes**: ACT-004 had a propsJson / top-level field collision (intonationOptions + correctCurveId stored in both). Resolved Apr 8 — duplicate rows deleted, propsJson is now the single source for these fields.
- **Sources**: Player activity-registry.ts:66–70 · LV2 activity-registry.ts:113–128

---

### ACT-005 — Listen and Repeat
- **Status**: Active
- **Category**: repeat
- **Skill Domain**: Pronunciation / Production
- **Description**: Audio playback + mic record button + waveform feedback
- **Activity Row Tool**: SequentialRecorder
- **Command Row Controls**: play, pause
- **Whisper Required**: Yes
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: scored
- **Telemetry Fields**: accuracy (number), transcription (string), attempt_count (number)
- **Grading Mode**: scored_threshold
- **Completion Policy**: on_submit
- **Required Fields**: `lines` (at least one row) OR non-empty `targetText`/`body`
- **Validation Rules**: When `lines` is present it must satisfy ACT-001 lines schema; when `lines` is absent, recorder source must be provided via `targetText` or `body` (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Listen and Repeat"
- **Special Notes**: Uses Whisper speech service for accuracy scoring
- **Sources**: Player activity-registry.ts:71–75 · LV2 activity-registry.ts:129–146 · Old CMS slideTypeConfigFromContract.ts:59–61

---

### ACT-006 — Shadowing ⛔ INACTIVE
- **Status**: INACTIVE — deprecated in WP-H0 manifest hardening
- **Category**: repeat
- **Skill Domain**: Pronunciation / Fluency
- **Description**: Audio + live mic input + visual rhythm bar
- **Activity Row Tool**: SequentialRecorder
- **Command Row Controls**: play, pause
- **Whisper Required**: Yes
- **MVP Priority**: Medium
- **Is Game Container**: No
- **Telemetry Shape**: scored
- **Telemetry Fields**: accuracy (number), word_count (number), duration (number)
- **Grading Mode**: soft_score
- **Completion Policy**: on_submit
- **CMS Display Name**: "Shadowing"
- **Sources**: Player activity-registry.ts:76–82 · LV2 activity-registry.ts:147–164 · Old CMS slideConstants.ts:76

---

### ACT-007 — Delayed Repetition ⛔ INACTIVE
- **Status**: INACTIVE — deprecated in WP-H0 manifest hardening
- **Category**: repeat
- **Skill Domain**: Pronunciation / Processing
- **Description**: Audio plays → timer bar → mic record
- **Activity Row Tool**: SequentialRecorder
- **Command Row Controls**: play, pause
- **Whisper Required**: Yes
- **MVP Priority**: Medium
- **Is Game Container**: No
- **Telemetry Shape**: scored
- **Telemetry Fields**: accuracy (number), delay_duration (number)
- **Grading Mode**: scored_threshold
- **Completion Policy**: on_submit
- **CMS Display Name**: "Delayed Repetition"
- **Sources**: Player activity-registry.ts:83–89 · LV2 activity-registry.ts:165–181 · Old CMS slideConstants.ts:77

---

### ACT-008 — Read Aloud ⛔ INACTIVE
- **Status**: INACTIVE — deprecated in WP-H0 manifest hardening
- **Category**: repeat
- **Skill Domain**: Pronunciation / Production
- **Description**: Text card + mic button + word-level error highlights
- **Activity Row Tool**: SequentialRecorder
- **Command Row Controls**: play, pause
- **Whisper Required**: Yes
- **MVP Priority**: Medium
- **Is Game Container**: No
- **Telemetry Shape**: scored_per_word
- **Telemetry Fields**: accuracy (number), mispronounced_words (string[])
- **Grading Mode**: scored_threshold
- **Completion Policy**: on_submit
- **CMS Display Name**: "Read Aloud"
- **Sources**: Player activity-registry.ts:90–96 · LV2 activity-registry.ts:182–198 · Old CMS slideConstants.ts:78

---

### ACT-009 — Multiple Choice — Audio
- **Status**: Active
- **Category**: choice
- **Skill Domain**: Listening discrimination / Grammar
- **Description**: Audio player + option tiles
- **Activity Row Tool**: AudioChoiceSelector
- **Command Row Controls**: play
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: selected_answer (string), correct (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `choiceElements` (minimum 2), `correctAnswer`, `audioPrompt` (playable source required)
- **Validation Rules**: `correctAnswer` must match a choice label or 1-based choice index (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Multiple Choice — Audio"
- **Sources**: Player activity-registry.ts:97–101 · LV2 activity-registry.ts:199–215 · Old CMS slideTypeConfigFromContract.ts:62–64

---

### ACT-010 — Multiple Choice — Text
- **Status**: Active
- **Category**: choice
- **Skill Domain**: Grammar / Vocabulary
- **Description**: Question text + option tiles
- **Activity Row Tool**: AudioChoiceSelector
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: selected_answer (string), correct (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `promptText`, `choiceElements` (minimum 2), `correctAnswer`
- **Validation Rules**: `correctAnswer` must match a choice label or 1-based choice index (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Multiple Choice — Text"
- **Sources**: Player activity-registry.ts:102–106 · LV2 activity-registry.ts:216–232 · Old CMS slideTypeConfigFromContract.ts:65–67

---

### ACT-011 — True / False
- **Status**: Active
- **Category**: choice
- **Skill Domain**: Grammar / Vocabulary
- **Description**: Statement card + two large buttons
- **Activity Row Tool**: ChipSelector
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: answer (boolean), correct (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `statement`, `correctAnswer`
- **Validation Rules**: `statement` is required; `correctAnswer` must be boolean-like (`true`/`false`) (`lesson-contract.v1.ts`)
- **CMS Display Name**: "True / False"
- **Sources**: Player activity-registry.ts:107–111 · LV2 activity-registry.ts:233–249

---

### ACT-012 — Odd One Out
- **Status**: Active
- **Category**: choice
- **Skill Domain**: Vocabulary / Listening discrimination
- **Description**: Item row with tap-to-select
- **Activity Row Tool**: ChipSelector
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: Medium
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: selected_item (string), correct (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `choiceElements`, `correctOddIndex`
- **Validation Rules**: `choiceElements` must have at least 3 items; `correctOddIndex` must be an integer, 1-based, and must not exceed `choiceElements` length (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Odd One Out"
- **Sources**: Player activity-registry.ts:112–116 · LV2 activity-registry.ts:250–266 · Old CMS slideTypeConfigFromContract.ts:68–70

---

### ACT-013 — Drag-and-Drop Match
- **Status**: Active
- **Category**: construct
- **Skill Domain**: Vocabulary / Grammar
- **Description**: Two-column drag interface
- **Activity Row Tool**: ChipMatchPairs
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary_per_item
- **Telemetry Fields**: match_accuracy (number), complete (boolean)
- **Grading Mode**: binary_per_item
- **Completion Policy**: on_all_placed
- **Required Fields**: matchPairs
- **Validation Rules**: `matchPairs` must contain at least 2 pairs; left and target values must be unique (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Drag-and-Drop Match"
- **Sources**: Player activity-registry.ts:117–121 · LV2 activity-registry.ts:267–283

---

### ACT-014 — Word Sort
- **Status**: Active
- **Category**: construct
- **Skill Domain**: Grammar / Vocabulary
- **Description**: Word chips + category drop zones
- **Activity Row Tool**: ChipWordSort
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary_per_item
- **Telemetry Fields**: correct_placements (number), incorrect_placements (number)
- **Grading Mode**: binary_per_item
- **Completion Policy**: on_all_placed
- **Required Fields**: categoryLabels, wordBank
- **Validation Rules**: `categoryLabels` must contain at least 2 unique categories; `wordBank` must contain at least 2 items; each `wordBank.category` must exist in `categoryLabels` (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Word Sort"
- **Sources**: Player activity-registry.ts:122–126 · LV2 activity-registry.ts:284–300

---

### ACT-015 — Sentence Reconstruction
- **Status**: Active
- **Category**: construct
- **Skill Domain**: Grammar behaviour
- **Description**: Word chips + target slot row
- **Activity Row Tool**: ChipSequenceBuilder
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: correct (boolean), move_count (number)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: sentenceTokens, correctOrderWords
- **Validation Rules**: `sentenceTokens` and `correctOrderWords` must each contain at least 2 tokens; lengths must match and both arrays must contain the same token multiset (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Sentence Reconstruction"
- **Sources**: Player activity-registry.ts:127–131 · LV2 activity-registry.ts:301–317

---

### ACT-016 — Tense Sort
- **Status**: Active
- **Category**: construct
- **Skill Domain**: Grammar behaviour
- **Description**: Card stack + labelled bins
- **Activity Row Tool**: ChipWordSort
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: Medium
- **Is Game Container**: No
- **Telemetry Shape**: binary_per_item
- **Telemetry Fields**: correct_placements (number)
- **Grading Mode**: binary_per_item
- **Completion Policy**: on_all_placed
- **Required Fields**: `tenseBins`, `sentenceCards`
- **Validation Rules**: `tenseBins` must have at least 2 unique values; `sentenceCards` must have at least 2 items; each `sentenceCards.correct_tense` must exist in `tenseBins` (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Tense Sort"
- **Sources**: Player activity-registry.ts:132–136 · LV2 activity-registry.ts:318–333

---

### ACT-017 — Fill in the Blank — Typed
- **Status**: Active
- **Category**: construct
- **Skill Domain**: Grammar / Vocabulary
- **Description**: Sentence with inline input field(s)
- **Activity Row Tool**: InlineGapTextInput
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: answer (string), correct (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `sentenceWithGaps`, `blanks`
- **Validation Rules**: `sentenceWithGaps` is required; `blanks` must include at least one item with unique 1-based `correctGapIndex` values within sentence token bounds (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Fill in the Blank — Typed"
- **Sources**: Player activity-registry.ts:137–141 · LV2 activity-registry.ts:334–350

---

### ACT-018 — Fill in the Blank — Word Bank
- **Status**: Active
- **Category**: construct
- **Skill Domain**: Grammar / Vocabulary
- **Description**: Sentence + word bank chips that slot into gaps
- **Activity Row Tool**: WordBankInput
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: binary_per_item
- **Telemetry Fields**: selected_words (string[]), correct (boolean)
- **Grading Mode**: binary_per_item
- **Completion Policy**: on_all_placed
- **Required Fields**: `wordBank`, `sentenceWithGaps`
- **Validation Rules**: `wordBank` and `sentenceWithGaps` are required; gap positions must be valid/unique per sentence; each `accepted_answers` value must exist in `wordBank` (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Fill in the Blank — Word Bank"
- **Sources**: Player activity-registry.ts:142–146 · LV2 activity-registry.ts:351–367

---

### ACT-019 — Error Correction
- **Status**: Active
- **Category**: construct
- **Skill Domain**: Grammar behaviour
- **Description**: Sentence where words are tappable + correction options
- **Activity Row Tool**: ChipRetypeCorrection
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: Medium
- **Is Game Container**: No
- **Telemetry Shape**: binary
- **Telemetry Fields**: error_located (boolean), correction_correct (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `incorrectSentence`, `acceptedCorrections`, `errorIndex`
- **Validation Rules**: `acceptedCorrections` must include at least one item; `errorIndex` must be integer 1-based and within `incorrectSentence` token bounds (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Error Correction"
- **Sources**: Player activity-registry.ts:147–151 · LV2 activity-registry.ts:368–384

---

### ACT-020 — Speak and Score
- **Status**: Active
- **Category**: speak
- **Skill Domain**: Pronunciation / Production
- **Description**: Prompt card + mic + post-attempt word-level error display
- **Activity Row Tool**: FreeRecorder
- **Command Row Controls**: (none)
- **Whisper Required**: Yes
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: scored_per_word
- **Telemetry Fields**: transcription (string), accuracy (number), per_word_errors (string[]), attempt_count (number)
- **Grading Mode**: scored_threshold
- **Completion Policy**: on_submit
- **Required Fields**: `promptText`, `targetText`
- **Validation Rules**: Both fields are required and must be non-empty (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Speak and Score"
- **Sources**: Player activity-registry.ts:152–156 · LV2 activity-registry.ts:385–403

---

### ACT-021 — Speech Match
- **Status**: Active
- **Category**: speak
- **Skill Domain**: Pronunciation
- **Description**: Model audio + student record + side-by-side waveform
- **Activity Row Tool**: ChipAudioMatcher
- **Command Row Controls**: play, pause
- **Whisper Required**: Yes
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: scored
- **Telemetry Fields**: transcription_accuracy (number), attempt_count (number)
- **Grading Mode**: scored_threshold
- **Completion Policy**: on_submit
- **Required Fields**: `choiceElements` (minimum 2), `correctAnswer`
- **Validation Rules**: `choiceElements` must satisfy ACT choice schema cardinality; `correctAnswer` must match a choice label or 1-based choice index (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Speech Match"
- **Special Notes ⚠️**: Instructions for ACT-021 MUST display sidebar-only — never inline. This is a locked, immutable contract per PLAYER_CONSTITUTION.md. Do not move instructions into the slide component under any circumstances.
- **Sources**: Player activity-registry.ts:157–161 · LV2 activity-registry.ts:404–420 · Old CMS slideTypeConfigFromContract.ts:71–73 · ouiispeak/docs/PLAYER_CONSTITUTION.md

---

### ACT-022 — Open Production — Prompted
- **Status**: Active
- **Category**: speak
- **Skill Domain**: Production / Fluency
- **Description**: Prompt card + mic + post-attempt transcript shown to student
- **Activity Row Tool**: FreeRecorder
- **Command Row Controls**: (none)
- **Whisper Required**: Yes
- **MVP Priority**: High
- **Is Game Container**: No
- **Telemetry Shape**: scored_keyword
- **Telemetry Fields**: transcription (string), keyword_hits (string[]), word_count (number), duration (number)
- **Grading Mode**: soft_score
- **Completion Policy**: on_submit
- **Required Fields**: `promptText`, `targetKeywords`
- **Validation Rules**: `targetKeywords` must contain at least one unique keyword (case-insensitive); optional word-count/threshold constraints apply when provided (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Open Production — Prompted"
- **Sources**: Player activity-registry.ts:162–166 · LV2 activity-registry.ts:421–439

---

### ACT-023 — NPC Dialogue Tree
- **Status**: Active
- **Category**: game
- **Skill Domain**: Grammar / Production / Pragmatics
- **Description**: Chat-style interface with NPC avatar and player choice tiles
- **Activity Row Tool**: AvatarDialoguePlayer
- **Command Row Controls**: play
- **Whisper Required**: No
- **MVP Priority**: Medium
- **Is Game Container**: Yes
- **Telemetry Shape**: path_scored
- **Telemetry Fields**: path_taken (string[]), choices_correct (number), choices_total (number)
- **Grading Mode**: binary_per_item
- **Completion Policy**: on_path_end
- **Required Fields**: `avatarDialogues`
- **Validation Rules**: `avatarDialogues` must contain at least one turn; each turn requires non-empty `avatarLine`, playable audio (`audioFile` or `audio.speech`), and at least one non-empty `correctResponses` entry (`lesson-contract.v1.ts`)
- **CMS Display Name**: "NPC Dialogue Tree"
- **Sources**: Player activity-registry.ts:167–171 · LV2 activity-registry.ts:440–457

---

### ACT-024 — Environmental Puzzle
- **Status**: Active
- **Category**: game
- **Skill Domain**: Grammar / Vocabulary
- **Description**: Illustration layer + overlaid activity widget
- **Activity Row Tool**: SpeechComparer
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: Medium
- **Is Game Container**: Yes
- **Telemetry Shape**: binary
- **Telemetry Fields**: task_accuracy (number), complete (boolean)
- **Grading Mode**: binary
- **Completion Policy**: on_submit
- **Required Fields**: `word`, `letterUnits`
- **Validation Rules**: `word` is required; `letterUnits` must contain at least one unit (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Environmental Puzzle"
- **Sources**: Player activity-registry.ts:172–176 · LV2 activity-registry.ts:458–474

---

### ACT-025 — Audio Sequence Ordering
- **Status**: Active
- **Category**: listen
- **Skill Domain**: Listening discrimination / Processing
- **Description**: Audio clip cards + drag-to-reorder interface
- **Activity Row Tool**: ReorderList
- **Command Row Controls**: (none)
- **Whisper Required**: No
- **MVP Priority**: Medium
- **Is Game Container**: No
- **Telemetry Shape**: sequence
- **Telemetry Fields**: sequence_accuracy (number)
- **Grading Mode**: binary
- **Completion Policy**: on_sequence_complete
- **Required Fields**: `audioClips`, `correctOrderClips`
- **Validation Rules**: `audioClips` minimum is 2; `correctOrderClips` must match clip count and be a unique 1..N permutation (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Audio Sequence Ordering"
- **Sources**: Player activity-registry.ts:177–181 · LV2 activity-registry.ts:475–490

---

### ACT-026 — Open Discussion
- **Status**: Active
- **Category**: speak
- **Skill Domain**: Fluency / Pragmatics
- **Description**: Prompted discussion turn with model audio and learner free response
- **Activity Row Tool**: FreeRecorder
- **Command Row Controls**: (none)
- **Whisper Required**: Yes
- **MVP Priority**: Medium
- **Is Game Container**: No
- **Telemetry Shape**: scored
- **Telemetry Fields**: accuracy (number), transcription (string), attempt_count (number)
- **Grading Mode**: soft_score
- **Completion Policy**: on_submit
- **Required Fields**: `promptText`, `targetText`
- **Validation Rules**: Both fields are required and must be non-empty (`lesson-contract.v1.ts`)
- **CMS Display Name**: "Open Discussion"
- **Sources**: Player activity-registry.ts:182–186 · LV2 activity-registry.ts:491–508

---

## Known Inconsistencies (Resolve Before v2 CMS Closes)

1. **Display Name Casing**: Some older sources use "Listen only" (lowercase). Canonical is Title Case throughout. Enforce in CONSTITUTION.md.

2. ~~**ACT-010 Tool Mismatch**~~ **RESOLVED (Apr 9)**: Sandbox defaults are canonical for authoring (`ACTIVITY_PROFILE_DEFAULTS` in `lib/activityRuntimeDefaults.ts`), and ACT-010/009 intentionally use `AudioChoiceSelector`.

3. ~~**ACT-001/002 Command Row Swap**~~ **RESOLVED (Apr 10)**: ACT-001 command row corrected to `["play"]` only (no pause — playback-only presentation). ACT-002 corrected to `["play", "pause"]` (syllable tap game needs pause). Source: `lib/activityRuntimeDefaults.ts`.

4. ~~**ACT-024/026 Command Row**~~ **RESOLVED (Apr 10)**: Both corrected from "play, pause" to `(none)`. SpeechComparer (ACT-024) and FreeRecorder/ACT-026 have no command row controls in sandbox. Source: `lib/activityRuntimeDefaults.ts`.

5. ~~**Schema Tightening Required**~~ **RESOLVED (Apr 8)**: propsJson is now required and validated. Sandbox preflight (`activitySlidePreflight.ts:153,167,171,181`) enforces required `propsJson.runtimeContractV1` + strict interaction fields. DB trigger (`016_activity_slides_setup.sql:27,78,108`) blocks top-level/propsJson structured collisions. This item is closed.

6. **Tele Pattern Must Update**: `ACTIVITY_ID_PATTERN` in `Tele/lib/events.ts:56` is hardcoded to ACT-001..ACT-026. If any ACT IDs change, Tele must update atomically. Do not lock final ACT set without updating Tele.

7. **ACT-004 Collision — Resolved**: intonationOptions + correctCurveId had duplicate rows in both propsJson and top-level named rows. Cleaned up Apr 8. propsJson is now the single source for these fields.

8. **ACT-006/007/008 Inactive Reason**: Deprecated in "WP-H0 manifest hardening." If this reason needs to be surfaced in the CMS UI or ACTIVITY_PROFILES doc, confirm the wording with Raychel.

9. **Cross-lane Defaults Drift**: Player registry command defaults currently diverge from sandbox defaults for ACT-001/ACT-002/ACT-024/ACT-026. Freeze requires an explicit authority decision at integration time.

10. ~~**ACT-023 Ingest vs Runtime Strictness Gap**~~ **RESOLVED (Apr 10)**: Sandbox preflight now requires non-empty `avatarLine`, playable turn audio (`audioFile` or `audio.speech`), and normalized non-empty `correctResponses`.

11. ~~**ACT-018 Ingest vs Runtime Shape Gap**~~ **RESOLVED (Apr 10)**: Sandbox preflight now validates canonical structured gap objects (`position` + `accepted_answers`) and enforces wordBank-reference checks for accepted answers.

---

## Activity-Related Files Across All Repos

| File | Repo | Contents |
|------|------|----------|
| `src/lib/activity/activity-registry.ts` | ouiispeak | Runtime registry: activity_id → activity_row_tool + status |
| `src/contracts/lesson/lesson-contract.v1.ts` | ouiispeak | Schema validation for `activity_slides` |
| `docs/PLAYER_CONSTITUTION.md` | ouiispeak | ACT-021 instructions sidebar-only law |
| `lesson-compiler-core-v2/shared/activity-registry.ts` | LV2 | Pedagogical registry: full metadata per ACT |
| `lib/constants/slideConstants.ts` | ouiispeak-cms | ACTIVE_ACTIVITY_IDS list |
| `lib/contract/slideTypeConfigFromContract.ts` | ouiispeak-cms | Display names + validation rules per ACT |
| `lib/contract/field-boundaries/edit_templates_by_component.json` | ouiispeak-cms | Field layout templates per component |
| `lib/data/activityFormConfigs.ts` | ouiispeak-cms | Form config generator |
| `lib/contract/fieldDefinitions.ts` | ouiispeak-cms | Field glossary (lines, choiceElements, buttons, etc.) |
| `supabase/manual/016_activity_slides_setup.sql` | ouiispeak-cms-sandbox | activity_slides + activity_slide_field_values schema |
| `supabase/manual/015_act_001_slide_setup.sql` | ouiispeak-cms-sandbox | Field activation list for `activity_slides` |
| `central/CONSTITUTION.md` | ouiispeak-cms-sandbox | Identity/naming governance |
| `ACT_BUILD_PLAN.md` | ouiispeak-cms-sandbox | Pre-C0 gate requirements and technical decisions |
| `lib/events.ts` | Tele | activityId pattern validation + IR-7 enforcement |

---

---

## Shared Field Schemas

> All schemas sourced from `ouiispeak/src/contracts/lesson/lesson-contract.v1.ts`. These are the canonical Zod-validated shapes. LV2 must produce payloads that match these exactly.

---

### Speech Object

Used inside `lines` cells (ACT-001, ACT-005), `choiceElements` items (ACT-003, ACT-021), and `audioClips` items (ACT-025).

```json
{
  "mode": "tts | file",
  "lang": "en-US",
  "text": "string — required when mode=tts",
  "fileUrl": "string — required when mode=file"
}
```

- `mode` is required. `"tts"` = synthesised. `"file"` = pre-recorded file.
- `lang` is optional (BCP-47). In sandbox, system-assigned `targetLanguage` is currently `"english"`.
- Exactly one of `text` or `fileUrl` must be non-empty depending on mode.

---

### audioPrompt Object

Used by ACT-009 (required) and ACT-002/ACT-004 (optional alternative audio source). In sandbox preflight, `audioPrompt` is normalized to canonical `audio` when possible (`activityPayloadNormalization.ts`).

```json
{
  "fileUrl": "string",
  "audioUrl": "string",
  "speech": { "mode": "tts | file", "text": "...", "fileUrl": "..." }
}
```

At least one of `fileUrl`, `audioUrl`, or a valid `speech` sub-object must be present.

---

### lineCell Object

One cell in a `lines` row. Used by ACT-001 and ACT-005.

```json
{ "label": "non-empty string", "speech": { ...speech object... } }
```

---

### lines Field (ACT-001, ACT-005)

Array of rows; each row is an array of `lineCell` objects.

```json
[
  [
    { "label": "Good", "speech": { "mode": "tts", "text": "Good", "lang": "en-US" } },
    { "label": "morning", "speech": { "mode": "tts", "text": "morning", "lang": "en-US" } }
  ]
]
```

- Minimum: 1 row, 1 cell per row.
- Each row = one line of audio content presented together.
- Multiple cells in a row = compound phrase broken into labelled chunks.

---

### choiceElement — Audio Variant (ACT-003, ACT-021)

```json
{ "label": "non-empty string", "speech": { ...speech object... } }
```

- `speech` is required. Labels must be unique in ACT-021.

### choiceElement — Text/Flexible Variant (ACT-009, ACT-010, ACT-012)

```json
{ "label": "non-empty string", "referenceText": "optional string", "speech": { ...speech object... } }
```

- `speech` is optional for text-choice ACTs.
- `label` is always required and is used for `correctAnswer` matching.
- Min items: ACT-009/010 = 2, ACT-012 = 3.

---

### matchPairs (ACT-013)

```json
[
  { "item": "cat", "target": "animal" },
  { "item": "carrot", "target": "vegetable" }
]
```

- Min 2 pairs. `item` values must be unique. `target` values must be unique.

---

### categoryLabels + wordBank (ACT-014)

```json
"categoryLabels": ["Present", "Past"],
"wordBank": [
  { "word": "I walk", "category": "Present" },
  { "word": "I walked", "category": "Past" }
]
```

- `categoryLabels`: min 2, unique strings.
- `wordBank`: min 2 items. Each item's `category` must exactly match a value in `categoryLabels`.

---

### sentenceTokens + correctOrderWords (ACT-015)

```json
"sentenceTokens": ["every", "day", "I", "walk"],
"correctOrderWords": ["I", "walk", "every", "day"]
```

- Both arrays must have the same length (min 2) and contain the same multiset of tokens.
- `sentenceTokens` = scrambled display order. `correctOrderWords` = correct answer order.
- Tokens are whitespace-split strings — typically individual words.

---

### tenseBins + sentenceCards (ACT-016)

```json
"tenseBins": ["Present", "Past"],
"sentenceCards": [
  { "text": "I walk to school.", "correct_tense": "Present" },
  { "text": "I walked to school.", "correct_tense": "Past" }
]
```

- `tenseBins`: min 2, unique strings.
- `sentenceCards`: min 2 items. Each `correct_tense` must exist in `tenseBins`.

---

### sentenceWithGaps + blanks (ACT-017)

```json
"sentenceWithGaps": "I ___ to school every day.",
"blanks": [
  { "correctGapIndex": 2, "acceptedAlternatives": ["walk", "go"] }
]
```

- `sentenceWithGaps`: plain string. Gaps may be marked visually (e.g. `___`) but the contract uses token position.
- `blanks`: min 1. `correctGapIndex` is 1-based, must not exceed sentence token count. All `correctGapIndex` values must be unique.
- `acceptedAlternatives`: min 1 item per blank — all valid typed answers.

---

### wordBank + sentenceWithGaps (ACT-018)

```json
"wordBank": ["walk", "run", "eat"],
"sentenceWithGaps": [
  {
    "sentence": "I ___ to school.",
    "gaps": [
      { "position": 2, "accepted_answers": ["walk"] }
    ]
  }
]
```

- `wordBank`: flat string array (min 1). These are the chip options displayed.
- `sentenceWithGaps`: array of sentence objects (min 1). Each has a `sentence` string and `gaps` array (min 1 gap). Each gap: `position` is 1-based token index, unique per sentence. All `accepted_answers` values must exist in `wordBank` (case-insensitive).

---

### incorrectSentence + errorIndex + acceptedCorrections (ACT-019)

```json
"incorrectSentence": "She go to school every day.",
"errorIndex": 2,
"acceptedCorrections": ["goes"]
```

- `incorrectSentence`: plain sentence string with the grammatical error.
- `errorIndex`: 1-based integer pointing to the erroneous token. Must not exceed token count.
- `acceptedCorrections`: min 1 string — all valid replacement phrases.

---

### targetKeywords + optional constraints (ACT-022)

```json
"promptText": "Describe your ideal day in English.",
"targetKeywords": ["work", "study", "family"],
"keywordThreshold": 2,
"minWordCount": 10,
"maxWordCount": 50
```

- `targetKeywords`: min 1, unique case-insensitive.
- `keywordThreshold`: optional positive number — how many keywords must appear to pass.
- `minWordCount` / `maxWordCount`: optional positive integers. If both set, max ≥ min.

---

### avatarDialogues (ACT-023)

```json
"avatarDialogues": [
  {
    "avatarLine": "Hi there. What's your name?",
    "audioFile": "https://cdn.example.com/audio/act023_turn1.mp3",
    "correctResponses": ["My name is ...", "I'm ..."]
  }
]
```

- Min 1 turn. Each turn: `avatarLine` (string), playable audio (`audioFile` URL or `audio.speech` object), `correctResponses` (string[], min 1).

---

### word + letterUnits (ACT-024)

```json
"word": "morning",
"letterUnits": ["morn", "ing"]
```

- `word`: the full target word as a string.
- `letterUnits`: array of strings (min 1) representing the phonetic/syllabic breakdown of the word for the puzzle.

---

### audioClips + correctOrderClips (ACT-025)

```json
"audioClips": [
  { "label": "Clip A", "speech": { "mode": "tts", "text": "First...", "lang": "en-US" } },
  { "label": "Clip B", "speech": { "mode": "tts", "text": "Then...", "lang": "en-US" } },
  { "label": "Clip C", "speech": { "mode": "tts", "text": "Finally...", "lang": "en-US" } }
],
"correctOrderClips": [2, 3, 1]
```

- `audioClips`: min 2 items. Each: `label` (string) + `speech` (speech object).
- `correctOrderClips`: 1-based integer array. Must be a permutation of 1..N where N = number of clips. Values must be unique. Length must equal `audioClips` length.
- Example above: correct order is B → C → A.

---

## runtimeContractV1 Templates per ACT

> Every `activity_slides` row `propsJson` must embed a `runtimeContractV1` block. LV2 should use these exact templates — do not infer from prose. Source of truth: `strictActivityToolById` in `lesson-contract.v1.ts` + `ACTIVITY_PROFILE_DEFAULTS` in `lib/activityRuntimeDefaults.ts`.

```json
ACT-001: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipSequencePlayer",   "command_row_controls": ["play"],          "status": "active" } }
ACT-002: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipSelector",          "command_row_controls": ["play", "pause"], "status": "active" } }
ACT-003: { "contractVersion": "v1", "interaction": { "activity_row_tool": "MinimalPairSelector",   "command_row_controls": ["play"],          "status": "active" } }
ACT-004: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipSelector",          "command_row_controls": ["play"],          "status": "active" } }
ACT-005: { "contractVersion": "v1", "interaction": { "activity_row_tool": "SequentialRecorder",    "command_row_controls": ["play", "pause"], "status": "active" } }
ACT-009: { "contractVersion": "v1", "interaction": { "activity_row_tool": "AudioChoiceSelector",   "command_row_controls": ["play"],          "status": "active" } }
ACT-010: { "contractVersion": "v1", "interaction": { "activity_row_tool": "AudioChoiceSelector",   "command_row_controls": [],                "status": "active" } }
ACT-011: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipSelector",          "command_row_controls": [],                "status": "active" } }
ACT-012: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipSelector",          "command_row_controls": [],                "status": "active" } }
ACT-013: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipMatchPairs",        "command_row_controls": [],                "status": "active" } }
ACT-014: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipWordSort",          "command_row_controls": [],                "status": "active" } }
ACT-015: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipSequenceBuilder",   "command_row_controls": [],                "status": "active" } }
ACT-016: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipWordSort",          "command_row_controls": [],                "status": "active" } }
ACT-017: { "contractVersion": "v1", "interaction": { "activity_row_tool": "InlineGapTextInput",    "command_row_controls": [],                "status": "active" } }
ACT-018: { "contractVersion": "v1", "interaction": { "activity_row_tool": "WordBankInput",         "command_row_controls": [],                "status": "active" } }
ACT-019: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipRetypeCorrection",  "command_row_controls": [],                "status": "active" } }
ACT-020: { "contractVersion": "v1", "interaction": { "activity_row_tool": "FreeRecorder",          "command_row_controls": [],                "status": "active" } }
ACT-021: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ChipAudioMatcher",      "command_row_controls": ["play", "pause"], "status": "active" } }
ACT-022: { "contractVersion": "v1", "interaction": { "activity_row_tool": "FreeRecorder",          "command_row_controls": [],                "status": "active" } }
ACT-023: { "contractVersion": "v1", "interaction": { "activity_row_tool": "AvatarDialoguePlayer",  "command_row_controls": ["play"],          "status": "active" } }
ACT-024: { "contractVersion": "v1", "interaction": { "activity_row_tool": "SpeechComparer",        "command_row_controls": [],                "status": "active" } }
ACT-025: { "contractVersion": "v1", "interaction": { "activity_row_tool": "ReorderList",           "command_row_controls": [],                "status": "active" } }
ACT-026: { "contractVersion": "v1", "interaction": { "activity_row_tool": "FreeRecorder",          "command_row_controls": [],                "status": "active" } }
```

> ⚠️ Sandbox preflight requires `propsJson.runtimeContractV1`. A top-level `runtimeContractV1` row is optional, but if present it must match the nested value exactly.

---

## Distractor Guidance

Some activities include wrong-answer options alongside the correct answer (ACT-009, ACT-010, ACT-011, ACT-012, ACT-021). Distractors are not required — whether and how many to include is determined upstream. However, **if distractors are present, each one must belong to at least one of the following categories**. Random or arbitrary wrong answers are never acceptable.

| Category | Description |
|----------|-------------|
| **Phonemic confusion** | Sounds or words that French speakers learning English predictably mishear or conflate. Examples: /ɪ/ vs /iː/ (ship/sheep), /θ/ vs /s/ or /d/ (think/sink/dink), short vs long vowel pairs. |
| **L1 transfer error** | Wrong forms that arise because French grammar works differently. Examples: wrong article choice (a/the/zero), wrong tense (simple present where continuous is required), wrong adverb position. |
| **False cognate trap** | An English word that looks or sounds like a French word but has a different meaning. Examples: "library" vs "librairie", "actually" vs "actuellement". |
| **Near-synonym precision** | A word that is close in meaning but wrong in context. Tests vocabulary depth rather than recognition. |

**Validity rule**: if a native English speaker would never plausibly choose the distractor, it is too easy to eliminate and teaches nothing. Every distractor must be something a real learner at this level might genuinely produce or select.

---

## LV2 Generation Guidance — Content Scope and Cardinalities

> This section is for LV2 generation agents. It describes what kind of **English-learning** content belongs in each ACT, typical item counts, and authoring constraints. The learner cohort is French L1 students learning English.

---

### ACT-001 — Listen Only
- **Content type**: A short English phrase or sentence (not a full dialogue). One presentation line per audio segment.
- **Typical cardinality**: 1–3 rows in `lines`, 1–4 cells per row.
- **Authoring note**: Each cell should be one meaningful audio chunk (word or short phrase). For generated audio, prefer `mode: "tts"` with English language tags.

### ACT-002 — Stress Pattern Identification
- **Content type**: An English word presented as syllable blocks; student taps the stressed syllable.
- **Typical cardinality**: 2–4 syllables. `correctStressIndex` is 1-based.
- **Authoring note**: Use `syllableBreakdown` as primary source when available. Ensure `correctStressIndex` points to a real syllable position.

### ACT-003 — Minimal Pair Detection
- **Content type**: Two English words that differ by one phonemic contrast.
- **Typical cardinality**: Exactly 2 `choiceElements`; `promptMode` is `same_different` or `select_word`.
- **Authoring note**: Each choice needs valid `speech` payload. Prefer contrasts relevant for French L1 learners (for example /ɪ/ vs /iː/).

### ACT-004 — Intonation Pattern Match
- **Content type**: An English sentence with a clear intonation contour.
- **Typical cardinality**: 2–3 `intonationOptions`; `correctCurveId` must match one option.
- **Authoring note**: Provide playable audio. Sandbox ingest normalizes common curve aliases to canonical values (`rising`, `falling`, `fall-rise`).

### ACT-005 — Listen and Repeat
- **Content type**: An English phrase/sentence heard by the learner, then repeated by recording.
- **Typical cardinality**: `lines` (1–3 rows) or `targetText` (single sentence) or `body`.
- **Authoring note**: If using `lines`, each cell must be pronounceable in isolation. If using `targetText`, keep reference text clean for scoring.

### ACT-009 — Multiple Choice — Audio
- **Content type**: English audio prompt + answer choices.
- **Typical cardinality**: 2–4 `choiceElements`; `correctAnswer` as label or 1-based index.
- **Authoring note**: `audioPrompt` should include a playable source. In sandbox ingest, label/index answers are normalized.

### ACT-010 — Multiple Choice — Text
- **Content type**: Written English prompt + text choices.
- **Typical cardinality**: 2–4 `choiceElements`, plus `promptText`.
- **Authoring note**: No audio required.

### ACT-011 — True / False
- **Content type**: English statement judged true/false.
- **Typical cardinality**: `statement` + `correctAnswer`.
- **Authoring note**: Keep statement unambiguous.

### ACT-012 — Odd One Out
- **Content type**: Set of English words/phrases where one item does not fit.
- **Typical cardinality**: 3–4 `choiceElements`, `correctOddIndex` (1-based).
- **Authoring note**: Category logic should be explicit (for example tense, semantic class, pronunciation pattern).

### ACT-013 — Drag-and-Drop Match
- **Content type**: Matching pairs (definition, usage, or translation alignment).
- **Typical cardinality**: 3–5 `matchPairs`.
- **Authoring note**: Both sides must be unique across pairs.

### ACT-014 — Word Sort
- **Content type**: English words sorted into grammar/meaning categories.
- **Typical cardinality**: 2–3 `categoryLabels`; 4–8 `wordBank` items.
- **Authoring note**: Each `wordBank.category` must exactly match a `categoryLabels` value.

### ACT-015 — Sentence Reconstruction
- **Content type**: Shuffled English sentence reconstructed by learner.
- **Typical cardinality**: 4–8 tokens in `sentenceTokens` and `correctOrderWords`.
- **Authoring note**: Both arrays must contain the same token multiset.

### ACT-016 — Tense Sort
- **Content type**: English sentences sorted into tense bins.
- **Typical cardinality**: 2–3 `tenseBins`; 4–8 `sentenceCards`.
- **Authoring note**: Each `sentenceCards.correct_tense` must exist in `tenseBins`.

### ACT-017 — Fill in the Blank — Typed
- **Content type**: English sentence with typed gaps.
- **Typical cardinality**: 1 sentence; 1–2 `blanks` rows.
- **Authoring note**: `correctGapIndex` is 1-based token position; include acceptable typed alternatives where needed.

### ACT-018 — Fill in the Blank — Word Bank
- **Content type**: English sentence/gaps solved using a word bank.
- **Typical cardinality**: `wordBank` of 3–6 entries; 1–2 sentence rows.
- **Authoring note**: `accepted_answers` should reference `wordBank` values.

### ACT-019 — Error Correction
- **Content type**: English sentence with one grammatical error.
- **Typical cardinality**: `incorrectSentence`, `errorIndex`, and 1–3 `acceptedCorrections`.
- **Authoring note**: Error should be learner-realistic and token-local.

### ACT-020 — Speak and Score
- **Content type**: English speaking prompt + scored target response.
- **Typical cardinality**: `promptText` and `targetText` (non-empty).
- **Authoring note**: `targetText` should be phonetically clear and practical for scoring.

### ACT-021 — Speech Match
- **Content type**: Compare learner production against model options.
- **Typical cardinality**: 2–3 `choiceElements`, `correctAnswer`.
- **Authoring note**: Each choice requires valid speech payload. ACT-021 instructions remain sidebar-only in player law.

### ACT-022 — Open Production — Prompted
- **Content type**: Open-ended English speaking prompt scored by keyword coverage.
- **Typical cardinality**: `promptText`, `targetKeywords`, optional thresholds/count bounds.
- **Authoring note**: Keep keywords content-heavy; avoid function-word-only sets.

### ACT-023 — NPC Dialogue Tree
- **Content type**: English dialogue exchange with avatar/NPC turns.
- **Typical cardinality**: 2–5 `avatarDialogues` turns.
- **Authoring note**: Each turn needs `avatarLine`, audio source, and non-empty `correctResponses`.

### ACT-024 — Environmental Puzzle
- **Content type**: English word split into letter/syllable units.
- **Typical cardinality**: one `word`, 2–5 `letterUnits`.
- **Authoring note**: Units should be pedagogically meaningful chunks, not random splits.

### ACT-025 — Audio Sequence Ordering
- **Content type**: Reorder English audio clips into the correct sequence.
- **Typical cardinality**: 3–5 `audioClips`; `correctOrderClips` is a 1..N permutation.
- **Authoring note**: Clips should have meaningful order dependency.

### ACT-026 — Open Discussion
- **Content type**: Open English discussion prompt with free spoken response.
- **Typical cardinality**: `promptText` + `targetText`.
- **Authoring note**: Lower scaffolding than ACT-022; useful for end-of-lesson production.

---

*Update this file when new ACT types are added, activation status changes, or tool assignments change. Do not update without reading the authority map at the top.*
