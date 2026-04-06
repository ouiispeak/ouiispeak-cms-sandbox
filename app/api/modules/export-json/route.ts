import { loadModuleConfigCategories } from "@/lib/universalConfigs";

export const dynamic = "force-dynamic";

type ModuleTemplate = Record<string, Record<string, string>>;

export async function GET(): Promise<Response> {
  const template: ModuleTemplate = {};
  const categories = await loadModuleConfigCategories();

  for (const category of categories) {
    const categoryPayload: Record<string, string> = {};

    for (const field of category.fields) {
      if (field.key === "moduleId") {
        continue;
      }
      categoryPayload[field.key] = "";
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
