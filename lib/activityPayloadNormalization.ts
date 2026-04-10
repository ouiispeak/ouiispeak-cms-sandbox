import { ACTIVE_ACTIVITY_SHAPE_LOCK_MAP } from "@/lib/activityShapeLock";

type ObjectRecord = Record<string, unknown>;

const ACT_CORRECT_ANSWER_NORMALIZATION_SET = new Set(["ACT-009", "ACT-010", "ACT-021"]);

// Canonical structured payload keys that must stay inside propsJson when present.
const CANONICAL_STRUCTURED_PAYLOAD_FIELD_KEYS = [
  "acceptedCorrections",
  "audio",
  "audioA",
  "audioB",
  "audioClips",
  "audioPrompt",
  "avatarDialogues",
  "blanks",
  "body",
  "buttons",
  "categoryLabels",
  "choiceElements",
  "correctAnswer",
  "correctCurveId",
  "correctOddIndex",
  "correctOrderClips",
  "correctOrderWords",
  "correctStressIndex",
  "errorIndex",
  "incorrectSentence",
  "intonationOptions",
  "keywordThreshold",
  "letterUnits",
  "lines",
  "matchPairs",
  "maxWordCount",
  "minWordCount",
  "promptMode",
  "promptText",
  "sentenceCards",
  "sentenceTokens",
  "sentenceWithGaps",
  "statement",
  "syllableBreakdown",
  "targetKeywords",
  "targetText",
  "tenseBins",
  "word",
  "wordBank",
] as const;

const RISING_CURVE_ALIASES = new Set(["rising", "rise", "up", "ascending", "question", "montante"]);
const FALLING_CURVE_ALIASES = new Set(["falling", "fall", "down", "descending", "statement", "declarative", "descendante"]);
const FALL_RISE_CURVE_ALIASES = new Set(["fall-rise", "fallrise", "falling-rising", "fallingrising", "fall_rise"]);

function isObjectRecord(value: unknown): value is ObjectRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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

function toNormalizedStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => collapseWhitespace(item))
    .filter((item) => item.length > 0);
}

function toLowerComparable(value: string): string {
  return collapseWhitespace(value).toLowerCase();
}

function normalizeCurveToken(value: unknown): string | null {
  const raw = asTrimmedString(value);
  if (!raw) {
    return null;
  }

  const lower = raw.toLowerCase();
  const collapsed = lower.replace(/[\s_]+/g, "-");
  const compact = lower.replace(/[\s_-]+/g, "");

  if (RISING_CURVE_ALIASES.has(collapsed) || RISING_CURVE_ALIASES.has(compact)) {
    return "rising";
  }
  if (FALLING_CURVE_ALIASES.has(collapsed) || FALLING_CURVE_ALIASES.has(compact)) {
    return "falling";
  }
  if (FALL_RISE_CURVE_ALIASES.has(collapsed) || FALL_RISE_CURVE_ALIASES.has(compact)) {
    return "fall-rise";
  }

  return collapsed;
}

function normalizeAudioPromptAlias(propsJson: ObjectRecord): void {
  if (!isObjectRecord(propsJson.audio) && isObjectRecord(propsJson.audioPrompt)) {
    const promptPayload = propsJson.audioPrompt;
    if (isObjectRecord(promptPayload.speech)) {
      propsJson.audio = { speech: promptPayload.speech };
    } else if (asTrimmedString(promptPayload.mode)) {
      // Accept direct speech-like shape and normalize into canonical audio.speech.
      propsJson.audio = { speech: promptPayload };
    }
  }
}

function normalizeAct004Payload(propsJson: ObjectRecord): void {
  if (Array.isArray(propsJson.intonationOptions)) {
    propsJson.intonationOptions = propsJson.intonationOptions
      .map((item) => normalizeCurveToken(item))
      .filter((item): item is string => item !== null);
  }

  const normalizedCorrectCurveId = normalizeCurveToken(propsJson.correctCurveId);
  if (normalizedCorrectCurveId) {
    propsJson.correctCurveId = normalizedCorrectCurveId;
  }
}

function normalizeCorrectAnswerFromChoices(activityId: string | null, propsJson: ObjectRecord): void {
  if (!activityId || !ACT_CORRECT_ANSWER_NORMALIZATION_SET.has(activityId)) {
    return;
  }

  if (!Array.isArray(propsJson.choiceElements)) {
    return;
  }

  const labels = propsJson.choiceElements
    .map((value) => (isObjectRecord(value) ? asTrimmedString(value.label) : null))
    .filter((value): value is string => value !== null);

  if (labels.length === 0) {
    return;
  }

  const rawCorrectAnswer = propsJson.correctAnswer;
  if (typeof rawCorrectAnswer === "number") {
    const oneBasedIndex = Math.trunc(rawCorrectAnswer);
    const label = labels[oneBasedIndex - 1];
    if (label) {
      propsJson.correctAnswer = label;
    }
    return;
  }

  const stringAnswer = asTrimmedString(rawCorrectAnswer);
  if (!stringAnswer) {
    return;
  }

  if (/^\d+$/.test(stringAnswer)) {
    const oneBasedIndex = Number.parseInt(stringAnswer, 10);
    const label = labels[oneBasedIndex - 1];
    if (label) {
      propsJson.correctAnswer = label;
    }
    return;
  }

  const comparableAnswer = toLowerComparable(stringAnswer);
  const matchedLabel = labels.find((label) => toLowerComparable(label) === comparableAnswer);
  if (matchedLabel) {
    propsJson.correctAnswer = matchedLabel;
  }
}

