// @ts-check
// TODO: Remove this file
import { Builder } from "fenge/eslint-config";

export default new Builder()
  .enablePackagejson()
  .enableJavascript()
  .enableTypescript({
    omit: [
      "@fenge/no-restricted-loops",
      "@typescript-eslint/no-floating-promises",
      "es-x/no-top-level-await",
      "unicorn/no-process-exit",
      "no-console",
    ],
  })
  .toConfig();
