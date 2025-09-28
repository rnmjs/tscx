import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import type ts from "typescript";
import { tscPath } from "./common.ts";

export interface TsConfig {
  compilerOptions?: ts.CompilerOptions;
  include?: string[];
  exclude?: string[];
  files?: string[];
}

export function getTsConfig(project?: string): TsConfig {
  const cmd = `${process.execPath} ${tscPath} --showConfig${project ? ` --project ${project}` : ""}`;
  const config: TsConfig = JSON.parse(
    childProcess.execSync(cmd).toString("utf8"),
  );
  if (
    !config.compilerOptions ||
    Object.keys(config.compilerOptions).length <= 0
  ) {
    throw new Error("Tsconfig.compilerOptions is empty!");
  }
  return config;
}

export function getRootDir(tsconfig: TsConfig): string {
  return path.resolve(
    process.cwd(),
    tsconfig.compilerOptions?.rootDir ??
      getRootDirByFiles(tsconfig.files ?? []),
  );
}

export function getOutDir(tsconfig: TsConfig) {
  const outDir = tsconfig.compilerOptions?.outDir;
  if (!outDir) {
    return undefined;
  }
  const absoluteOutDir = path.resolve(process.cwd(), outDir);
  if (process.cwd().startsWith(absoluteOutDir)) {
    throw new Error(
      '"outDir" in tsconfig.json should not be current or parent directory',
    );
  }
  return absoluteOutDir;
}

export function getInclude(tsconfig: TsConfig) {
  return (
    tsconfig.include?.map((i) => path.resolve(process.cwd(), i)) ?? [
      process.cwd(),
    ]
  );
}

/**
 * Get the longest common dir. https://www.typescriptlang.org/tsconfig#rootDir
 * @param files file paths like ['./src/index.ts', './index.ts']
 * @returns absolute path
 */
function getRootDirByFiles(files: string[]) {
  if (files.length === 0) {
    throw new Error(
      "Cannot get the longest common dir when the arguments is empty",
    );
  }

  const folders = files
    .map((file) => file.split(path.sep).slice(0, -1))
    .reduce<string[]>((prev, item) => {
      if (prev.length === 0) {
        return item;
      }
      const result: string[] = [];
      for (let i = 0; i < prev.length && i < item.length; i += 1) {
        const prevI = prev[i];
        const itemI = item[i];
        if (prevI && itemI && prevI === itemI) {
          result[i] = prevI;
        } else {
          break;
        }
      }
      return result;
    }, []);

  return path.join(...folders);
}

export function getTsConfigPath(project?: string) {
  const dirOrFile1 = project
    ? path.resolve(process.cwd(), project)
    : process.cwd();
  const dirOrFile2 = path.join(dirOrFile1, "tsconfig.json");
  if (fs.statSync(dirOrFile1).isFile()) return dirOrFile1;
  if (fs.statSync(dirOrFile2).isFile()) return dirOrFile2;
  throw new Error(
    `Could not find a tsconfig.json file at ${dirOrFile1} or ${dirOrFile2}`,
  );
}

/**
 * Create a temporary tsconfig file with exclude patterns
 * @param originalTsconfigPath Path to the original tsconfig file
 * @param excludePatterns Array of exclude patterns to add
 * @returns Path to the temporary tsconfig file
 */
export function createTempTsConfig(
  originalTsconfigPath: string,
  excludePatterns: string[],
): string {
  const originalConfig: TsConfig = JSON.parse(
    fs.readFileSync(originalTsconfigPath, "utf8"),
  );
  const tempConfig: TsConfig = {
    ...originalConfig,
    exclude: excludePatterns,
  };

  const tempConfigPath = path.join(
    path.dirname(originalTsconfigPath),
    `tsconfig.tscx-temp-${Date.now()}.json`,
  );
  fs.writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2));

  return tempConfigPath;
}

/**
 * Clean up temporary tsconfig file
 * @param tempTsconfigPath Path to the temporary tsconfig file
 */
export function cleanupTempTsConfig(tempTsconfigPath: string): void {
  try {
    if (fs.existsSync(tempTsconfigPath)) {
      fs.unlinkSync(tempTsconfigPath);
    }
  } catch {
    console.warn(
      `Warning: Failed to cleanup temporary tsconfig file: ${tempTsconfigPath}`,
    );
  }
}
