import childProcess from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { tscPath } from "../common.ts";
import { debug } from "../debug.ts";
import {
  cleanupTempTsConfig,
  createTempTsConfig,
  getTsConfigPath,
} from "../tsconfig-utils.ts";

const jsOrTs = import.meta.url.endsWith(".ts") ? "ts" : "js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOVE_PATH = path.resolve(__dirname, `remove.cli.m${jsOrTs}`);
const COPYFILES_PATH = path.resolve(__dirname, `copyfiles.cli.m${jsOrTs}`);
const TSC_PATH = tscPath;

function spawn(args: string[]) {
  // TODO: use util.styleText when dropping node 18 support
  debug(`👕 [${new Date().toLocaleString()}] node`, ...args);
  return childProcess.spawn(process.execPath, args, { stdio: "inherit" });
}

export function remove({ filepath }: { filepath: string }) {
  return spawn([REMOVE_PATH, filepath]);
}

export function tsc(options: string[]) {
  const excludeIndex = options.findIndex((opt) => opt === "--exclude");
  const nextOptionIndex = options.findIndex(
    (opt, index) => index > excludeIndex && opt.startsWith("-"),
  );
  const excludePatterns: string[] =
    excludeIndex < 0
      ? []
      : options.filter((_, i) =>
          nextOptionIndex < 0
            ? i > excludeIndex
            : i > excludeIndex && i < nextOptionIndex,
        );

  if (excludePatterns.length <= 0) {
    return spawn([TSC_PATH, ...options]);
  }

  // 1. Create temporary tsconfig with exclude patterns & modify options
  const modifiedOptions = [...options];
  const projectIndex = modifiedOptions.findIndex(
    (opt) => opt === "--project" || opt === "-p",
  );
  const originalTsconfigPath = getTsConfigPath(
    projectIndex > -1 ? modifiedOptions[projectIndex + 1] : undefined,
  );
  const tempTsconfigPath = createTempTsConfig(
    originalTsconfigPath,
    excludePatterns,
  );
  // Remove --exclude and excludePatterns from modifiedOptions
  modifiedOptions.splice(excludeIndex, excludePatterns.length + 1);
  if (projectIndex > -1) {
    modifiedOptions[projectIndex + 1] = tempTsconfigPath;
  } else {
    modifiedOptions.unshift("--project", tempTsconfigPath);
  }

  // 2. Spawn tsc with modified options
  const cp = spawn([TSC_PATH, ...modifiedOptions]);

  // 3. Clean up temporary config file when the process exits
  cp.on("close", () => {
    cleanupTempTsConfig(tempTsconfigPath);
  });
  cp.on("error", () => {
    cleanupTempTsConfig(tempTsconfigPath);
  });

  return cp;
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
