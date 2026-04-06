export type UniversalConfigField = {
  key: string;
  label: string;
  inputType: "text";
  descriptor: string;
  isRequired: boolean;
};

export type UniversalConfigCategory = {
  key: string;
  label: string;
  fields: UniversalConfigField[];
};

type ConfigRow = {
  category_name: string;
  field_name: string;
  input_type: string;
  field_order: number;
};

type ComponentRuleRow = {
  field_key: string;
};

function toLabel(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toInputType(inputType: string): "text" {
  if (inputType !== "text") {
    throw new Error(`Unsupported input_type "${inputType}".`);
  }
  return "text";
}

function rowsToCategories(rows: ConfigRow[], requiredFieldKeys: Set<string> = new Set()): UniversalConfigCategory[] {
  const byCategory = new Map<string, UniversalConfigCategory>();

  for (const row of rows) {
    const categoryKey = row.category_name;
    const fieldKey = row.field_name;

    let category = byCategory.get(categoryKey);
    if (!category) {
      category = {
        key: categoryKey,
        label: toLabel(categoryKey),
        fields: [],
      };
      byCategory.set(categoryKey, category);
    }

    category.fields.push({
      key: fieldKey,
      label: toLabel(fieldKey),
      inputType: toInputType(row.input_type),
      descriptor: `${row.input_type} field`,
      isRequired: requiredFieldKeys.has(fieldKey),
    });
  }

  return Array.from(byCategory.values());
}

async function fetchRows<T>(resourcePath: string): Promise<T[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${resourcePath}`, {
    cache: "no-store",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to load config rows (${response.status}): ${body}`);
  }

  return (await response.json()) as T[];
}

async function loadRequiredFieldKeys(componentName: string): Promise<Set<string>> {
  const encodedComponentName = encodeURIComponent(componentName);
  const rows = await fetchRows<ComponentRuleRow>(
    `field_dictionary_component_rules?select=field_key&component_name=eq.${encodedComponentName}&is_present=is.true&is_required=is.true`
  );
  return new Set(rows.map((row) => row.field_key));
}

export async function loadUniversalConfigCategories(): Promise<UniversalConfigCategory[]> {
  const rows = await fetchRows<ConfigRow>(
    "config_universal_fields?select=category_name,field_name,input_type,field_order&order=category_name.asc,field_order.asc,field_name.asc"
  );
  return rowsToCategories(rows);
}

export async function loadModuleConfigCategories(): Promise<UniversalConfigCategory[]> {
  return loadComponentConfigCategories("modules");
}

export async function loadLessonConfigCategories(): Promise<UniversalConfigCategory[]> {
  return loadComponentConfigCategories("lessons");
}

export async function loadGroupConfigCategories(): Promise<UniversalConfigCategory[]> {
  return loadComponentConfigCategories("groups");
}

export async function loadSlideConfigCategories(): Promise<UniversalConfigCategory[]> {
  return loadComponentConfigCategories("slides");
}

async function loadComponentConfigCategories(componentName: string): Promise<UniversalConfigCategory[]> {
  const encodedComponentName = encodeURIComponent(componentName);
  const [rows, requiredFieldKeys] = await Promise.all([
    fetchRows<ConfigRow>(
      `config_component_fields?select=category_name,field_name,input_type,field_order&component_name=eq.${encodedComponentName}&order=category_name.asc,field_order.asc,field_name.asc`
    ),
    loadRequiredFieldKeys(componentName),
  ]);
  return rowsToCategories(rows, requiredFieldKeys);
}

export async function loadUniversalConfigFields(): Promise<UniversalConfigField[]> {
  const categories = await loadUniversalConfigCategories();
  const fields: UniversalConfigField[] = [];

  for (const category of categories) {
    fields.push(...category.fields);
  }

  return fields;
}
