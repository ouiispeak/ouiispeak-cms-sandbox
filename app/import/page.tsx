type ImportPageSearchParams = {
  status?: string | string[];
  component?: string | string[];
  mode?: string | string[];
  message?: string | string[];
};

export const dynamic = "force-dynamic";

type ImportComponentConfig = {
  key: "modules" | "lessons" | "groups" | "slides" | "activity_slides" | "title_slides" | "lesson_ends";
  labelSingular: string;
  labelPlural: string;
  createHeading: string;
  createDescription: string;
  updateHeading: string;
  updateDescription: string;
  createButtonLabel: string;
  updateButtonLabel: string;
  createInputId: string;
  updateInputId: string;
  action: string;
};

const IMPORT_COMPONENTS: ImportComponentConfig[] = [
  {
    key: "modules",
    labelSingular: "Module",
    labelPlural: "Modules",
    createHeading: "Create New Modules",
    createDescription:
      "Required fields are enforced from Supabase field_dictionary_component_rules.is_required for modules. System-controlled moduleId is auto-assigned on create. Use canonical keys in category payloads (for example: slug, title, text, level).",
    updateHeading: "Update Existing Modules",
    updateDescription:
      "Top-level moduleId (uuid) is required. Module fields must match current Supabase module config and required rules. Use canonical keys in category payloads (for example: slug, title, text, level).",
    createButtonLabel: "Import JSON File",
    updateButtonLabel: "Import Update JSON",
    createInputId: "module-json-file-create",
    updateInputId: "module-json-file-update",
    action: "/api/modules/import-json",
  },
  {
    key: "lessons",
    labelSingular: "Lesson",
    labelPlural: "Lessons",
    createHeading: "Create New Lessons",
    createDescription:
      "Include top-level moduleId (uuid). Required lesson fields are enforced from Supabase field_dictionary_component_rules.is_required for lessons. Use canonical keys in category payloads (for example: slug, title, text, subtitle).",
    updateHeading: "Update Existing Lessons",
    updateDescription:
      "Top-level lessonId (uuid) is required. moduleId (uuid) is optional. Lesson fields must match current lesson config. Use canonical keys in category payloads (for example: slug, title, text, subtitle).",
    createButtonLabel: "Import Lesson JSON",
    updateButtonLabel: "Import Lesson Update JSON",
    createInputId: "lesson-json-file-create",
    updateInputId: "lesson-json-file-update",
    action: "/api/lessons/import-json",
  },
  {
    key: "groups",
    labelSingular: "Group",
    labelPlural: "Groups",
    createHeading: "Create New Groups",
    createDescription:
      "Include top-level lessonId (uuid). Required group fields are enforced from Supabase field_dictionary_component_rules.is_required for groups. Use canonical keys in category payloads (for example: slug, title, text, subtitle).",
    updateHeading: "Update Existing Groups",
    updateDescription:
      "Top-level groupId (uuid) is required. lessonId (uuid) is optional. Group fields must match current group config. Use canonical keys in category payloads (for example: slug, title, text, subtitle).",
    createButtonLabel: "Import Group JSON",
    updateButtonLabel: "Import Group Update JSON",
    createInputId: "group-json-file-create",
    updateInputId: "group-json-file-update",
    action: "/api/groups/import-json",
  },
  {
    key: "slides",
    labelSingular: "Slide",
    labelPlural: "Slides",
    createHeading: "Create New Slides",
    createDescription:
      "Include top-level groupId (uuid). Required slide fields are enforced from Supabase field_dictionary_component_rules.is_required for slides. Slides are content-slide only (for example: type=text).",
    updateHeading: "Update Existing Slides",
    updateDescription:
      "Top-level slideId (uuid) is required. groupId (uuid) is optional. Slide fields must match current slide config.",
    createButtonLabel: "Import Slide JSON",
    updateButtonLabel: "Import Slide Update JSON",
    createInputId: "slide-json-file-create",
    updateInputId: "slide-json-file-update",
    action: "/api/slides/import-json",
  },
  {
    key: "activity_slides",
    labelSingular: "Activity Slide",
    labelPlural: "Activity Slides",
    createHeading: "Create New Activity Slides",
    createDescription:
      'Include top-level groupId (uuid). Required activity slide fields are enforced from Supabase field_dictionary_component_rules.is_required for activity_slides. Use canonical keys for the selected active profile (ACT-001..ACT-005, ACT-009..ACT-026) plus type="activity", activityId, orderIndex, runtimeContractV1.',
    updateHeading: "Update Existing Activity Slides",
    updateDescription:
      'Top-level slideId (uuid) is required. groupId (uuid) is optional. Activity slide fields must match current activity_slides profile config. Keep type="activity" and activityId aligned with the profile payload.',
    createButtonLabel: "Import Activity Slide JSON",
    updateButtonLabel: "Import Activity Slide Update JSON",
    createInputId: "activity-slide-json-file-create",
    updateInputId: "activity-slide-json-file-update",
    action: "/api/activity-slides/import-json",
  },
  {
    key: "title_slides",
    labelSingular: "Title Slide",
    labelPlural: "Title Slides",
    createHeading: "Create New Title Slide",
    createDescription:
      "Include top-level lessonId (uuid). Required title slide fields are enforced from Supabase field_dictionary_component_rules.is_required for title_slides. Use canonical keys in category payloads (for example: slug, title, subtitle).",
    updateHeading: "Update Existing Title Slide",
    updateDescription:
      "Top-level slideId (uuid) is required. lessonId (uuid) is optional. Title slide fields must match current title slide config. Use canonical keys in category payloads (for example: slug, title, subtitle).",
    createButtonLabel: "Import Title Slide JSON",
    updateButtonLabel: "Import Title Slide Update JSON",
    createInputId: "title-slide-json-file-create",
    updateInputId: "title-slide-json-file-update",
    action: "/api/title-slides/import-json",
  },
  {
    key: "lesson_ends",
    labelSingular: "lesson_ends",
    labelPlural: "lesson_ends",
    createHeading: "Create New lesson_ends",
    createDescription:
      "Include top-level lessonId (uuid). Required lesson_ends fields are enforced from Supabase field_dictionary_component_rules.is_required for lesson_ends.",
    updateHeading: "Update Existing lesson_ends",
    updateDescription:
      "Top-level slideId (uuid) is required. lessonId (uuid) is optional. lesson_ends fields must match current lesson_ends config.",
    createButtonLabel: "Import lesson_ends JSON",
    updateButtonLabel: "Import lesson_ends Update JSON",
    createInputId: "lesson_ends-json-file-create",
    updateInputId: "lesson_ends-json-file-update",
    action: "/api/lesson-ends/import-json",
  },
];

function getFirstValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
}

function toErrorContextLabel(component: string | undefined, mode: string | undefined): string {
  const componentLabel =
    component === "lessons"
      ? "Lesson"
      : component === "modules"
      ? "Module"
      : component === "groups"
      ? "Group"
      : component === "slides"
      ? "Slide"
      : component === "activity_slides"
      ? "Activity Slide"
      : component === "title_slides"
      ? "Title Slide"
      : component === "lesson_ends"
      ? "lesson_ends"
      : "Import";
  const modeLabel = mode === "update" ? "Update" : mode === "create" ? "Create" : "Operation";
  return `${componentLabel} ${modeLabel}`;
}

function ImportSection({
  heading,
  description,
  action,
  mode,
  inputId,
  inputLabel,
  buttonLabel,
  ariaLabel,
}: {
  heading: string;
  description: string;
  action: string;
  mode: "create" | "update";
  inputId: string;
  inputLabel: string;
  buttonLabel: string;
  ariaLabel: string;
}) {
  return (
    <section className="configSection" aria-label={ariaLabel}>
      <h3 className="configCategoryTitle">{heading}</h3>
      <p className="meta">{description}</p>
      <form action={action} method="post" encType="multipart/form-data">
        <input type="hidden" name="mode" value={mode} />
        <div className="configForm">
          <div className="configField">
            <label htmlFor={inputId}>{inputLabel}</label>
            <input id={inputId} name="file" type="file" accept=".json,application/json" required />
          </div>
          <button type="submit">{buttonLabel}</button>
        </div>
      </form>
    </section>
  );
}

