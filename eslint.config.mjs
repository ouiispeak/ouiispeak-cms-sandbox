import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreVitals,
  ...nextTypeScript,
  {
    files: ["app/**/*.tsx"],
    rules: {
      // Server components in this repo intentionally use route-level try/catch
      // to render deterministic fallback UI for data-loading failures.
      "react-hooks/error-boundaries": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
  ]),
]);
