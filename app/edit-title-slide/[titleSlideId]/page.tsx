import CustomFieldInput from "@/components/CustomFieldInput";
import { isCustomComplexInputType, loadTitleSlideConfigCategories } from "@/lib/universalConfigs";
import { createTitleSlideFromFormData, loadTitleSlideById, updateTitleSlideFromFormData } from "@/lib/titleSlides";
import { loadLessons } from "@/lib/lessons";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createTitleSlideAction(formData: FormData) {
  "use server";

  const titleSlideId = await createTitleSlideFromFormData(formData);
  redirect(`/edit-title-slide/${titleSlideId}`);
}

async function updateTitleSlideAction(titleSlideId: string, formData: FormData) {
  "use server";

  await updateTitleSlideFromFormData(titleSlideId, formData);
  redirect(`/edit-title-slide/${titleSlideId}`);
}

export default async function EditTitleSlidePage({ params }: { params: Promise<{ titleSlideId: string }> }) {
  const { titleSlideId } = await params;
  const isNewTitleSlideRoute = titleSlideId === "new";
  const pageTitle = isNewTitleSlideRoute ? "New Title Slide" : "Edit Title Slide";

  try {
    const [categories, titleSlideRecord, lessons] = await Promise.all([
      loadTitleSlideConfigCategories(),
      isNewTitleSlideRoute ? Promise.resolve(null) : loadTitleSlideById(titleSlideId),
      loadLessons(),
    ]);

    if (!isNewTitleSlideRoute && !titleSlideRecord) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-title-slide/[titleSlideId]</p>
          <p className="meta">Title slide not found in Supabase.</p>
        </section>
      );
    }

    if (lessons.length === 0) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-title-slide/[titleSlideId]</p>
          <p className="meta">No lessons exist yet. Create a lesson first.</p>
        </section>
      );
    }

    const defaultLessonId = titleSlideRecord?.lesson_id ?? lessons[0].id;

    const getFieldDefaultValue = (categoryKey: string, fieldKey: string): string | undefined => {
      if (isNewTitleSlideRoute) {
        if (fieldKey === "slideId") {
          return "Auto-assigned";
        }
        return undefined;
      }

      if (!titleSlideRecord) {
        return undefined;
      }

      if (fieldKey === "slideId") {
        return String(titleSlideRecord.id);
      }

      const categoryValues = titleSlideRecord.values[categoryKey];
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
            {category.fields.length === 0 ? (
              <p className="meta">No fields in this category.</p>
            ) : (
              <div className="configForm">
                {category.fields.map((field) => (
                  <div key={`${category.key}-${field.key}`} className="configField">
                    <label htmlFor={`edit-title-slide-${category.key}-${field.key}`}>{field.label}</label>
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
                            id={`edit-title-slide-${category.key}-${field.key}`}
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
                            id={`edit-title-slide-${category.key}-${field.key}`}
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
                              id={`edit-title-slide-${category.key}-${field.key}`}
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
                              id={`edit-title-slide-${category.key}-${field.key}`}
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
                            id={`edit-title-slide-${category.key}-${field.key}`}
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
                          id={`edit-title-slide-${category.key}-${field.key}`}
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
            <label htmlFor="title-slide-lesson-id">Lesson</label>
            <select id="title-slide-lesson-id" name="lessonId" defaultValue={String(defaultLessonId)} required>
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

    if (isNewTitleSlideRoute) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-title-slide/[titleSlideId]</p>
          <p className="meta">
            Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
            (title_slides)
          </p>
          {categories.length === 0 ? (
            <p className="meta">No title slide categories defined.</p>
          ) : (
            <form action={createTitleSlideAction}>
              {lessonSelector}
              {categoriesMarkup}
              <button type="submit">Add Title Slide</button>
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
            <form action={`/api/title-slides/${titleSlideId}/export-json`} method="get">
              <button type="submit">Export JSON File</button>
            </form>
            {categories.length > 0 ? (
              <button type="submit" form="edit-title-slide-form">
                Save Changes
              </button>
            ) : null}
          </div>
        </div>
        <p className="meta">Route: /edit-title-slide/[titleSlideId]</p>
        <p className="meta">
          Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
          (title_slides)
        </p>
        {categories.length === 0 ? (
          <p className="meta">No title slide categories defined.</p>
        ) : (
          <form id="edit-title-slide-form" action={updateTitleSlideAction.bind(null, titleSlideId)}>
            {lessonSelector}
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
        <p className="meta">Could not load title slide config SOT from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
