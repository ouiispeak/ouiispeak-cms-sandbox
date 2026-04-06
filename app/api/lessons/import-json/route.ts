import { NextResponse } from "next/server";
import { importLessonUpdatesFromJsonPayload, importLessonsFromJsonPayload } from "@/lib/lessons";
import {
  buildImportErrorResponse,
  isTextReadableFile,
  toImportMode,
  type ImportMode,
} from "@/lib/importGate";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let mode: ImportMode = "create";

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    mode = toImportMode(formData.get("mode"));

    if (!isTextReadableFile(file)) {
      throw new Error('Missing uploaded file field "file".');
    }

    let payload: unknown;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      throw new Error("Uploaded file is not valid JSON.");
    }

    if (mode === "update") {
      await importLessonUpdatesFromJsonPayload(payload);
    } else {
      await importLessonsFromJsonPayload(payload);
    }

    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return buildImportErrorResponse(request, "lessons", mode, message);
  }
}
