import type childProcess from "node:child_process";
import { copyfiles, exec, remove, tsc } from "./cmd/index.ts";

export interface TaskQueueOptions {
  removeConfig?: Parameters<typeof remove>[0];
  tscConfig: Parameters<typeof tsc>[0];
  copyfilesConfig?: Parameters<typeof copyfiles>[0];
  execConfig?: Parameters<typeof exec>[0];
}

export class TaskQueue {
  private currentSubprocess: childProcess.ChildProcess | undefined = undefined;
  private readonly tasks: Array<() => childProcess.ChildProcess> = [];
  // Note: Each event should not have more than one listeners! Main class requires this feature.
  private readonly listeners = new Map<string, (...args: any[]) => void>();
  constructor({
    removeConfig,
    tscConfig,
    copyfilesConfig,
    execConfig,
  }: TaskQueueOptions) {
    if (removeConfig) {
      this.tasks.push(() => remove(removeConfig));
    }
    this.tasks.push(() => tsc(tscConfig));
    if (copyfilesConfig) {
      this.tasks.push(() => copyfiles(copyfilesConfig));
    }
    if (execConfig) {
      this.tasks.push(() => exec(execConfig));
    }
  }

  start() {
    const execNextTask = (index = 0) => {
      const task = this.tasks[index];
      if (!task) {
        throw new Error(
          "Internal Error. No task to execute. This should not happen. If you see this error, please open an issue.",
        );
      }
      this.currentSubprocess = task();
      this.currentSubprocess.on("close", (code, signal) => {
        // manually exiting or unexpected exception will not execute next task
        if (code || signal) {
          this.currentSubprocess = undefined;
          this.listeners.get("close")?.(code, signal);
          return;
        }
        if (index >= this.tasks.length - 1) {
          this.currentSubprocess = undefined;
          this.listeners.get("close")?.(code, signal);
          return;
        }
        execNextTask(index + 1);
      });
    };
    execNextTask();
    return this;
  }

  on(
    event: "close",
    listener: (code: number | null, signal: NodeJS.Signals | null) => void,
  ) {
    this.listeners.set(event, listener);
    return this;
  }

  stop() {
    this.currentSubprocess?.kill();
    return this;
  }

  isRunning() {
    return !!this.currentSubprocess;
  }
}
