import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This app has no data-fetching library (TanStack Query, SWR, etc.), so
      // components fetch on mount with the standard `useEffect(() => { load() }, [load])`
      // pattern, where `load` sets a loading flag before awaiting. The new React
      // Compiler-aligned rule flags any setState reachable from an effect, which
      // includes this correct and common pattern — disable it rather than add a
      // fetching library for a small personal app.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
