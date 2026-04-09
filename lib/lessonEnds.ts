import { fetchAnonRows, parseUuid, type FieldInputMap, type ValueMap } from "@/lib/componentCore";
import { CANONICAL_COMPONENT_FIELD_MAP } from "@/lib/canonicalFieldMap";
import {
  createHierarchyComponentEngine,
  type SystemAssignedFieldContext,
} from "@/lib/hierarchyComponentEngine";
import { loadLessonEndConfigCategories, type UniversalConfigCategory } from "@/lib/universalConfigs";

const LESSON_END_FIELD_MAP = CANONICAL_COMPONENT_FIELD_MAP.lesson_ends;
const LESSON_END_ORDER_INDEX_FIELD_NAME = "orderIndex";
const LESSON_END_SYSTEM_CONTROLLED_FIELD_NAMES = new Set([
  LESSON_END_FIELD_MAP.identityFieldKey,
  LESSON_END_ORDER_INDEX_FIELD_NAME,
]);
const LESSON_END_PARENT_FIELD_KEY = LESSON_END_FIELD_MAP.parentFieldKey;
const LESSON_END_PARENT_DB_COLUMN = LESSON_END_FIELD_MAP.parentDbColumn;

if (!LESSON_END_PARENT_FIELD_KEY || !LESSON_END_PARENT_DB_COLUMN) {
  throw new Error("lesson_ends canonical mapping must define parent field key and parent db column.");
}

type LessonEndCoreRow = {
  id: string;
  lesson_id: string;
};

type LessonEndCoreInsertRow = {
  lesson_id: string;
};

type LessonEndCoreUpdatePatch = Partial<LessonEndCoreInsertRow>;

