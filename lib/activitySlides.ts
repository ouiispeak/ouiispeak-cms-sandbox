import {
  fetchAnonRows,
  parseUuid,
  splitQualifiedFieldKey,
  type FieldInputMap,
  type ValueMap,
} from "@/lib/componentCore";
import { CANONICAL_COMPONENT_FIELD_MAP } from "@/lib/canonicalFieldMap";
import { createHierarchyComponentEngine } from "@/lib/hierarchyComponentEngine";
import {
  validateActivitySlideFormDataPreflight,
  validateActivitySlideImportPayloadPreflight,
} from "@/lib/activitySlidePreflight";
import { normalizeActivityPropsJson } from "@/lib/activityPayloadNormalization";
import { loadActivitySlideConfigCategories } from "@/lib/universalConfigs";

const ACTIVITY_SLIDE_FIELD_MAP = CANONICAL_COMPONENT_FIELD_MAP.activity_slides;
const ACTIVITY_SLIDE_SYSTEM_CONTROLLED_FIELD_NAMES = new Set([ACTIVITY_SLIDE_FIELD_MAP.identityFieldKey]);
const ACTIVITY_SLIDE_PARENT_FIELD_KEY = ACTIVITY_SLIDE_FIELD_MAP.parentFieldKey;
const ACTIVITY_SLIDE_PARENT_DB_COLUMN = ACTIVITY_SLIDE_FIELD_MAP.parentDbColumn;

if (!ACTIVITY_SLIDE_PARENT_FIELD_KEY || !ACTIVITY_SLIDE_PARENT_DB_COLUMN) {
  throw new Error("Activity slides canonical mapping must define parent field key and parent db column.");
}

type ActivitySlideCoreRow = {
  id: string;
  group_id: string;
};

type ActivitySlideCoreInsertRow = {
  group_id: string;
};

type ActivitySlideCoreUpdatePatch = Partial<ActivitySlideCoreInsertRow>;

