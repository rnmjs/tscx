import os from "node:os";
import chokidar from "chokidar";
import { TaskQueue } from "./task-queue.ts";
import {
  getInclude,
  getOutDir,
  getRootDir,
  getTsConfig,
  getTsConfigPath,
} from "./tsconfig-utils.ts";

export interface MainOptions extends Record<string, string | boolean> {
  remove?: boolean;
  copyfiles?: boolean;
  exec?: string;
}

// Note: In this class, `watch` and `compile` shouldn't be called more than once.
export class Main {
  private watcher: chokidar.FSWatcher | undefined = undefined;
  private currentQueue: TaskQueue | undefined = undefined;

  private readonly tscOptions: Record<string, string | boolean>;
  private readonly remove?: boolean;
  private readonly copyfiles?: boolean;
  private readonly exec?: string;

  private readonly tsconfigPath: string;
  private readonly rootDir: string;
  private readonly outDir: string;
  private readonly include: string[];

  constructor(options: MainOptions) {
    const { remove, copyfiles, exec, ...tscOptions } = options; // strip options which are not passed to tsc
    this.tscOptions = tscOptions;
    if (remove) this.remove = remove;
    if (copyfiles) this.copyfiles = copyfiles;
    if (exec) this.exec = exec;

    const project = this.tscOptions["project"];
    if (typeof project === "boolean") {
      throw new Error("The `project` is required to be a string.");
    }
    this.tsconfigPath = getTsConfigPath(project);
    const tsconfig = getTsConfig(this.tsconfigPath);
    this.rootDir = getRootDir(tsconfig);
    this.outDir = getOutDir(tsconfig);
    this.include = getInclude(tsconfig);
  }

  watch() {
    // TODO: Rethinking the watch files. Each of them below is reasonable. Scope: `process.cwd()` >= `rootDir` >= `include`.
    // 1. Watch the `include`.
    // 2. Watch the `process.cwd()`.
    // 3. Watch the `rootDir`. Definitely, `rootDir` is not a good idea as it may change to another directory when ts file is added or deleted.
    this.watcher = chokidar
      .watch(this.include, {
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          this.outDir,
          this.tsconfigPath,
        ],
        ignoreInitial: true,
      })
      .on("ready", () => this.restartQueue())
      .on("add", () => this.restartQueue())
      .on("unlink", () => this.restartQueue())
      .on("change", () => this.restartQueue());
  }

  private restartQueue() {
    if (!this.currentQueue?.isRunning()) {
      this.currentQueue = this.newQueue().start();
    } else {
      this.currentQueue.on("close", () => {
        this.currentQueue = this.newQueue().start();
      });
      this.currentQueue.stop();
    }
  }

  async compile() {
    return await new Promise<number>((resolve) => {
      this.currentQueue = this.newQueue()
        .on("close", (code, signal) => {
          resolve(code ?? (signal ? 128 + os.constants.signals[signal] : 0));
        })
        .start();
    });
  }

  async stop() {
    // After the watcher is closed, restartQueue will never be called.
    await this.watcher?.close();
    return await new Promise<number>((resolve) => {
      if (!this.currentQueue?.isRunning()) {
        resolve(0);
      } else {
        this.currentQueue
          .on("close", (code, signal) => {
            resolve(code ?? (signal ? 128 + os.constants.signals[signal] : 0));
          })
          .stop();
      }
    });
  }

  private newQueue() {
    return new TaskQueue({
      tscConfig: this.tscOptions,
      ...(this.remove ? { removeConfig: { filepath: this.outDir } } : {}),
      ...(this.copyfiles
        ? { copyfilesConfig: { rootDir: this.rootDir, outDir: this.outDir } }
        : {}),
      ...(this.exec ? { execConfig: { filepath: this.exec } } : {}),
    });
  }
}
