import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright 산출물.
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    /* Playwright fixture는 `async ({ page }, use) => { … await use(page) }` 모양이라
       `react-hooks/rules-of-hooks`가 `use`를 React Hook으로 오인한다.
       React 19의 `use()`와 이름만 같을 뿐 무관하다. e2e에는 React가 없다. */
    files: ["e2e/**/*.ts", "playwright.config.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
]);

export default eslintConfig;
