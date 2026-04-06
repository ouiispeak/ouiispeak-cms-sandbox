import type { ValueMap } from "@/lib/componentCore";
import { CANONICAL_COMPONENT_FIELD_MAP } from "@/lib/canonicalFieldMap";
import { createHierarchyComponentEngine, type CoreFieldSpec } from "@/lib/hierarchyComponentEngine";
import { loadModuleConfigCategories } from "@/lib/universalConfigs";

const LEVEL_MIN = 1;
const LEVEL_MAX = 10;

const MODULE_FIELD_MAP = CANONICAL_COMPONENT_FIELD_MAP.modules;
const MODULE_SYSTEM_CONTROLLED_FIELD_NAMES = new Set([MODULE_FIELD_MAP.identityFieldKey]);

type ModuleCoreRow = {
  id: string;
  title: string | null;
  text: string | null;
  level_number: number | null;
};

type ModuleCoreInsertRow = {
  title: string | null;
  text: string | null;
  level_number: number | null;
};

type ModuleCoreUpdatePatch = Partial<ModuleCoreInsertRow>;

type ModuleAtomicCreateRpcRow = {
  entry_index: number;
  core: ModuleCoreInsertRow;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

type ModuleAtomicUpdateRpcRow = {
  entry_index: number;
  moduleId: string;
  core_patch: ModuleCoreUpdatePatch;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

export type ModuleRow = {
  id: string;
  title: string | null;
  level_number: number | null;
};

export type ModuleValueMap = Record<string, Record<string, string | null>>;

export type ModuleDetailRow = {
  id: string;
  title: string | null;
  text: string | null;
  level_number: number | null;
  values: ModuleValueMap;
};

function parseLevelValue(rawValue: string | null | undefined, fieldName: string): number | null {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`${fieldName} must be an integer between ${LEVEL_MIN} and ${LEVEL_MAX}.`);
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (parsed < LEVEL_MIN || parsed > LEVEL_MAX) {
    throw new Error(`${fieldName} must be an integer between ${LEVEL_MIN} and ${LEVEL_MAX}.`);
  }

  return parsed;
}

const moduleCoreFields: CoreFieldSpec[] = [
  {
    runtimeFieldKeys: ["title"],
    coreColumn: MODULE_FIELD_MAP.coreFieldDbColumns.title,
  },
  {
    runtimeFieldKeys: ["text"],
    coreColumn: MODULE_FIELD_MAP.coreFieldDbColumns.text,
  },
  {
    runtimeFieldKeys: ["level"],
    coreColumn: MODULE_FIELD_MAP.coreFieldDbColumns.level,
    parse: parseLevelValue,
  },
];

const moduleEngine = createHierarchyComponentEngine<ModuleCoreRow, ModuleRow, ModuleDetailRow>({
  componentName: "modules",
  componentLabel: "module",
  entityLabel: "module",
  idPathLabel: "Module id",
  updateIdentityEntryKey: MODULE_FIELD_MAP.identityFieldKey,
  tableName: "modules",
  idColumn: "id",
  loadConfigCategories: loadModuleConfigCategories,
  systemControlledFieldNames: MODULE_SYSTEM_CONTROLLED_FIELD_NAMES,
  coreFields: moduleCoreFields,
  rpc: {
    createFunctionName: "import_modules_create_atomic",
    updateFunctionName: "import_modules_update_atomic",
    buildCreateRow: ({ entryIndex, coreInsert, valueRows }): ModuleAtomicCreateRpcRow => ({
      entry_index: entryIndex,
      core: coreInsert as ModuleCoreInsertRow,
      values: valueRows,
    }),
    buildUpdateRow: ({ entryIndex, id, corePatch, valueRows }): ModuleAtomicUpdateRpcRow => ({
      entry_index: entryIndex,
      moduleId: id,
      core_patch: corePatch as ModuleCoreUpdatePatch,
      values: valueRows,
    }),
  },
  queries: {
    listResourcePath: "modules?select=id,title,level_number,created_at&order=level_number.asc,created_at.asc,id.asc",
    detailResourcePath: (id) => `modules?select=id,title,text,level_number&id=eq.${encodeURIComponent(id)}&limit=1`,
    listErrorLabel: "Failed to load modules",
    detailErrorLabel: "Failed to load module",
  },
  dynamicValues: {
    tableName: "module_field_values",
    foreignKeyColumn: "module_id",
    onConflictColumns: "module_id,component_name,category_name,field_name",
    loadErrorLabel: "Failed to load module field values",
    saveErrorLabel: "Failed to save module field values",
  },
  mapDetail: (coreRow: ModuleCoreRow, values: ValueMap): ModuleDetailRow => ({
    ...coreRow,
    values,
  }),
});

export async function createModuleFromFormData(formData: FormData): Promise<string> {
  return moduleEngine.createFromFormData(formData);
}

export async function updateModuleFromFormData(moduleId: string, formData: FormData): Promise<void> {
  await moduleEngine.updateFromFormData(moduleId, formData);
}

export async function importModulesFromJsonPayload(payload: unknown): Promise<number> {
  return moduleEngine.importCreateFromJsonPayload(payload);
}

export async function importModuleUpdatesFromJsonPayload(payload: unknown): Promise<number> {
  return moduleEngine.importUpdateFromJsonPayload(payload);
}

export async function loadModules(): Promise<ModuleRow[]> {
  return moduleEngine.loadList();
}

export async function loadModuleById(moduleId: string): Promise<ModuleDetailRow | null> {
  return moduleEngine.loadById(moduleId);
}
