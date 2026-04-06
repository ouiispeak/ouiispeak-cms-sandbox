import { loadLessonConfigCategories } from "@/lib/universalConfigs";
import { createLessonFromFormData, loadLessonById, updateLessonFromFormData } from "@/lib/lessons";
import { loadModules } from "@/lib/modules";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createLessonAction(formData: FormData) {
  "use server";

  const lessonId = await createLessonFromFormData(formData);
  redirect(`/edit-lesson/${lessonId}`);
}

async function updateLessonAction(lessonId: string, formData: FormData) {
  "use server";

  await updateLessonFromFormData(lessonId, formData);
  redirect(`/edit-lesson/${lessonId}`);
}

export default async function EditLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const isNewLessonRoute = lessonId === "new";
  const pageTitle = isNewLessonRoute ? "New Lesson" : "Edit Lesson";

  try {
    const [categories, lessonRecord, modules] = await Promise.all([
      loadLessonConfigCategories(),
      isNewLessonRoute ? Promise.resolve(null) : loadLessonById(lessonId),
      loadModules(),
    ]);

    if (!isNewLessonRoute && !lessonRecord) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-lesson/[lessonId]</p>
          <p className="meta">Lesson not found in Supabase.</p>
        </section>
      );
    }

    if (modules.length === 0) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-lesson/[lessonId]</p>
          <p className="meta">No modules exist yet. Create a module first.</p>
        </section>
      );
    }

    const defaultModuleId = lessonRecord?.module_id ?? modules[0].id;

    const getFieldDefaultValue = (categoryKey: string, fieldKey: string): string | undefined => {
      if (isNewLessonRoute) {
        if (fieldKey === "lessonId") {
          return "Auto-assigned";
        }
        return undefined;
      }

      if (!lessonRecord) {
        return undefined;
      }

      if (fieldKey === "lessonId") {
        return String(lessonRecord.id);
      }

      const categoryValues = lessonRecord.values[categoryKey];
      if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
        return categoryValues[fieldKey] ?? undefined;
      }

      if (fieldKey === "title") {
        return lessonRecord.title ?? undefined;
      }

      if (fieldKey === "text") {
        return lessonRecord.text ?? undefined;
      }

      if (fieldKey === "subtitle") {
        return lessonRecord.subtitle ?? undefined;
      }

      return undefined;
    };

    const categoriesMarkup = (
      <div className="configCategoryList">
        {categories.map((category) => (
          <section key={category.key} className="configCategory">
            <h3 className="configCategoryTitle">{category.label}</h3>
            {category.fields.length === 0 ? (
              <p className="meta">No fields in this category.</p>
            ) : (
              <div className="configForm">
                {category.fields.map((field) => (
                  <div key={`${category.key}-${field.key}`} className="configField">
                    <label htmlFor={`edit-lesson-${category.key}-${field.key}`}>{field.label}</label>
                    <input
                      id={`edit-lesson-${category.key}-${field.key}`}
                      name={`${category.key}.${field.key}`}
                      type={field.inputType}
                      defaultValue={getFieldDefaultValue(category.key, field.key)}
                      readOnly={field.key === "lessonId"}
                      disabled={field.key === "lessonId"}
                      required={field.isRequired && field.key !== "lessonId"}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    );

    const moduleSelector = (
      <section className="configCategory">
        <h3 className="configCategoryTitle">Hierarchy</h3>
        <div className="configForm">
          <div className="configField">
            <label htmlFor="lesson-module-id">Module</label>
            <select id="lesson-module-id" name="moduleId" defaultValue={String(defaultModuleId)} required>
              {modules.map((module) => (
                <option key={module.id} value={String(module.id)}>
                  {module.title ?? `Module ${module.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    );

    if (isNewLessonRoute) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-lesson/[lessonId]</p>
          <p className="meta">
            Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
            (lessons)
          </p>
          {categories.length === 0 ? (
            <p className="meta">No lesson categories defined.</p>
          ) : (
            <form action={createLessonAction}>
              {moduleSelector}
              {categoriesMarkup}
              <button type="submit">Add Lesson</button>
            </form>
          )}
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="panelHeader">
          <h2>{pageTitle}</h2>
          <div className="panelActions">
            <form action={`/api/lessons/${lessonId}/export-json`} method="get">
              <button type="submit">Export JSON File</button>
            </form>
            <form action={`/api/lessons/${lessonId}/export-json-lesson`} method="get">
              <button type="submit">Export JSON Lesson</button>
            </form>
            {categories.length > 0 ? (
              <button type="submit" form="edit-lesson-form">
                Save Changes
              </button>
            ) : null}
          </div>
        </div>
        <p className="meta">Route: /edit-lesson/[lessonId]</p>
        <p className="meta">
          Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
          (lessons)
        </p>
        {categories.length === 0 ? (
          <p className="meta">No lesson categories defined.</p>
        ) : (
          <form id="edit-lesson-form" action={updateLessonAction.bind(null, lessonId)}>
            {moduleSelector}
            {categoriesMarkup}
          </form>
        )}
      </section>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section className="panel">
        <h2>{pageTitle}</h2>
        <p className="meta">Could not load lesson config SOT from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
