export type ActivityShapeLockSpec = {
  requiredAll: readonly string[];
  requiredOneOf?: readonly (readonly string[])[];
};

export const ACTIVE_ACTIVITY_SHAPE_LOCK_MAP: Record<string, ActivityShapeLockSpec> = {
  "ACT-001": {
    requiredAll: ["lines"],
  },
  "ACT-002": {
    requiredAll: ["correctStressIndex"],
    requiredOneOf: [["syllableBreakdown", "body"]],
  },
  "ACT-003": {
    requiredAll: ["promptMode", "choiceElements"],
  },
  "ACT-004": {
    requiredAll: ["intonationOptions", "correctCurveId"],
  },
  "ACT-005": {
    requiredAll: [],
    requiredOneOf: [["lines", "targetText", "body"]],
  },
  "ACT-009": {
    requiredAll: ["choiceElements", "correctAnswer", "audioPrompt"],
  },
  "ACT-010": {
    requiredAll: ["promptText", "choiceElements", "correctAnswer"],
  },
  "ACT-011": {
    requiredAll: ["statement", "correctAnswer"],
  },
  "ACT-012": {
    requiredAll: ["choiceElements", "correctOddIndex"],
  },
  "ACT-013": {
    requiredAll: ["matchPairs"],
  },
  "ACT-014": {
    requiredAll: ["categoryLabels", "wordBank"],
  },
  "ACT-015": {
    requiredAll: ["sentenceTokens", "correctOrderWords"],
  },
  "ACT-016": {
    requiredAll: ["tenseBins", "sentenceCards"],
  },
  "ACT-017": {
    requiredAll: ["sentenceWithGaps", "blanks"],
  },
  "ACT-018": {
    requiredAll: ["wordBank", "sentenceWithGaps"],
  },
  "ACT-019": {
    requiredAll: ["incorrectSentence", "acceptedCorrections", "errorIndex"],
  },
  "ACT-020": {
    requiredAll: ["promptText", "targetText"],
  },
  "ACT-021": {
    requiredAll: ["choiceElements", "correctAnswer"],
  },
  "ACT-022": {
    requiredAll: ["promptText", "targetKeywords"],
  },
  "ACT-023": {
    requiredAll: ["avatarDialogues"],
  },
  "ACT-024": {
    requiredAll: ["word", "letterUnits"],
  },
  "ACT-025": {
    requiredAll: ["audioClips", "correctOrderClips"],
  },
  "ACT-026": {
    requiredAll: ["promptText", "targetText"],
  },
};

export function listActiveActivityShapeLockFieldKeys(): string[] {
  const keys = new Set<string>();

  for (const spec of Object.values(ACTIVE_ACTIVITY_SHAPE_LOCK_MAP)) {
    for (const key of spec.requiredAll) {
      keys.add(key);
    }

    for (const group of spec.requiredOneOf ?? []) {
      for (const key of group) {
        keys.add(key);
      }
    }
  }

  return [...keys].sort();
}
