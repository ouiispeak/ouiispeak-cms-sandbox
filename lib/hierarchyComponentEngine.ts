import {
  assertRequiredFieldValues,
  buildAllowedFieldSet,
  callAtomicImportRpc,
  createCoreRow,
  ensureCoreRowExists,
  extractFieldInputsFromFormData,
  fetchAnonRows,
  getFieldValueByCandidateNames,
  isObjectRecord,
  parseFieldInputsFromPayloadEntry,
  parseImportEntries,
  parseUuid,
  parseUuidFromPathValue,
  splitQualifiedFieldKey,
  rowsToValueMap,
  toDynamicFieldValuePayloadRows,
  type DynamicFieldValuePayloadRow,
  type FieldInputMap,
  type ValueMap,
  updateCoreRow,
  upsertDynamicFieldRows,
} from "@/lib/componentCore";
import type { UniversalConfigCategory, UniversalConfigField } from "@/lib/universalConfigs";
import {
  buildCategoryPayloadDbInvariantRuleFromRequirednessMatrix,
  buildCategoryPayloadRequirednessRuleFromRequirednessMatrix,
} from "@/lib/requirednessMatrix";

type DynamicValueRow = {
  category_name: string;
  field_name: string;
  field_value: string | null;
};

type SlugValueRow = {
  field_value: string | null;
};

type ParentScopeRow = {
  id: string;
  [key: string]: unknown;
};

type ForeignKeyValueRow = {
  [key: string]: unknown;
};

export type SystemAssignedFieldMode = "create" | "update" | "import_create" | "import_update";

export type SystemAssignedFieldContext = {
  mode: SystemAssignedFieldMode;
  id?: string;
  parentValue?: string;
  values: FieldInputMap;
  categories: UniversalConfigCategory[];
  operationState: Map<string, unknown>;
};

export type CoreFieldSpec = {
  runtimeFieldKeys: string[];
  coreColumn: string;
  parse?: (rawValue: string | null | undefined, runtimeFieldKey: string) => unknown;
};

type ParentSpec = {
  formKeys: string[];
  entryKeys: string[];
  coreColumn: string;
  requiredOnCreate: boolean;
  parse: (rawValue: unknown, contextLabel: string) => string;
  createFormContextLabel: string;
  updateFormContextLabel: string;
  createEntryContextLabel: string;
  updateEntryContextLabel: (id: string) => string;
};

type CreateRowBuilderArgs = {
  entryIndex: number;
  parentValue: string | undefined;
  coreInsert: Record<string, unknown>;
  valueRows: DynamicFieldValuePayloadRow[];
};

type UpdateRowBuilderArgs = {
  entryIndex: number;
  id: string;
  parentValue: string | undefined;
  corePatch: Record<string, unknown>;
  valueRows: DynamicFieldValuePayloadRow[];
};

type RpcSpec = {
  createFunctionName: string;
  updateFunctionName: string;
  buildCreateRow: (args: CreateRowBuilderArgs) => unknown;
  buildUpdateRow: (args: UpdateRowBuilderArgs) => unknown;
};

type QuerySpec = {
  listResourcePath: string;
  detailResourcePath: (id: string) => string;
  listErrorLabel: string;
  detailErrorLabel: string;
};

type DynamicValueSpec = {
  tableName: string;
  foreignKeyColumn: string;
  onConflictColumns: string;
  loadErrorLabel: string;
  saveErrorLabel: string;
};

type EngineConfig<CoreRow extends { id: string }, DetailRow> = {
  componentName: string;
  componentLabel: string;
  entityLabel: string;
  idPathLabel: string;
  updateIdentityEntryKey: string;
  tableName: string;
  idColumn: string;
  loadConfigCategories: () => Promise<UniversalConfigCategory[]>;
  systemControlledFieldNames: Set<string>;
  coreFields: CoreFieldSpec[];
  parentSpec?: ParentSpec;
  rpc: RpcSpec;
  queries: QuerySpec;
  dynamicValues: DynamicValueSpec;
  mapDetail: (coreRow: CoreRow, values: ValueMap) => DetailRow;
  applySystemAssignedFields?: (context: SystemAssignedFieldContext) => Promise<void> | void;
};

type ParsedImportCreateRow = {
  parentValue: string | undefined;
  values: FieldInputMap;
};

type ParsedImportUpdateRow = {
  id: string;
  parentValue: string | undefined;
  values: FieldInputMap;
};

type PostWriteInvariantRuleOptions = {
  requiredFieldNames: Set<string>;
  requiredOneOfGroups: string[][];
  topLevelOnlyFieldNames: Set<string>;
};

function getFirstFormValue(formData: FormData, keys: string[]): FormDataEntryValue | null {
  for (const key of keys) {
    if (formData.has(key)) {
      return formData.get(key);
    }
  }

  return null;
}

function hasAnyOwnProperty(entry: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(entry, key));
}

