import { parseUuid, type ValueMap } from "@/lib/componentCore";
import { CANONICAL_COMPONENT_FIELD_MAP } from "@/lib/canonicalFieldMap";
import { createHierarchyComponentEngine, type CoreFieldSpec } from "@/lib/hierarchyComponentEngine";
import { loadLessonConfigCategories } from "@/lib/universalConfigs";

const LESSON_FIELD_MAP = CANONICAL_COMPONENT_FIELD_MAP.lessons;
const LESSON_SYSTEM_CONTROLLED_FIELD_NAMES = new Set([LESSON_FIELD_MAP.identityFieldKey]);
const LESSON_PARENT_FIELD_KEY = LESSON_FIELD_MAP.parentFieldKey;
const LESSON_PARENT_DB_COLUMN = LESSON_FIELD_MAP.parentDbColumn;

if (!LESSON_PARENT_FIELD_KEY || !LESSON_PARENT_DB_COLUMN) {
  throw new Error("Lessons canonical mapping must define parent field key and parent db column.");
}

type LessonCoreRow = {
  id: string;
  module_id: string;
  title: string | null;
  text: string | null;
  subtitle: string | null;
};

type LessonCoreInsertRow = {
  module_id: string;
  title: string | null;
  text: string | null;
  subtitle: string | null;
};

type LessonCoreUpdatePatch = Partial<LessonCoreInsertRow>;

type LessonAtomicCreateRpcRow = {
  entry_index: number;
  moduleId: string;
  core: Omit<LessonCoreInsertRow, "module_id">;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

type LessonAtomicUpdateRpcRow = {
  entry_index: number;
  lessonId: string;
  core_patch: LessonCoreUpdatePatch;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

export type LessonRow = {
  id: string;
  module_id: string;
  title: string | null;
};

export type LessonValueMap = Record<string, Record<string, string | null>>;

export type LessonDetailRow = {
  id: string;
  module_id: string;
  title: string | null;
  text: string | null;
  subtitle: string | null;
  values: LessonValueMap;
};

function parseModuleIdValue(value: unknown, contextLabel: string): string {
  return parseUuid(value, `${contextLabel} must include a valid uuid "moduleId".`);
}

const lessonCoreFields: CoreFieldSpec[] = [
  {
    runtimeFieldKeys: ["title"],
    coreColumn: LESSON_FIELD_MAP.coreFieldDbColumns.title,
  },
  {
    runtimeFieldKeys: ["text"],
    coreColumn: LESSON_FIELD_MAP.coreFieldDbColumns.text,
  },
  {
    runtimeFieldKeys: ["subtitle"],
    coreColumn: LESSON_FIELD_MAP.coreFieldDbColumns.subtitle,
  },
];

const lessonEngine = createHierarchyComponentEngine<LessonCoreRow, LessonRow, LessonDetailRow>({
  componentName: "lessons",
  componentLabel: "lesson",
  entityLabel: "lesson",
  idPathLabel: "Lesson id",
  updateIdentityEntryKey: LESSON_FIELD_MAP.identityFieldKey,
  tableName: "lessons",
  idColumn: "id",
  loadConfigCategories: loadLessonConfigCategories,
  systemControlledFieldNames: LESSON_SYSTEM_CONTROLLED_FIELD_NAMES,
  coreFields: lessonCoreFields,
  parentSpec: {
    formKeys: [LESSON_PARENT_FIELD_KEY],
    entryKeys: [LESSON_PARENT_FIELD_KEY],
    coreColumn: LESSON_PARENT_DB_COLUMN,
    requiredOnCreate: true,
    parse: parseModuleIdValue,
    createFormContextLabel: "Create",
    updateFormContextLabel: "Update",
    createEntryContextLabel: "Each create entry",
    updateEntryContextLabel: (id) => `Update entry ${id}`,
  },
  rpc: {
    createFunctionName: "import_lessons_create_atomic",
    updateFunctionName: "import_lessons_update_atomic",
    buildCreateRow: ({ entryIndex, parentValue, coreInsert, valueRows }): LessonAtomicCreateRpcRow => {
      if (typeof parentValue !== "string") {
        throw new Error('Each create entry must include a valid uuid "moduleId".');
      }

      const typedCoreInsert = coreInsert as LessonCoreInsertRow;
      const coreWithoutParent: Omit<LessonCoreInsertRow, "module_id"> = {
        title: typedCoreInsert.title,
        text: typedCoreInsert.text,
        subtitle: typedCoreInsert.subtitle,
      };

      return {
        entry_index: entryIndex,
        moduleId: parentValue,
        core: coreWithoutParent,
        values: valueRows,
      };
    },
    buildUpdateRow: ({ entryIndex, id, corePatch, valueRows }): LessonAtomicUpdateRpcRow => ({
      entry_index: entryIndex,
      lessonId: id,
      core_patch: corePatch as LessonCoreUpdatePatch,
      values: valueRows,
    }),
  },
  queries: {
    listResourcePath: "lessons?select=id,module_id,title,created_at&order=created_at.asc,id.asc",
    detailResourcePath: (id) => `lessons?select=id,module_id,title,text,subtitle&id=eq.${encodeURIComponent(id)}&limit=1`,
    listErrorLabel: "Failed to load lessons",
    detailErrorLabel: "Failed to load lesson",
  },
  dynamicValues: {
    tableName: "lesson_field_values",
    foreignKeyColumn: "lesson_id",
    onConflictColumns: "lesson_id,component_name,category_name,field_name",
    loadErrorLabel: "Failed to load lesson field values",
    saveErrorLabel: "Failed to save lesson field values",
  },
  mapDetail: (coreRow: LessonCoreRow, values: ValueMap): LessonDetailRow => ({
    ...coreRow,
    values,
  }),
});

export async function createLessonFromFormData(formData: FormData): Promise<string> {
  return lessonEngine.createFromFormData(formData);
}

export async function updateLessonFromFormData(lessonId: string, formData: FormData): Promise<void> {
  await lessonEngine.updateFromFormData(lessonId, formData);
}

export async function importLessonsFromJsonPayload(payload: unknown): Promise<number> {
  return lessonEngine.importCreateFromJsonPayload(payload);
}

export async function importLessonUpdatesFromJsonPayload(payload: unknown): Promise<number> {
  return lessonEngine.importUpdateFromJsonPayload(payload);
}

export async function loadLessons(): Promise<LessonRow[]> {
  return lessonEngine.loadList();
}

export async function loadLessonById(lessonId: string): Promise<LessonDetailRow | null> {
  return lessonEngine.loadById(lessonId);
}
