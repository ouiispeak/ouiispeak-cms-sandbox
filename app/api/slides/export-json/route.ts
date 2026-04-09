import { loadSlideConfigCategories } from "@/lib/universalConfigs";
import { exportEmptyValueForInputType, type ExportTemplateValue } from "@/lib/exportTemplateValues";
import { getTopLevelOnlyFieldKeys } from "@/lib/canonicalFieldMap";

export const dynamic = "force-dynamic";

type SlideTemplate = Record<string, Record<string, ExportTemplateValue>>;

export async function GET(): Promise<Response> {
  const template: SlideTemplate = {};
  const categories = await loadSlideConfigCategories();
  const topLevelOnlyFields = getTopLevelOnlyFieldKeys("slides");

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

  const payload = {
    groupId: "",
    ...template,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="slide-template.json"',
      "Cache-Control": "no-store",
    },
  });
}
