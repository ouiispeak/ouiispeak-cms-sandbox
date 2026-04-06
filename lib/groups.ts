import { parseUuid, type ValueMap } from "@/lib/componentCore";
import { CANONICAL_COMPONENT_FIELD_MAP } from "@/lib/canonicalFieldMap";
import { createHierarchyComponentEngine, type CoreFieldSpec } from "@/lib/hierarchyComponentEngine";
import { loadGroupConfigCategories } from "@/lib/universalConfigs";

const GROUP_FIELD_MAP = CANONICAL_COMPONENT_FIELD_MAP.groups;
const GROUP_SYSTEM_CONTROLLED_FIELD_NAMES = new Set([GROUP_FIELD_MAP.identityFieldKey]);
const GROUP_PARENT_FIELD_KEY = GROUP_FIELD_MAP.parentFieldKey;
const GROUP_PARENT_DB_COLUMN = GROUP_FIELD_MAP.parentDbColumn;

if (!GROUP_PARENT_FIELD_KEY || !GROUP_PARENT_DB_COLUMN) {
  throw new Error("Groups canonical mapping must define parent field key and parent db column.");
}

type GroupCoreRow = {
  id: string;
  lesson_id: string;
  title: string | null;
  text: string | null;
  subtitle: string | null;
};

type GroupCoreInsertRow = {
  lesson_id: string;
  title: string | null;
  text: string | null;
  subtitle: string | null;
};

type GroupCoreUpdatePatch = Partial<GroupCoreInsertRow>;

type GroupAtomicCreateRpcRow = {
  entry_index: number;
  lessonId: string;
  core: Omit<GroupCoreInsertRow, "lesson_id">;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

type GroupAtomicUpdateRpcRow = {
  entry_index: number;
  groupId: string;
  core_patch: GroupCoreUpdatePatch;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

export type GroupRow = {
  id: string;
  lesson_id: string;
  title: string | null;
};

export type GroupValueMap = Record<string, Record<string, string | null>>;

export type GroupDetailRow = {
  id: string;
  lesson_id: string;
  title: string | null;
  text: string | null;
  subtitle: string | null;
  values: GroupValueMap;
};

function parseLessonIdValue(value: unknown, contextLabel: string): string {
  return parseUuid(value, `${contextLabel} must include a valid uuid "lessonId".`);
}

const groupCoreFields: CoreFieldSpec[] = [
  {
    runtimeFieldKeys: ["title"],
    coreColumn: GROUP_FIELD_MAP.coreFieldDbColumns.title,
  },
  {
    runtimeFieldKeys: ["text"],
    coreColumn: GROUP_FIELD_MAP.coreFieldDbColumns.text,
  },
  {
    runtimeFieldKeys: ["subtitle"],
    coreColumn: GROUP_FIELD_MAP.coreFieldDbColumns.subtitle,
  },
];

const groupEngine = createHierarchyComponentEngine<GroupCoreRow, GroupRow, GroupDetailRow>({
  componentName: "groups",
  componentLabel: "group",
  entityLabel: "group",
  idPathLabel: "Group id",
  updateIdentityEntryKey: GROUP_FIELD_MAP.identityFieldKey,
  tableName: "groups",
  idColumn: "id",
  loadConfigCategories: loadGroupConfigCategories,
  systemControlledFieldNames: GROUP_SYSTEM_CONTROLLED_FIELD_NAMES,
  coreFields: groupCoreFields,
  parentSpec: {
    formKeys: [GROUP_PARENT_FIELD_KEY],
    entryKeys: [GROUP_PARENT_FIELD_KEY],
    coreColumn: GROUP_PARENT_DB_COLUMN,
    requiredOnCreate: true,
    parse: parseLessonIdValue,
    createFormContextLabel: "Create",
    updateFormContextLabel: "Update",
    createEntryContextLabel: "Each create entry",
    updateEntryContextLabel: (id) => `Update entry ${id}`,
  },
  rpc: {
    createFunctionName: "import_groups_create_atomic",
    updateFunctionName: "import_groups_update_atomic",
    buildCreateRow: ({ entryIndex, parentValue, coreInsert, valueRows }): GroupAtomicCreateRpcRow => {
      if (typeof parentValue !== "string") {
        throw new Error('Each create entry must include a valid uuid "lessonId".');
      }

      const typedCoreInsert = coreInsert as GroupCoreInsertRow;
      const coreWithoutParent: Omit<GroupCoreInsertRow, "lesson_id"> = {
        title: typedCoreInsert.title,
        text: typedCoreInsert.text,
        subtitle: typedCoreInsert.subtitle,
      };

      return {
        entry_index: entryIndex,
        lessonId: parentValue,
        core: coreWithoutParent,
        values: valueRows,
      };
    },
    buildUpdateRow: ({ entryIndex, id, corePatch, valueRows }): GroupAtomicUpdateRpcRow => ({
      entry_index: entryIndex,
      groupId: id,
      core_patch: corePatch as GroupCoreUpdatePatch,
      values: valueRows,
    }),
  },
  queries: {
    listResourcePath: "groups?select=id,lesson_id,title,created_at&order=created_at.asc,id.asc",
    detailResourcePath: (id) => `groups?select=id,lesson_id,title,text,subtitle&id=eq.${encodeURIComponent(id)}&limit=1`,
    listErrorLabel: "Failed to load groups",
    detailErrorLabel: "Failed to load group",
  },
  dynamicValues: {
    tableName: "group_field_values",
    foreignKeyColumn: "group_id",
    onConflictColumns: "group_id,component_name,category_name,field_name",
    loadErrorLabel: "Failed to load group field values",
    saveErrorLabel: "Failed to save group field values",
  },
  mapDetail: (coreRow: GroupCoreRow, values: ValueMap): GroupDetailRow => ({
    ...coreRow,
    values,
  }),
});

export async function createGroupFromFormData(formData: FormData): Promise<string> {
  return groupEngine.createFromFormData(formData);
}

export async function updateGroupFromFormData(groupId: string, formData: FormData): Promise<void> {
  await groupEngine.updateFromFormData(groupId, formData);
}

export async function importGroupsFromJsonPayload(payload: unknown): Promise<number> {
  return groupEngine.importCreateFromJsonPayload(payload);
}

export async function importGroupUpdatesFromJsonPayload(payload: unknown): Promise<number> {
  return groupEngine.importUpdateFromJsonPayload(payload);
}

export async function loadGroups(): Promise<GroupRow[]> {
  return groupEngine.loadList();
}

export async function loadGroupById(groupId: string): Promise<GroupDetailRow | null> {
  return groupEngine.loadById(groupId);
}
