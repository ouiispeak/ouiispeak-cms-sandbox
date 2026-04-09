import type { ImportMode } from "@/lib/importGate";

export const ACTIVITY_INGEST_REJECTION_CONTRACT_VERSION = "v1";

export type ActivityIngestOperation = "create" | "update" | "import_create" | "import_update";

export type ActivityIngestFailureStage = "form_data" | "json_parse" | "import";

export type ActivityIngestRejectionCode =
  | "ACTIVITY_IMPORT_MISSING_FILE"
  | "ACTIVITY_IMPORT_INVALID_JSON"
  | "ACTIVITY_IMPORT_EMPTY_PAYLOAD"
  | "ACTIVITY_IMPORT_STRUCTURED_OVERRIDE_CONFLICT"
  | "ACTIVITY_IMPORT_RUNTIME_CONTRACT_INVALID"
  | "ACTIVITY_IMPORT_PROPS_JSON_INVALID"
  | "ACTIVITY_IMPORT_FORBIDDEN_FIELD"
  | "ACTIVITY_IMPORT_REQUIRED_FIELD_MISSING"
  | "ACTIVITY_IMPORT_ACT_SHAPE_INVALID"
  | "ACTIVITY_RPC_FAILURE"
  | "ACTIVITY_IMPORT_UNKNOWN";

export type ActivityIngestRejectionEnvelopeV1 = {
  code: ActivityIngestRejectionCode;
  component: "activity_slides";
  operation: ActivityIngestOperation;
  activityId: string | null;
  slideId: string | null;
  field: string | null;
  message: string;
  contractVersion: typeof ACTIVITY_INGEST_REJECTION_CONTRACT_VERSION;
  timestamp: string;
};

type ActivityIdentity = {
  activityId: string | null;
  slideId: string | null;
};

type ClassificationResult = {
  code: ActivityIngestRejectionCode;
  field: string | null;
  message: string;
};

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }

  return "Import failed.";
}

function stripEntryPrefix(message: string): string {
  return message.replace(/^(Create|Update)\s+import\s+entry\s+\d+:\s*/i, "").trim();
}

function toOperation(mode: ImportMode): ActivityIngestOperation {
  return mode === "update" ? "import_update" : "import_create";
}

function toFirstFieldToken(raw: string): string | null {
  const first = raw.split(",")[0]?.trim();
  if (!first) {
    return null;
  }

  return first.replace(/\.$/, "");
}

function normalizeFieldName(fieldName: string): string {
  return fieldName.replace(/^.*\./, "");
}

