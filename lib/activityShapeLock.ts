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
    requiredOneOf: [
      ["syllableBreakdown", "body"],
      ["audioId"],
    ],
  },
  "ACT-003": {
    requiredAll: ["promptMode", "choiceElements"],
  },
  "ACT-004": {
    requiredAll: ["intonationOptions", "correctCurveId"],
    requiredOneOf: [["audioId"]],
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
    requiredAll: ["categoryLabels", "wordBank"],
  },
  "ACT-017": {
    requiredAll: ["body"],
  },
  "ACT-018": {
    requiredAll: ["body", "wordBank"],
  },
  "ACT-019": {
    requiredAll: ["body", "correctAnswer"],
  },
  "ACT-020": {
    requiredAll: ["audioPrompt"],
  },
  "ACT-021": {
    requiredAll: ["audioPrompt", "choiceElements"],
  },
  "ACT-022": {
    requiredAll: ["audioPrompt"],
  },
  "ACT-023": {
    requiredAll: ["buttons"],
  },
  "ACT-024": {
    requiredAll: [],
  },
  "ACT-025": {
    requiredAll: ["lines"],
  },
  "ACT-026": {
    requiredAll: ["audioPrompt"],
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
