import type { UniversalConfigCategory } from "@/lib/universalConfigs";

export type ActivityProfile =
  | "default"
  | "act-001"
  | "act-002"
  | "act-003"
  | "act-004"
  | "act-005"
  | "act-009"
  | "act-010"
  | "act-011"
  | "act-012"
  | "act-013"
  | "act-014"
  | "act-015"
  | "act-016"
  | "act-017"
  | "act-018"
  | "act-019"
  | "act-020"
  | "act-021"
  | "act-022"
  | "act-023"
  | "act-024"
  | "act-025"
  | "act-026";
export type ConcreteActivityProfile = Exclude<ActivityProfile, "default">;

const ACTIVITY_DEFAULT_FIELD_KEYS = [
  "activityId",
  "aiInstructions",
  "allowRetry",
  "allowSkip",
  "anecdoteOrMemoryHook",
  "assessmentPlan",
  "audienceNotes",
  "autoAdvance",
  "levelMax",
  "levelMin",
  "body",
  "buttons",
  "cefrLevel",
  "cefrMax",
  "cefrMin",
  "commonMisconceptions",
  "competencyTags",
  "coreTopics",
  "culturalContext",
  "defaultLang",
  "delayMs",
  "description",
  "diagnosticChecks",
  "diffLog",
  "differentiationPaths",
  "differentiationStrategies",
  "discourseFocus",
  "estimatedMinutes",
  "exampleResponses",
  "expansionGuidelines",
  "expectedCompletionRate",
  "expectedTimeOnTask",
  "extraPracticeNotes",
  "extractabilityTier",
  "forbiddenPatterns",
  "grammarFocus",
  "groupId",
  "groupName",
  "ingestPayload",
  "ingestSource",
  "instructions",
  "isRequiredToPass",
  "keywords",
  "l1InterferenceNotes",
  "lastUpdatedAt",
  "lastUpdatedBy",
  "learningObjectives",
  "lessonId",
  "linkedResources",
  "manualOverrideJson",
  "masteryRule",
  "masteryThreshold",
  "maxAttempts",
  "maxScoreValue",
  "metadata",
  "minAttemptsBeforeSkip",
  "moduleId",
  "note",
  "notesForTeacherOrAI",
  "orderIndex",
  "ownerTeam",
  "passRequiredForNext",
  "passingScoreType",
  "passingScoreValue",
  "prerequisiteEdges",
  "prerequisiteModules",
  "prerequisiteNodes",
  "prerequisiteSlices",
  "prerequisites",
  "priorLessons",
  "pronunciationFocus",
  "propsJson",
  "registerTone",
  "registerVariants",
  "remediationGuidance",
  "remediationPaths",
  "requiredScore",
  "retryPolicy",
  "runtimeContractV1",
  "shortSummaryTeacherActivity",
  "shortSummaryTeacherSlide",
  "signatureMetaphors",
  "simplificationGuidelines",
  "skipPolicy",
  "slideId",
  "slug",
  "sourceVersion",
  "styleConstraints",
  "subtitle",
  "successCriteria",
  "tags",
  "targetLanguage",
  "targetNodeKeys",
  "targetedEdges",
  "targetedNodes",
  "targetedSlices",
  "teacherNotes",
  "teacherOverview",
  "telemetryTags",
  "textSubtype",
  "timeExpectationActivity",
  "title",
  "topicCategory",
  "type",
  "version",
  "visibility",
  "vocabularyTheme",
] as const;

const ACTIVITY_PROFILE_EXTRA_FIELDS: Record<ConcreteActivityProfile, readonly string[]> = {
  "act-001": ["lines"],
  "act-002": ["audioPrompt", "correctStressIndex", "syllableBreakdown"],
  "act-003": ["audioA", "audioB", "choiceElements", "promptMode"],
  "act-004": ["audioPrompt", "correctCurveId", "intonationOptions"],
  "act-005": ["lines", "targetText"],
  "act-009": ["audioPrompt", "choiceElements", "correctAnswer"],
  "act-010": ["choiceElements", "correctAnswer", "promptText"],
  "act-011": ["correctAnswer", "statement"],
  "act-012": ["choiceElements", "correctOddIndex"],
  "act-013": ["matchPairs"],
  "act-014": ["categoryLabels", "wordBank"],
  "act-015": ["correctOrderWords", "sentenceTokens"],
  "act-016": ["sentenceCards", "tenseBins"],
  "act-017": ["blanks", "sentenceWithGaps"],
  "act-018": ["sentenceWithGaps", "wordBank"],
  "act-019": ["acceptedCorrections", "errorIndex", "incorrectSentence"],
  "act-020": ["promptText", "targetText"],
  "act-021": ["choiceElements", "correctAnswer"],
  "act-022": ["keywordThreshold", "maxWordCount", "minWordCount", "promptText", "targetKeywords"],
  "act-023": ["avatarDialogues"],
  "act-024": ["letterUnits", "word"],
  "act-025": ["audioClips", "correctOrderClips"],
  "act-026": ["promptText", "targetText"],
};

