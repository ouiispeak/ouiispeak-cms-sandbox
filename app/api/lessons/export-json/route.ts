import { loadLessonConfigCategories } from "@/lib/universalConfigs";

export const dynamic = "force-dynamic";

type LessonTemplate = Record<string, Record<string, string>>;

export async function GET(): Promise<Response> {
  const template: LessonTemplate = {};
  const categories = await loadLessonConfigCategories();

  for (const category of categories) {
    const categoryPayload: Record<string, string> = {};

    for (const field of category.fields) {
      if (field.key === "lessonId") {
        continue;
      }
      categoryPayload[field.key] = "";
    }

    template[category.key] = categoryPayload;
  }

  const payload = {
    moduleId: "",
    ...template,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lesson-template.json"',
      "Cache-Control": "no-store",
    },
  });
}
