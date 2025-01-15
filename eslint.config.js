// @ts-check
// TODO: Remove this file
import { Builder } from "fenge/eslint-config";

export default new Builder()
  .enablePackageJson()
  .enableJavaScript()
  .enableTypeScript({
    omit: ["@fenge/no-restricted-loops", "no-console"],
  })
  .append({
    rules: {
      "check-file/filename-blocklist": "off",
    },
  })
  .toConfig();
