// @ts-check
// TODO: Remove this file
import { Builder } from "fenge/eslint-config";

export default new Builder({
  blockedFiles: { "**/*.{cjs,mjs,cts,mts}": false },
})
  .enablePackageJson()
  .enableJavaScript()
  .enableTypeScript({
    omit: ["@fenge/no-restricted-loops", "no-console"],
  })
  .toConfig();