type ActivitySlideAtomicCreateRpcRow = {
  entry_index: number;
  groupId: string;
  core: Record<string, never>;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

type ActivitySlideAtomicUpdateRpcRow = {
  entry_index: number;
  slideId: string;
  core_patch: ActivitySlideCoreUpdatePatch;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

export type ActivitySlideRow = {
  id: string;
  group_id: string;
};

type ActivitySlideOrderIndexRow = {
  activity_slide_id: string;
  field_value: string | null;
};

export type ActivitySlideValueMap = Record<string, Record<string, string | null>>;

export type ActivitySlideDetailRow = {
  id: string;
  group_id: string;
  values: ActivitySlideValueMap;
};

function parseGroupIdValue(value: unknown, contextLabel: string): string {
  return parseUuid(value, `${contextLabel} must include a valid uuid "groupId".`);
}

function getFieldMapEntryByName(
  values: FieldInputMap,
  fieldName: string
): [qualifiedKey: string, fieldValue: string | null] | null {
  for (const [qualifiedKey, fieldValue] of values.entries()) {
    if (splitQualifiedFieldKey(qualifiedKey).fieldName === fieldName) {
      return [qualifiedKey, fieldValue];
    }
  }

  return null;
}

function normalizeActivityPropsJsonInValueMap(values: FieldInputMap): void {
  const activityIdEntry = getFieldMapEntryByName(values, "activityId");
  const activityId = activityIdEntry?.[1] ?? null;

  const propsJsonEntry = getFieldMapEntryByName(values, "propsJson");
  if (!propsJsonEntry) {
    return;
  }

  const [propsJsonQualifiedKey, propsJsonRaw] = propsJsonEntry;
  if (typeof propsJsonRaw !== "string" || propsJsonRaw.trim().length === 0) {
    return;
  }

  let parsedPropsJson: unknown;
  try {
    parsedPropsJson = JSON.parse(propsJsonRaw);
  } catch {
    return;
  }

  if (!parsedPropsJson || typeof parsedPropsJson !== "object" || Array.isArray(parsedPropsJson)) {
    return;
  }

  const normalizedPropsJson = normalizeActivityPropsJson(activityId, parsedPropsJson as Record<string, unknown>);
  values.set(propsJsonQualifiedKey, JSON.stringify(normalizedPropsJson));
}

const activitySlideEngine = createHierarchyComponentEngine<
  ActivitySlideCoreRow,
  ActivitySlideRow,
  ActivitySlideDetailRow
>({
  componentName: "activity_slides",
  componentLabel: "activity slide",
  entityLabel: "activity slide",
  idPathLabel: "Activity slide id",
  updateIdentityEntryKey: ACTIVITY_SLIDE_FIELD_MAP.identityFieldKey,
  tableName: "activity_slides",
  idColumn: "id",
  loadConfigCategories: loadActivitySlideConfigCategories,
  systemControlledFieldNames: ACTIVITY_SLIDE_SYSTEM_CONTROLLED_FIELD_NAMES,
  coreFields: [],
  parentSpec: {
    formKeys: [ACTIVITY_SLIDE_PARENT_FIELD_KEY],
    entryKeys: [ACTIVITY_SLIDE_PARENT_FIELD_KEY],
    coreColumn: ACTIVITY_SLIDE_PARENT_DB_COLUMN,
    requiredOnCreate: true,
    parse: parseGroupIdValue,
    createFormContextLabel: "Create",
    updateFormContextLabel: "Update",
    createEntryContextLabel: "Each create entry",
    updateEntryContextLabel: (id) => `Update entry ${id}`,
  },
  rpc: {
    createFunctionName: "import_activity_slides_create_atomic",
    updateFunctionName: "import_activity_slides_update_atomic",
    buildCreateRow: ({ entryIndex, parentValue, valueRows }): ActivitySlideAtomicCreateRpcRow => {
      if (typeof parentValue !== "string") {
        throw new Error('Each create entry must include a valid uuid "groupId".');
      }

      return {
        entry_index: entryIndex,
        groupId: parentValue,
        core: {},
        values: valueRows,
      };
    },
    buildUpdateRow: ({ entryIndex, id, corePatch, valueRows }): ActivitySlideAtomicUpdateRpcRow => ({
      entry_index: entryIndex,
      slideId: id,
      core_patch: corePatch as ActivitySlideCoreUpdatePatch,
      values: valueRows,
    }),
  },
  queries: {
    listResourcePath: "activity_slides?select=id,group_id,created_at&order=created_at.asc,id.asc",
    detailResourcePath: (id) =>
      `activity_slides?select=id,group_id&id=eq.${encodeURIComponent(id)}&limit=1`,
    listErrorLabel: "Failed to load activity slides",
    detailErrorLabel: "Failed to load activity slide",
  },
  dynamicValues: {
    tableName: "activity_slide_field_values",
    foreignKeyColumn: "activity_slide_id",
    onConflictColumns: "activity_slide_id,component_name,category_name,field_name",
    loadErrorLabel: "Failed to load activity slide field values",
    saveErrorLabel: "Failed to save activity slide field values",
  },
  applySystemAssignedFields: ({ values }) => {
    normalizeActivityPropsJsonInValueMap(values);
  },
  mapDetail: (coreRow: ActivitySlideCoreRow, values: ValueMap): ActivitySlideDetailRow => ({
    ...coreRow,
    values,
  }),
});

export async function createActivitySlideFromFormData(formData: FormData): Promise<string> {
  validateActivitySlideFormDataPreflight(formData, "create");
  return activitySlideEngine.createFromFormData(formData);
}

export async function updateActivitySlideFromFormData(activitySlideId: string, formData: FormData): Promise<void> {
  validateActivitySlideFormDataPreflight(formData, "update");
  await activitySlideEngine.updateFromFormData(activitySlideId, formData);
}

export async function importActivitySlidesFromJsonPayload(payload: unknown): Promise<number> {
  validateActivitySlideImportPayloadPreflight(payload, "create");
  return activitySlideEngine.importCreateFromJsonPayload(payload);
}

export async function importActivitySlideUpdatesFromJsonPayload(payload: unknown): Promise<number> {
  validateActivitySlideImportPayloadPreflight(payload, "update");
  return activitySlideEngine.importUpdateFromJsonPayload(payload);
}

export async function loadActivitySlides(): Promise<ActivitySlideRow[]> {
  const activitySlides = await activitySlideEngine.loadList();
  if (activitySlides.length <= 1) {
    return activitySlides;
  }

  const activitySlideIds = activitySlides.map((row) => row.id);
  const orderIndexRows = await fetchAnonRows<ActivitySlideOrderIndexRow>(
    `activity_slide_field_values?select=activity_slide_id,field_value&component_name=eq.activity_slides&field_name=eq.orderIndex&activity_slide_id=in.(${activitySlideIds.join(
      ","
    )})`,
    "Failed to load activity slide order index values"
  );

  const orderIndexByActivitySlideId = new Map<string, number>();
  for (const row of orderIndexRows) {
    if (typeof row.field_value !== "string") {
      continue;
    }

    const parsed = Number.parseInt(row.field_value, 10);
    if (!Number.isInteger(parsed)) {
      continue;
    }

    orderIndexByActivitySlideId.set(row.activity_slide_id, parsed);
  }

  return [...activitySlides].sort((a, b) => {
    const aOrderIndex = orderIndexByActivitySlideId.get(a.id);
    const bOrderIndex = orderIndexByActivitySlideId.get(b.id);
    const aHasOrderIndex = aOrderIndex !== undefined;
    const bHasOrderIndex = bOrderIndex !== undefined;

    if (aHasOrderIndex && bHasOrderIndex && aOrderIndex !== bOrderIndex) {
      return aOrderIndex - bOrderIndex;
    }

    if (aHasOrderIndex && !bHasOrderIndex) {
      return -1;
    }

    if (!aHasOrderIndex && bHasOrderIndex) {
      return 1;
    }

    return a.id.localeCompare(b.id);
  });
}

export async function loadActivitySlideById(activitySlideId: string): Promise<ActivitySlideDetailRow | null> {
  return activitySlideEngine.loadById(activitySlideId);
}
