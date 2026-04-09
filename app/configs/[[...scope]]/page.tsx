import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadActivitySlideConfigCategories,
  isCustomComplexInputType,
  loadGroupConfigCategories,
  loadLessonEndConfigCategories,
  loadLessonConfigCategories,
  loadModuleConfigCategories,
  loadSlideConfigCategories,
  loadTitleSlideConfigCategories,
  loadUniversalConfigCategories,
  type UniversalConfigCategory,
} from "@/lib/universalConfigs";
import {
  filterActivitySlideCategoriesForProfile,
  resolveActivityProfile,
  type ActivityProfile,
} from "@/lib/activityProfiles";

type ConfigTabKey =
  | "universal"
  | "modules"
  | "lessons"
  | "groups"
  | "slides"
  | "activity-slides"
  | "title-slides"
  | "lesson-ends";

type ConfigTab = {
  key: ConfigTabKey;
  label: string;
  href: string;
  sourceOfTruth: string;
  emptyMessage: string;
  loadCategories: () => Promise<UniversalConfigCategory[]>;
};

const ACTIVITY_PROFILE_TABS: readonly ActivityProfile[] = [
  "default",
  "act-001",
  "act-002",
  "act-003",
  "act-004",
  "act-005",
  "act-009",
  "act-010",
  "act-011",
  "act-012",
  "act-013",
  "act-014",
  "act-015",
  "act-016",
  "act-017",
  "act-018",
  "act-019",
  "act-020",
  "act-021",
  "act-022",
  "act-023",
  "act-024",
  "act-025",
  "act-026",
] as const;

const CONFIG_TABS: ConfigTab[] = [
  {
    key: "universal",
    label: "Universal",
    href: "/configs",
    sourceOfTruth: "Supabase public.field_dictionary -> public.universal_fields",
    emptyMessage: "No universal categories defined.",
    loadCategories: loadUniversalConfigCategories,
  },
  {
    key: "modules",
    label: "Modules",
    href: "/configs/modules",
    sourceOfTruth: "Supabase public.field_dictionary_component_rules -> public.component_config_fields (modules)",
    emptyMessage: "No module categories defined.",
    loadCategories: loadModuleConfigCategories,
  },
  {
    key: "lessons",
    label: "Lessons",
    href: "/configs/lessons",
    sourceOfTruth: "Supabase public.field_dictionary_component_rules -> public.component_config_fields (lessons)",
    emptyMessage: "No lesson categories defined.",
    loadCategories: loadLessonConfigCategories,
  },
  {
    key: "groups",
    label: "Groups",
    href: "/configs/groups",
    sourceOfTruth: "Supabase public.field_dictionary_component_rules -> public.component_config_fields (groups)",
    emptyMessage: "No group categories defined.",
    loadCategories: loadGroupConfigCategories,
  },
  {
    key: "slides",
    label: "Slides",
    href: "/configs/slides",
    sourceOfTruth: "Supabase public.field_dictionary_component_rules -> public.component_config_fields (slides)",
    emptyMessage: "No slide categories defined.",
    loadCategories: loadSlideConfigCategories,
  },
  {
    key: "activity-slides",
    label: "Activity Slides",
    href: "/configs/activity-slides",
    sourceOfTruth:
      "Supabase public.field_dictionary_component_rules -> public.component_config_fields (activity_slides)",
    emptyMessage: "No activity slide categories defined.",
    loadCategories: loadActivitySlideConfigCategories,
  },
  {
    key: "title-slides",
    label: "Title Slides",
    href: "/configs/title-slides",
    sourceOfTruth:
      "Supabase public.field_dictionary_component_rules -> public.component_config_fields (title_slides)",
    emptyMessage: "No title slide categories defined.",
    loadCategories: loadTitleSlideConfigCategories,
  },
  {
    key: "lesson-ends",
    label: "lesson_ends",
    href: "/configs/lesson-ends",
    sourceOfTruth:
      "Supabase public.field_dictionary_component_rules -> public.component_config_fields (lesson_ends)",
    emptyMessage: "No lesson_ends categories defined.",
    loadCategories: loadLessonEndConfigCategories,
  },
];

function resolveSelectedTab(scope: string | undefined): ConfigTab {
  if (!scope) {
    return CONFIG_TABS[0];
  }

  const selected = CONFIG_TABS.find((tab) => tab.key === scope);
  if (!selected) {
    notFound();
  }

  return selected;
}

export const dynamic = "force-dynamic";

