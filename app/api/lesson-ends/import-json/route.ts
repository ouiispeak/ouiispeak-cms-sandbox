import { NextResponse } from "next/server";
import { importLessonEndUpdatesFromJsonPayload, importLessonEndsFromJsonPayload } from "@/lib/lessonEnds";
import {
  buildImportRejectionEnvelope,
  buildImportRejectionResponse,
  isTextReadableFile,
  toImportMode,
  type ImportFailureStage,
  type ImportMode,
} from "@/lib/importGate";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let mode: ImportMode = "create";
  let stage: ImportFailureStage = "form_data";
  let payload: unknown = undefined;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    mode = toImportMode(formData.get("mode"));

    if (!isTextReadableFile(file)) {
      throw new Error('Missing uploaded file field "file".');
    }

    stage = "json_parse";
    try {
      payload = JSON.parse(await file.text());
    } catch {
      throw new Error("Uploaded file is not valid JSON.");
    }

    stage = "import";
    if (mode === "update") {
      await importLessonEndUpdatesFromJsonPayload(payload);
    } else {
      await importLessonEndsFromJsonPayload(payload);
    }

    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  } catch (error) {
    return buildImportRejectionResponse(
      request,
      buildImportRejectionEnvelope({
        component: "lesson_ends",
        mode,
        stage,
        payload,
        error,
      })
    );
  }
}
