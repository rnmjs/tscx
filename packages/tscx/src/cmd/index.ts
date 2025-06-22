import childProcess from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tscPath } from "../common.ts";
import { debug } from "../debug.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOVE_PATH = path.resolve(__dirname, "remove.cli.mjs");
const COPYFILES_PATH = path.resolve(__dirname, "copyfiles.cli.mjs");
const TSC_PATH = tscPath;

function spawn(args: string[]) {
  // TODO: use util.styleText when dropping node 18 support
  debug(`👕 [${new Date().toLocaleString()}] node`, ...args);
  return childProcess.spawn("node", args, { stdio: "inherit" });
}

export function remove({ filepath }: { filepath: string }) {
  return spawn([REMOVE_PATH, filepath]);
}

export function tsc(options: Record<string, string | boolean>) {
  return spawn([
    TSC_PATH,
    ...Object.entries(options).flatMap(([key, value]) =>
      value === false
        ? []
        : value === true
          ? [`--${key}`]
          : [`--${key}`, value],
    ),
  ]);
}

export function copyfiles({
  rootDir,
  outDir,
}: {
  rootDir: string;
  outDir: string;
}) {
  return spawn([COPYFILES_PATH, rootDir, outDir]);
}

export function exec({ filepath }: { filepath: string }) {
  return spawn([filepath]);
}