function getFirstEntryValue(entry: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(entry, key)) {
      return entry[key];
    }
  }

  return undefined;
}

function parseImportUpdateId(value: unknown, identityEntryKey: string): string {
  return parseUuid(value, `Each update entry must include a valid uuid "${identityEntryKey}".`);
}

function buildCoreInsertRow(
  values: FieldInputMap,
  coreFields: CoreFieldSpec[],
  parentSpec: ParentSpec | undefined,
  parentValue: string | undefined
): Record<string, unknown> {
  const insertRow: Record<string, unknown> = {};

  if (parentSpec && parentValue !== undefined) {
    insertRow[parentSpec.coreColumn] = parentValue;
  }

  for (const field of coreFields) {
    const value = getFieldValueByCandidateNames(values, field.runtimeFieldKeys);
    if (field.parse) {
      insertRow[field.coreColumn] = field.parse(value, field.runtimeFieldKeys[0]);
    } else {
      insertRow[field.coreColumn] = value ?? null;
    }
  }

  return insertRow;
}

function buildCorePatchRow(
  values: FieldInputMap,
  coreFields: CoreFieldSpec[],
  parentSpec: ParentSpec | undefined,
  parentValue: string | undefined
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (parentSpec && parentValue !== undefined) {
    patch[parentSpec.coreColumn] = parentValue;
  }

  for (const field of coreFields) {
    const value = getFieldValueByCandidateNames(values, field.runtimeFieldKeys);
    if (value === undefined) {
      continue;
    }

    if (field.parse) {
      patch[field.coreColumn] = field.parse(value, field.runtimeFieldKeys[0]);
    } else {
      patch[field.coreColumn] = value ?? null;
    }
  }

  return patch;
}

function parseParentValueFromFormData(
  formData: FormData,
  parentSpec: ParentSpec | undefined,
  mode: "create" | "update"
): string | undefined {
  if (!parentSpec) {
    return undefined;
  }

  const rawValue = getFirstFormValue(formData, parentSpec.formKeys);
  if (mode === "create") {
    if (!parentSpec.requiredOnCreate && rawValue === null) {
      return undefined;
    }

    return parentSpec.parse(rawValue, parentSpec.createFormContextLabel);
  }

  if (rawValue === null) {
    return undefined;
  }

  return parentSpec.parse(rawValue, parentSpec.updateFormContextLabel);
}

function parseParentValueFromImportEntryCreate(
  entry: Record<string, unknown>,
  parentSpec: ParentSpec | undefined
): string | undefined {
  if (!parentSpec) {
    return undefined;
  }

  const rawValue = getFirstEntryValue(entry, parentSpec.entryKeys);
  if (!parentSpec.requiredOnCreate && rawValue === undefined) {
    return undefined;
  }

  return parentSpec.parse(rawValue, parentSpec.createEntryContextLabel);
}

function parseParentValueFromImportEntryUpdate(
  entry: Record<string, unknown>,
  parentSpec: ParentSpec | undefined,
  id: string
): string | undefined {
  if (!parentSpec) {
    return undefined;
  }

  if (!hasAnyOwnProperty(entry, parentSpec.entryKeys)) {
    return undefined;
  }

  const rawValue = getFirstEntryValue(entry, parentSpec.entryKeys);
  return parentSpec.parse(rawValue, parentSpec.updateEntryContextLabel(id));
}

function parseEntryFieldValues(
  entry: Record<string, unknown>,
  allowedFields: Set<string>,
  fieldInputTypes: Map<string, UniversalConfigField["inputType"]>,
  componentLabel: string,
  ignoredTopLevelKeys: Set<string>,
  systemControlledFieldNames: Set<string>,
  topLevelOnlyFieldNames: Set<string>
): FieldInputMap {
  return parseFieldInputsFromPayloadEntry({
    entry,
    allowedFields,
    fieldInputTypes,
    componentLabel,
    ignoredTopLevelKeys,
    systemControlledFieldNames,
    topLevelOnlyFieldNames,
  });
}

function toDynamicValueRowsWithScope(
  id: string,
  values: FieldInputMap,
  componentName: string,
  foreignKeyColumn: string
): Record<string, unknown>[] {
  return toDynamicFieldValuePayloadRows(values).map((row) => ({
    [foreignKeyColumn]: id,
    component_name: componentName,
    category_name: row.category_name,
    field_name: row.field_name,
    field_value: row.field_value,
  }));
}

function fieldInputMapFromDynamicRows(rows: DynamicValueRow[]): FieldInputMap {
  const output: FieldInputMap = new Map();

  for (const row of rows) {
    output.set(`${row.category_name}.${row.field_name}`, row.field_value);
  }

  return output;
}

const ENFORCED_TARGET_LANGUAGE = "english";
const ENFORCED_SOURCE_VERSION = "v1";

