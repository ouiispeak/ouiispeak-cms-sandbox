import { isObjectRecord, parseImportEntries, splitQualifiedFieldKey, type FieldInputMap } from "@/lib/componentCore";
import { ACTIVE_ACTIVITY_SHAPE_LOCK_MAP } from "@/lib/activityShapeLock";
import {
  deriveActivityStructuredPayloadFieldKeys,
  normalizeActivityPropsJson,
} from "@/lib/activityPayloadNormalization";

type ActivitySlidePreflightMode = "create" | "update";

const STRUCTURED_OVERRIDE_FIELD_KEYS = deriveActivityStructuredPayloadFieldKeys();

const STATUS_VALUES = new Set(["active", "inactive"]);
const ACT_003_PROMPT_MODES = new Set(["same_different", "select_word"]);
const INACTIVE_ACTIVITY_IDS = new Set(["ACT-006", "ACT-007", "ACT-008"]);

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return true;
  }

  return true;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseObjectLikeJson(value: unknown, fieldLabel: string): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`${fieldLabel} must be valid JSON.`);
    }

    if (!isObjectRecord(parsed)) {
      throw new Error(`${fieldLabel} must be a JSON object.`);
    }

    return parsed;
  }

  if (!isObjectRecord(value)) {
    throw new Error(`${fieldLabel} must be a JSON object.`);
  }

  return value;
}

function validateSpeechPayload(value: unknown, contextLabel: string): void {
  if (!isObjectRecord(value)) {
    throw new Error(`${contextLabel} requires "speech" to be an object.`);
  }

  const mode = asTrimmedString(value.mode);
  if (mode !== "tts" && mode !== "file") {
    throw new Error(`${contextLabel} requires speech.mode to be "tts" or "file".`);
  }

  if (mode === "tts") {
    if (!asTrimmedString(value.text)) {
      throw new Error(`${contextLabel} requires non-empty speech.text when mode="tts".`);
    }
    return;
  }

  if (!asTrimmedString(value.fileUrl)) {
    throw new Error(`${contextLabel} requires non-empty speech.fileUrl when mode="file".`);
  }
}

function validateLinesShape(linesValue: unknown, contextLabel: string): void {
  if (!Array.isArray(linesValue) || linesValue.length === 0) {
    throw new Error(`${contextLabel} requires lines with at least one row.`);
  }

  for (const [rowIndex, row] of linesValue.entries()) {
    if (!Array.isArray(row) || row.length === 0) {
      throw new Error(`${contextLabel} requires each lines row to include at least one element.`);
    }

    for (const [cellIndex, cell] of row.entries()) {
      if (!isObjectRecord(cell)) {
        throw new Error(`${contextLabel} requires each lines element to be an object.`);
      }

      if (!asTrimmedString(cell.label)) {
        throw new Error(
          `${contextLabel} requires non-empty label for lines row ${rowIndex + 1}, element ${cellIndex + 1}.`
        );
      }

      validateSpeechPayload(cell.speech, `${contextLabel} lines row ${rowIndex + 1}, element ${cellIndex + 1}`);
    }
  }
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toComparableValue(value: string): string {
  return collapseWhitespace(value).toLowerCase();
}

function asOneBasedInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
    return value;
  }

  const trimmed = asTrimmedString(value);
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function collectChoiceLabels(
  choiceElementsValue: unknown,
  contextLabel: string,
  activityId: string
): string[] {
  if (!Array.isArray(choiceElementsValue) || choiceElementsValue.length < 2) {
    throw new Error(`${contextLabel} ${activityId} requires propsJson.choiceElements with at least two options.`);
  }

  const labels: string[] = [];
  for (const [choiceIndex, element] of choiceElementsValue.entries()) {
    if (!isObjectRecord(element)) {
      throw new Error(`${contextLabel} ${activityId} requires each choiceElements item to be an object.`);
    }

    const label = asTrimmedString(element.label);
    if (!label) {
      throw new Error(
        `${contextLabel} ${activityId} requires each choiceElements item to include non-empty label (item ${choiceIndex + 1}).`
      );
    }

    labels.push(label);
  }

  return labels;
}

