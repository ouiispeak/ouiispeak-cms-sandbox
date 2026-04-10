import fs from "node:fs";
import path from "node:path";

export type RequirednessFlag = "true" | "false" | "conditional_one_of";

export type RequirednessMatrixRow = {
  field_key: string;
  component_name: string;
  act_id: string;
  operation: string;
  required_from_lv2: RequirednessFlag | string;
  required_at_ingest: RequirednessFlag | string;
  required_in_db: RequirednessFlag | string;
  required_for_runtime: RequirednessFlag | string;
  system_generated: string;
  generator_owner: string;
  evidence_source: string;
  evidence_reference: string;
  decision_status: string;
};

export type ActivityShapeLockRule = {
  requiredAll: string[];
  requiredOneOf?: string[][];
};

export type CategoryPayloadRequirednessRule = {
  requiredAll: string[];
  requiredOneOf?: string[][];
};

export type CategoryPayloadDbInvariantRule = {
  requiredAll: string[];
  requiredOneOf?: string[][];
};

export type CategoryPayloadRuntimeRule = {
  requiredAll: string[];
  requiredOneOf?: string[][];
};

const REQUIREDNESS_MATRIX_PATH = path.join(process.cwd(), "central/REQUIREDNESS_MATRIX.csv");

let cachedRows: RequirednessMatrixRow[] | null = null;
const ENVELOPE_FIELD_KEYS = new Set(["propsJson", "runtimeContractV1"]);

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const text = csvText.startsWith("\uFEFF") ? csvText.slice(1) : csvText;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      currentField = "";

      if (currentRow.length > 1 || currentRow[0]?.trim().length > 0) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

function toRequirednessRow(
  headers: string[],
  values: string[],
  lineNumber: number
): RequirednessMatrixRow {
  const row: Record<string, string> = {};
  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });

  const requiredKeys: Array<keyof RequirednessMatrixRow> = [
    "field_key",
    "component_name",
    "act_id",
    "operation",
    "required_from_lv2",
    "required_at_ingest",
    "required_in_db",
    "required_for_runtime",
    "system_generated",
    "generator_owner",
    "evidence_source",
    "evidence_reference",
    "decision_status",
  ];

  for (const key of requiredKeys) {
    if (!(key in row)) {
      throw new Error(`Requiredness matrix is missing "${key}" at line ${lineNumber}.`);
    }
  }

  return row as RequirednessMatrixRow;
}

export function loadRequirednessMatrixRows(): RequirednessMatrixRow[] {
  if (cachedRows) {
    return cachedRows;
  }

  const fileContents = fs.readFileSync(REQUIREDNESS_MATRIX_PATH, "utf8");
  const parsedRows = parseCsvRows(fileContents);
  if (parsedRows.length < 2) {
    throw new Error("Requiredness matrix is empty.");
  }

  const [headerRow, ...valueRows] = parsedRows;
  const headers = headerRow.map((header) => header.trim());
  const rows = valueRows.map((values, index) => toRequirednessRow(headers, values, index + 2));
  cachedRows = rows;
  return rows;
}

function parseRequiredOneOfGroup(evidenceReference: string): string[] | null {
  const match = evidenceReference.match(/requiredOneOf=\[([^\]]+)\]/);
  if (!match || !match[1]) {
    return null;
  }

  const keys = match[1]
    .split("|")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return keys.length > 0 ? keys : null;
}

