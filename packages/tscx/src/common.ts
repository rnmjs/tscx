import module from "node:module";
import process from "node:process";

export const tscPath = module
  .createRequire(process.cwd())
  .resolve("typescript/bin/tsc");
