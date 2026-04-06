type ImportPageSearchParams = {
  status?: string | string[];
  component?: string | string[];
  mode?: string | string[];
  message?: string | string[];
};

export const dynamic = "force-dynamic";

type ImportComponentConfig = {
  key: "modules" | "lessons" | "groups" | "slides";
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
      "Required fields are enforced from Supabase field_dictionary_component_rules.is_required for modules. System-controlled moduleId is auto-assigned on create. Use canonical keys in category payloads (for example: title, text, level).",
    updateHeading: "Update Existing Modules",
    updateDescription:
      "Top-level moduleId (uuid) is required. Module fields must match current Supabase module config and required rules. Use canonical keys in category payloads (for example: title, text, level).",
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
      "Include top-level moduleId (uuid). Required lesson fields are enforced from Supabase field_dictionary_component_rules.is_required for lessons. Use canonical keys in category payloads (for example: title, text, subtitle).",
    updateHeading: "Update Existing Lessons",
    updateDescription:
      "Top-level lessonId (uuid) is required. moduleId (uuid) is optional. Lesson fields must match current lesson config. Use canonical keys in category payloads (for example: title, text, subtitle).",
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
      "Include top-level lessonId (uuid). Required group fields are enforced from Supabase field_dictionary_component_rules.is_required for groups. Use canonical keys in category payloads (for example: title, text, subtitle).",
    updateHeading: "Update Existing Groups",
    updateDescription:
      "Top-level groupId (uuid) is required. lessonId (uuid) is optional. Group fields must match current group config. Use canonical keys in category payloads (for example: title, text, subtitle).",
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
      "Include top-level groupId (uuid). Required slide fields are enforced from Supabase field_dictionary_component_rules.is_required for slides. Use canonical keys in category payloads.",
    updateHeading: "Update Existing Slides",
    updateDescription:
      "Top-level slideId (uuid) is required. groupId (uuid) is optional. Slide fields must match current slide config. Use canonical keys in category payloads.",
    createButtonLabel: "Import Slide JSON",
    updateButtonLabel: "Import Slide Update JSON",
    createInputId: "slide-json-file-create",
    updateInputId: "slide-json-file-update",
    action: "/api/slides/import-json",
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
    </section>
  );
}
