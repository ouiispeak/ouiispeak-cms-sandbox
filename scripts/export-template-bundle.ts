import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type RouteModule = {
  GET: (request?: Request) => Promise<Response>;
};

type TemplateSpec = {
  component: string;
  routePath: string;
  url: string;
  fallbackFilename: string;
};

type CliOptions = {
  envFile: string | null;
  generatedAt: string | null;
};

const OUTPUT_DIR = path.join("tests", "fixtures", "lv3-cms-export-template-bundle");
const TEMPLATES_DIR = path.join(OUTPUT_DIR, "templates");

const ACTIVITY_PROFILES = [
  "default",
  "act-001",
  "act-002",
  "act-003",
  "act-004",
  "act-005",
  "act-009",
  "act-010",
  "act-011",
  "act-012",
  "act-013",
  "act-014",
  "act-015",
  "act-016",
  "act-017",
  "act-018",
  "act-019",
  "act-020",
  "act-021",
  "act-022",
  "act-023",
  "act-024",
  "act-025",
  "act-026",
] as const;

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    envFile: null,
    generatedAt: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--env-file") {
      options.envFile = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--env-file=")) {
      options.envFile = arg.slice("--env-file=".length);
      continue;
    }

    if (arg === "--generated-at") {
      options.generatedAt = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--generated-at=")) {
      options.generatedAt = arg.slice("--generated-at=".length);
      continue;
    }

    throw new Error(`Unsupported argument "${arg}".`);
  }

  return options;
}

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Env file not found: ${filePath}`);
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function filenameFromDisposition(disposition: string | null, fallback: string): string {
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}

async function loadRoute(routePath: string): Promise<RouteModule> {
  const mod = (await import(routePath)) as RouteModule | { default: RouteModule };
  return "GET" in mod ? mod : mod.default;
}

function routePathFromUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

async function main(): Promise<void> {
  const cliOptions = parseCliOptions(process.argv.slice(2));
  if (cliOptions.envFile) {
    loadEnvFile(cliOptions.envFile);
  }

  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const sourceCommitDate = execFileSync("git", ["log", "-1", "--format=%cI"], {
    encoding: "utf8",
  }).trim();

  const templateSpecs: TemplateSpec[] = [
    {
      component: "modules",
      routePath: "../app/api/modules/export-json/route.ts",
      url: "http://localhost/api/modules/export-json",
      fallbackFilename: "module-template.json",
    },
    {
      component: "lessons",
      routePath: "../app/api/lessons/export-json/route.ts",
      url: "http://localhost/api/lessons/export-json",
      fallbackFilename: "lesson-template.json",
    },
    {
      component: "groups",
      routePath: "../app/api/groups/export-json/route.ts",
      url: "http://localhost/api/groups/export-json",
      fallbackFilename: "group-template.json",
    },
    {
      component: "slides",
      routePath: "../app/api/slides/export-json/route.ts",
      url: "http://localhost/api/slides/export-json",
      fallbackFilename: "slide-template.json",
    },
    {
      component: "title_slides",
      routePath: "../app/api/title-slides/export-json/route.ts",
      url: "http://localhost/api/title-slides/export-json",
      fallbackFilename: "title-slide-template.json",
    },
    {
      component: "lesson_ends",
      routePath: "../app/api/lesson-ends/export-json/route.ts",
      url: "http://localhost/api/lesson-ends/export-json",
      fallbackFilename: "lesson_ends-template.json",
    },
  ];

  for (const profile of ACTIVITY_PROFILES) {
    templateSpecs.push({
      component: `activity_slides:${profile}`,
      routePath: "../app/api/activity-slides/export-json/route.ts",
      url: `http://localhost/api/activity-slides/export-json?profile=${profile}`,
      fallbackFilename: `activity-slide-template-${profile}.json`,
    });
  }

  const files: Array<{ component: string; route: string; file: string; sha256: string }> = [];
  for (const spec of templateSpecs) {
    const route = await loadRoute(spec.routePath);
    const response = await route.GET(new Request(spec.url));
    if (!response.ok) {
      throw new Error(
        `${spec.component} template export failed with status ${response.status}: ${await response.text()}`
      );
    }

    const filename = filenameFromDisposition(
      response.headers.get("Content-Disposition"),
      spec.fallbackFilename
    );
    const parsed = (await response.json()) as unknown;
    const json = `${JSON.stringify(parsed, null, 2)}\n`;
    fs.writeFileSync(path.join(TEMPLATES_DIR, filename), json, "utf8");
    files.push({
      component: spec.component,
      route: routePathFromUrl(spec.url),
      file: `templates/${filename}`,
      sha256: sha256(json),
    });
  }

  const manifest = {
    artifact: "lv3-cms-export-template-bundle",
    contract:
      "CMS export templates are the source of truth; import rejects target component identity/direct parent keys inside category buckets.",
    sourceCommit,
    sourceCommitDate,
    configSource: "public.config_component_fields via CMS export-json route handlers",
    generatedAt: cliOptions.generatedAt ?? sourceCommitDate,
    files,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Generated ${files.length} templates in ${OUTPUT_DIR}`);
}

void main();
