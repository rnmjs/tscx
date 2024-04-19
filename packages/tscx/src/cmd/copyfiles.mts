import process from "node:process";
import { copyfiles } from "./copyfiles.js";

const rootDir = process.argv[2];
const outDir = process.argv[3];
if (!rootDir || !outDir) {
  throw new Error("`rootDir` and `outDir` are required");
}

await copyfiles(rootDir, outDir);