function validateCorrectAnswerAgainstChoiceLabels(
  correctAnswerValue: unknown,
  labels: string[],
  contextLabel: string,
  activityId: string
): void {
  const answer = asTrimmedString(correctAnswerValue);
  if (!answer) {
    throw new Error(`${contextLabel} ${activityId} requires non-empty propsJson.correctAnswer.`);
  }

  const comparableLabels = new Set(labels.map((label) => toComparableValue(label)));
  if (!comparableLabels.has(toComparableValue(answer))) {
    throw new Error(`${contextLabel} ${activityId} requires correctAnswer to match a choiceElements label or index.`);
  }
}

function toStringArray(value: unknown, fieldLabel: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${fieldLabel} must be a non-empty array.`);
  }

  const output = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => collapseWhitespace(item))
    .filter((item) => item.length > 0);
  if (output.length !== value.length) {
    throw new Error(`${fieldLabel} must contain only non-empty strings.`);
  }

  return output;
}

function validateAct015TokenShape(propsJson: Record<string, unknown>, contextLabel: string): void {
  const tokens = toStringArray(propsJson.sentenceTokens, `${contextLabel} ACT-015 propsJson.sentenceTokens`);
  const correctOrder = toStringArray(propsJson.correctOrderWords, `${contextLabel} ACT-015 propsJson.correctOrderWords`);

  if (tokens.length !== correctOrder.length) {
    throw new Error(`${contextLabel} ACT-015 requires sentenceTokens and correctOrderWords to have equal lengths.`);
  }

  const sortedTokens = [...tokens].sort((a, b) => a.localeCompare(b));
  const sortedCorrectOrder = [...correctOrder].sort((a, b) => a.localeCompare(b));
  for (let index = 0; index < sortedTokens.length; index += 1) {
    if (sortedTokens[index] !== sortedCorrectOrder[index]) {
      throw new Error(`${contextLabel} ACT-015 requires sentenceTokens and correctOrderWords to contain the same tokens.`);
    }
  }
}

function countSentenceTokens(value: unknown): number | null {
  const text = asTrimmedString(value);
  if (!text) {
    return null;
  }

  return text.split(/\s+/).filter(Boolean).length;
}

function validateAct017GapShape(propsJson: Record<string, unknown>, contextLabel: string): void {
  if (!Array.isArray(propsJson.blanks) || propsJson.blanks.length === 0) {
    throw new Error(`${contextLabel} ACT-017 requires propsJson.blanks with at least one row.`);
  }

  const tokenCount = countSentenceTokens(propsJson.sentenceWithGaps);
  const seenIndexes = new Set<number>();

  for (const [index, blank] of propsJson.blanks.entries()) {
    if (!isObjectRecord(blank)) {
      throw new Error(`${contextLabel} ACT-017 requires each blanks item to be an object.`);
    }

    const gapIndex = asOneBasedInteger(blank.correctGapIndex);
    if (!gapIndex) {
      throw new Error(`${contextLabel} ACT-017 requires blanks item ${index + 1} to include a 1-based correctGapIndex.`);
    }
    if (seenIndexes.has(gapIndex)) {
      throw new Error(`${contextLabel} ACT-017 requires unique correctGapIndex values across blanks.`);
    }
    seenIndexes.add(gapIndex);

    if (tokenCount && gapIndex > tokenCount) {
      throw new Error(`${contextLabel} ACT-017 correctGapIndex must be within sentenceWithGaps token bounds.`);
    }
  }
}

function collectWordBankValues(wordBankValue: unknown): Set<string> {
  if (!Array.isArray(wordBankValue)) {
    return new Set<string>();
  }

  const values = new Set<string>();
  for (const entry of wordBankValue) {
    if (typeof entry === "string") {
      const normalized = toComparableValue(entry);
      if (normalized) {
        values.add(normalized);
      }
      continue;
    }

    if (!isObjectRecord(entry)) {
      continue;
    }

    const word = asTrimmedString(entry.word);
    if (word) {
      values.add(toComparableValue(word));
    }
  }

  return values;
}

function validateAct018GapShape(propsJson: Record<string, unknown>, contextLabel: string): void {
  if (!Array.isArray(propsJson.sentenceWithGaps) || propsJson.sentenceWithGaps.length === 0) {
    throw new Error(`${contextLabel} ACT-018 requires propsJson.sentenceWithGaps with at least one row.`);
  }

  const wordBankValues = collectWordBankValues(propsJson.wordBank);

  for (const [sentenceIndex, item] of propsJson.sentenceWithGaps.entries()) {
    if (!isObjectRecord(item)) {
      throw new Error(`${contextLabel} ACT-018 requires each sentenceWithGaps item to be an object.`);
    }

    const sentence = asTrimmedString(item.sentence);
    if (!sentence) {
      throw new Error(`${contextLabel} ACT-018 requires sentenceWithGaps item ${sentenceIndex + 1} to include sentence.`);
    }

    if (!Array.isArray(item.gaps) || item.gaps.length === 0) {
      throw new Error(`${contextLabel} ACT-018 requires sentenceWithGaps item ${sentenceIndex + 1} to include gaps array.`);
    }

    const tokenCount = sentence.split(/\s+/).filter(Boolean).length;
    const seenPositions = new Set<number>();
    for (const [gapIndex, gap] of item.gaps.entries()) {
      if (!isObjectRecord(gap)) {
        throw new Error(`${contextLabel} ACT-018 requires each gap to be an object.`);
      }

      const position = asOneBasedInteger(gap.position);
      if (!position) {
        throw new Error(
          `${contextLabel} ACT-018 requires each gap to include a 1-based position (sentence ${sentenceIndex + 1}, gap ${gapIndex + 1}).`
        );
      }
      if (seenPositions.has(position)) {
        throw new Error(`${contextLabel} ACT-018 requires unique gap positions per sentence item.`);
      }
      seenPositions.add(position);
      if (tokenCount > 0 && position > tokenCount) {
        throw new Error(`${contextLabel} ACT-018 gap position must be within sentence token bounds.`);
      }

      const acceptedAnswers = Array.isArray(gap.accepted_answers)
        ? gap.accepted_answers
        : Array.isArray(gap.acceptedAnswers)
          ? gap.acceptedAnswers
          : null;
      if (!acceptedAnswers || acceptedAnswers.length === 0) {
        throw new Error(
          `${contextLabel} ACT-018 requires each gap to include accepted_answers (sentence ${sentenceIndex + 1}, gap ${gapIndex + 1}).`
        );
      }

      for (const answer of acceptedAnswers) {
        const normalizedAnswer = asTrimmedString(answer);
        if (!normalizedAnswer) {
          throw new Error(`${contextLabel} ACT-018 accepted_answers must contain only non-empty strings.`);
        }

        if (wordBankValues.size > 0 && !wordBankValues.has(toComparableValue(normalizedAnswer))) {
          throw new Error(`${contextLabel} ACT-018 accepted_answers must reference values present in wordBank.`);
        }
      }
    }
  }
}

function validateAct023DialogueShape(propsJson: Record<string, unknown>, contextLabel: string): void {
  if (!Array.isArray(propsJson.avatarDialogues) || propsJson.avatarDialogues.length === 0) {
    throw new Error(`${contextLabel} ACT-023 requires propsJson.avatarDialogues with at least one turn.`);
  }

  for (const [turnIndex, turn] of propsJson.avatarDialogues.entries()) {
    if (!isObjectRecord(turn)) {
      throw new Error(`${contextLabel} ACT-023 requires each avatarDialogues turn to be an object.`);
    }

    if (!asTrimmedString(turn.avatarLine)) {
      throw new Error(`${contextLabel} ACT-023 requires each turn to include non-empty avatarLine.`);
    }

    if (!Array.isArray(turn.correctResponses) || turn.correctResponses.length === 0) {
      throw new Error(`${contextLabel} ACT-023 requires each turn to include at least one correctResponses entry.`);
    }

    const normalizedResponses = turn.correctResponses
      .filter((item): item is string => typeof item === "string")
      .map((item) => collapseWhitespace(item))
      .filter((item) => item.length > 0);
    if (normalizedResponses.length === 0) {
      throw new Error(`${contextLabel} ACT-023 requires each turn to include non-empty correctResponses values.`);
    }

    let hasAudio = false;
    if (asTrimmedString(turn.audioFile)) {
      hasAudio = true;
    }

    if (isObjectRecord(turn.audio)) {
      validateSpeechPayload(turn.audio.speech, `${contextLabel} ACT-023 turn ${turnIndex + 1} audio`);
      hasAudio = true;
    }

    if (!hasAudio) {
      throw new Error(`${contextLabel} ACT-023 requires each turn to include audioFile or audio.speech.`);
    }
  }
}

function hasPlayableAudio(propsJson: Record<string, unknown>): boolean {
  if (asTrimmedString(propsJson.audioId)) {
    return true;
  }

  if (!isObjectRecord(propsJson.audio)) {
    return false;
  }

  try {
    validateSpeechPayload(propsJson.audio.speech, "Audio payload");
    return true;
  } catch {
    return false;
  }
}

function validateRuntimeContract(
  runtimeContract: Record<string, unknown> | null,
  contextLabel: string
): Record<string, unknown> {
  if (!runtimeContract) {
    throw new Error(`${contextLabel} requires non-empty runtimeContractV1.`);
  }

  const contractVersion = asTrimmedString(runtimeContract.contractVersion);
  if (contractVersion !== "v1") {
    throw new Error(`${contextLabel} requires runtimeContractV1.contractVersion="v1".`);
  }

  const interaction = runtimeContract.interaction;
  if (!isObjectRecord(interaction)) {
    throw new Error(`${contextLabel} requires runtimeContractV1.interaction object.`);
  }

  if (!asTrimmedString(interaction.activity_row_tool)) {
    throw new Error(`${contextLabel} requires runtimeContractV1.interaction.activity_row_tool.`);
  }

  if (!Array.isArray(interaction.command_row_controls)) {
    throw new Error(`${contextLabel} requires runtimeContractV1.interaction.command_row_controls array.`);
  }

  for (const control of interaction.command_row_controls) {
    if (!asTrimmedString(control)) {
      throw new Error(`${contextLabel} requires command_row_controls to contain only non-empty strings.`);
    }
  }

  const status = asTrimmedString(interaction.status);
  if (!status || !STATUS_VALUES.has(status)) {
    throw new Error(`${contextLabel} requires runtimeContractV1.interaction.status to be "active" or "inactive".`);
  }

  return runtimeContract;
}

function validateActSpecificShape(
  activityId: string | null,
  propsJson: Record<string, unknown>,
  contextLabel: string
): void {
  if (!activityId) {
    return;
  }

  const shapeLockSpec = ACTIVE_ACTIVITY_SHAPE_LOCK_MAP[activityId];
  if (!shapeLockSpec) {
    if (INACTIVE_ACTIVITY_IDS.has(activityId)) {
      throw new Error(`${contextLabel} ${activityId} is inactive and cannot be imported in this lane.`);
    }
    throw new Error(`${contextLabel} uses unsupported activityId "${activityId}".`);
  }

  for (const requiredKey of shapeLockSpec.requiredAll) {
    if (!hasMeaningfulValue(propsJson[requiredKey])) {
      throw new Error(`${contextLabel} ${activityId} requires non-empty propsJson.${requiredKey}.`);
    }
  }

  for (const oneOfGroup of shapeLockSpec.requiredOneOf ?? []) {
    const hasAny = oneOfGroup.some((fieldName) => hasMeaningfulValue(propsJson[fieldName]));
    if (!hasAny) {
      throw new Error(
        `${contextLabel} ${activityId} requires at least one of: ${oneOfGroup
          .map((fieldName) => `propsJson.${fieldName}`)
          .join(", ")}.`
      );
    }
  }

  if (activityId === "ACT-001") {
    validateLinesShape(propsJson.lines, `${contextLabel} ACT-001`);
    return;
  }

  if (activityId === "ACT-002") {
    const hasSyllableSource =
      asTrimmedString(propsJson.syllableBreakdown) ||
      (Array.isArray(propsJson.syllables) && propsJson.syllables.length > 0) ||
      asTrimmedString(propsJson.body);
    if (!hasSyllableSource) {
      throw new Error(`${contextLabel} ACT-002 requires at least one of propsJson.syllableBreakdown/syllables/body.`);
    }

    const stressIndex = Number(propsJson.correctStressIndex);
    if (!Number.isInteger(stressIndex) || stressIndex < 1) {
      throw new Error(`${contextLabel} ACT-002 requires propsJson.correctStressIndex as a 1-based integer.`);
    }

    return;
  }

  if (activityId === "ACT-003") {
    const promptMode = asTrimmedString(propsJson.promptMode);
    if (!promptMode || !ACT_003_PROMPT_MODES.has(promptMode)) {
      throw new Error(`${contextLabel} ACT-003 requires propsJson.promptMode: same_different | select_word.`);
    }

    if (!Array.isArray(propsJson.choiceElements) || propsJson.choiceElements.length < 2) {
      throw new Error(`${contextLabel} ACT-003 requires propsJson.choiceElements with at least two options.`);
    }

    for (const [choiceIndex, element] of propsJson.choiceElements.entries()) {
      if (!isObjectRecord(element) || !asTrimmedString(element.label)) {
        throw new Error(
          `${contextLabel} ACT-003 requires each choiceElements item to include non-empty label (item ${choiceIndex + 1}).`
        );
      }
      validateSpeechPayload(element.speech, `${contextLabel} ACT-003 choiceElements item ${choiceIndex + 1}`);
    }
    return;
  }

  if (activityId === "ACT-004") {
    if (!Array.isArray(propsJson.intonationOptions) || propsJson.intonationOptions.length < 2) {
      throw new Error(`${contextLabel} ACT-004 requires propsJson.intonationOptions with at least two options.`);
    }

    const normalizedOptions = propsJson.intonationOptions
      .map((value) => asTrimmedString(value))
      .filter((value): value is string => value !== null);
    const uniqueOptions = new Set(normalizedOptions);
    if (normalizedOptions.length !== propsJson.intonationOptions.length || uniqueOptions.size < 2) {
      throw new Error(`${contextLabel} ACT-004 requires unique non-empty intonationOptions.`);
    }

    const correctCurveId = asTrimmedString(propsJson.correctCurveId);
    if (!correctCurveId || !uniqueOptions.has(correctCurveId)) {
      throw new Error(`${contextLabel} ACT-004 requires correctCurveId that matches intonationOptions.`);
    }

    if (!hasPlayableAudio(propsJson)) {
      throw new Error(`${contextLabel} ACT-004 requires playable audio via propsJson.audioId or propsJson.audio.speech.`);
    }
    return;
  }

  if (activityId === "ACT-005") {
    const hasLines = Array.isArray(propsJson.lines) && propsJson.lines.length > 0;
    if (hasLines) {
      validateLinesShape(propsJson.lines, `${contextLabel} ACT-005`);
    }

    const hasTextSource = Boolean(asTrimmedString(propsJson.targetText) || asTrimmedString(propsJson.body));
    if (!hasLines && !hasTextSource) {
      throw new Error(`${contextLabel} ACT-005 requires non-empty propsJson.lines or propsJson.targetText/body.`);
    }
    return;
  }

  if (activityId === "ACT-009" || activityId === "ACT-010" || activityId === "ACT-021") {
    const labels = collectChoiceLabels(propsJson.choiceElements, contextLabel, activityId);
    validateCorrectAnswerAgainstChoiceLabels(propsJson.correctAnswer, labels, contextLabel, activityId);

    if (activityId === "ACT-009" && !hasPlayableAudio(propsJson)) {
      throw new Error(`${contextLabel} ACT-009 requires playable audio via propsJson.audioId or propsJson.audio.speech.`);
    }
    return;
  }

  if (activityId === "ACT-015") {
    validateAct015TokenShape(propsJson, contextLabel);
    return;
  }

  if (activityId === "ACT-017") {
    validateAct017GapShape(propsJson, contextLabel);
    return;
  }

  if (activityId === "ACT-018") {
    validateAct018GapShape(propsJson, contextLabel);
    return;
  }

  if (activityId === "ACT-023") {
    validateAct023DialogueShape(propsJson, contextLabel);
  }
}

function validatePropsJsonCollision(
  fieldMap: Map<string, unknown>,
  propsJson: Record<string, unknown> | null,
  contextLabel: string
): void {
  if (!propsJson) {
    return;
  }

  const collisions: string[] = [];
  for (const fieldName of STRUCTURED_OVERRIDE_FIELD_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(propsJson, fieldName)) {
      continue;
    }

    if (hasMeaningfulValue(fieldMap.get(fieldName))) {
      collisions.push(fieldName);
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `${contextLabel} must keep structured payload in propsJson only. Remove top-level duplicate fields: ${collisions.join(
        ", "
      )}.`
    );
  }
}

function shouldValidateUpdateEntry(fieldMap: Map<string, unknown>): boolean {
  if (fieldMap.has("activityId")) {
    return true;
  }

  if (fieldMap.has("propsJson") || fieldMap.has("runtimeContractV1")) {
    return true;
  }

  return STRUCTURED_OVERRIDE_FIELD_KEYS.some((fieldName) => fieldMap.has(fieldName));
}

function validateActivitySlideFieldMap(
  fieldMap: Map<string, unknown>,
  mode: ActivitySlidePreflightMode,
  contextLabel: string
): void {
  if (mode === "update" && !shouldValidateUpdateEntry(fieldMap)) {
    return;
  }

  const activityId = asTrimmedString(fieldMap.get("activityId"));
  const propsJsonRaw = parseObjectLikeJson(fieldMap.get("propsJson"), `${contextLabel} propsJson`);
  const propsJson = propsJsonRaw ? normalizeActivityPropsJson(activityId, propsJsonRaw) : null;
  const runtimeFromTopLevel = parseObjectLikeJson(
    fieldMap.get("runtimeContractV1"),
    `${contextLabel} runtimeContractV1`
  );
  const runtimeFromProps =
    propsJson && Object.prototype.hasOwnProperty.call(propsJson, "runtimeContractV1")
      ? parseObjectLikeJson(propsJson.runtimeContractV1, `${contextLabel} propsJson.runtimeContractV1`)
      : null;
  const runtimeContract = validateRuntimeContract(
    runtimeFromTopLevel ?? runtimeFromProps,
    `${contextLabel}`
  );

  if (runtimeFromTopLevel && runtimeFromProps) {
    const topLevelInteraction = runtimeFromTopLevel.interaction;
    const propsInteraction = runtimeFromProps.interaction;
    if (
      JSON.stringify(topLevelInteraction) !== JSON.stringify(propsInteraction) ||
      runtimeFromTopLevel.contractVersion !== runtimeFromProps.contractVersion
    ) {
      throw new Error(`${contextLabel} has mismatched runtimeContractV1 between top-level field and propsJson.`);
    }
  }

  if (!propsJson) {
    throw new Error(`${contextLabel} requires non-empty propsJson.`);
  }

  validatePropsJsonCollision(fieldMap, propsJson, contextLabel);

  validateActSpecificShape(activityId, propsJson, contextLabel);

  // Runtime must also be present inside propsJson for transparent pipe.
  if (!runtimeFromProps) {
    throw new Error(`${contextLabel} requires propsJson.runtimeContractV1.`);
  }
  validateRuntimeContract(runtimeContract, contextLabel);
}

function extractFieldMapFromImportEntry(entry: unknown, contextLabel: string): Map<string, unknown> {
  if (!isObjectRecord(entry)) {
    throw new Error(`${contextLabel} must be an object.`);
  }

  const fieldMap = new Map<string, unknown>();
  for (const [, categoryPayload] of Object.entries(entry)) {
    if (!isObjectRecord(categoryPayload)) {
      continue;
    }

    for (const [fieldName, fieldValue] of Object.entries(categoryPayload)) {
      fieldMap.set(fieldName, fieldValue);
    }
  }

  return fieldMap;
}

function extractFieldMapFromFormData(formData: FormData): Map<string, unknown> {
  const fieldMap = new Map<string, unknown>();

  for (const [qualifiedKey, value] of formData.entries()) {
    if (qualifiedKey.startsWith("$ACTION_")) {
      continue;
    }

    const separatorIndex = qualifiedKey.indexOf(".");
    if (separatorIndex < 0) {
      continue;
    }

    const fieldName = qualifiedKey.slice(separatorIndex + 1);
    if (typeof value === "string") {
      fieldMap.set(fieldName, value);
    }
  }

  return fieldMap;
}

export function validateActivitySlideImportPayloadPreflight(
  payload: unknown,
  mode: ActivitySlidePreflightMode
): void {
  const entries = parseImportEntries(payload);
  for (const [index, entry] of entries.entries()) {
    const contextLabel = `Activity slide ${mode} import entry ${index + 1}`;
    const fieldMap = extractFieldMapFromImportEntry(entry, contextLabel);
    validateActivitySlideFieldMap(fieldMap, mode, contextLabel);
  }
}

export function validateActivitySlideFormDataPreflight(
  formData: FormData,
  mode: ActivitySlidePreflightMode
): void {
  const contextLabel = `Activity slide ${mode} request`;
  const fieldMap = extractFieldMapFromFormData(formData);
  validateActivitySlideFieldMap(fieldMap, mode, contextLabel);
}

export function validateActivitySlidePersistedValuesPostWrite(
  persistedValues: FieldInputMap,
  contextLabel: string
): void {
  const fieldMap = new Map<string, unknown>();
  for (const [qualifiedKey, fieldValue] of persistedValues.entries()) {
    const { fieldName } = splitQualifiedFieldKey(qualifiedKey);
    fieldMap.set(fieldName, fieldValue);
  }

  validateActivitySlideFieldMap(fieldMap, "create", contextLabel);
}
