export type HierarchyComponentName = "modules" | "lessons" | "groups" | "slides";

type ComponentCanonicalFieldMap = {
  identityFieldKey: string;
  identityDbColumn: "id";
  parentFieldKey: string | null;
  parentDbColumn: "module_id" | "lesson_id" | "group_id" | null;
  coreFieldDbColumns: Record<string, "title" | "text" | "subtitle" | "level_number">;
};

export const CANONICAL_COMPONENT_FIELD_MAP: Record<HierarchyComponentName, ComponentCanonicalFieldMap> = {
  modules: {
    identityFieldKey: "moduleId",
    identityDbColumn: "id",
    parentFieldKey: null,
    parentDbColumn: null,
    coreFieldDbColumns: {
      title: "title",
      text: "text",
      level: "level_number",
    },
  },
  lessons: {
    identityFieldKey: "lessonId",
    identityDbColumn: "id",
    parentFieldKey: "moduleId",
    parentDbColumn: "module_id",
    coreFieldDbColumns: {
      title: "title",
      text: "text",
      subtitle: "subtitle",
    },
  },
  groups: {
    identityFieldKey: "groupId",
    identityDbColumn: "id",
    parentFieldKey: "lessonId",
    parentDbColumn: "lesson_id",
    coreFieldDbColumns: {
      title: "title",
      text: "text",
      subtitle: "subtitle",
    },
  },
  slides: {
    identityFieldKey: "slideId",
    identityDbColumn: "id",
    parentFieldKey: "groupId",
    parentDbColumn: "group_id",
    coreFieldDbColumns: {},
  },
};
