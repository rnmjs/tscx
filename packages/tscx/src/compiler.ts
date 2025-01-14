// this file should not have `async` and `await`
import childProcess from "node:child_process";
import path from "node:path";
import process from "node:process";
import type ts from "typescript";
import { copyfiles, exec, remove, script, tsc } from "./cmd/index.ts";

export interface CompilerOptions extends Record<string, string | boolean> {
  project: string;
  remove: boolean;
  copyfiles: boolean;
  script?: string;
  exec?: string;
}

export interface TsConfig {
  compilerOptions?: ts.CompilerOptions;
  include?: string[];
  exclude?: string[];
  files?: string[];
}

export class Compiler {
  private id = "";
  private currentSubprocess?: childProcess.ChildProcess;
  private tsconfig: TsConfig;
  private rootDir: string;
  private outDir: string;

  constructor(private readonly options: CompilerOptions) {
    // setup tsconfig
    this.tsconfig = this.getTsConfig();
    this.rootDir = this.getRootDir();
    this.outDir = this.getOutDir();
  }

  compile() {
    const id = `${Date.now().toString()}_${Math.random().toString(36).slice(2)}`;
    this.id = id;

    if (!this.currentSubprocess) {
      this.execTasks(id);
      return;
    }
    if (typeof this.currentSubprocess.exitCode === "number") {
      this.execTasks(id);
      return;
    }
    if (!this.currentSubprocess.killed) {
      this.currentSubprocess.kill();
    }
    this.currentSubprocess.removeAllListeners("close");
    this.currentSubprocess.on("close", () => {
      this.execTasks(id);
    });
  }

  private getTasks(): Array<() => childProcess.ChildProcess> {
    const {
      project,
      remove: rm,
      copyfiles: cp,
      script: scr,
      exec: ex,
      ...others
    } = this.options;
    return [
      ...(rm ? [() => remove(this.outDir)] : []),
      () => tsc({ project, ...others }),
      ...(cp ? [() => copyfiles(this.rootDir, this.outDir)] : []),
      ...(scr ? [() => script(scr)] : []),
      ...(ex ? [() => exec(ex)] : []),
    ];
  }

  private execTasks(id: string) {
    if (this.id !== id) {
      return;
    }

    const tasks = this.getTasks();
    const execNextTask = (index = 0) => {
      const currentTask = tasks[index];
      if (!currentTask || this.id !== id) {
        return;
      }
      this.currentSubprocess = currentTask();
      this.currentSubprocess.on("close", (code, signal) => {
        // manually exiting or unexpected exception will not execute next task
        if (code || signal) {
          return;
        }
        execNextTask(index + 1);
      });
    };
    execNextTask();
  }

  refreshTsConfig() {
    this.tsconfig = this.getTsConfig();
    this.rootDir = this.getRootDir();
    this.outDir = this.getOutDir();
  }

  private getTsConfig(): TsConfig {
    const tscPath = path.resolve(
      process.cwd(),
      "node_modules",
      "typescript",
      "bin",
      "tsc",
    );
    const cmd = `node ${tscPath} --showConfig --project ${this.options.project}`;
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

  getInclude() {
    return this.tsconfig.include;
  }

  getOutDir() {
    const outDir = this.tsconfig.compilerOptions?.outDir;
    if (!outDir) {
      throw new Error('"outDir" is not found');
    }
    const absoluteOutDir = path.resolve(process.cwd(), outDir);
    if (process.cwd().startsWith(absoluteOutDir)) {
      throw new Error(
        '"outDir" in tsconfig.json should not be current or parent directory',
      );
    }
    return absoluteOutDir;
  }

  private getRootDir() {
    const rootDir = this.tsconfig.compilerOptions?.rootDir;
    return rootDir
      ? path.resolve(process.cwd(), rootDir)
      : path.resolve(
          process.cwd(),
          this.getRootDirByFiles(this.tsconfig.files ?? []),
        );
  }

  /**
   * Get the longest common dir. https://www.typescriptlang.org/tsconfig#rootDir
   * @param files file paths like ['./src/index.ts', './index.ts']
   * @returns absolute path
   */
  private getRootDirByFiles(files: string[]) {
    if (files.length === 0) {
      throw new Error(
        "Cannot get the longest common dir when the arguments is empty",
      );
    }

    const folder = files
      .map((file) => file.split(path.sep).slice(0, -1))
      .reduce<string[]>((prev, item) => {
        if (prev.length === 0) {
          return item;
        }
        const result: string[] = [];
        for (let i = 0; i < prev.length && i < item.length; i += 1) {
          const sub = prev[i];
          if (sub && sub === item[i]) {
            result[i] = sub;
          } else {
            break;
          }
        }
        return result;
      }, []);

    return path.join(...folder);
  }
}
