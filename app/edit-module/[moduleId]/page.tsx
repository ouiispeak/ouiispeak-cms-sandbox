import CustomFieldInput from "@/components/CustomFieldInput";
import { isCustomComplexInputType, loadModuleConfigCategories } from "@/lib/universalConfigs";
import { createModuleFromFormData, loadModuleById, updateModuleFromFormData } from "@/lib/modules";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createModuleAction(formData: FormData) {
  "use server";

  const moduleId = await createModuleFromFormData(formData);
  redirect(`/edit-module/${moduleId}`);
}

async function updateModuleAction(moduleId: string, formData: FormData) {
  "use server";

  await updateModuleFromFormData(moduleId, formData);
  redirect(`/edit-module/${moduleId}`);
}

export default async function EditModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const isNewModuleRoute = moduleId === "new";
  const pageTitle = isNewModuleRoute ? "New Module" : "Edit Module";

  try {
    const [categories, moduleRecord] = await Promise.all([
      loadModuleConfigCategories(),
      isNewModuleRoute ? Promise.resolve(null) : loadModuleById(moduleId),
    ]);

    if (!isNewModuleRoute && !moduleRecord) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-module/[moduleId]</p>
          <p className="meta">Module not found in Supabase.</p>
        </section>
      );
    }

    const getFieldDefaultValue = (categoryKey: string, fieldKey: string): string | undefined => {
      if (isNewModuleRoute) {
        if (fieldKey === "moduleId") {
          return "Auto-assigned";
        }

        if (fieldKey === "level") {
          return "1";
        }
        return undefined;
      }

      if (!moduleRecord) {
        return undefined;
      }

      if (fieldKey === "moduleId") {
        return String(moduleRecord.id);
      }

      const categoryValues = moduleRecord.values[categoryKey];
      if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
        return categoryValues[fieldKey] ?? undefined;
      }

      if (fieldKey === "title") {
        return moduleRecord.title ?? undefined;
      }

      if (fieldKey === "text") {
        return moduleRecord.text ?? undefined;
      }

      if (fieldKey === "level") {
        if (moduleRecord.level_number === null) {
          return undefined;
        }
        return String(moduleRecord.level_number);
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
                    <label htmlFor={`edit-module-${category.key}-${field.key}`}>{field.label}</label>
                    {(() => {
                      const fieldDefaultValue = getFieldDefaultValue(category.key, field.key);
                      const isLockedField = field.isReadOnly || field.key === "moduleId";
                      const hasCurrentValue =
                        fieldDefaultValue !== undefined && fieldDefaultValue !== null && fieldDefaultValue !== "";
                      const currentInOptions =
                        hasCurrentValue && field.options.includes(String(fieldDefaultValue));

                      if (isCustomComplexInputType(field.inputType)) {
                        return (
                          <CustomFieldInput
                            id={`edit-module-${category.key}-${field.key}`}
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
                            id={`edit-module-${category.key}-${field.key}`}
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
                              id={`edit-module-${category.key}-${field.key}`}
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
                              id={`edit-module-${category.key}-${field.key}`}
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
                            id={`edit-module-${category.key}-${field.key}`}
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
                          id={`edit-module-${category.key}-${field.key}`}
                          name={`${category.key}.${field.key}`}
                          type={field.key === "level" ? "number" : field.inputType}
                          min={field.key === "level" ? 1 : undefined}
                          max={field.key === "level" ? 10 : undefined}
                          step={field.key === "level" ? 1 : undefined}
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

    if (isNewModuleRoute) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-module/[moduleId]</p>
          <p className="meta">
            Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
            (modules)
          </p>
          {categories.length === 0 ? (
            <p className="meta">No module categories defined.</p>
          ) : (
            <form action={createModuleAction}>
              {categoriesMarkup}
              <button type="submit">Add Module</button>
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
            <form action={`/api/modules/${moduleId}/export-json`} method="get">
              <button type="submit">Export JSON File</button>
            </form>
            {categories.length > 0 ? (
              <button type="submit" form="edit-module-form">
                Save Changes
              </button>
            ) : null}
          </div>
        </div>
        <p className="meta">Route: /edit-module/[moduleId]</p>
        <p className="meta">
          Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
          (modules)
        </p>
        {categories.length === 0 ? (
          <p className="meta">No module categories defined.</p>
        ) : (
          <form id="edit-module-form" action={updateModuleAction.bind(null, moduleId)}>
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
        <p className="meta">Could not load module config SOT from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
