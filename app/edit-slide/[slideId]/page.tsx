import { loadSlideConfigCategories } from "@/lib/universalConfigs";
import { createSlideFromFormData, loadSlideById, updateSlideFromFormData } from "@/lib/slides";
import { loadGroups } from "@/lib/groups";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createSlideAction(formData: FormData) {
  "use server";

  const slideId = await createSlideFromFormData(formData);
  redirect(`/edit-slide/${slideId}`);
}

async function updateSlideAction(slideId: string, formData: FormData) {
  "use server";

  await updateSlideFromFormData(slideId, formData);
  redirect(`/edit-slide/${slideId}`);
}

export default async function EditSlidePage({ params }: { params: Promise<{ slideId: string }> }) {
  const { slideId } = await params;
  const isNewSlideRoute = slideId === "new";
  const pageTitle = isNewSlideRoute ? "New Slide" : "Edit Slide";

  try {
    const [categories, slideRecord, groups] = await Promise.all([
      loadSlideConfigCategories(),
      isNewSlideRoute ? Promise.resolve(null) : loadSlideById(slideId),
      loadGroups(),
    ]);

    if (!isNewSlideRoute && !slideRecord) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-slide/[slideId]</p>
          <p className="meta">Slide not found in Supabase.</p>
        </section>
      );
    }

    if (groups.length === 0) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-slide/[slideId]</p>
          <p className="meta">No groups exist yet. Create a group first.</p>
        </section>
      );
    }

    const defaultGroupId = slideRecord?.group_id ?? groups[0].id;

    const getFieldDefaultValue = (categoryKey: string, fieldKey: string): string | undefined => {
      if (isNewSlideRoute) {
        if (fieldKey === "slideId") {
          return "Auto-assigned";
        }
        return undefined;
      }

      if (!slideRecord) {
        return undefined;
      }

      if (fieldKey === "slideId") {
        return String(slideRecord.id);
      }

      const categoryValues = slideRecord.values[categoryKey];
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
                    <label htmlFor={`edit-slide-${category.key}-${field.key}`}>{field.label}</label>
                    <input
                      id={`edit-slide-${category.key}-${field.key}`}
                      name={`${category.key}.${field.key}`}
                      type={field.inputType}
                      defaultValue={getFieldDefaultValue(category.key, field.key)}
                      readOnly={field.key === "slideId"}
                      disabled={field.key === "slideId"}
                      required={field.isRequired && field.key !== "slideId"}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    );

    const groupSelector = (
      <section className="configCategory">
        <h3 className="configCategoryTitle">Hierarchy</h3>
        <div className="configForm">
          <div className="configField">
            <label htmlFor="slide-group-id">Group</label>
            <select id="slide-group-id" name="groupId" defaultValue={String(defaultGroupId)} required>
              {groups.map((group) => (
                <option key={group.id} value={String(group.id)}>
                  {group.title ?? `Group ${group.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    );

    if (isNewSlideRoute) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-slide/[slideId]</p>
          <p className="meta">
            Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
            (slides)
          </p>
          {categories.length === 0 ? (
            <p className="meta">No slide categories defined.</p>
          ) : (
            <form action={createSlideAction}>
              {groupSelector}
              {categoriesMarkup}
              <button type="submit">Add Slide</button>
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
            <form action={`/api/slides/${slideId}/export-json`} method="get">
              <button type="submit">Export JSON File</button>
            </form>
            {categories.length > 0 ? (
              <button type="submit" form="edit-slide-form">
                Save Changes
              </button>
            ) : null}
          </div>
        </div>
        <p className="meta">Route: /edit-slide/[slideId]</p>
        <p className="meta">
          Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
          (slides)
        </p>
        {categories.length === 0 ? (
          <p className="meta">No slide categories defined.</p>
        ) : (
          <form id="edit-slide-form" action={updateSlideAction.bind(null, slideId)}>
            {groupSelector}
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
        <p className="meta">Could not load slide config SOT from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
