import { parseUuid, type ValueMap } from "@/lib/componentCore";
import { CANONICAL_COMPONENT_FIELD_MAP } from "@/lib/canonicalFieldMap";
import { createHierarchyComponentEngine } from "@/lib/hierarchyComponentEngine";
import { loadTitleSlideConfigCategories } from "@/lib/universalConfigs";

const TITLE_SLIDE_FIELD_MAP = CANONICAL_COMPONENT_FIELD_MAP.title_slides;
const TITLE_SLIDE_SYSTEM_CONTROLLED_FIELD_NAMES = new Set([TITLE_SLIDE_FIELD_MAP.identityFieldKey]);
const TITLE_SLIDE_PARENT_FIELD_KEY = TITLE_SLIDE_FIELD_MAP.parentFieldKey;
const TITLE_SLIDE_PARENT_DB_COLUMN = TITLE_SLIDE_FIELD_MAP.parentDbColumn;

if (!TITLE_SLIDE_PARENT_FIELD_KEY || !TITLE_SLIDE_PARENT_DB_COLUMN) {
  throw new Error("Title slides canonical mapping must define parent field key and parent db column.");
}

type TitleSlideCoreRow = {
  id: string;
  lesson_id: string;
};

type TitleSlideCoreInsertRow = {
  lesson_id: string;
};

type TitleSlideCoreUpdatePatch = Partial<TitleSlideCoreInsertRow>;

type TitleSlideAtomicCreateRpcRow = {
  entry_index: number;
  lessonId: string;
  core: Record<string, never>;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

type TitleSlideAtomicUpdateRpcRow = {
  entry_index: number;
  slideId: string;
  core_patch: TitleSlideCoreUpdatePatch;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

export type TitleSlideRow = {
  id: string;
  lesson_id: string;
};

export type TitleSlideValueMap = Record<string, Record<string, string | null>>;

export type TitleSlideDetailRow = {
  id: string;
  lesson_id: string;
  values: TitleSlideValueMap;
};

function parseLessonIdValue(value: unknown, contextLabel: string): string {
  return parseUuid(value, `${contextLabel} must include a valid uuid "lessonId".`);
}

const titleSlideEngine = createHierarchyComponentEngine<TitleSlideCoreRow, TitleSlideRow, TitleSlideDetailRow>({
  componentName: "title_slides",
  componentLabel: "title slide",
  entityLabel: "title slide",
  idPathLabel: "Title slide id",
  updateIdentityEntryKey: TITLE_SLIDE_FIELD_MAP.identityFieldKey,
  tableName: "title_slides",
  idColumn: "id",
  loadConfigCategories: loadTitleSlideConfigCategories,
  systemControlledFieldNames: TITLE_SLIDE_SYSTEM_CONTROLLED_FIELD_NAMES,
  coreFields: [],
  parentSpec: {
    formKeys: [TITLE_SLIDE_PARENT_FIELD_KEY],
    entryKeys: [TITLE_SLIDE_PARENT_FIELD_KEY],
    coreColumn: TITLE_SLIDE_PARENT_DB_COLUMN,
    requiredOnCreate: true,
    parse: parseLessonIdValue,
    createFormContextLabel: "Create",
    updateFormContextLabel: "Update",
    createEntryContextLabel: "Each create entry",
    updateEntryContextLabel: (id) => `Update entry ${id}`,
  },
  rpc: {
    createFunctionName: "import_title_slides_create_atomic",
    updateFunctionName: "import_title_slides_update_atomic",
    buildCreateRow: ({ entryIndex, parentValue, valueRows }): TitleSlideAtomicCreateRpcRow => {
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
    buildUpdateRow: ({ entryIndex, id, corePatch, valueRows }): TitleSlideAtomicUpdateRpcRow => ({
      entry_index: entryIndex,
      slideId: id,
      core_patch: corePatch as TitleSlideCoreUpdatePatch,
      values: valueRows,
    }),
  },
  queries: {
    listResourcePath: "title_slides?select=id,lesson_id,created_at&order=created_at.asc,id.asc",
    detailResourcePath: (id) => `title_slides?select=id,lesson_id&id=eq.${encodeURIComponent(id)}&limit=1`,
    listErrorLabel: "Failed to load title slides",
    detailErrorLabel: "Failed to load title slide",
  },
  dynamicValues: {
    tableName: "title_slide_field_values",
    foreignKeyColumn: "title_slide_id",
    onConflictColumns: "title_slide_id,component_name,category_name,field_name",
    loadErrorLabel: "Failed to load title slide field values",
    saveErrorLabel: "Failed to save title slide field values",
  },
  mapDetail: (coreRow: TitleSlideCoreRow, values: ValueMap): TitleSlideDetailRow => ({
    ...coreRow,
    values,
  }),
});

export async function createTitleSlideFromFormData(formData: FormData): Promise<string> {
  return titleSlideEngine.createFromFormData(formData);
}

export async function updateTitleSlideFromFormData(titleSlideId: string, formData: FormData): Promise<void> {
  await titleSlideEngine.updateFromFormData(titleSlideId, formData);
}

export async function importTitleSlidesFromJsonPayload(payload: unknown): Promise<number> {
  return titleSlideEngine.importCreateFromJsonPayload(payload);
}

export async function importTitleSlideUpdatesFromJsonPayload(payload: unknown): Promise<number> {
  return titleSlideEngine.importUpdateFromJsonPayload(payload);
}

export async function loadTitleSlides(): Promise<TitleSlideRow[]> {
  return titleSlideEngine.loadList();
}

export async function loadTitleSlideById(titleSlideId: string): Promise<TitleSlideDetailRow | null> {
  return titleSlideEngine.loadById(titleSlideId);
}