export function buildActivityShapeLockMapFromRequirednessMatrix(): Record<string, ActivityShapeLockRule> {
  const rows = loadRequirednessMatrixRows();
  const perAct = new Map<
    string,
    {
      requiredAll: Set<string>;
      requiredOneOfByKey: Map<string, string[]>;
    }
  >();

  for (const row of rows) {
    if (row.component_name !== "activity_slides") {
      continue;
    }
    if (row.operation !== "propsJson") {
      continue;
    }
    if (!row.act_id || !row.act_id.startsWith("ACT-")) {
      continue;
    }
    if (row.decision_status !== "locked") {
      continue;
    }
    if (ENVELOPE_FIELD_KEYS.has(row.field_key)) {
      // Envelope fields are validated by shared ingestion rules,
      // not as ACT-specific payload keys.
      continue;
    }

    const state = perAct.get(row.act_id) ?? {
      requiredAll: new Set<string>(),
      requiredOneOfByKey: new Map<string, string[]>(),
    };

    if (row.required_at_ingest === "true") {
      state.requiredAll.add(row.field_key);
    } else if (row.required_at_ingest === "conditional_one_of") {
      const requiredOneOf = parseRequiredOneOfGroup(row.evidence_reference);
      if (!requiredOneOf) {
        throw new Error(
          `Requiredness matrix conditional_one_of row is missing requiredOneOf group for ${row.act_id}.${row.field_key}.`
        );
      }

      const groupKey = requiredOneOf.join("|");
      if (!state.requiredOneOfByKey.has(groupKey)) {
        state.requiredOneOfByKey.set(groupKey, requiredOneOf);
      }
    }

    perAct.set(row.act_id, state);
  }

  const output: Record<string, ActivityShapeLockRule> = {};
  for (const [actId, state] of perAct.entries()) {
    const requiredAll = [...state.requiredAll].sort();
    const requiredOneOf = [...state.requiredOneOfByKey.values()].map((group) => [...group]);
    output[actId] = requiredOneOf.length > 0 ? { requiredAll, requiredOneOf } : { requiredAll };
  }

  return output;
}

export function buildCategoryPayloadRequirednessRuleFromRequirednessMatrix(
  componentName: string
): CategoryPayloadRequirednessRule {
  const rows = loadRequirednessMatrixRows();
  const requiredAll = new Set<string>();
  const requiredOneOfByKey = new Map<string, string[]>();
  let hasRows = false;

  for (const row of rows) {
    if (row.component_name !== componentName) {
      continue;
    }
    if (row.operation !== "category_payload") {
      continue;
    }
    if (row.decision_status !== "locked") {
      continue;
    }
    if (row.act_id && row.act_id.trim().length > 0) {
      continue;
    }

    hasRows = true;
    if (row.required_at_ingest === "true") {
      requiredAll.add(row.field_key);
      continue;
    }

    if (row.required_at_ingest === "conditional_one_of") {
      const requiredOneOf = parseRequiredOneOfGroup(row.evidence_reference);
      if (!requiredOneOf) {
        throw new Error(
          `Requiredness matrix conditional_one_of row is missing requiredOneOf group for ${componentName}.${row.field_key}.`
        );
      }

      const groupKey = requiredOneOf.join("|");
      if (!requiredOneOfByKey.has(groupKey)) {
        requiredOneOfByKey.set(groupKey, requiredOneOf);
      }
    }
  }

  if (!hasRows) {
    throw new Error(`Requiredness matrix has no category_payload rows for component "${componentName}".`);
  }

  const normalizedRequiredAll = [...requiredAll].sort();
  const normalizedRequiredOneOf = [...requiredOneOfByKey.values()].map((group) => [...group]);

  return normalizedRequiredOneOf.length > 0
    ? { requiredAll: normalizedRequiredAll, requiredOneOf: normalizedRequiredOneOf }
    : { requiredAll: normalizedRequiredAll };
}

export function buildCategoryPayloadDbInvariantRuleFromRequirednessMatrix(
  componentName: string
): CategoryPayloadDbInvariantRule {
  const rows = loadRequirednessMatrixRows();
  const requiredAll = new Set<string>();
  const requiredOneOfByKey = new Map<string, string[]>();
  let hasRows = false;

  for (const row of rows) {
    if (row.component_name !== componentName) {
      continue;
    }
    if (row.operation !== "category_payload") {
      continue;
    }
    if (row.decision_status !== "locked") {
      continue;
    }
    if (row.act_id && row.act_id.trim().length > 0) {
      continue;
    }

    hasRows = true;
    const isDbRequired = row.required_in_db === "true";
    const isSystemGenerated = row.system_generated === "true";

    if (isDbRequired || isSystemGenerated) {
      requiredAll.add(row.field_key);
      continue;
    }

    if (row.required_in_db === "conditional_one_of") {
      const requiredOneOf = parseRequiredOneOfGroup(row.evidence_reference);
      if (!requiredOneOf) {
        throw new Error(
          `Requiredness matrix conditional_one_of row is missing requiredOneOf group for ${componentName}.${row.field_key}.`
        );
      }

      const groupKey = requiredOneOf.join("|");
      if (!requiredOneOfByKey.has(groupKey)) {
        requiredOneOfByKey.set(groupKey, requiredOneOf);
      }
    }
  }

  if (!hasRows) {
    throw new Error(`Requiredness matrix has no category_payload rows for component "${componentName}".`);
  }

  const normalizedRequiredAll = [...requiredAll].sort();
  const normalizedRequiredOneOf = [...requiredOneOfByKey.values()].map((group) => [...group]);

  return normalizedRequiredOneOf.length > 0
    ? { requiredAll: normalizedRequiredAll, requiredOneOf: normalizedRequiredOneOf }
    : { requiredAll: normalizedRequiredAll };
}

