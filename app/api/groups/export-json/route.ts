import { loadGroupConfigCategories } from "@/lib/universalConfigs";

export const dynamic = "force-dynamic";

type GroupTemplate = Record<string, Record<string, string>>;

export async function GET(): Promise<Response> {
  const template: GroupTemplate = {};
  const categories = await loadGroupConfigCategories();

  for (const category of categories) {
    const categoryPayload: Record<string, string> = {};

    for (const field of category.fields) {
      if (field.key === "groupId") {
        continue;
      }
      categoryPayload[field.key] = "";
    }

    template[category.key] = categoryPayload;
  }

  const payload = {
    lessonId: "",
    ...template,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="group-template.json"',
      "Cache-Control": "no-store",
    },
  });
}