export default async function ConfigsPage({
  params,
  searchParams,
}: {
  params: Promise<{ scope?: string[] }>;
  searchParams?: Promise<{ profile?: string | string[] }> | { profile?: string | string[] };
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const scopeParts = resolvedParams.scope ?? [];

  if (scopeParts.length > 1) {
    notFound();
  }

  const selectedTab = resolveSelectedTab(scopeParts[0]);
  const slideProfile = (() => {
    const profileValue = resolvedSearchParams.profile;
    const profileFirst = Array.isArray(profileValue) ? profileValue[0] : profileValue;
    if (profileFirst === "text") {
      return "text";
    }
    return "text";
  })();
  const activityProfile: ActivityProfile = resolveActivityProfile(resolvedSearchParams.profile);

  try {
    const rawCategories = await selectedTab.loadCategories();
    const categories = (() => {
      return selectedTab.key === "activity-slides"
        ? filterActivitySlideCategoriesForProfile(rawCategories, activityProfile)
        : rawCategories;
    })();

    return (
      <section className="panel">
        <h2>Configs</h2>
        <p className="meta">Route: {selectedTab.href}</p>

        <div className="configTabs" role="tablist" aria-label="Config tabs">
          {CONFIG_TABS.map((tab) => (
            <Link
              key={tab.key}
              className="configTab"
              href={tab.href}
              role="tab"
              aria-selected={tab.key === selectedTab.key}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <section className="configSection" aria-label={`${selectedTab.label} Config`}>
          <p className="meta">Source of truth: {selectedTab.sourceOfTruth}</p>
          {selectedTab.key === "slides" ? (
            <div className="configTabs" role="tablist" aria-label="Slide profiles">
              <Link
                className="configTab"
                href="/configs/slides?profile=text"
                role="tab"
                aria-selected={slideProfile === "text"}
              >
                Text
              </Link>
            </div>
          ) : null}
          {selectedTab.key === "slides" ? <p className="meta">Profile: Text</p> : null}
          {selectedTab.key === "activity-slides" ? (
            <div className="configTabs" role="tablist" aria-label="Activity slide profiles">
              {ACTIVITY_PROFILE_TABS.map((profile) => (
                <Link
                  key={profile}
                  className="configTab"
                  href={`/configs/activity-slides?profile=${profile}`}
                  role="tab"
                  aria-selected={activityProfile === profile}
                >
                  {profile === "default" ? "Default" : profile.toUpperCase()}
                </Link>
              ))}
            </div>
          ) : null}
          {selectedTab.key === "activity-slides" ? (
            <p className="meta">
              Profile: {activityProfile === "default" ? "Default baseline" : activityProfile.toUpperCase()}
            </p>
          ) : null}
          {categories.length === 0 ? (
            <p className="meta">{selectedTab.emptyMessage}</p>
          ) : (
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
                          <label htmlFor={`${selectedTab.key}-config-${category.key}-${field.key}`}>
                            {field.label}
                          </label>
                          {field.inputType === "textarea" || field.inputType === "json" || field.inputType === "list" ? (
                            <textarea
                              id={`${selectedTab.key}-config-${category.key}-${field.key}`}
                              name={`${category.key}.${field.key}`}
                            />
                          ) : isCustomComplexInputType(field.inputType) ? (
                            <textarea
                              id={`${selectedTab.key}-config-${category.key}-${field.key}`}
                              name={`${category.key}.${field.key}`}
                              rows={3}
                              defaultValue={`Custom UI: ${field.inputType}`}
                            />
                          ) : field.inputType === "checkbox" ? (
                            <div className="configCheckboxRow">
                              <input
                                id={`${selectedTab.key}-config-${category.key}-${field.key}`}
                                className="configCheckboxInput"
                                name={`${category.key}.${field.key}`}
                                type="checkbox"
                                defaultChecked={false}
                              />
                              <span className="meta">Toggle on/off</span>
                            </div>
                          ) : field.inputType === "select" ? (
                            <select
                              id={`${selectedTab.key}-config-${category.key}-${field.key}`}
                              name={`${category.key}.${field.key}`}
                              defaultValue=""
                            >
                              <option value="">
                                {field.selectSource
                                  ? `Dynamic (${field.selectSource})`
                                  : field.options.length > 0
                                    ? "Select..."
                                    : "No options configured"}
                              </option>
                              {field.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`${selectedTab.key}-config-${category.key}-${field.key}`}
                              name={`${category.key}.${field.key}`}
                              type={field.inputType}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </section>
      </section>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section className="panel">
        <h2>Configs</h2>
        <p className="meta">Could not load {selectedTab.label.toLowerCase()} configs from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
