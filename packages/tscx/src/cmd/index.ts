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

/**
 * Extract patterns for a given option (--exclude or --include)
 * @param options Command line options array
 * @param optionName The option name to extract patterns for
 * @returns Object containing the patterns and the option index
 */
function extractOptionPatterns(options: string[], optionName: string) {
  const optionIndex = options.findIndex((opt) => opt === optionName);
  if (optionIndex < 0) {
    return { patterns: [], optionIndex: -1 };
  }

  const nextOptionIndex = options.findIndex(
    (opt, index) => index > optionIndex && opt.startsWith("-"),
  );

  const patterns: string[] = options.filter((_, i) =>
    nextOptionIndex < 0
      ? i > optionIndex
      : i > optionIndex && i < nextOptionIndex,
  );

  return { patterns, optionIndex };
}

export function tsc(options: string[]) {
  const excludeResult = extractOptionPatterns(options, "--exclude");
  const includeResult = extractOptionPatterns(options, "--include");

  const hasExcludePatterns = excludeResult.patterns.length > 0;
  const hasIncludePatterns = includeResult.patterns.length > 0;

  // If no custom exclude or include patterns, use original tsc
  if (!hasExcludePatterns && !hasIncludePatterns) {
    return spawn([TSC_PATH, ...options]);
  }

  // 1. Create temporary tsconfig with exclude/include patterns & modify options
  const modifiedOptions = [...options];
  const projectIndex = modifiedOptions.findIndex(
    (opt) => opt === "--project" || opt === "-p",
  );
  const originalTsconfigPath = getTsConfigPath(
    projectIndex > -1 ? modifiedOptions[projectIndex + 1] : undefined,
  );

  const tempTsconfigPath = createTempTsConfig(
    originalTsconfigPath,
    hasExcludePatterns ? excludeResult.patterns : undefined,
    hasIncludePatterns ? includeResult.patterns : undefined,
  );

  // Remove --exclude/--include and their patterns from modifiedOptions
  // Process in reverse order to avoid index shifting issues
  const optionsToRemove = [
    ...(hasExcludePatterns
      ? [
          {
            index: excludeResult.optionIndex,
            length: excludeResult.patterns.length + 1,
          },
        ]
      : []),
    ...(hasIncludePatterns
      ? [
          {
            index: includeResult.optionIndex,
            length: includeResult.patterns.length + 1,
          },
        ]
      : []),
  ].sort((a, b) => b.index - a.index); // Sort in descending order
  for (const { index, length } of optionsToRemove) {
    modifiedOptions.splice(index, length);
  }

  if (projectIndex > -1) {
    // Find the new project index after removals
    const newProjectIndex = modifiedOptions.findIndex(
      (opt) => opt === "--project" || opt === "-p",
    );
    // newProjectIndex must > -1
    modifiedOptions[newProjectIndex + 1] = tempTsconfigPath;
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
