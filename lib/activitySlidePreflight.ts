import { isObjectRecord, parseImportEntries } from "@/lib/componentCore";
import { ACTIVE_ACTIVITY_SHAPE_LOCK_MAP } from "@/lib/activityShapeLock";

type ActivitySlidePreflightMode = "create" | "update";

const STRUCTURED_OVERRIDE_FIELD_KEYS = [
  "lines",
  "targetText",
  "body",
  "choiceElements",
  "correctAnswer",
  "promptText",
  "statement",
  "correctOddIndex",
  "matchPairs",
  "categoryLabels",
  "wordBank",
  "sentenceTokens",
  "correctOrderWords",
  "tenseBins",
  "sentenceCards",
  "sentenceWithGaps",
  "blanks",
  "incorrectSentence",
  "acceptedCorrections",
  "errorIndex",
  "targetKeywords",
  "keywordThreshold",
  "minWordCount",
  "maxWordCount",
  "avatarDialogues",
  "word",
  "letterUnits",
  "audioClips",
  "correctOrderClips",
  "audio",
  "buttons",
  "promptMode",
  "intonationOptions",
  "correctCurveId",
  "audioPrompt",
  "syllableBreakdown",
  "correctStressIndex",
] as const;

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

  const propsJson = parseObjectLikeJson(fieldMap.get("propsJson"), `${contextLabel} propsJson`);
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

  const activityId = asTrimmedString(fieldMap.get("activityId"));
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