function normalizeSlugPart(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function parseVersionCounter(rawValue: string | null | undefined): number {
  if (rawValue === undefined || rawValue === null) {
    return 0;
  }

  const trimmed = rawValue.trim();
  if (!/^\d+$/.test(trimmed)) {
    return 0;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function getFieldValueByFieldName(values: FieldInputMap, fieldName: string): string | null | undefined {
  for (const [qualifiedKey, value] of values.entries()) {
    if (splitQualifiedFieldKey(qualifiedKey).fieldName === fieldName) {
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

function setFieldValueIfActiveInCategories(
  values: FieldInputMap,
  categories: UniversalConfigCategory[],
  fieldName: string,
  fieldValue: string
): void {
  for (const category of categories) {
    if (!category.fields.some((field) => field.key === fieldName)) {
      continue;
    }

    values.set(`${category.key}.${fieldName}`, fieldValue);
    return;
  }
}

function hasActiveField(categories: UniversalConfigCategory[], fieldName: string): boolean {
  return categories.some((category) => category.fields.some((field) => field.key === fieldName));
}

function shouldEnforcePostWriteDbValidation(categories: UniversalConfigCategory[]): boolean {
  return hasActiveField(categories, "slug");
}

function applyGlobalSystemAssignedValues(
  values: FieldInputMap,
  categories: UniversalConfigCategory[]
): void {
  setFieldValueIfActiveInCategories(values, categories, "lastUpdatedAt", new Date().toISOString());
  setFieldValueIfActiveInCategories(values, categories, "targetLanguage", ENFORCED_TARGET_LANGUAGE);
}

export function createHierarchyComponentEngine<CoreRow extends { id: string }, ListRow, DetailRow>(
  config: EngineConfig<CoreRow, DetailRow>
) {
  const ignoredTopLevelKeys = new Set<string>([
    config.updateIdentityEntryKey,
    ...(config.parentSpec ? config.parentSpec.entryKeys : []),
  ]);
  const topLevelOnlyFieldNames = new Set<string>(
    config.parentSpec ? config.parentSpec.entryKeys : []
  );
  const matrixBoundCategoryRequirednessRule =
    config.componentName === "activity_slides"
      ? null
      : buildCategoryPayloadRequirednessRuleFromRequirednessMatrix(config.componentName);
  const matrixBoundCategoryDbInvariantRule =
    buildCategoryPayloadDbInvariantRuleFromRequirednessMatrix(config.componentName);

  function matrixRequirednessOptionsForCategories(
    categories: UniversalConfigCategory[]
  ):
    | {
        requiredFieldNames: Set<string>;
        requiredOneOfGroups: string[][];
        topLevelOnlyFieldNames: Set<string>;
      }
    | undefined {
    if (!matrixBoundCategoryRequirednessRule) {
      return undefined;
    }

    const activeFieldNames = new Set<string>();
    for (const category of categories) {
      for (const field of category.fields) {
        activeFieldNames.add(field.key);
      }
    }

    const requiredFieldNames = new Set(
      matrixBoundCategoryRequirednessRule.requiredAll.filter((fieldName) => activeFieldNames.has(fieldName))
    );
    const requiredOneOfGroups = (matrixBoundCategoryRequirednessRule.requiredOneOf ?? [])
      .map((group) => group.filter((fieldName) => activeFieldNames.has(fieldName)))
      .filter((group) => group.length > 0);

    return { requiredFieldNames, requiredOneOfGroups, topLevelOnlyFieldNames };
  }

  function matrixDbInvariantOptionsForCategories(
    categories: UniversalConfigCategory[]
  ): PostWriteInvariantRuleOptions {
    const activeFieldNames = new Set<string>();
    for (const category of categories) {
      for (const field of category.fields) {
        activeFieldNames.add(field.key);
      }
    }

    const requiredFieldNames = new Set(
      matrixBoundCategoryDbInvariantRule.requiredAll.filter((fieldName) => activeFieldNames.has(fieldName))
    );
    const requiredOneOfGroups = (matrixBoundCategoryDbInvariantRule.requiredOneOf ?? [])
      .map((group) => group.filter((fieldName) => activeFieldNames.has(fieldName)))
      .filter((group) => group.length > 0);

    return { requiredFieldNames, requiredOneOfGroups, topLevelOnlyFieldNames };
  }

  async function applySystemAssignedValues(context: SystemAssignedFieldContext): Promise<void> {
    applyGlobalSystemAssignedValues(context.values, context.categories);

    if (hasActiveField(context.categories, "sourceVersion")) {
      setFieldValueIfActiveInCategories(
        context.values,
        context.categories,
        "sourceVersion",
        ENFORCED_SOURCE_VERSION
      );
    }

    if (hasActiveField(context.categories, "version")) {
      let nextVersion = 1;
      if (context.mode === "update" || context.mode === "import_update") {
        const existingVersion = await getExistingFieldValueByName(context, "version");
        nextVersion = parseVersionCounter(existingVersion) + 1;
        if (nextVersion < 1) {
          nextVersion = 1;
        }
      }

      setFieldValueIfActiveInCategories(context.values, context.categories, "version", String(nextVersion));
    }

    if (hasActiveField(context.categories, "slug")) {
      await applySlugPolicy(context);
    }

    if (config.applySystemAssignedFields) {
      await config.applySystemAssignedFields(context);
    }
  }

  function existingValuesStateKey(id: string): string {
    return `${config.componentName}:existing:${id}`;
  }

  async function getExistingValuesForId(context: SystemAssignedFieldContext): Promise<FieldInputMap | null> {
    if (!context.id) {
      return null;
    }

    const cacheKey = existingValuesStateKey(context.id);
    const cached = context.operationState.get(cacheKey);
    if (cached && cached instanceof Map) {
      return cached as FieldInputMap;
    }

    const existingRows = await loadValueRowsById(context.id);
    const mapped = fieldInputMapFromDynamicRows(existingRows);
    context.operationState.set(cacheKey, mapped);
    return mapped;
  }

  async function getExistingFieldValueByName(
    context: SystemAssignedFieldContext,
    fieldName: string
  ): Promise<string | null | undefined> {
    const existingValues = await getExistingValuesForId(context);
    if (!existingValues) {
      return undefined;
    }

    return getFieldValueByFieldName(existingValues, fieldName);
  }

  async function resolveParentScopeValue(context: SystemAssignedFieldContext): Promise<string | null> {
    if (!config.parentSpec) {
      return null;
    }

    if (typeof context.parentValue === "string" && context.parentValue.trim().length > 0) {
      return context.parentValue;
    }

    if (!context.id) {
      return null;
    }

    const rows = await fetchAnonRows<ParentScopeRow>(
      `${config.tableName}?select=id,${config.parentSpec.coreColumn}&id=eq.${encodeURIComponent(context.id)}&limit=1`,
      `Failed to load ${config.componentLabel} parent scope`
    );
    const row = rows[0];
    if (!row) {
      return null;
    }

    const parentValue = row[config.parentSpec.coreColumn];
    return typeof parentValue === "string" && parentValue.trim().length > 0 ? parentValue : null;
  }

  function slugScopeStateKey(parentScope: string | null): string {
    return `${config.componentName}:slug-scope:${parentScope ?? "__global__"}`;
  }

  async function loadSlugCountsForScope(
    parentScope: string | null,
    context: SystemAssignedFieldContext
  ): Promise<Map<string, number>> {
    const cacheKey = slugScopeStateKey(parentScope);
    const cached = context.operationState.get(cacheKey);
    if (cached && cached instanceof Map) {
      return cached as Map<string, number>;
    }

    const { tableName, foreignKeyColumn } = config.dynamicValues;
    let resourcePath = `${tableName}?select=${foreignKeyColumn},field_value&component_name=eq.${encodeURIComponent(
      config.componentName
    )}&field_name=eq.slug`;

    if (config.parentSpec && parentScope !== null) {
      resourcePath += `&${config.tableName}.${config.parentSpec.coreColumn}=eq.${encodeURIComponent(parentScope)}`;
      resourcePath = `${tableName}?select=${foreignKeyColumn},field_value,${config.tableName}!inner(${config.parentSpec.coreColumn})&component_name=eq.${encodeURIComponent(
        config.componentName
      )}&field_name=eq.slug&${config.tableName}.${config.parentSpec.coreColumn}=eq.${encodeURIComponent(parentScope)}`;
    }

    const rows = await fetchAnonRows<SlugValueRow>(
      resourcePath,
      `Failed to load ${config.componentLabel} slug scope`
    );

    const counts = new Map<string, number>();
    for (const row of rows) {
      const rawSlug = row.field_value;
      if (typeof rawSlug !== "string") {
        continue;
      }

      const normalized = normalizeSlugPart(rawSlug);
      if (normalized.length === 0) {
        continue;
      }

      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }

    context.operationState.set(cacheKey, counts);
    return counts;
  }

  function deriveSlugBase(values: FieldInputMap): string {
    const title = getFieldValueByFieldName(values, "title");
    if (typeof title === "string" && title.trim().length > 0) {
      return title;
    }

    const body = getFieldValueByFieldName(values, "body");
    if (typeof body === "string" && body.trim().length > 0) {
      return body.slice(0, 64);
    }

    return config.componentName.replace(/_/g, "-");
  }

  function reserveUniqueSlug(
    counts: Map<string, number>,
    baseInput: string,
    existingSlug: string | null | undefined
  ): string {
    const normalizedBase = normalizeSlugPart(baseInput);
    const base = normalizedBase.length > 0 ? normalizedBase : config.componentName.replace(/_/g, "-");
    const existingNormalized =
      typeof existingSlug === "string" && existingSlug.trim().length > 0
        ? normalizeSlugPart(existingSlug)
        : null;

    if (existingNormalized) {
      const currentCount = counts.get(existingNormalized) ?? 0;
      if (currentCount > 0) {
        counts.set(existingNormalized, currentCount - 1);
      }
    }

    let candidate = base;
    let suffix = 2;
    while ((counts.get(candidate) ?? 0) > 0) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
    return candidate;
  }

  async function applySlugPolicy(context: SystemAssignedFieldContext): Promise<void> {
    const providedSlug = getFieldValueByFieldName(context.values, "slug");
    const providedSlugTrimmed =
      typeof providedSlug === "string" ? normalizeSlugPart(providedSlug) : "";
    const hasExplicitSlug = providedSlugTrimmed.length > 0;

    const existingSlug = await getExistingFieldValueByName(context, "slug");
    const parentScope = await resolveParentScopeValue(context);
    const slugCounts = await loadSlugCountsForScope(parentScope, context);

    let slugBase = providedSlugTrimmed;
    if (!hasExplicitSlug) {
      if (
        (context.mode === "update" || context.mode === "import_update") &&
        typeof existingSlug === "string" &&
        normalizeSlugPart(existingSlug).length > 0
      ) {
        slugBase = normalizeSlugPart(existingSlug);
      } else {
        slugBase = deriveSlugBase(context.values);
      }
    }

    const uniqueSlug = reserveUniqueSlug(slugCounts, slugBase, existingSlug);
    setFieldValueIfActiveInCategories(context.values, context.categories, "slug", uniqueSlug);
  }

  async function loadCategoriesAndAllowedFields(): Promise<{
    categories: UniversalConfigCategory[];
    allowedFields: Set<string>;
    fieldInputTypes: Map<string, UniversalConfigField["inputType"]>;
  }> {
    const categories = await config.loadConfigCategories();
    const fieldInputTypes = new Map<string, UniversalConfigField["inputType"]>();
    for (const category of categories) {
      for (const field of category.fields) {
        fieldInputTypes.set(`${category.key}.${field.key}`, field.inputType);
      }
    }

    return {
      categories,
      allowedFields: buildAllowedFieldSet(categories),
      fieldInputTypes,
    };
  }

  async function loadValueRowsById(id: string): Promise<DynamicValueRow[]> {
    const { tableName, foreignKeyColumn, loadErrorLabel } = config.dynamicValues;
    return fetchAnonRows<DynamicValueRow>(
      `${tableName}?select=${foreignKeyColumn},component_name,category_name,field_name,field_value&${foreignKeyColumn}=eq.${encodeURIComponent(
        id
      )}&component_name=eq.${config.componentName}&order=category_name.asc,field_name.asc`,
      loadErrorLabel
    );
  }

  async function upsertValueRows(id: string, values: FieldInputMap): Promise<void> {
    const { tableName, foreignKeyColumn, onConflictColumns, saveErrorLabel } = config.dynamicValues;
    await upsertDynamicFieldRows(
      tableName,
      onConflictColumns,
      toDynamicValueRowsWithScope(id, values, config.componentName, foreignKeyColumn),
      saveErrorLabel
    );
  }

  async function loadCoreRowById(id: string): Promise<ParentScopeRow | null> {
    const selectColumns = ["id"];
    if (config.parentSpec) {
      selectColumns.push(config.parentSpec.coreColumn);
    }

    const rows = await fetchAnonRows<ParentScopeRow>(
      `${config.tableName}?select=${selectColumns.join(",")}&id=eq.${encodeURIComponent(id)}&limit=1`,
      `Failed to load ${config.componentLabel}`
    );

    return rows[0] ?? null;
  }

  function postWriteOptionsNeedDynamicValueValidation(options: PostWriteInvariantRuleOptions): boolean {
    for (const fieldName of options.requiredFieldNames.values()) {
      if (!options.topLevelOnlyFieldNames.has(fieldName)) {
        return true;
      }
    }

    for (const group of options.requiredOneOfGroups) {
      if (group.some((fieldName) => !options.topLevelOnlyFieldNames.has(fieldName))) {
        return true;
      }
    }

    return false;
  }

  async function resolveCreatedIdBySlugAndParentValue(
    values: FieldInputMap,
    expectedParentValue: string | undefined
  ): Promise<string> {
    const slug = getFieldValueByFieldName(values, "slug");
    if (isMissingRequiredFieldValue(slug)) {
      throw new Error(
        `Post-write DB validation failed for ${config.componentLabel}: missing generated "slug" required to resolve created row.`
      );
    }

    const slugValue = slug as string;
    const { tableName, foreignKeyColumn } = config.dynamicValues;
    let resourcePath = `${tableName}?select=${foreignKeyColumn}&component_name=eq.${encodeURIComponent(
      config.componentName
    )}&field_name=eq.slug&field_value=eq.${encodeURIComponent(slugValue)}`;

    if (config.parentSpec && typeof expectedParentValue === "string" && expectedParentValue.trim().length > 0) {
      resourcePath = `${tableName}?select=${foreignKeyColumn},${config.tableName}!inner(${config.parentSpec.coreColumn})&component_name=eq.${encodeURIComponent(
        config.componentName
      )}&field_name=eq.slug&field_value=eq.${encodeURIComponent(slugValue)}&${config.tableName}.${config.parentSpec.coreColumn}=eq.${encodeURIComponent(
        expectedParentValue
      )}`;
    }

    const rows = await fetchAnonRows<ForeignKeyValueRow>(
      resourcePath,
      `Failed to resolve created ${config.componentLabel} row by slug`
    );

    if (rows.length !== 1) {
      throw new Error(
        `Post-write DB validation failed for ${config.componentLabel}: expected exactly one created row for slug "${slugValue}", got ${rows.length}.`
      );
    }

    const resolved = rows[0]?.[foreignKeyColumn];
    if (typeof resolved !== "string" || resolved.trim().length === 0) {
      throw new Error(
        `Post-write DB validation failed for ${config.componentLabel}: created row resolution returned invalid id.`
      );
    }

    return resolved;
  }

  async function verifyPostWriteDbInvariantsForId(
    id: string,
    expectedParentValue: string | undefined,
    options: PostWriteInvariantRuleOptions,
    contextLabel: string
  ): Promise<void> {
    const coreRow = await loadCoreRowById(id);
    if (!coreRow) {
      throw new Error(`${contextLabel}: post-write DB validation failed; ${config.componentLabel} "${id}" not found.`);
    }

    let persistedParentValue: string | undefined;
    if (config.parentSpec) {
      const rawParent = coreRow[config.parentSpec.coreColumn];
      persistedParentValue =
        typeof rawParent === "string" && rawParent.trim().length > 0 ? rawParent : undefined;
    }

    const hasIdentityRequirement = options.requiredFieldNames.has(config.updateIdentityEntryKey);
    if (hasIdentityRequirement && (typeof coreRow.id !== "string" || coreRow.id.trim().length === 0)) {
      throw new Error(
        `${contextLabel}: post-write DB validation failed; required identity field "${config.updateIdentityEntryKey}" is missing.`
      );
    }

    if (
      config.parentSpec &&
      options.requiredFieldNames.has(config.parentSpec.entryKeys[0]) &&
      isMissingRequiredFieldValue(persistedParentValue ?? null)
    ) {
      throw new Error(
        `${contextLabel}: post-write DB validation failed; required parent field "${config.parentSpec.entryKeys[0]}" is missing.`
      );
    }

    if (
      config.parentSpec &&
      typeof expectedParentValue === "string" &&
      expectedParentValue.trim().length > 0 &&
      persistedParentValue !== undefined &&
      persistedParentValue !== expectedParentValue
    ) {
      throw new Error(
        `${contextLabel}: post-write DB validation failed; persisted parent value "${persistedParentValue}" did not match expected "${expectedParentValue}".`
      );
    }

    if (!postWriteOptionsNeedDynamicValueValidation(options)) {
      return;
    }

    const persistedRows = await loadValueRowsById(id);
    const persistedValues = fieldInputMapFromDynamicRows(persistedRows);

    const missingDynamicFields: string[] = [];
    for (const fieldName of options.requiredFieldNames.values()) {
      if (options.topLevelOnlyFieldNames.has(fieldName)) {
        continue;
      }

      const value = getFieldValueByFieldName(persistedValues, fieldName);
      if (isMissingRequiredFieldValue(value)) {
        missingDynamicFields.push(fieldName);
      }
    }

    if (missingDynamicFields.length > 0) {
      throw new Error(
        `${contextLabel}: post-write DB validation failed; missing required persisted ${config.componentLabel} fields: ${missingDynamicFields.join(
          ", "
        )}.`
      );
    }

    const missingOneOfGroups: string[][] = [];
    for (const group of options.requiredOneOfGroups) {
      const hasAny = group.some((fieldName) => {
        if (options.topLevelOnlyFieldNames.has(fieldName)) {
          if (fieldName === config.updateIdentityEntryKey) {
            return typeof coreRow.id === "string" && coreRow.id.trim().length > 0;
          }

          if (config.parentSpec && fieldName === config.parentSpec.entryKeys[0]) {
            return !isMissingRequiredFieldValue(persistedParentValue ?? null);
          }

          return false;
        }

        const value = getFieldValueByFieldName(persistedValues, fieldName);
        return !isMissingRequiredFieldValue(value);
      });

      if (!hasAny) {
        missingOneOfGroups.push(group);
      }
    }

    if (missingOneOfGroups.length > 0) {
      const groupsText = missingOneOfGroups.map((group) => `[${group.join(" | ")}]`).join(", ");
      throw new Error(
        `${contextLabel}: post-write DB validation failed; missing required one-of persisted ${config.componentLabel} groups: ${groupsText}.`
      );
    }
  }

  function parseImportCreateRow(
    entry: unknown,
    allowedFields: Set<string>,
    fieldInputTypes: Map<string, UniversalConfigField["inputType"]>
  ): ParsedImportCreateRow {
    if (!isObjectRecord(entry)) {
      throw new Error(`Each imported ${config.componentLabel} entry must be an object.`);
    }

    const parentValue = parseParentValueFromImportEntryCreate(entry, config.parentSpec);
    const values = parseEntryFieldValues(
      entry,
      allowedFields,
      fieldInputTypes,
      config.componentLabel,
      ignoredTopLevelKeys,
      config.systemControlledFieldNames,
      topLevelOnlyFieldNames
    );

    return { parentValue, values };
  }

  function parseImportUpdateRow(
    entry: unknown,
    allowedFields: Set<string>,
    fieldInputTypes: Map<string, UniversalConfigField["inputType"]>
  ): ParsedImportUpdateRow {
    if (!isObjectRecord(entry)) {
      throw new Error(`Each imported ${config.componentLabel} update entry must be an object.`);
    }

    const id = parseImportUpdateId(entry[config.updateIdentityEntryKey], config.updateIdentityEntryKey);
    const parentValue = parseParentValueFromImportEntryUpdate(entry, config.parentSpec, id);
    const values = parseEntryFieldValues(
      entry,
      allowedFields,
      fieldInputTypes,
      config.componentLabel,
      ignoredTopLevelKeys,
      config.systemControlledFieldNames,
      topLevelOnlyFieldNames
    );

    return { id, parentValue, values };
  }

  return {
    async createFromFormData(formData: FormData): Promise<string> {
      const { categories, allowedFields } = await loadCategoriesAndAllowedFields();
      const values = extractFieldInputsFromFormData(
        formData,
        allowedFields,
        config.systemControlledFieldNames
      );
      const parentValue = parseParentValueFromFormData(formData, config.parentSpec, "create");
      const operationState = new Map<string, unknown>();
      await applySystemAssignedValues({
        mode: "create",
        parentValue,
        values,
        categories,
        operationState,
      });
      assertRequiredFieldValues(
        values,
        categories,
        config.systemControlledFieldNames,
        "Create/import",
        config.componentLabel,
        { topLevelOnlyFieldNames }
      );

      const coreInsert = buildCoreInsertRow(values, config.coreFields, config.parentSpec, parentValue);
      const id = await createCoreRow(config.tableName, coreInsert, config.entityLabel);
      await upsertValueRows(id, values);
      if (shouldEnforcePostWriteDbValidation(categories)) {
        await verifyPostWriteDbInvariantsForId(
          id,
          parentValue,
          matrixDbInvariantOptionsForCategories(categories),
          "Create/save"
        );
      }
      return id;
    },

    async updateFromFormData(pathId: string, formData: FormData): Promise<void> {
      const id = parseUuidFromPathValue(pathId, config.idPathLabel);
      const { categories, allowedFields } = await loadCategoriesAndAllowedFields();
      await ensureCoreRowExists(config.tableName, config.idColumn, id, config.idPathLabel.replace(" id", ""));
      const values = extractFieldInputsFromFormData(
        formData,
        allowedFields,
        config.systemControlledFieldNames
      );
      const parentValue = parseParentValueFromFormData(formData, config.parentSpec, "update");
      const operationState = new Map<string, unknown>();
      await applySystemAssignedValues({
        mode: "update",
        id,
        parentValue,
        values,
        categories,
        operationState,
      });
      const existingValueRows = await loadValueRowsById(id);
      const existingValues = fieldInputMapFromDynamicRows(existingValueRows);
      const valuesForRequiredCheck: FieldInputMap = new Map(existingValues);
      for (const [key, value] of values.entries()) {
        valuesForRequiredCheck.set(key, value);
      }

      assertRequiredFieldValues(
        valuesForRequiredCheck,
        categories,
        config.systemControlledFieldNames,
        "Update/save",
        config.componentLabel,
        { topLevelOnlyFieldNames }
      );

      const corePatch = buildCorePatchRow(values, config.coreFields, config.parentSpec, parentValue);
      await updateCoreRow(config.tableName, config.idColumn, id, corePatch, config.entityLabel);
      await upsertValueRows(id, values);
      if (shouldEnforcePostWriteDbValidation(categories)) {
        await verifyPostWriteDbInvariantsForId(
          id,
          parentValue,
          matrixDbInvariantOptionsForCategories(categories),
          "Update/save"
        );
      }
    },

    async importCreateFromJsonPayload(payload: unknown): Promise<number> {
      const configData = await loadCategoriesAndAllowedFields();

      const entries = parseImportEntries(payload);
      const rpcRows: unknown[] = [];
      const parsedCreateRows: ParsedImportCreateRow[] = [];
      const operationState = new Map<string, unknown>();

      for (const [entryIndex, entry] of entries.entries()) {
        try {
          const parsed = parseImportCreateRow(entry, configData.allowedFields, configData.fieldInputTypes);
          await applySystemAssignedValues({
            mode: "import_create",
            parentValue: parsed.parentValue,
            values: parsed.values,
            categories: configData.categories,
            operationState,
          });
          assertRequiredFieldValues(
            parsed.values,
            configData.categories,
            config.systemControlledFieldNames,
            "Create/import",
            config.componentLabel,
            matrixRequirednessOptionsForCategories(configData.categories) ?? { topLevelOnlyFieldNames }
          );

          const coreInsert = buildCoreInsertRow(
            parsed.values,
            config.coreFields,
            config.parentSpec,
            parsed.parentValue
          );
          const valueRows = toDynamicFieldValuePayloadRows(parsed.values);
          rpcRows.push(
            config.rpc.buildCreateRow({
              entryIndex: entryIndex + 1,
              parentValue: parsed.parentValue,
              coreInsert,
              valueRows,
            })
          );
          parsedCreateRows.push(parsed);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Create import validation failed.";
          throw new Error(`Create import entry ${entryIndex + 1}: ${message}`);
        }
      }

      const count = await callAtomicImportRpc(config.rpc.createFunctionName, rpcRows);
      const dbInvariantOptions = matrixDbInvariantOptionsForCategories(configData.categories);
      if (
        shouldEnforcePostWriteDbValidation(configData.categories) &&
        postWriteOptionsNeedDynamicValueValidation(dbInvariantOptions)
      ) {
        for (const [rowIndex, row] of parsedCreateRows.entries()) {
          const resolvedId = await resolveCreatedIdBySlugAndParentValue(row.values, row.parentValue);
          await verifyPostWriteDbInvariantsForId(
            resolvedId,
            row.parentValue,
            dbInvariantOptions,
            `Create/import entry ${rowIndex + 1}`
          );
        }
      }

      return count;
    },

    async importUpdateFromJsonPayload(payload: unknown): Promise<number> {
      const configData = await loadCategoriesAndAllowedFields();

      const entries = parseImportEntries(payload);
      const parsedRows = entries.map((entry) =>
        parseImportUpdateRow(entry, configData.allowedFields, configData.fieldInputTypes)
      );
      const rpcRows: unknown[] = [];
      const operationState = new Map<string, unknown>();

      for (const [entryIndex, row] of parsedRows.entries()) {
        try {
          await applySystemAssignedValues({
            mode: "import_update",
            id: row.id,
            parentValue: row.parentValue,
            values: row.values,
            categories: configData.categories,
            operationState,
          });
          assertRequiredFieldValues(
            row.values,
            configData.categories,
            config.systemControlledFieldNames,
            "Update/import",
            config.componentLabel,
            matrixRequirednessOptionsForCategories(configData.categories) ?? { topLevelOnlyFieldNames }
          );

          const corePatch = buildCorePatchRow(
            row.values,
            config.coreFields,
            config.parentSpec,
            row.parentValue
          );
          const valueRows = toDynamicFieldValuePayloadRows(row.values);
          rpcRows.push(
            config.rpc.buildUpdateRow({
              entryIndex: entryIndex + 1,
              id: row.id,
              parentValue: row.parentValue,
              corePatch,
              valueRows,
            })
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Update import validation failed.";
          throw new Error(`Update import entry ${entryIndex + 1}: ${message}`);
        }
      }

      const count = await callAtomicImportRpc(config.rpc.updateFunctionName, rpcRows);
      const dbInvariantOptions = matrixDbInvariantOptionsForCategories(configData.categories);
      if (
        shouldEnforcePostWriteDbValidation(configData.categories) &&
        postWriteOptionsNeedDynamicValueValidation(dbInvariantOptions)
      ) {
        for (const [rowIndex, row] of parsedRows.entries()) {
          await verifyPostWriteDbInvariantsForId(
            row.id,
            row.parentValue,
            dbInvariantOptions,
            `Update/import entry ${rowIndex + 1}`
          );
        }
      }

      return count;
    },

    async loadList(): Promise<ListRow[]> {
      return fetchAnonRows<ListRow>(config.queries.listResourcePath, config.queries.listErrorLabel);
    },

    async loadById(pathId: string): Promise<DetailRow | null> {
      const id = parseUuidFromPathValue(pathId, config.idPathLabel);
      const rows = await fetchAnonRows<CoreRow>(
        config.queries.detailResourcePath(id),
        config.queries.detailErrorLabel
      );
      const coreRow = rows[0];
      if (!coreRow) {
        return null;
      }

      const valueRows = await loadValueRowsById(coreRow.id);
      return config.mapDetail(coreRow, rowsToValueMap(valueRows));
    },
  };
}