type LessonEndAtomicCreateRpcRow = {
  entry_index: number;
  lessonId: string;
  core: Record<string, never>;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

type LessonEndAtomicUpdateRpcRow = {
  entry_index: number;
  slideId: string;
  core_patch: LessonEndCoreUpdatePatch;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

export type LessonEndRow = {
  id: string;
  lesson_id: string;
};

export type LessonEndValueMap = Record<string, Record<string, string | null>>;

export type LessonEndDetailRow = {
  id: string;
  lesson_id: string;
  values: LessonEndValueMap;
};

function parseLessonIdValue(value: unknown, contextLabel: string): string {
  return parseUuid(value, `${contextLabel} must include a valid uuid "lessonId".`);
}

type LessonEndOrderValueRow = {
  lesson_end_id: string;
  field_value: string | null;
};

type LessonEndParentRow = {
  id: string;
  lesson_id: string;
};

type LessonEndOrderState = {
  nextOrderIndex: number;
  currentOrderById: Map<string, number>;
};

function toLessonEndOrderStateKey(lessonId: string): string {
  return `lesson_ends-order-state:${lessonId}`;
}

function parseOrderIndex(rawValue: string | null): number | null {
  if (rawValue === null) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function setOrderIndexIfActive(
  values: FieldInputMap,
  categories: UniversalConfigCategory[],
  orderIndex: number
): void {
  const orderIndexText = String(orderIndex);

  for (const category of categories) {
    if (!category.fields.some((field) => field.key === LESSON_END_ORDER_INDEX_FIELD_NAME)) {
      continue;
    }

    values.set(`${category.key}.${LESSON_END_ORDER_INDEX_FIELD_NAME}`, orderIndexText);
    return;
  }
}

async function resolveLessonIdForSystemAssignment(context: SystemAssignedFieldContext): Promise<string | null> {
  if (typeof context.parentValue === "string" && context.parentValue.trim().length > 0) {
    return context.parentValue;
  }

  if (!context.id) {
    return null;
  }

  const rows = await fetchAnonRows<LessonEndParentRow>(
    `lesson_ends?select=id,lesson_id&id=eq.${encodeURIComponent(context.id)}&limit=1`,
    "Failed to load lesson_ends parent"
  );
  const row = rows[0];
  if (!row) {
    return null;
  }

  return row.lesson_id;
}

async function loadOrCreateOrderState(
  lessonId: string,
  operationState: Map<string, unknown>
): Promise<LessonEndOrderState> {
  const stateKey = toLessonEndOrderStateKey(lessonId);
  const existing = operationState.get(stateKey);
  if (existing) {
    return existing as LessonEndOrderState;
  }

  const rows = await fetchAnonRows<LessonEndOrderValueRow>(
    `lesson_end_field_values?select=lesson_end_id,field_value,lesson_ends!inner(lesson_id)&component_name=eq.lesson_ends&field_name=eq.${encodeURIComponent(
      LESSON_END_ORDER_INDEX_FIELD_NAME
    )}&lesson_ends.lesson_id=eq.${encodeURIComponent(lessonId)}`,
    "Failed to load lesson_ends order indices"
  );

  let maxOrderIndex = 0;
  const currentOrderById = new Map<string, number>();

  for (const row of rows) {
    const parsed = parseOrderIndex(row.field_value);
    if (parsed === null) {
      continue;
    }

    currentOrderById.set(row.lesson_end_id, parsed);
    if (parsed > maxOrderIndex) {
      maxOrderIndex = parsed;
    }
  }

  const createdState: LessonEndOrderState = {
    nextOrderIndex: maxOrderIndex + 1,
    currentOrderById,
  };
  operationState.set(stateKey, createdState);
  return createdState;
}

async function applyLessonEndSystemAssignedFields(context: SystemAssignedFieldContext): Promise<void> {
  const lessonId = await resolveLessonIdForSystemAssignment(context);
  if (!lessonId) {
    return;
  }

  const orderState = await loadOrCreateOrderState(lessonId, context.operationState);

  if (context.mode === "create" || context.mode === "import_create") {
    const assigned = orderState.nextOrderIndex;
    orderState.nextOrderIndex += 1;
    setOrderIndexIfActive(context.values, context.categories, assigned);
    return;
  }

  if (!context.id) {
    const assigned = orderState.nextOrderIndex;
    orderState.nextOrderIndex += 1;
    setOrderIndexIfActive(context.values, context.categories, assigned);
    return;
  }

  const existingOrder = orderState.currentOrderById.get(context.id);
  const currentTopOrder = orderState.nextOrderIndex - 1;

  if (existingOrder !== undefined && existingOrder === currentTopOrder) {
    setOrderIndexIfActive(context.values, context.categories, existingOrder);
    return;
  }

  const assigned = orderState.nextOrderIndex;
  orderState.nextOrderIndex += 1;
  orderState.currentOrderById.set(context.id, assigned);
  setOrderIndexIfActive(context.values, context.categories, assigned);
}

const lessonEndEngine = createHierarchyComponentEngine<LessonEndCoreRow, LessonEndRow, LessonEndDetailRow>({
  componentName: "lesson_ends",
  componentLabel: "lesson_ends",
  entityLabel: "lesson_ends",
  idPathLabel: "lesson_ends id",
  updateIdentityEntryKey: LESSON_END_FIELD_MAP.identityFieldKey,
  tableName: "lesson_ends",
  idColumn: "id",
  loadConfigCategories: loadLessonEndConfigCategories,
  systemControlledFieldNames: LESSON_END_SYSTEM_CONTROLLED_FIELD_NAMES,
  coreFields: [],
  parentSpec: {
    formKeys: [LESSON_END_PARENT_FIELD_KEY],
    entryKeys: [LESSON_END_PARENT_FIELD_KEY],
    coreColumn: LESSON_END_PARENT_DB_COLUMN,
    requiredOnCreate: true,
    parse: parseLessonIdValue,
    createFormContextLabel: "Create",
    updateFormContextLabel: "Update",
    createEntryContextLabel: "Each create entry",
    updateEntryContextLabel: (id) => `Update entry ${id}`,
  },
  rpc: {
    createFunctionName: "import_lesson_ends_create_atomic",
    updateFunctionName: "import_lesson_ends_update_atomic",
    buildCreateRow: ({ entryIndex, parentValue, valueRows }): LessonEndAtomicCreateRpcRow => {
      if (typeof parentValue !== "string") {
        throw new Error('Each create entry must include a valid uuid "lessonId".');
      }

      return {
        entry_index: entryIndex,
        lessonId: parentValue,
        core: {},
        values: valueRows,
      };
    },
    buildUpdateRow: ({ entryIndex, id, corePatch, valueRows }): LessonEndAtomicUpdateRpcRow => ({
      entry_index: entryIndex,
      slideId: id,
      core_patch: corePatch as LessonEndCoreUpdatePatch,
      values: valueRows,
    }),
  },
  queries: {
    listResourcePath: "lesson_ends?select=id,lesson_id,created_at&order=created_at.asc,id.asc",
    detailResourcePath: (id) => `lesson_ends?select=id,lesson_id&id=eq.${encodeURIComponent(id)}&limit=1`,
    listErrorLabel: "Failed to load lesson_ends",
    detailErrorLabel: "Failed to load lesson_ends",
  },
  dynamicValues: {
    tableName: "lesson_end_field_values",
    foreignKeyColumn: "lesson_end_id",
    onConflictColumns: "lesson_end_id,component_name,category_name,field_name",
    loadErrorLabel: "Failed to load lesson_ends field values",
    saveErrorLabel: "Failed to save lesson_ends field values",
  },
  mapDetail: (coreRow: LessonEndCoreRow, values: ValueMap): LessonEndDetailRow => ({
    ...coreRow,
    values,
  }),
  applySystemAssignedFields: applyLessonEndSystemAssignedFields,
});

export async function createLessonEndFromFormData(formData: FormData): Promise<string> {
  return lessonEndEngine.createFromFormData(formData);
}

export async function updateLessonEndFromFormData(lessonEndId: string, formData: FormData): Promise<void> {
  await lessonEndEngine.updateFromFormData(lessonEndId, formData);
}

export async function importLessonEndsFromJsonPayload(payload: unknown): Promise<number> {
  return lessonEndEngine.importCreateFromJsonPayload(payload);
}

export async function importLessonEndUpdatesFromJsonPayload(payload: unknown): Promise<number> {
  return lessonEndEngine.importUpdateFromJsonPayload(payload);
}

export async function loadLessonEnds(): Promise<LessonEndRow[]> {
  return lessonEndEngine.loadList();
}

export async function loadLessonEndById(lessonEndId: string): Promise<LessonEndDetailRow | null> {
  return lessonEndEngine.loadById(lessonEndId);
}