export function buildCategoryPayloadRuntimeRuleFromRequirednessMatrix(
  componentName: string
): CategoryPayloadRuntimeRule {
  const rows = loadRequirednessMatrixRows();
  const requiredAll = new Set<string>();
  const requiredOneOfByKey = new Map<string, string[]>();
  let hasRows = false;

  for (const row of rows) {
    if (row.component_name !== componentName) {
      continue;
    }
    if (row.operation !== "category_payload") {
      continue;
    }
    if (row.decision_status !== "locked") {
      continue;
    }
    if (row.act_id && row.act_id.trim().length > 0) {
      continue;
    }

    hasRows = true;
    if (row.required_for_runtime === "true") {
      requiredAll.add(row.field_key);
      continue;
    }

    if (row.required_for_runtime === "conditional_one_of") {
      const requiredOneOf = parseRequiredOneOfGroup(row.evidence_reference);
      if (!requiredOneOf) {
        throw new Error(
          `Requiredness matrix conditional_one_of row is missing requiredOneOf group for ${componentName}.${row.field_key}.`
        );
      }

      const groupKey = requiredOneOf.join("|");
      if (!requiredOneOfByKey.has(groupKey)) {
        requiredOneOfByKey.set(groupKey, requiredOneOf);
      }
    }
  }

  if (!hasRows) {
    throw new Error(`Requiredness matrix has no category_payload rows for component "${componentName}".`);
  }

  const normalizedRequiredAll = [...requiredAll].sort();
  const normalizedRequiredOneOf = [...requiredOneOfByKey.values()].map((group) => [...group]);

  return normalizedRequiredOneOf.length > 0
    ? { requiredAll: normalizedRequiredAll, requiredOneOf: normalizedRequiredOneOf }
    : { requiredAll: normalizedRequiredAll };
}

export function buildActivityPropsRuntimeRuleMapFromRequirednessMatrix(): Record<string, ActivityShapeLockRule> {
  const rows = loadRequirednessMatrixRows();
  const perAct = new Map<
    string,
    {
      requiredAll: Set<string>;
      requiredOneOfByKey: Map<string, string[]>;
    }
  >();

  for (const row of rows) {
    if (row.component_name !== "activity_slides") {
      continue;
    }
    if (row.operation !== "propsJson") {
      continue;
    }
    if (!row.act_id || !row.act_id.startsWith("ACT-")) {
      continue;
    }
    if (row.decision_status !== "locked") {
      continue;
    }
    if (row.field_key === "propsJson") {
      continue;
    }

    const state = perAct.get(row.act_id) ?? {
      requiredAll: new Set<string>(),
      requiredOneOfByKey: new Map<string, string[]>(),
    };

    if (row.required_for_runtime === "true") {
      state.requiredAll.add(row.field_key);
    } else if (row.required_for_runtime === "conditional_one_of") {
      const requiredOneOf = parseRequiredOneOfGroup(row.evidence_reference);
      if (!requiredOneOf) {
        throw new Error(
          `Requiredness matrix conditional_one_of row is missing requiredOneOf group for ${row.act_id}.${row.field_key}.`
        );
      }

      const groupKey = requiredOneOf.join("|");
      if (!state.requiredOneOfByKey.has(groupKey)) {
        state.requiredOneOfByKey.set(groupKey, requiredOneOf);
      }
    }

    perAct.set(row.act_id, state);
  }

  const output: Record<string, ActivityShapeLockRule> = {};
  for (const [actId, state] of perAct.entries()) {
    const requiredAll = [...state.requiredAll].sort();
    const requiredOneOf = [...state.requiredOneOfByKey.values()].map((group) => [...group]);
    output[actId] = requiredOneOf.length > 0 ? { requiredAll, requiredOneOf } : { requiredAll };
  }

  return output;
}
