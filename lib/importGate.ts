import { NextResponse } from "next/server";

export type ImportMode = "create" | "update";
export type ImportComponent = "modules" | "lessons" | "groups" | "slides";

type TextReadableFile = {
  text: () => Promise<string>;
};

function toComponentLabel(component: ImportComponent): string {
  if (component === "modules") {
    return "Module";
  }

  if (component === "lessons") {
    return "Lesson";
  }

  if (component === "slides") {
    return "Slide";
  }

  return "Group";
}

export function isTextReadableFile(value: unknown): value is TextReadableFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof (value as { text?: unknown }).text === "function"
  );
}

export function toImportMode(value: FormDataEntryValue | null): ImportMode {
  return value === "update" ? "update" : "create";
}

export function toGateMessage(component: ImportComponent, mode: ImportMode, message: string): string {
  return `${toComponentLabel(component)} ${mode} failed on import because: ${message}`;
}

export function buildImportErrorResponse(
  request: Request,
  component: ImportComponent,
  mode: ImportMode,
  message: string
): Response {
  const gateMessage = toGateMessage(component, mode, message);
  const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;

  if (!acceptsHtml) {
    return new Response(gateMessage, { status: 400 });
  }

  const url = new URL("/import", request.url);
  url.searchParams.set("status", "error");
  url.searchParams.set("component", component);
  url.searchParams.set("mode", mode);
  url.searchParams.set("message", gateMessage.slice(0, 500));
  return NextResponse.redirect(url, { status: 303 });
}
