import js from "@eslint/js";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";

export default ts.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/dist-android/**",
      "**/dist-ios/**",
      "**/.expo/**",
      "backend/**",
      "**/*.d.ts",
    ],
  },
  {
    files: [
      "mobile/app/**/*.{ts,tsx}",
      "mobile/src/**/*.{ts,tsx}",
      "website/app/**/*.{ts,tsx}",
      "website/src/**/*.{ts,tsx}",
    ],
    extends: [js.configs.recommended, ...ts.configs.recommended],
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
