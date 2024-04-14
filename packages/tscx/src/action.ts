import path from "node:path";
import process from "node:process";
import chokidar, { type FSWatcher } from "chokidar";
import { Compiler, type CompilerOptions } from "./compiler.js";

interface TscxOptions extends CompilerOptions {
  watch: boolean;
}

export class Action {
  private readonly compiler;
  private watcher?: FSWatcher;
  constructor(private readonly options: TscxOptions) {
    this.compiler = new Compiler(options);
  }

  private setupWatcher() {
    const include = this.compiler.getInclude() ?? [];
    const watchFiles =
      include.length <= 0
        ? [process.cwd()]
        : include
            .map((i) => path.resolve(process.cwd(), i))
            .concat(path.resolve(process.cwd(), this.options.project));

    this.watcher = chokidar.watch(watchFiles, {
      ignored: ["**/node_modules/**", "**/.git/**", this.compiler.getOutDir()],
      ignoreInitial: true,
    });
    this.watcher
      .on("add", (filepath) => this.cb(filepath))
      .on("unlink", (filepath) => this.cb(filepath))
      .on("change", (filepath) => this.cb(filepath))
      .on("ready", () => this.cb());
  }

  private cb(filepath?: string) {
    console.log("Recompile for the file updated", filepath);
    if (
      !filepath ||
      path.resolve(process.cwd(), filepath) !==
        path.resolve(process.cwd(), this.options.project)
    ) {
      return this.compiler.exec();
    }

    try {
      this.compiler.refreshTsConfig();
    } catch (e) {
      console.warn(
        "Refresh ts config fail. You can ignore this small warning.",
        e,
      );
      return;
    }
    this.watcher
      ?.close()
      .then(() => {
        this.setupWatcher();
      })
      .catch((e) => {
        console.error("Close watcher fail!", e);
        process.exit(1);
      });
  }

  start() {
    if (!this.options.watch) {
      this.compiler.exec();
      return;
    }

    this.setupWatcher();
  }
}
