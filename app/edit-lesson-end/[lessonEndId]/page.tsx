import CustomFieldInput from "@/components/CustomFieldInput";
import { isCustomComplexInputType, loadLessonEndConfigCategories } from "@/lib/universalConfigs";
import { createLessonEndFromFormData, loadLessonEndById, updateLessonEndFromFormData } from "@/lib/lessonEnds";
import { loadLessons } from "@/lib/lessons";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createLessonEndAction(formData: FormData) {
  "use server";

  const lessonEndId = await createLessonEndFromFormData(formData);
  redirect(`/edit-lesson-end/${lessonEndId}`);
}

async function updateLessonEndAction(lessonEndId: string, formData: FormData) {
  "use server";

  await updateLessonEndFromFormData(lessonEndId, formData);
  redirect(`/edit-lesson-end/${lessonEndId}`);
}

export default async function EditLessonEndPage({ params }: { params: Promise<{ lessonEndId: string }> }) {
  const { lessonEndId } = await params;
  const isNewLessonEndRoute = lessonEndId === "new";
  const pageTitle = isNewLessonEndRoute ? "New lesson_ends" : "Edit lesson_ends";

  try {
    const [categories, lessonEndRecord, lessons] = await Promise.all([
      loadLessonEndConfigCategories(),
      isNewLessonEndRoute ? Promise.resolve(null) : loadLessonEndById(lessonEndId),
      loadLessons(),
    ]);

    if (!isNewLessonEndRoute && !lessonEndRecord) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-lesson-end/[lessonEndId]</p>
          <p className="meta">lesson_ends not found in Supabase.</p>
        </section>
      );
    }

    if (lessons.length === 0) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-lesson-end/[lessonEndId]</p>
          <p className="meta">No lessons exist yet. Create a lesson first.</p>
        </section>
      );
    }

    const defaultLessonId = lessonEndRecord?.lesson_id ?? lessons[0].id;

    const getFieldDefaultValue = (categoryKey: string, fieldKey: string): string | undefined => {
      if (isNewLessonEndRoute) {
        if (fieldKey === "slideId") {
          return "Auto-assigned";
        }
        return undefined;
      }

      if (!lessonEndRecord) {
        return undefined;
      }

      if (fieldKey === "slideId") {
        return String(lessonEndRecord.id);
      }

      const categoryValues = lessonEndRecord.values[categoryKey];
      if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
        return categoryValues[fieldKey] ?? undefined;
      }

      return undefined;
    };

    const categoriesMarkup = (
      <div className="configCategoryList">
        {categories.map((category) => (
          <section key={category.key} className="configCategory">
            <h3 className="configCategoryTitle">{category.label}</h3>
            {category.fields.filter((field) => field.key !== "orderIndex").length === 0 ? (
              <p className="meta">No fields in this category.</p>
            ) : (
              <div className="configForm">
                {category.fields
                  .filter((field) => field.key !== "orderIndex")
                  .map((field) => (
                  <div key={`${category.key}-${field.key}`} className="configField">
                    <label htmlFor={`edit-lesson-end-${category.key}-${field.key}`}>{field.label}</label>
                    {(() => {
                      const fieldDefaultValue = getFieldDefaultValue(category.key, field.key);
                      const isLockedField = field.isReadOnly || field.key === "slideId";
                      const hasCurrentValue =
                        fieldDefaultValue !== undefined && fieldDefaultValue !== null && fieldDefaultValue !== "";
                      const currentInOptions =
                        hasCurrentValue && field.options.includes(String(fieldDefaultValue));

                      if (isCustomComplexInputType(field.inputType)) {
                        return (
                          <CustomFieldInput
                            id={`edit-lesson-end-${category.key}-${field.key}`}
                            name={`${category.key}.${field.key}`}
                            inputType={field.inputType}
                            defaultValue={fieldDefaultValue}
                            readOnly={isLockedField}
                          />
                        );
                      }

                      if (field.inputType === "textarea" || field.inputType === "json" || field.inputType === "list") {
                        return (
                          <textarea
                            id={`edit-lesson-end-${category.key}-${field.key}`}
                            name={`${category.key}.${field.key}`}
                            defaultValue={fieldDefaultValue}
                            readOnly={isLockedField}
                            disabled={isLockedField}
                            required={field.isRequired && !isLockedField}
                          />
                        );
                      }

                      if (field.inputType === "checkbox") {
                        const checkboxChecked = String(fieldDefaultValue ?? "").toLowerCase() === "true";
                        if (isLockedField) {
                          return (
                            <input
                              id={`edit-lesson-end-${category.key}-${field.key}`}
                              type="checkbox"
                              defaultChecked={checkboxChecked}
                              disabled
                              aria-readonly="true"
                            />
                          );
                        }
                        return (
                          <>
                            <input type="hidden" name={`${category.key}.${field.key}`} value="false" />
                            <input
                              id={`edit-lesson-end-${category.key}-${field.key}`}
                              name={`${category.key}.${field.key}`}
                              type="checkbox"
                              value="true"
                              defaultChecked={checkboxChecked}
                            />
                          </>
                        );
                      }

                      if (field.inputType === "select") {
                        return (
                          <select
                            id={`edit-lesson-end-${category.key}-${field.key}`}
                            name={`${category.key}.${field.key}`}
                            defaultValue={fieldDefaultValue ?? ""}
                            disabled={isLockedField}
                            required={field.isRequired && !isLockedField}
                          >
                            {!field.isRequired && <option value="">—</option>}
                            {field.options.length === 0 && (
                              <option value="">
                                {field.selectSource
                                  ? `Dynamic (${field.selectSource})`
                                  : "No options configured"}
                              </option>
                            )}
                            {hasCurrentValue && !currentInOptions && (
                              <option value={String(fieldDefaultValue)}>{String(fieldDefaultValue)}</option>
                            )}
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        );
                      }

                      return (
                        <input
                          id={`edit-lesson-end-${category.key}-${field.key}`}
                          name={`${category.key}.${field.key}`}
                          type={field.inputType}
                          defaultValue={fieldDefaultValue}
                          readOnly={isLockedField}
                          disabled={isLockedField}
                          required={field.isRequired && !isLockedField}
                        />
                      );
                    })()}
                  </div>
                  ))}
              </div>
            )}
          </section>
        ))}
      </div>
    );

    const lessonSelector = (
      <section className="configCategory">
        <h3 className="configCategoryTitle">Hierarchy</h3>
        <div className="configForm">
          <div className="configField">
            <label htmlFor="lesson-end-lesson-id">Lesson</label>
            <select id="lesson-end-lesson-id" name="lessonId" defaultValue={String(defaultLessonId)} required>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={String(lesson.id)}>
                  {lesson.title ?? `Lesson ${lesson.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    );

    if (isNewLessonEndRoute) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-lesson-end/[lessonEndId]</p>
          <p className="meta">
            Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
            (lesson_ends)
          </p>
          {categories.length === 0 ? (
            <p className="meta">No lesson_ends categories defined.</p>
          ) : (
            <form action={createLessonEndAction}>
              {lessonSelector}
              <p className="meta">Order index is system-assigned to the final lesson_ends slide position.</p>
              {categoriesMarkup}
              <button type="submit">Add lesson_ends</button>
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
            {categories.length > 0 ? (
              <button type="submit" form="edit-lesson-end-form">
                Save Changes
              </button>
            ) : null}
          </div>
        </div>
        <p className="meta">Route: /edit-lesson-end/[lessonEndId]</p>
        <p className="meta">
          Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
          (lesson_ends)
        </p>
        {categories.length === 0 ? (
          <p className="meta">No lesson_ends categories defined.</p>
        ) : (
          <form id="edit-lesson-end-form" action={updateLessonEndAction.bind(null, lessonEndId)}>
            {lessonSelector}
            <p className="meta">Order index is system-assigned to the final lesson_ends slide position.</p>
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
        <p className="meta">Could not load lesson_ends config SOT from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
