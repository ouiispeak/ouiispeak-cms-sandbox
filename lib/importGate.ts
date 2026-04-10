import { NextResponse } from "next/server";

export type ImportMode = "create" | "update";
export type ImportComponent =
  | "modules"
  | "lessons"
  | "groups"
  | "slides"
  | "activity_slides"
  | "title_slides"
  | "lesson_ends";

export type ImportFailureStage = "form_data" | "json_parse" | "import";

export const IMPORT_REJECTION_CONTRACT_VERSION = "v1";

export type ImportRejectionCode =
  | "IMPORT_MISSING_FILE"
  | "IMPORT_INVALID_JSON"
  | "IMPORT_EMPTY_PAYLOAD"
  | "IMPORT_FORBIDDEN_FIELD"
  | "IMPORT_REQUIRED_FIELD_MISSING"
  | "IMPORT_RPC_FAILURE"
  | "IMPORT_UNKNOWN";

export type ImportRejectionOperation = "import_create" | "import_update";

export type ImportRejectionEnvelopeV1 = {
  code: ImportRejectionCode;
  component: ImportComponent;
  operation: ImportRejectionOperation;
  activityId: string | null;
  slideId: string | null;
  field: string | null;
  message: string;
  contractVersion: typeof IMPORT_REJECTION_CONTRACT_VERSION;
  timestamp: string;
};

type TextReadableFile = {
  text: () => Promise<string>;
};

function toComponentLabel(component: ImportComponent): string {
  if (component === "modules") {
    return "Module";
  }

  if (component === "lessons") {
    return "Lesson";
  }

  if (component === "slides") {
    return "Slide";
  }

  if (component === "activity_slides") {
    return "Activity Slide";
  }

  if (component === "title_slides") {
    return "Title Slide";
  }

  if (component === "lesson_ends") {
    return "lesson_ends";
  }

    return "Group";
}

function acceptsHtmlResponse(request: Request): boolean {
  return request.headers.get("accept")?.includes("text/html") ?? false;
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

function toFirstFieldToken(raw: string): string | null {
  const first = raw.split(",")[0]?.trim();
  if (!first) {
    return null;
  }

  return first.replace(/\.$/, "").replace(/^\[+/, "").replace(/\]+$/, "");
}

function normalizeFieldName(fieldName: string): string {
  return fieldName.replace(/^.*\./, "");
}

function toOperation(mode: ImportMode): ImportRejectionOperation {
  return mode === "update" ? "import_update" : "import_create";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractIdentityFromEntry(entry: unknown): { activityId: string | null; slideId: string | null } {
  if (!isObjectRecord(entry)) {
    return { activityId: null, slideId: null };
  }

  let activityId = toTrimmedString(entry.activityId);
  let slideId = toTrimmedString(entry.slideId);

  for (const value of Object.values(entry)) {
    if (!isObjectRecord(value)) {
      continue;
    }

    activityId = activityId ?? toTrimmedString(value.activityId);
    slideId = slideId ?? toTrimmedString(value.slideId);
  }

  return { activityId, slideId };
}

function extractIdentityFromPayload(payload: unknown): { activityId: string | null; slideId: string | null } {
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

function classifyImportError(
  rawMessage: string,
  stage: ImportFailureStage
): { code: ImportRejectionCode; field: string | null; message: string } {
  const message = stripEntryPrefix(rawMessage);

  if (message.includes('Missing uploaded file field "file".')) {
    return {
      code: "IMPORT_MISSING_FILE",
      field: "file",
      message,
    };
  }

  if (message.includes("Uploaded file is not valid JSON.")) {
    return {
      code: "IMPORT_INVALID_JSON",
      field: "file",
      message,
    };
  }

  if (message.includes("Import payload cannot be empty.")) {
    return {
      code: "IMPORT_EMPTY_PAYLOAD",
      field: "$payload",
      message,
    };
  }

  const forbiddenFieldMatch = message.match(/Field\s+"([^"]+)"/);
  if (forbiddenFieldMatch) {
    return {
      code: "IMPORT_FORBIDDEN_FIELD",
      field: normalizeFieldName(forbiddenFieldMatch[1]),
      message,
    };
  }

  const requiredFieldsMatch = message.match(/requires non-empty [^:]*fields:\s*([^.]*)\./i);
  if (requiredFieldsMatch) {
    return {
      code: "IMPORT_REQUIRED_FIELD_MISSING",
      field: toFirstFieldToken(requiredFieldsMatch[1]),
      message,
    };
  }

  const oneOfFieldGroupMatch = message.match(/requires at least one of [^:]*field groups:\s*([^.]*)\./i);
  if (oneOfFieldGroupMatch) {
    const firstToken = toFirstFieldToken(oneOfFieldGroupMatch[1]);
    return {
      code: "IMPORT_REQUIRED_FIELD_MISSING",
      field: firstToken ? normalizeFieldName(firstToken) : null,
      message,
    };
  }

  const requiredSingleFieldMatch = message.match(/requires non-empty ([A-Za-z0-9_.]+)/i);
  if (requiredSingleFieldMatch) {
    return {
      code: "IMPORT_REQUIRED_FIELD_MISSING",
      field: normalizeFieldName(requiredSingleFieldMatch[1]),
      message,
    };
  }

  if (stage === "import") {
    return {
      code: "IMPORT_RPC_FAILURE",
      field: null,
      message,
    };
  }

  return {
    code: "IMPORT_UNKNOWN",
    field: null,
    message,
  };
}

export function isTextReadableFile(value: unknown): value is TextReadableFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof (value as { text?: unknown }).text === "function"
  );
}

