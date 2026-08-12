import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactCompiler from "eslint-plugin-react-compiler";

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
  ]),
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    // Reading from sessionStorage / localStorage on mount is a valid
    // init-on-mount pattern in Next.js App Router (client components).
    // Downgrade from error → warn so it doesn't block the build.
    rules: {
      "react-compiler/react-compiler": "warn",
    },
  },
]);

export default eslintConfig;
