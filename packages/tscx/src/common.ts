import path from "node:path";
import process from "node:process";

export const tscPath = path.resolve(
  process.cwd(),
  "node_modules",
  "typescript",
  "bin",
  "tsc",
);
