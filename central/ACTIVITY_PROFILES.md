Authority Role: canonical
Artifact Type: activity-runtime-profile-matrix
Canonical Source: central/ACTIVITY_PROFILES.md
Constitution Reference: central/CONSTITUTION.md

# Activity Profiles (ACT-001..ACT-026)

Date: 2026-04-09
Repository: ouiispeak-cms-sandbox

## Purpose
Single reference for per-ACT runtime requirements used by sandbox authoring/import and player runtime validation.

## Authority Order
1. Shape-lock required keys per ACT: `lib/activityShapeLock.ts`
2. Preflight ingest enforcement and fail-closed validation: `lib/activitySlidePreflight.ts`
3. Profile field-scope selection in CMS authoring: `lib/activityProfiles.ts`

If sources disagree, resolve to this order and update lower-priority layers.

## Universal Activity Envelope (all ACT rows)
- `type = "activity"`
- `activityId = ACT-xxx`
- `orderIndex` set
- `propsJson` required and non-empty object
- `propsJson.runtimeContractV1` required:
  - `contractVersion = "v1"`
  - `interaction.activity_row_tool` non-empty
  - `interaction.command_row_controls` array
  - `interaction.status` is `active` or `inactive`

## Structured Payload Policy (PropsJson vs Top-Level Rows)
- Structured ACT payload is canonical in `propsJson`.
- `propsJson.runtimeContractV1` is mandatory.
- Top-level `runtimeContractV1` may be present but must match `propsJson.runtimeContractV1` exactly.
- Do not duplicate structured keys as top-level rows when also present in `propsJson`.
- Sandbox preflight currently blocks top-level duplicates for:
  - `lines`, `targetText`, `body`, `choiceElements`, `audio`, `buttons`, `promptMode`, `intonationOptions`, `correctCurveId`, `audioPrompt`, `syllableBreakdown`, `correctStressIndex`

## ACT Matrix
| ACT | Status | activity_row_tool | Default command_row_controls | Required propsJson shape (summary) |
|---|---|---|---|---|
| ACT-001 | active | ChipSequencePlayer | `["play","pause"]` | `lines` required (valid `AudioLabelCell[][]`). |
| ACT-002 | active | ChipSelector | `["play"]` | `correctStressIndex` (1-based int) + at least one syllable source (`syllableBreakdown` or `syllables` or `body`). |
| ACT-003 | active | MinimalPairSelector | `["play"]` | `promptMode` in `same_different \| select_word`; `choiceElements` min 2; each choice has non-empty label + valid speech payload. |
| ACT-004 | active | ChipSelector | `["play"]` | `intonationOptions` min 2 unique; `correctCurveId` in options; playable audio (`audioId` or `audio.speech`). |
| ACT-005 | active | SequentialRecorder | `["play","pause"]` | At least one recorder source: valid `lines` OR non-empty `targetText`/`body`. |
| ACT-006 | inactive | SequentialRecorder | `["play","pause"]` | Inactive in this lane (deprecated). |
| ACT-007 | inactive | SequentialRecorder | `["play","pause"]` | Inactive in this lane (deprecated). |
| ACT-008 | inactive | SequentialRecorder | `["play","pause"]` | Inactive in this lane (deprecated). |
| ACT-009 | active | AudioChoiceSelector | `["play"]` | `choiceElements` min 2; `correctAnswer` matches label or 1-based index; `audioPrompt` playable. |
| ACT-010 | active | AudioChoiceSelector | `[]` | `promptText`; `choiceElements` min 2; `correctAnswer` matches label or 1-based index. |
| ACT-011 | active | ChipSelector | `[]` | `statement` required; `correctAnswer` must be true/false-like. |
| ACT-012 | active | ChipSelector | `[]` | `choiceElements` min 3; `correctOddIndex` 1-based int <= choice count. |
| ACT-013 | active | ChipMatchPairs | `[]` | `matchPairs` min 2; left/target values unique. |
| ACT-014 | active | ChipWordSort | `[]` | `categoryLabels` min 2 unique; `wordBank` min 2; each `wordBank.category` in labels. |
| ACT-015 | active | ChipSequenceBuilder | `[]` | `sentenceTokens` + `correctOrderWords`; lengths match; same token multiset. |
| ACT-016 | active | ChipWordSort | `[]` | `tenseBins` min 2 unique; `sentenceCards` min 2; each `sentenceCards.correct_tense` exists in `tenseBins`. |
| ACT-017 | active | InlineGapTextInput | `[]` | `sentenceWithGaps` required; `blanks` min 1 with unique 1-based `correctGapIndex` within token bounds. |
| ACT-018 | active | WordBankInput | `[]` | `wordBank` + `sentenceWithGaps` required; gap positions valid/unique; `accepted_answers` values must exist in `wordBank`. |
| ACT-019 | active | ChipRetypeCorrection | `[]` | `incorrectSentence` required; `acceptedCorrections` min 1; `errorIndex` 1-based int within token bounds. |
| ACT-020 | active | FreeRecorder | `[]` | `promptText` and `targetText` required (non-empty). |
| ACT-021 | active | ChipAudioMatcher | `["play","pause"]` | `choiceElements` min 2; `correctAnswer` matches label or 1-based index. |
| ACT-022 | active | FreeRecorder | `[]` | `promptText` required; `targetKeywords` min 1 unique; optional word-count thresholds must be valid when present. |
| ACT-023 | active | AvatarDialoguePlayer | `["play"]` | `avatarDialogues` min 1 turn; each turn has >=1 `correctResponses`. |
| ACT-024 | active | SpeechComparer | `["play","pause"]` | `word` required; `letterUnits` min 1. |
| ACT-025 | active | ReorderList | `[]` | `audioClips` min 2; `correctOrderClips` length matches clip count and is unique 1..N permutation. |
| ACT-026 | active | FreeRecorder | `["play","pause"]` | `promptText` and `targetText` required (non-empty). |

## Compatibility Aliases Accepted by Contract
- ACT-016: `tense_labels` alias for `tenseBins`
- ACT-018: `word_bank` alias for `wordBank`, `items` alias for `sentenceWithGaps`
- ACT-022: `targetText` accepted as fallback for `promptText`
- ACT-024: `targetText` accepted as fallback for `word`
- ACT-025: `audio_clips` alias for `audioClips`, `correct_order` alias for `correctOrderClips`
- ACT-026: `targetText` fallback for `promptText`, and `promptText` fallback for `targetText`

## Inactive IDs
- `ACT-006`
- `ACT-007`
- `ACT-008`

These are deprecated in current sandbox lane and should fail closed in ingest paths.
