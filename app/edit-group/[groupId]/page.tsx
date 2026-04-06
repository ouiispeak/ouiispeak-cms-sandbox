import { loadGroupConfigCategories } from "@/lib/universalConfigs";
import { createGroupFromFormData, loadGroupById, updateGroupFromFormData } from "@/lib/groups";
import { loadLessons } from "@/lib/lessons";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createGroupAction(formData: FormData) {
  "use server";

  const groupId = await createGroupFromFormData(formData);
  redirect(`/edit-group/${groupId}`);
}

async function updateGroupAction(groupId: string, formData: FormData) {
  "use server";

  await updateGroupFromFormData(groupId, formData);
  redirect(`/edit-group/${groupId}`);
}

export default async function EditGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const isNewGroupRoute = groupId === "new";
  const pageTitle = isNewGroupRoute ? "New Group" : "Edit Group";

  try {
    const [categories, groupRecord, lessons] = await Promise.all([
      loadGroupConfigCategories(),
      isNewGroupRoute ? Promise.resolve(null) : loadGroupById(groupId),
      loadLessons(),
    ]);

    if (!isNewGroupRoute && !groupRecord) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-group/[groupId]</p>
          <p className="meta">Group not found in Supabase.</p>
        </section>
      );
    }

    if (lessons.length === 0) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-group/[groupId]</p>
          <p className="meta">No lessons exist yet. Create a lesson first.</p>
        </section>
      );
    }

    const defaultLessonId = groupRecord?.lesson_id ?? lessons[0].id;

    const getFieldDefaultValue = (categoryKey: string, fieldKey: string): string | undefined => {
      if (isNewGroupRoute) {
        if (fieldKey === "groupId") {
          return "Auto-assigned";
        }
        return undefined;
      }

      if (!groupRecord) {
        return undefined;
      }

      if (fieldKey === "groupId") {
        return String(groupRecord.id);
      }

      const categoryValues = groupRecord.values[categoryKey];
      if (categoryValues && Object.prototype.hasOwnProperty.call(categoryValues, fieldKey)) {
        return categoryValues[fieldKey] ?? undefined;
      }

      if (fieldKey === "title") {
        return groupRecord.title ?? undefined;
      }

      if (fieldKey === "text") {
        return groupRecord.text ?? undefined;
      }

      if (fieldKey === "subtitle") {
        return groupRecord.subtitle ?? undefined;
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
                    <label htmlFor={`edit-group-${category.key}-${field.key}`}>{field.label}</label>
                    <input
                      id={`edit-group-${category.key}-${field.key}`}
                      name={`${category.key}.${field.key}`}
                      type={field.inputType}
                      defaultValue={getFieldDefaultValue(category.key, field.key)}
                      readOnly={field.key === "groupId"}
                      disabled={field.key === "groupId"}
                      required={field.isRequired && field.key !== "groupId"}
                    />
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
            <label htmlFor="group-lesson-id">Lesson</label>
            <select id="group-lesson-id" name="lessonId" defaultValue={String(defaultLessonId)} required>
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

    if (isNewGroupRoute) {
      return (
        <section className="panel">
          <h2>{pageTitle}</h2>
          <p className="meta">Route: /edit-group/[groupId]</p>
          <p className="meta">
            Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
            (groups)
          </p>
          {categories.length === 0 ? (
            <p className="meta">No group categories defined.</p>
          ) : (
            <form action={createGroupAction}>
              {lessonSelector}
              {categoriesMarkup}
              <button type="submit">Add Group</button>
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
            <form action={`/api/groups/${groupId}/export-json`} method="get">
              <button type="submit">Export JSON File</button>
            </form>
            {categories.length > 0 ? (
              <button type="submit" form="edit-group-form">
                Save Changes
              </button>
            ) : null}
          </div>
        </div>
        <p className="meta">Route: /edit-group/[groupId]</p>
        <p className="meta">
          Source of truth: Supabase public.field_dictionary_component_rules -&gt; public.component_config_fields
          (groups)
        </p>
        {categories.length === 0 ? (
          <p className="meta">No group categories defined.</p>
        ) : (
          <form id="edit-group-form" action={updateGroupAction.bind(null, groupId)}>
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
        <p className="meta">Could not load group config SOT from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
