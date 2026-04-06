import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadGroupConfigCategories,
  loadLessonConfigCategories,
  loadModuleConfigCategories,
  loadSlideConfigCategories,
  loadUniversalConfigCategories,
  type UniversalConfigCategory,
} from "@/lib/universalConfigs";

type ConfigTabKey = "universal" | "modules" | "lessons" | "groups" | "slides";
type ConfigTab = {
  key: ConfigTabKey;
  label: string;
  href: string;
  sourceOfTruth: string;
  emptyMessage: string;
  loadCategories: () => Promise<UniversalConfigCategory[]>;
};

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
}: {
  params: Promise<{ scope?: string[] }>;
}) {
  const resolvedParams = await params;
  const scopeParts = resolvedParams.scope ?? [];

  if (scopeParts.length > 1) {
    notFound();
  }

  const selectedTab = resolveSelectedTab(scopeParts[0]);

  try {
    const categories = await selectedTab.loadCategories();

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
                          <input
                            id={`${selectedTab.key}-config-${category.key}-${field.key}`}
                            name={`${category.key}.${field.key}`}
                            type={field.inputType}
                          />
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
