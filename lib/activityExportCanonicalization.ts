import { deriveActivityStructuredPayloadFieldKeys, normalizeActivityPropsJson } from "@/lib/activityPayloadNormalization";
import { ACTIVE_ACTIVITY_SHAPE_LOCK_MAP } from "@/lib/activityShapeLock";
import { buildActivityDefaultsById } from "@/lib/activityRuntimeDefaults";

type CategoryPayload = Record<string, unknown>;
type ActivityExportTemplate = Record<string, CategoryPayload>;

const STRUCTURED_ACTIVITY_FIELD_KEYS = new Set(
  deriveActivityStructuredPayloadFieldKeys().filter((fieldName) => fieldName !== "propsJson")
);

function parseObjectLikePropsJson(value: unknown): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function stripStructuredTopLevelFields(payload: CategoryPayload): CategoryPayload {
  const nextPayload = { ...payload };
  for (const fieldName of STRUCTURED_ACTIVITY_FIELD_KEYS) {
    if (Object.prototype.hasOwnProperty.call(nextPayload, fieldName)) {
      delete nextPayload[fieldName];
    }
  }
  return nextPayload;
}

function buildRuntimeContract(activityId: string): Record<string, unknown> {
  const defaults = buildActivityDefaultsById()[activityId];
  if (!defaults) {
    return {
      contractVersion: "v1",
      interaction: {
        activity_row_tool: "",
        command_row_controls: [],
        status: "active",
      },
    };
  }

  return {
    contractVersion: "v1",
    interaction: {
      activity_row_tool: defaults.activityRowTool,
      command_row_controls: defaults.commandRowControls,
      status: "active",
    },
  };
}

function buildActivityTemplateValue(fieldKey: string, activityId: string): unknown {
  if (fieldKey === "audioPrompt") {
    return {
      speech: {
        mode: "tts",
        text: "",
      },
    };
  }

  if (fieldKey === "avatarDialogues") {
    return [
      {
        avatarLine: "",
        audioFile: "",
        correctResponses: [],
      },
    ];
  }

  if (fieldKey === "blanks") {
    return [
      {
        correctGapIndex: 0,
        acceptedAlternatives: [],
      },
    ];
  }

  if (fieldKey === "categoryLabels") {
    return ["", ""];
  }

  if (fieldKey === "choiceElements") {
    return [{ label: "" }, { label: "" }];
  }

  if (fieldKey === "intonationOptions") {
    return ["rising", "falling"];
  }

  if (fieldKey === "lines") {
    return [
      [
        {
          label: "",
          speech: {
            mode: "tts",
            text: "",
          },
        },
      ],
    ];
  }

  if (fieldKey === "matchPairs") {
    return [
      {
        left: "",
        right: "",
      },
    ];
  }

  if (fieldKey === "sentenceCards") {
    return [
      {
        sentence: "",
        correct_tense: "",
      },
    ];
  }

  if (fieldKey === "sentenceWithGaps" && activityId === "ACT-018") {
    return [
      {
        sentence: "",
        gaps: [
          {
            position: 0,
            accepted_answers: [],
          },
        ],
      },
    ];
  }

  if (fieldKey === "tenseBins") {
    return [
      {
        id: "",
        label: "",
      },
    ];
  }

  if (
    fieldKey === "acceptedCorrections" ||
    fieldKey === "audioClips" ||
    fieldKey === "correctOrderClips" ||
    fieldKey === "correctOrderWords" ||
    fieldKey === "letterUnits" ||
    fieldKey === "sentenceTokens" ||
    fieldKey === "targetKeywords" ||
    fieldKey === "wordBank"
  ) {
    return [];
  }

  if (fieldKey === "correctCurveId") {
    return "rising";
  }

  if (fieldKey === "promptMode") {
    return "same_different";
  }

  if (
    fieldKey === "correctOddIndex" ||
    fieldKey === "correctStressIndex" ||
    fieldKey === "errorIndex" ||
    fieldKey === "keywordThreshold" ||
    fieldKey === "maxWordCount" ||
    fieldKey === "minWordCount"
  ) {
    return 0;
  }

  return "";
}

export function buildActivityPropsJsonTemplate(
  activityId: string,
  profileFieldKeys: readonly string[] = []
): Record<string, unknown> {
  const shapeLockSpec = ACTIVE_ACTIVITY_SHAPE_LOCK_MAP[activityId];
  const fieldKeys = new Set<string>();

  for (const fieldKey of shapeLockSpec?.requiredAll ?? []) {
    fieldKeys.add(fieldKey);
  }

  for (const oneOfGroup of shapeLockSpec?.requiredOneOf ?? []) {
    for (const fieldKey of oneOfGroup) {
      fieldKeys.add(fieldKey);
    }
  }

  for (const fieldKey of profileFieldKeys) {
    fieldKeys.add(fieldKey);
  }

  fieldKeys.delete("propsJson");
  fieldKeys.delete("runtimeContractV1");

  const propsJson: Record<string, unknown> = {
    runtimeContractV1: buildRuntimeContract(activityId),
  };

  for (const fieldKey of [...fieldKeys].sort()) {
    propsJson[fieldKey] = buildActivityTemplateValue(fieldKey, activityId);
  }

  return normalizeActivityPropsJson(activityId, propsJson);
}

export function canonicalizeActivityExportTemplate(
  template: ActivityExportTemplate,
  activityId: string | null | undefined
): ActivityExportTemplate {
  const nextTemplate: ActivityExportTemplate = { ...template };

  for (const [categoryKey, categoryPayload] of Object.entries(template)) {
    const normalizedCategoryPayload: CategoryPayload = stripStructuredTopLevelFields(categoryPayload);
    const propsJson = parseObjectLikePropsJson(normalizedCategoryPayload.propsJson);
    if (propsJson) {
      normalizedCategoryPayload.propsJson = normalizeActivityPropsJson(activityId, propsJson);
    }

    nextTemplate[categoryKey] = normalizedCategoryPayload;
  }

  return nextTemplate;
}
