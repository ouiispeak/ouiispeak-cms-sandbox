import { parseUuid, type ValueMap } from "@/lib/componentCore";
import { CANONICAL_COMPONENT_FIELD_MAP } from "@/lib/canonicalFieldMap";
import { createHierarchyComponentEngine } from "@/lib/hierarchyComponentEngine";
import { loadSlideConfigCategories } from "@/lib/universalConfigs";

const SLIDE_FIELD_MAP = CANONICAL_COMPONENT_FIELD_MAP.slides;
const SLIDE_SYSTEM_CONTROLLED_FIELD_NAMES = new Set([SLIDE_FIELD_MAP.identityFieldKey]);
const SLIDE_PARENT_FIELD_KEY = SLIDE_FIELD_MAP.parentFieldKey;
const SLIDE_PARENT_DB_COLUMN = SLIDE_FIELD_MAP.parentDbColumn;

if (!SLIDE_PARENT_FIELD_KEY || !SLIDE_PARENT_DB_COLUMN) {
  throw new Error("Slides canonical mapping must define parent field key and parent db column.");
}

type SlideCoreRow = {
  id: string;
  group_id: string;
};

type SlideCoreInsertRow = {
  group_id: string;
};

type SlideCoreUpdatePatch = Partial<SlideCoreInsertRow>;

type SlideAtomicCreateRpcRow = {
  entry_index: number;
  groupId: string;
  core: Record<string, never>;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

type SlideAtomicUpdateRpcRow = {
  entry_index: number;
  slideId: string;
  core_patch: SlideCoreUpdatePatch;
  values: Array<{ category_name: string; field_name: string; field_value: string | null }>;
};

export type SlideRow = {
  id: string;
  group_id: string;
};

export type SlideValueMap = Record<string, Record<string, string | null>>;

export type SlideDetailRow = {
  id: string;
  group_id: string;
  values: SlideValueMap;
};

function parseGroupIdValue(value: unknown, contextLabel: string): string {
  return parseUuid(value, `${contextLabel} must include a valid uuid "groupId".`);
}

const slideEngine = createHierarchyComponentEngine<SlideCoreRow, SlideRow, SlideDetailRow>({
  componentName: "slides",
  componentLabel: "slide",
  entityLabel: "slide",
  idPathLabel: "Slide id",
  updateIdentityEntryKey: SLIDE_FIELD_MAP.identityFieldKey,
  tableName: "slides",
  idColumn: "id",
  loadConfigCategories: loadSlideConfigCategories,
  systemControlledFieldNames: SLIDE_SYSTEM_CONTROLLED_FIELD_NAMES,
  coreFields: [],
  parentSpec: {
    formKeys: [SLIDE_PARENT_FIELD_KEY],
    entryKeys: [SLIDE_PARENT_FIELD_KEY],
    coreColumn: SLIDE_PARENT_DB_COLUMN,
    requiredOnCreate: true,
    parse: parseGroupIdValue,
    createFormContextLabel: "Create",
    updateFormContextLabel: "Update",
    createEntryContextLabel: "Each create entry",
    updateEntryContextLabel: (id) => `Update entry ${id}`,
  },
  rpc: {
    createFunctionName: "import_slides_create_atomic",
    updateFunctionName: "import_slides_update_atomic",
    buildCreateRow: ({ entryIndex, parentValue, valueRows }): SlideAtomicCreateRpcRow => {
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
    buildUpdateRow: ({ entryIndex, id, corePatch, valueRows }): SlideAtomicUpdateRpcRow => ({
      entry_index: entryIndex,
      slideId: id,
      core_patch: corePatch as SlideCoreUpdatePatch,
      values: valueRows,
    }),
  },
  queries: {
    listResourcePath: "slides?select=id,group_id,created_at&order=created_at.asc,id.asc",
    detailResourcePath: (id) => `slides?select=id,group_id&id=eq.${encodeURIComponent(id)}&limit=1`,
    listErrorLabel: "Failed to load slides",
    detailErrorLabel: "Failed to load slide",
  },
  dynamicValues: {
    tableName: "slide_field_values",
    foreignKeyColumn: "slide_id",
    onConflictColumns: "slide_id,component_name,category_name,field_name",
    loadErrorLabel: "Failed to load slide field values",
    saveErrorLabel: "Failed to save slide field values",
  },
  mapDetail: (coreRow: SlideCoreRow, values: ValueMap): SlideDetailRow => ({
    ...coreRow,
    values,
  }),
});

export async function createSlideFromFormData(formData: FormData): Promise<string> {
  return slideEngine.createFromFormData(formData);
}

export async function updateSlideFromFormData(slideId: string, formData: FormData): Promise<void> {
  await slideEngine.updateFromFormData(slideId, formData);
}

export async function importSlidesFromJsonPayload(payload: unknown): Promise<number> {
  return slideEngine.importCreateFromJsonPayload(payload);
}

export async function importSlideUpdatesFromJsonPayload(payload: unknown): Promise<number> {
  return slideEngine.importUpdateFromJsonPayload(payload);
}

export async function loadSlides(): Promise<SlideRow[]> {
  return slideEngine.loadList();
}

export async function loadSlideById(slideId: string): Promise<SlideDetailRow | null> {
  return slideEngine.loadById(slideId);
}
