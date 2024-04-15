import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOVE_PATH = path.resolve(__dirname, "remove.mjs");
const COPYFILES_PATH = path.resolve(__dirname, "copyfiles.mjs");
const TSC_PATH = path.resolve(
  process.cwd(),
  "node_modules",
  "typescript",
  "bin",
  "tsc",
);

function spawnNode(...args: string[]) {
  return spawn("node", args, { stdio: "inherit" });
}

export function remove(filepath: string) {
  console.log("Remove", filepath);
  return spawnNode(REMOVE_PATH, filepath);
}

export function tsc(options: { project: string }) {
  console.log("Tsc", options);
  return spawnNode(TSC_PATH, "--project", options.project);
}

export function copyfiles(rootDir: string, outDir: string) {
  console.log("Copyfiles", rootDir, "=>", outDir);
  return spawnNode(COPYFILES_PATH, rootDir, outDir);
}

export function exec(filepath: string) {
  console.log("Execute", filepath);
  return spawnNode(filepath);
}