export default async function ImportPage({
  searchParams,
}: {
  searchParams?: Promise<ImportPageSearchParams> | ImportPageSearchParams;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = getFirstValue(resolvedSearchParams.status);
  const component = getFirstValue(resolvedSearchParams.component);
  const mode = getFirstValue(resolvedSearchParams.mode);
  const message = getFirstValue(resolvedSearchParams.message);
  const hasError = status === "error" && typeof message === "string" && message.length > 0;
  const errorContextLabel = toErrorContextLabel(component, mode);

  return (
    <section className="panel">
      <h2>Import</h2>
      <p className="meta">Route: /import</p>
      <p className="meta">
        Contract: identity/parent keys (<code>moduleId</code>, <code>lessonId</code>, <code>groupId</code>,{" "}
        <code>slideId</code>) must be top-level only and are rejected inside category payloads.
      </p>
      {hasError ? (
        <section className="configSection" aria-label="Validation Failed Gate">
          <h3 className="configCategoryTitle">Validation Failed: {errorContextLabel}</h3>
          <p className="meta">{message}</p>
        </section>
      ) : null}
      {IMPORT_COMPONENTS.map((componentConfig) => (
        <ImportSection
          key={`${componentConfig.key}-create`}
          heading={componentConfig.createHeading}
          description={componentConfig.createDescription}
          action={componentConfig.action}
          mode="create"
          inputId={componentConfig.createInputId}
          inputLabel="JSON File"
          buttonLabel={componentConfig.createButtonLabel}
          ariaLabel={`Create ${componentConfig.labelPlural} From JSON`}
        />
      ))}
      {IMPORT_COMPONENTS.map((componentConfig) => (
        <ImportSection
          key={`${componentConfig.key}-update`}
          heading={componentConfig.updateHeading}
          description={componentConfig.updateDescription}
          action={componentConfig.action}
          mode="update"
          inputId={componentConfig.updateInputId}
          inputLabel="JSON File"
          buttonLabel={componentConfig.updateButtonLabel}
          ariaLabel={`Update Existing ${componentConfig.labelPlural} From JSON`}
        />
      ))}
      <ImportSection
        heading="Create New Nested Lessons"
        description='Upload lesson payloads that include top-level "groups", and each group can include "slides" and "activitySlides". The lesson is created first, then nested groups, then nested slides. Lesson-boundary title slides and lesson_ends slides are imported separately through their dedicated imports.'
        action="/api/lessons/import-json-nested"
        mode="create"
        inputId="lesson-json-file-nested-create"
        inputLabel="Nested Lesson JSON File"
        buttonLabel="Import Nested Lesson JSON"
        ariaLabel="Create New Nested Lessons From JSON"
      />
      <ImportSection
        heading="Update Existing Nested Lessons"
        description='Upload lesson payloads with "lessonId" plus optional nested "groups", "slides", and "activitySlides". Groups/slides/activitySlides with ids are updated; entries without ids are created under their parent. Lesson-boundary title slides and lesson_ends slides are updated through their dedicated imports.'
        action="/api/lessons/import-json-nested"
        mode="update"
        inputId="lesson-json-file-nested-update"
        inputLabel="Nested Lesson JSON File"
        buttonLabel="Import Nested Lesson Update JSON"
        ariaLabel="Update Existing Nested Lessons From JSON"
      />
    </section>
  );
}
