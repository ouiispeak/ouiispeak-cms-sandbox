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
  rowsToValueMap,
  toDynamicFieldValuePayloadRows,
  type DynamicFieldValuePayloadRow,
  type FieldInputMap,
  type ValueMap,
  updateCoreRow,
  upsertDynamicFieldRows,
} from "@/lib/componentCore";
import type { UniversalConfigCategory } from "@/lib/universalConfigs";

type DynamicValueRow = {
  category_name: string;
  field_name: string;
  field_value: string | null;
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
  componentLabel: string,
  ignoredTopLevelKeys: Set<string>,
  systemControlledFieldNames: Set<string>
): FieldInputMap {
  return parseFieldInputsFromPayloadEntry({
    entry,
    allowedFields,
    componentLabel,
    ignoredTopLevelKeys,
    systemControlledFieldNames,
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

export function createHierarchyComponentEngine<CoreRow extends { id: string }, ListRow, DetailRow>(
  config: EngineConfig<CoreRow, DetailRow>
) {
  const ignoredTopLevelKeys = new Set<string>([
    config.updateIdentityEntryKey,
    ...(config.parentSpec ? config.parentSpec.entryKeys : []),
  ]);

  async function loadCategoriesAndAllowedFields(): Promise<{
    categories: UniversalConfigCategory[];
    allowedFields: Set<string>;
  }> {
    const categories = await config.loadConfigCategories();
    return {
      categories,
      allowedFields: buildAllowedFieldSet(categories),
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

  function parseImportCreateRow(
    entry: unknown,
    allowedFields: Set<string>
  ): ParsedImportCreateRow {
    if (!isObjectRecord(entry)) {
      throw new Error(`Each imported ${config.componentLabel} entry must be an object.`);
    }

    const parentValue = parseParentValueFromImportEntryCreate(entry, config.parentSpec);
    const values = parseEntryFieldValues(
      entry,
      allowedFields,
      config.componentLabel,
      ignoredTopLevelKeys,
      config.systemControlledFieldNames
    );

    return { parentValue, values };
  }

  function parseImportUpdateRow(
    entry: unknown,
    allowedFields: Set<string>
  ): ParsedImportUpdateRow {
    if (!isObjectRecord(entry)) {
      throw new Error(`Each imported ${config.componentLabel} update entry must be an object.`);
    }

    const id = parseImportUpdateId(entry[config.updateIdentityEntryKey], config.updateIdentityEntryKey);
    const parentValue = parseParentValueFromImportEntryUpdate(entry, config.parentSpec, id);
    const values = parseEntryFieldValues(
      entry,
      allowedFields,
      config.componentLabel,
      ignoredTopLevelKeys,
      config.systemControlledFieldNames
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
      assertRequiredFieldValues(
        values,
        categories,
        config.systemControlledFieldNames,
        "Create/import",
        config.componentLabel
      );

      const parentValue = parseParentValueFromFormData(formData, config.parentSpec, "create");
      const coreInsert = buildCoreInsertRow(values, config.coreFields, config.parentSpec, parentValue);
      const id = await createCoreRow(config.tableName, coreInsert, config.entityLabel);
      await upsertValueRows(id, values);
      return id;
    },

    async updateFromFormData(pathId: string, formData: FormData): Promise<void> {
      const id = parseUuidFromPathValue(pathId, config.idPathLabel);
      const { categories, allowedFields } = await loadCategoriesAndAllowedFields();
      const values = extractFieldInputsFromFormData(
        formData,
        allowedFields,
        config.systemControlledFieldNames
      );
      assertRequiredFieldValues(
        values,
        categories,
        config.systemControlledFieldNames,
        "Update/save",
        config.componentLabel
      );

      const parentValue = parseParentValueFromFormData(formData, config.parentSpec, "update");
      const corePatch = buildCorePatchRow(values, config.coreFields, config.parentSpec, parentValue);
      await ensureCoreRowExists(config.tableName, config.idColumn, id, config.idPathLabel.replace(" id", ""));
      await updateCoreRow(config.tableName, config.idColumn, id, corePatch, config.entityLabel);
      await upsertValueRows(id, values);
    },

    async importCreateFromJsonPayload(payload: unknown): Promise<number> {
      const configData = await loadCategoriesAndAllowedFields();

      const entries = parseImportEntries(payload);
      const rpcRows: unknown[] = [];

      for (const [entryIndex, entry] of entries.entries()) {
        try {
          const parsed = parseImportCreateRow(entry, configData.allowedFields);
          assertRequiredFieldValues(
            parsed.values,
            configData.categories,
            config.systemControlledFieldNames,
            "Create/import",
            config.componentLabel
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
        } catch (error) {
          const message = error instanceof Error ? error.message : "Create import validation failed.";
          throw new Error(`Create import entry ${entryIndex + 1}: ${message}`);
        }
      }

      return callAtomicImportRpc(config.rpc.createFunctionName, rpcRows);
    },

    async importUpdateFromJsonPayload(payload: unknown): Promise<number> {
      const configData = await loadCategoriesAndAllowedFields();

      const entries = parseImportEntries(payload);
      const parsedRows = entries.map((entry) => parseImportUpdateRow(entry, configData.allowedFields));
      const rpcRows: unknown[] = [];

      for (const [entryIndex, row] of parsedRows.entries()) {
        try {
          assertRequiredFieldValues(
            row.values,
            configData.categories,
            config.systemControlledFieldNames,
            "Update/import",
            config.componentLabel
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

      return callAtomicImportRpc(config.rpc.updateFunctionName, rpcRows);
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