function classifyImportError(rawMessage: string, stage: ActivityIngestFailureStage): ClassificationResult {
  const message = stripEntryPrefix(rawMessage);

  if (message.includes('Missing uploaded file field "file".')) {
    return {
      code: "ACTIVITY_IMPORT_MISSING_FILE",
      field: "file",
      message,
    };
  }

  if (message.includes("Uploaded file is not valid JSON.")) {
    return {
      code: "ACTIVITY_IMPORT_INVALID_JSON",
      field: "file",
      message,
    };
  }

  if (message.includes("Import payload cannot be empty.")) {
    return {
      code: "ACTIVITY_IMPORT_EMPTY_PAYLOAD",
      field: "$payload",
      message,
    };
  }

  const structuredCollision = message.match(/Remove top-level duplicate fields:\s*([^.]*)/i);
  if (structuredCollision) {
    return {
      code: "ACTIVITY_IMPORT_STRUCTURED_OVERRIDE_CONFLICT",
      field: toFirstFieldToken(structuredCollision[1]) ?? "propsJson",
      message,
    };
  }

  if (
    message.includes("requires non-empty runtimeContractV1") ||
    message.includes("requires runtimeContractV1.contractVersion") ||
    message.includes("requires runtimeContractV1.interaction object") ||
    message.includes("requires runtimeContractV1.interaction.activity_row_tool") ||
    message.includes("requires runtimeContractV1.interaction.command_row_controls") ||
    message.includes("requires runtimeContractV1.interaction.status")
  ) {
    return {
      code: "ACTIVITY_IMPORT_RUNTIME_CONTRACT_INVALID",
      field: message.includes("activity_row_tool")
        ? "runtimeContractV1.interaction.activity_row_tool"
        : message.includes("command_row_controls")
          ? "runtimeContractV1.interaction.command_row_controls"
          : message.includes("status")
            ? "runtimeContractV1.interaction.status"
            : "runtimeContractV1",
      message,
    };
  }

  if (
    message.includes("propsJson must be valid JSON.") ||
    message.includes("propsJson must be a JSON object.") ||
    message.includes("requires non-empty propsJson.") ||
    message.includes("requires propsJson.runtimeContractV1")
  ) {
    return {
      code: "ACTIVITY_IMPORT_PROPS_JSON_INVALID",
      field: message.includes("propsJson.runtimeContractV1") ? "propsJson.runtimeContractV1" : "propsJson",
      message,
    };
  }

  const forbiddenFieldMatch = message.match(/Field\s+"([^"]+)"/);
  if (forbiddenFieldMatch) {
    return {
      code: "ACTIVITY_IMPORT_FORBIDDEN_FIELD",
      field: normalizeFieldName(forbiddenFieldMatch[1]),
      message,
    };
  }

  const requiredFieldsMatch = message.match(/requires non-empty activity slide fields:\s*([^.]*)\./i);
  if (requiredFieldsMatch) {
    return {
      code: "ACTIVITY_IMPORT_REQUIRED_FIELD_MISSING",
      field: toFirstFieldToken(requiredFieldsMatch[1]),
      message,
    };
  }

  const actShapeFieldMatch = message.match(/propsJson\.([A-Za-z0-9_]+)/);
  if (actShapeFieldMatch) {
    return {
      code: "ACTIVITY_IMPORT_ACT_SHAPE_INVALID",
      field: `propsJson.${actShapeFieldMatch[1]}`,
      message,
    };
  }

  if (stage === "import") {
    return {
      code: "ACTIVITY_RPC_FAILURE",
      field: null,
      message,
    };
  }

  return {
    code: "ACTIVITY_IMPORT_UNKNOWN",
    field: null,
    message,
  };
}

function extractIdentityFromEntry(entry: unknown): ActivityIdentity {
  if (!isObjectRecord(entry)) {
    return { activityId: null, slideId: null };
  }

  const topLevelActivityId = toTrimmedString(entry.activityId);
  const topLevelSlideId = toTrimmedString(entry.slideId);
  let activityId: string | null = topLevelActivityId;
  let slideId: string | null = topLevelSlideId;

  for (const value of Object.values(entry)) {
    if (!isObjectRecord(value)) {
      continue;
    }

    activityId = activityId ?? toTrimmedString(value.activityId);
    slideId = slideId ?? toTrimmedString(value.slideId);
  }

  return { activityId, slideId };
}

export function extractActivityIdentity(payload: unknown): ActivityIdentity {
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const candidate = extractIdentityFromEntry(entry);
      if (candidate.activityId || candidate.slideId) {
        return candidate;
      }
    }
    return { activityId: null, slideId: null };
  }

  return extractIdentityFromEntry(payload);
}

export function buildActivityImportRejectionEnvelope({
  mode,
  stage,
  payload,
  error,
}: {
  mode: ImportMode;
  stage: ActivityIngestFailureStage;
  payload?: unknown;
  error: unknown;
}): ActivityIngestRejectionEnvelopeV1 {
  const { activityId, slideId } = extractActivityIdentity(payload);
  const message = toErrorMessage(error);
  const classification = classifyImportError(message, stage);

  return {
    code: classification.code,
    component: "activity_slides",
    operation: toOperation(mode),
    activityId,
    slideId,
    field: classification.field,
    message: classification.message,
    contractVersion: ACTIVITY_INGEST_REJECTION_CONTRACT_VERSION,
    timestamp: new Date().toISOString(),
  };
}
