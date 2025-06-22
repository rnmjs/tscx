import os from "node:os";
import chokidar from "chokidar";
import { TaskQueue } from "./task-queue.ts";
import {
  getInclude,
  getOutDir,
  getRootDir,
  getTsConfig,
} from "./tsconfig-utils.ts";

export interface MainOptions extends Record<string, string | boolean> {
  remove?: boolean;
  copyfiles?: boolean;
  exec?: string;
}

export class Main {
  private currentQueue: TaskQueue | undefined = undefined;

  private readonly tscOptions: Record<string, string | boolean>;
  private readonly remove?: boolean;
  private readonly copyfiles?: boolean;
  private readonly exec?: string;

  private readonly rootDir: string;
  private readonly outDir: string;
  private readonly include: string[];

  constructor(options: MainOptions) {
    const { remove, copyfiles, exec, ...tscOptions } = options; // strip options which are not passed to tsc
    this.tscOptions = tscOptions;
    if (remove) this.remove = remove;
    if (copyfiles) this.copyfiles = copyfiles;
    if (exec) this.exec = exec;

    const tsconfig = getTsConfig(
      typeof this.tscOptions["project"] === "string"
        ? this.tscOptions["project"]
        : undefined,
    );
    this.rootDir = getRootDir(tsconfig);
    this.outDir = getOutDir(tsconfig);
    this.include = getInclude(tsconfig);
  }

  watch() {
    chokidar
      .watch(this.include, {
        ignored: ["**/node_modules/**", "**/.git/**", this.outDir],
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
      this.newQueue()
        .on("close", (code, signal) => {
          resolve(code ?? (signal ? 128 + os.constants.signals[signal] : 0));
        })
        .start();
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
