import { loadModuleById, type ModuleDetailRow } from "@/lib/modules";
import { loadModuleConfigCategories, type UniversalConfigCategory } from "@/lib/universalConfigs";

export const dynamic = "force-dynamic";

type ModuleTemplate = Record<string, Record<string, string>>;

function resolveModuleFieldValue(
  moduleRecord: ModuleDetailRow,
  categoryKey: string,
  fieldKey: string
): string | undefined {
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
}

function buildModuleTemplate(
  moduleRecord: ModuleDetailRow,
  categories: UniversalConfigCategory[]
): ModuleTemplate {
  const template: ModuleTemplate = {};

  for (const category of categories) {
    const categoryPayload: Record<string, string> = {};

    for (const field of category.fields) {
      if (field.key === "moduleId") {
        continue;
      }
      const value = resolveModuleFieldValue(moduleRecord, category.key, field.key);
      categoryPayload[field.key] = value ?? "";
    }

    template[category.key] = categoryPayload;
  }

  return template;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ moduleId: string }> }
): Promise<Response> {
  try {
    const { moduleId } = await context.params;
    const [categories, moduleRecord] = await Promise.all([
      loadModuleConfigCategories(),
      loadModuleById(moduleId),
    ]);

    if (!moduleRecord) {
      return new Response("Module not found.", { status: 404 });
    }

    const template = buildModuleTemplate(moduleRecord, categories);
    const payload = {
      moduleId: moduleRecord.id,
      ...template,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="module-${moduleRecord.id}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export module JSON.";
    return new Response(message, { status: 400 });
  }
}
