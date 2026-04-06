import type { UniversalConfigCategory } from "@/lib/universalConfigs";

export type FieldInputMap = Map<string, string | null>;
export type ValueMap = Record<string, Record<string, string | null>>;

export type DynamicFieldValuePayloadRow = {
  category_name: string;
  field_name: string;
  field_value: string | null;
};

type PostgrestErrorBody = {
  message?: string;
  details?: string;
  hint?: string;
};

export function getSupabaseServiceCredentials(): { supabaseUrl: string; supabaseServiceRoleKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { supabaseUrl, supabaseServiceRoleKey };
}

export function getSupabaseAnonCredentials(): { supabaseUrl: string; supabaseAnonKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPostgrestErrorMessage(responseText: string): string {
  if (responseText.trim().length === 0) {
    return "No response body.";
  }

  try {
    const parsed = JSON.parse(responseText) as PostgrestErrorBody;
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return parsed.message;
    }

    return responseText;
  } catch {
    return responseText;
  }
}

async function parseJsonResponse<T>(response: Response, contextLabel: string): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${contextLabel} (${response.status}): ${toPostgrestErrorMessage(body)}`);
  }

  return (await response.json()) as T;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseUuid(value: unknown, errorMessage: string): string {
  if (typeof value !== "string") {
    throw new Error(errorMessage);
  }

  const trimmed = value.trim();
  if (!UUID_PATTERN.test(trimmed)) {
    throw new Error(errorMessage);
  }

  return trimmed;
}

export function parseUuidFromPathValue(pathValue: string, idLabel: string): string {
  return parseUuid(pathValue, `${idLabel} must be a valid uuid.`);
}

export function parseImportEntries(payload: unknown): unknown[] {
  const entries = Array.isArray(payload) ? payload : [payload];
  if (entries.length === 0) {
    throw new Error("Import payload cannot be empty.");
  }

  return entries;
}

export function buildAllowedFieldSet(categories: UniversalConfigCategory[]): Set<string> {
  const allowed = new Set<string>();

  for (const category of categories) {
    for (const field of category.fields) {
      allowed.add(`${category.key}.${field.key}`);
    }
  }

  return allowed;
}

export function splitQualifiedFieldKey(qualifiedKey: string): { categoryName: string; fieldName: string } {
  const separatorIndex = qualifiedKey.indexOf(".");
  if (separatorIndex <= 0 || separatorIndex === qualifiedKey.length - 1) {
    throw new Error(`Invalid field key "${qualifiedKey}".`);
  }

  return {
    categoryName: qualifiedKey.slice(0, separatorIndex),
    fieldName: qualifiedKey.slice(separatorIndex + 1),
  };
}

export function extractFieldInputsFromFormData(
  formData: FormData,
  allowedFields: Set<string>,
  systemControlledFieldNames: Set<string>
): FieldInputMap {
  const fieldInputs: FieldInputMap = new Map();

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION_")) {
      continue;
    }

    if (!allowedFields.has(key)) {
      continue;
    }

    if (typeof value !== "string") {
      throw new Error(`Field "${key}" must be a text value.`);
    }

    const { fieldName } = splitQualifiedFieldKey(key);
    if (systemControlledFieldNames.has(fieldName)) {
      continue;
    }

    fieldInputs.set(key, value);
  }

  return fieldInputs;
}

function parseImportFieldValue(value: unknown, fieldName: string): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  throw new Error(`Field "${fieldName}" must be a string, number, boolean, or null.`);
}

export function parseFieldInputsFromPayloadEntry({
  entry,
  allowedFields,
  componentLabel,
  ignoredTopLevelKeys,
  systemControlledFieldNames,
}: {
  entry: unknown;
  allowedFields: Set<string>;
  componentLabel: string;
  ignoredTopLevelKeys: Set<string>;
  systemControlledFieldNames: Set<string>;
}): FieldInputMap {
  if (!isObjectRecord(entry)) {
    throw new Error(`Each imported ${componentLabel} entry must be an object.`);
  }

  const values: FieldInputMap = new Map();

  for (const [categoryName, categoryPayload] of Object.entries(entry)) {
    if (ignoredTopLevelKeys.has(categoryName)) {
      continue;
    }

    if (!isObjectRecord(categoryPayload)) {
      throw new Error(`Category "${categoryName}" must be an object.`);
    }

    for (const [fieldName, rawValue] of Object.entries(categoryPayload)) {
      if (systemControlledFieldNames.has(fieldName)) {
        throw new Error(
          `Field "${categoryName}.${fieldName}" maps to system-controlled "${fieldName}" and cannot be imported.`
        );
      }

      const qualifiedKey = `${categoryName}.${fieldName}`;
      if (!allowedFields.has(qualifiedKey)) {
        throw new Error(`Field "${categoryName}.${fieldName}" is not enabled in ${componentLabel} config.`);
      }

      values.set(qualifiedKey, parseImportFieldValue(rawValue, qualifiedKey));
    }
  }

  return values;
}

export function getFieldValueByName(values: FieldInputMap, fieldName: string): string | null | undefined {
  for (const [qualifiedKey, fieldValue] of values.entries()) {
    const parsed = splitQualifiedFieldKey(qualifiedKey);
    if (parsed.fieldName === fieldName) {
      return fieldValue;
    }
  }

  return undefined;
}

export function getFieldValueByCandidateNames(
  values: FieldInputMap,
  candidateNames: string[]
): string | null | undefined {
  for (const candidateName of candidateNames) {
    const value = getFieldValueByName(values, candidateName);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function isMissingRequiredFieldValue(value: string | null | undefined): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  return value.trim().length === 0;
}

export function assertRequiredFieldValues(
  values: FieldInputMap,
  categories: UniversalConfigCategory[],
  systemControlledFieldNames: Set<string>,
  contextLabel: string,
  componentLabel: string
): void {
  const requiredFieldNames = new Set<string>();

  for (const category of categories) {
    for (const field of category.fields) {
      if (!field.isRequired) {
        continue;
      }

      if (systemControlledFieldNames.has(field.key)) {
        continue;
      }

      requiredFieldNames.add(field.key);
    }
  }

  const missingFieldNames: string[] = [];

  for (const fieldName of requiredFieldNames.values()) {
    const value = getFieldValueByName(values, fieldName);
    if (isMissingRequiredFieldValue(value)) {
      missingFieldNames.push(fieldName);
    }
  }

  if (missingFieldNames.length > 0) {
    throw new Error(
      `${contextLabel} requires non-empty ${componentLabel} fields: ${missingFieldNames.join(", ")}.`
    );
  }
}

export function toDynamicFieldValuePayloadRows(values: FieldInputMap): DynamicFieldValuePayloadRow[] {
  const rows: DynamicFieldValuePayloadRow[] = [];

  for (const [qualifiedKey, fieldValue] of values.entries()) {
    const { categoryName, fieldName } = splitQualifiedFieldKey(qualifiedKey);
    rows.push({
      category_name: categoryName,
      field_name: fieldName,
      field_value: fieldValue,
    });
  }

  return rows;
}

export function rowsToValueMap(
  rows: Array<{ category_name: string; field_name: string; field_value: string | null }>
): ValueMap {
  const values: ValueMap = {};

  for (const row of rows) {
    if (!values[row.category_name]) {
      values[row.category_name] = {};
    }

    values[row.category_name][row.field_name] = row.field_value;
  }

  return values;
}

type AtomicImportRpcResult = number | string | null | { [key: string]: unknown } | unknown[];

function extractNumericRpcResult(raw: AtomicImportRpcResult): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    return Number.parseInt(raw, 10);
  }

  if (Array.isArray(raw) && raw.length === 1) {
    return extractNumericRpcResult(raw[0] as AtomicImportRpcResult);
  }

  if (isObjectRecord(raw)) {
    for (const value of Object.values(raw)) {
      const parsed = extractNumericRpcResult(value as AtomicImportRpcResult);
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return null;
}

export async function callAtomicImportRpc(functionName: string, rows: unknown[]): Promise<number> {
  if (rows.length === 0) {
    throw new Error("Import payload cannot be empty.");
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceCredentials();

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ p_rows: rows }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(toPostgrestErrorMessage(body));
  }

  const raw = (await response.json()) as AtomicImportRpcResult;
  const count = extractNumericRpcResult(raw);
  if (count === null) {
    throw new Error(`Atomic import RPC "${functionName}" returned an unexpected payload.`);
  }

  return count;
}

export async function createCoreRow(
  tableName: string,
  insertRow: Record<string, unknown>,
  entityLabel: string
): Promise<string> {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceCredentials();

  const rows = await parseJsonResponse<Array<{ id: string }>>(
    await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(insertRow),
    }),
    `Failed to create ${entityLabel}`
  );

  const created = rows[0];
  if (!created || typeof created.id !== "string") {
    throw new Error(`Supabase did not return a valid ${entityLabel} id.`);
  }

  return created.id;
}

export async function updateCoreRow(
  tableName: string,
  idColumn: string,
  idValue: string,
  patch: Record<string, unknown>,
  entityLabel: string
): Promise<void> {
  if (Object.keys(patch).length === 0) {
    return;
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceCredentials();

  const rows = await parseJsonResponse<Array<{ id: string }>>(
    await fetch(`${supabaseUrl}/rest/v1/${tableName}?${idColumn}=eq.${idValue}`, {
      method: "PATCH",
      cache: "no-store",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    }),
    `Failed to update ${entityLabel}`
  );

  if (rows.length === 0) {
    throw new Error(`${entityLabel} not found.`);
  }
}

export async function ensureCoreRowExists(
  tableName: string,
  idColumn: string,
  idValue: string,
  entityLabel: string
): Promise<void> {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceCredentials();

  const rows = await parseJsonResponse<Array<{ id: string }>>(
    await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=id&${idColumn}=eq.${idValue}&limit=1`, {
      cache: "no-store",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    }),
    `Failed to verify ${entityLabel} ${idValue}`
  );

  if (rows.length === 0) {
    throw new Error(`${entityLabel} ${idValue} not found.`);
  }
}

export async function upsertDynamicFieldRows(
  tableName: string,
  onConflict: string,
  rows: Record<string, unknown>[],
  errorLabel: string
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceCredentials();

  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?on_conflict=${onConflict}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${errorLabel} (${response.status}): ${toPostgrestErrorMessage(body)}`);
  }
}

export async function fetchAnonRows<T>(resourcePath: string, errorLabel: string): Promise<T[]> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseAnonCredentials();

  return parseJsonResponse<T[]>(
    await fetch(`${supabaseUrl}/rest/v1/${resourcePath}`, {
      cache: "no-store",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    }),
    errorLabel
  );
}
