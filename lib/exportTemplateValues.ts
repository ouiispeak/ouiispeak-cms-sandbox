import type { UniversalConfigField } from "@/lib/universalConfigs";

export type ExportTemplateValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

const ARRAY_JSON_INPUT_TYPES = new Set<UniversalConfigField["inputType"]>([
  "list",
  "audio_list",
  "blanks_mapper",
  "audio_lines_mapper",
  "choice_elements_mapper",
  "match_pairs_mapper",
  "avatar_dialogues_mapper",
]);

const OBJECT_JSON_INPUT_TYPES = new Set<UniversalConfigField["inputType"]>(["json", "audio_prompt"]);

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "0") {
    return false;
  }

  return null;
}

function parseJson(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function exportEmptyValueForInputType(inputType: UniversalConfigField["inputType"]): ExportTemplateValue {
  if (inputType === "number") {
    return 0;
  }

  if (inputType === "checkbox") {
    return false;
  }

  if (ARRAY_JSON_INPUT_TYPES.has(inputType)) {
    return [];
  }

  if (OBJECT_JSON_INPUT_TYPES.has(inputType)) {
    return {};
  }

  return "";
}

export function exportValueFromStoredValue(
  inputType: UniversalConfigField["inputType"],
  rawValue: string | null | undefined
): ExportTemplateValue {
  if (rawValue === null || rawValue === undefined || rawValue.trim().length === 0) {
    return exportEmptyValueForInputType(inputType);
  }

  if (inputType === "number") {
    const parsed = parseNumber(rawValue);
    return parsed === null ? rawValue : parsed;
  }

  if (inputType === "checkbox") {
    const parsed = parseBoolean(rawValue);
    return parsed === null ? rawValue : parsed;
  }

  if (ARRAY_JSON_INPUT_TYPES.has(inputType)) {
    const parsed = parseJson(rawValue);
    if (Array.isArray(parsed)) {
      return parsed;
    }

    return rawValue;
  }

  if (OBJECT_JSON_INPUT_TYPES.has(inputType)) {
    const parsed = parseJson(rawValue);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }

    return rawValue;
  }

  return rawValue;
}
