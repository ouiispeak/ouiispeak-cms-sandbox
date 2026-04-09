import { loadModuleConfigCategories } from "@/lib/universalConfigs";
import { exportEmptyValueForInputType, type ExportTemplateValue } from "@/lib/exportTemplateValues";
import { getTopLevelOnlyFieldKeys } from "@/lib/canonicalFieldMap";

export const dynamic = "force-dynamic";

type ModuleTemplate = Record<string, Record<string, ExportTemplateValue>>;

export async function GET(): Promise<Response> {
  const template: ModuleTemplate = {};
  const categories = await loadModuleConfigCategories();
  const topLevelOnlyFields = getTopLevelOnlyFieldKeys("modules");

  for (const category of categories) {
    const categoryPayload: Record<string, ExportTemplateValue> = {};

    for (const field of category.fields) {
      if (topLevelOnlyFields.has(field.key)) {
        continue;
      }
      categoryPayload[field.key] = exportEmptyValueForInputType(field.inputType);
    }

    template[category.key] = categoryPayload;
  }

  return new Response(JSON.stringify(template, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="module-template.json"',
      "Cache-Control": "no-store",
    },
  });
}