export function toImportMode(value: FormDataEntryValue | null): ImportMode {
  return value === "update" ? "update" : "create";
}

export function toGateMessage(component: ImportComponent, mode: ImportMode, message: string): string {
  return `${toComponentLabel(component)} ${mode} failed on import because: ${message}`;
}

export function buildImportRejectionEnvelope({
  component,
  mode,
  stage,
  payload,
  error,
}: {
  component: ImportComponent;
  mode: ImportMode;
  stage: ImportFailureStage;
  payload?: unknown;
  error: unknown;
}): ImportRejectionEnvelopeV1 {
  const { activityId, slideId } = extractIdentityFromPayload(payload);
  const rawMessage = toErrorMessage(error);
  const classified = classifyImportError(rawMessage, stage);
  return {
    code: classified.code,
    component,
    operation: toOperation(mode),
    activityId,
    slideId,
    field: classified.field,
    message: classified.message,
    contractVersion: IMPORT_REJECTION_CONTRACT_VERSION,
    timestamp: new Date().toISOString(),
  };
}

export function buildImportRejectionResponse(request: Request, envelope: ImportRejectionEnvelopeV1): Response {
  if (!acceptsHtmlResponse(request)) {
    return NextResponse.json(envelope, { status: 400 });
  }

  const mode: ImportMode = envelope.operation === "import_update" ? "update" : "create";
  const gateMessage = toGateMessage(envelope.component, mode, `[${envelope.code}] ${envelope.message}`);
  const url = new URL("/import", request.url);
  url.searchParams.set("status", "error");
  url.searchParams.set("component", envelope.component);
  url.searchParams.set("mode", mode);
  url.searchParams.set("message", gateMessage.slice(0, 500));
  return NextResponse.redirect(url, { status: 303 });
}

export function buildImportErrorResponse(
  request: Request,
  component: ImportComponent,
  mode: ImportMode,
  message: string
): Response {
  const gateMessage = toGateMessage(component, mode, message);
  if (!acceptsHtmlResponse(request)) {
    return new Response(gateMessage, { status: 400 });
  }

  const url = new URL("/import", request.url);
  url.searchParams.set("status", "error");
  url.searchParams.set("component", component);
  url.searchParams.set("mode", mode);
  url.searchParams.set("message", gateMessage.slice(0, 500));
  return NextResponse.redirect(url, { status: 303 });
}
