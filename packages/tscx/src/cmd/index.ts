import childProcess from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOVE_PATH = path.resolve(__dirname, "remove.cli.mjs");
const COPYFILES_PATH = path.resolve(__dirname, "copyfiles.cli.mjs");
const TSC_PATH = path.resolve(
  process.cwd(),
  "node_modules",
  "typescript",
  "bin",
  "tsc",
);

function spawn(cmd: "node" | "npm", ...args: string[]) {
  return childProcess.spawn(cmd, args, { stdio: "inherit" });
}

export function remove(filepath: string) {
  console.log("Remove", filepath);
  return spawn("node", REMOVE_PATH, filepath);
}

export function tsc(options: { project: string; noCheck: boolean }) {
  console.log("Tsc", options);
  const args = [
    TSC_PATH,
    "--project",
    options.project,
    ...(options.noCheck ? ["--noCheck"] : []),
  ];
  return spawn("node", ...args);
}

export function copyfiles(rootDir: string, outDir: string) {
  console.log("Copyfiles", rootDir, "=>", outDir);
  return spawn("node", COPYFILES_PATH, rootDir, outDir);
}

export function script(scr: string) {
  console.log("Script", `npm run ${scr}`);
  return spawn("npm", "run", scr); // TODO: Use node --run instead of npm run. See https://nodejs.org/api/cli.html#--run
}

export function exec(filepath: string) {
  console.log("Execute", filepath);
  return spawn("node", filepath);
}