function normalizeAct023Payload(propsJson: ObjectRecord): void {
  if (!Array.isArray(propsJson.avatarDialogues)) {
    return;
  }

  propsJson.avatarDialogues = propsJson.avatarDialogues.map((turn) => {
    if (!isObjectRecord(turn)) {
      return turn;
    }

    const nextTurn: ObjectRecord = { ...turn };
    const audioFile = asTrimmedString(nextTurn.audioFile);

    if (!isObjectRecord(nextTurn.audio) && audioFile) {
      nextTurn.audio = {
        speech: {
          mode: "file",
          fileUrl: audioFile,
        },
      };
    }

    if (isObjectRecord(nextTurn.audio) && !audioFile) {
      const speech = nextTurn.audio.speech;
      if (isObjectRecord(speech) && asTrimmedString(speech.mode) === "file") {
        const fileUrl = asTrimmedString(speech.fileUrl);
        if (fileUrl) {
          nextTurn.audioFile = fileUrl;
        }
      }
    }

    if (Array.isArray(nextTurn.correctResponses)) {
      nextTurn.correctResponses = nextTurn.correctResponses
        .filter((item): item is string => typeof item === "string")
        .map((item) => collapseWhitespace(item))
        .filter((item) => item.length > 0);
    }

    return nextTurn;
  });
}

function normalizeAcceptedAlternatives(raw: unknown): string[] {
  if (typeof raw === "string") {
    return raw
      .split(/\n|,/)
      .map((item) => collapseWhitespace(item))
      .filter((item) => item.length > 0);
  }

  return [];
}

function normalizeAct018Payload(propsJson: ObjectRecord): void {
  if (!Array.isArray(propsJson.sentenceWithGaps)) {
    return;
  }

  propsJson.sentenceWithGaps = propsJson.sentenceWithGaps.map((item) => {
    if (!isObjectRecord(item)) {
      return item;
    }

    const nextItem: ObjectRecord = { ...item };
    const legacyAcceptedAnswers = toNormalizedStringArray(
      Array.isArray(nextItem.accepted_answers)
        ? nextItem.accepted_answers
        : Array.isArray(nextItem.acceptedAnswers)
          ? nextItem.acceptedAnswers
          : null
    );
    const rawGaps = Array.isArray(nextItem.gaps) ? nextItem.gaps : [];

    nextItem.gaps = rawGaps.map((rawGap) => {
      if (isObjectRecord(rawGap)) {
        const nextGap: ObjectRecord = { ...rawGap };
        const position = asOneBasedInteger(nextGap.position ?? nextGap.correctGapIndex ?? nextGap.index);
        if (position !== null) {
          nextGap.position = position;
        }
        delete nextGap.correctGapIndex;
        delete nextGap.index;

        const acceptedAnswers = toNormalizedStringArray(
          Array.isArray(nextGap.accepted_answers)
            ? nextGap.accepted_answers
            : Array.isArray(nextGap.acceptedAnswers)
              ? nextGap.acceptedAnswers
              : null
        );
        const acceptedAlternatives = normalizeAcceptedAlternatives(nextGap.acceptedAlternatives);
        const fallbackAcceptedAnswers = acceptedAnswers.length > 0 ? acceptedAnswers : acceptedAlternatives;
        nextGap.accepted_answers =
          fallbackAcceptedAnswers.length > 0 ? fallbackAcceptedAnswers : legacyAcceptedAnswers;
        delete nextGap.acceptedAnswers;
        delete nextGap.acceptedAlternatives;
        return nextGap;
      }

      const position = asOneBasedInteger(rawGap);
      if (position === null) {
        return rawGap;
      }

      return {
        position,
        accepted_answers: legacyAcceptedAnswers,
      };
    });

    delete nextItem.accepted_answers;
    delete nextItem.acceptedAnswers;
    return nextItem;
  });
}

export function deriveActivityStructuredPayloadFieldKeys(): string[] {
  const derivedKeys = new Set<string>(CANONICAL_STRUCTURED_PAYLOAD_FIELD_KEYS);

  for (const spec of Object.values(ACTIVE_ACTIVITY_SHAPE_LOCK_MAP)) {
    for (const requiredKey of spec.requiredAll) {
      derivedKeys.add(requiredKey);
    }

    for (const oneOfGroup of spec.requiredOneOf ?? []) {
      for (const fieldKey of oneOfGroup) {
        derivedKeys.add(fieldKey);
      }
    }
  }

  return [...derivedKeys].sort();
}

export function normalizeActivityPropsJson(
  activityId: string | null | undefined,
  propsJson: ObjectRecord
): ObjectRecord {
  const normalized: ObjectRecord = { ...propsJson };
  const normalizedActivityId = asTrimmedString(activityId ?? null);

  normalizeAudioPromptAlias(normalized);

  if (normalizedActivityId === "ACT-004") {
    normalizeAct004Payload(normalized);
  }

  normalizeCorrectAnswerFromChoices(normalizedActivityId, normalized);

  if (normalizedActivityId === "ACT-018") {
    normalizeAct018Payload(normalized);
  }

  if (normalizedActivityId === "ACT-023") {
    normalizeAct023Payload(normalized);
  }

  return normalized;
}
