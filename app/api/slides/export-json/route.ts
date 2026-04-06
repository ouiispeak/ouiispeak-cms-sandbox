import { loadSlideConfigCategories } from "@/lib/universalConfigs";

export const dynamic = "force-dynamic";

type SlideTemplate = Record<string, Record<string, string>>;

export async function GET(): Promise<Response> {
  const template: SlideTemplate = {};
  const categories = await loadSlideConfigCategories();

  for (const category of categories) {
    const categoryPayload: Record<string, string> = {};

    for (const field of category.fields) {
      if (field.key === "slideId") {
        continue;
      }
      categoryPayload[field.key] = "";
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
