// @ts-check
// TODO: Remove this file
import { Builder } from "fenge/eslint-config";

export default new Builder()
  .enablePackagejson()
  .enableJavascript()
  .enableTypescript({
    omit: ["@fenge/no-restricted-loops", "no-console"],
  })
  .toConfig();
