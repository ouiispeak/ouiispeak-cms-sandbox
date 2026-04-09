import { NextResponse } from "next/server";
import {
  importActivitySlideUpdatesFromJsonPayload,
  importActivitySlidesFromJsonPayload,
} from "@/lib/activitySlides";
import { buildActivityImportRejectionEnvelope, type ActivityIngestFailureStage } from "@/lib/activityIngestRejection";
import {
  buildImportErrorResponse,
  isTextReadableFile,
  toImportMode,
  type ImportMode,
} from "@/lib/importGate";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let mode: ImportMode = "create";
  let stage: ActivityIngestFailureStage = "form_data";
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
      await importActivitySlideUpdatesFromJsonPayload(payload);
    } else {
      await importActivitySlidesFromJsonPayload(payload);
    }

    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  } catch (error) {
    const rejection = buildActivityImportRejectionEnvelope({
      mode,
      stage,
      payload,
      error,
    });
    const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;

    if (!acceptsHtml) {
      return NextResponse.json(rejection, { status: 400 });
    }

    const messageWithCode = `[${rejection.code}] ${rejection.message}`;
    return buildImportErrorResponse(request, "activity_slides", mode, messageWithCode);
  }
}