export function resolveActivityProfile(value: string | string[] | undefined): ActivityProfile {
  const firstValue = Array.isArray(value) ? value[0] : value;
  if (firstValue === "default") {
    return "default";
  }
  if (
    firstValue === "act-001" ||
    firstValue === "act-002" ||
    firstValue === "act-003" ||
    firstValue === "act-004" ||
    firstValue === "act-005" ||
    firstValue === "act-009" ||
    firstValue === "act-010" ||
    firstValue === "act-011" ||
    firstValue === "act-012" ||
    firstValue === "act-013" ||
    firstValue === "act-014" ||
    firstValue === "act-015" ||
    firstValue === "act-016" ||
    firstValue === "act-017" ||
    firstValue === "act-018" ||
    firstValue === "act-019" ||
    firstValue === "act-020" ||
    firstValue === "act-021" ||
    firstValue === "act-022" ||
    firstValue === "act-023" ||
    firstValue === "act-024" ||
    firstValue === "act-025" ||
    firstValue === "act-026"
  ) {
    return firstValue;
  }
  return "default";
}

export function resolveConcreteActivityProfile(value: string | string[] | undefined): ConcreteActivityProfile {
  const resolved = resolveActivityProfile(value);
  if (resolved === "default") {
    return "act-001";
  }
  return resolved;
}

export function resolveConcreteActivityProfileFromActivityId(
  activityIdValue: string | null | undefined
): ConcreteActivityProfile {
  if (activityIdValue === "ACT-002") {
    return "act-002";
  }
  if (activityIdValue === "ACT-003") {
    return "act-003";
  }
  if (activityIdValue === "ACT-004") {
    return "act-004";
  }
  if (activityIdValue === "ACT-005") {
    return "act-005";
  }
  if (activityIdValue === "ACT-009") {
    return "act-009";
  }
  if (activityIdValue === "ACT-010") {
    return "act-010";
  }
  if (activityIdValue === "ACT-011") {
    return "act-011";
  }
  if (activityIdValue === "ACT-012") {
    return "act-012";
  }
  if (activityIdValue === "ACT-013") {
    return "act-013";
  }
  if (activityIdValue === "ACT-014") {
    return "act-014";
  }
  if (activityIdValue === "ACT-015") {
    return "act-015";
  }
  if (activityIdValue === "ACT-016") {
    return "act-016";
  }
  if (activityIdValue === "ACT-017") {
    return "act-017";
  }
  if (activityIdValue === "ACT-018") {
    return "act-018";
  }
  if (activityIdValue === "ACT-019") {
    return "act-019";
  }
  if (activityIdValue === "ACT-020") {
    return "act-020";
  }
  if (activityIdValue === "ACT-021") {
    return "act-021";
  }
  if (activityIdValue === "ACT-022") {
    return "act-022";
  }
  if (activityIdValue === "ACT-023") {
    return "act-023";
  }
  if (activityIdValue === "ACT-024") {
    return "act-024";
  }
  if (activityIdValue === "ACT-025") {
    return "act-025";
  }
  if (activityIdValue === "ACT-026") {
    return "act-026";
  }
  return "act-001";
}

function buildActivityProfileAllowedFieldSet(profile: ActivityProfile): Set<string> {
  const keys = new Set<string>(ACTIVITY_DEFAULT_FIELD_KEYS);

  if (profile === "default") {
    return keys;
  }

  for (const extraFieldKey of ACTIVITY_PROFILE_EXTRA_FIELDS[profile]) {
    keys.add(extraFieldKey);
  }

  return keys;
}

export function filterActivitySlideCategoriesForProfile(
  categories: UniversalConfigCategory[],
  profile: ActivityProfile
): UniversalConfigCategory[] {
  const allowedFieldKeys = buildActivityProfileAllowedFieldSet(profile);
  return categories
    .map((category) => ({
      ...category,
      fields: category.fields.filter((field) => allowedFieldKeys.has(field.key)),
    }))
    .filter((category) => category.fields.length > 0);
}
