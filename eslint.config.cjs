const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const nextPlugin = require("@next/eslint-plugin-next");

module.exports = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "*.config.js",
      "*.config.cjs",
      "*.config.ts",
      "dist/**",
      "**/*.d.ts",
      "eslint.config.cjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
