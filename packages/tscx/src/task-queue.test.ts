import type childProcess from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as cmdModule from "./cmd/index.ts";
import { TaskQueue, type TaskQueueOptions } from "./task-queue.ts";

// Mock the cmd module
vi.mock("./cmd/index.ts", () => ({
  remove: vi.fn(),
  tsc: vi.fn(),
  copyfiles: vi.fn(),
  exec: vi.fn(),
}));

// Type for the close event callback
type CloseCallback = (
  code: number | null,
  signal: NodeJS.Signals | null,
) => void;

describe("TaskQueue", () => {
  let mockChildProcess: Partial<childProcess.ChildProcess> = {};
  let mockRemove: ReturnType<typeof vi.fn> = vi.fn();
  let mockTsc: ReturnType<typeof vi.fn> = vi.fn();
  let mockCopyfiles: ReturnType<typeof vi.fn> = vi.fn();
  let mockExec: ReturnType<typeof vi.fn> = vi.fn();

  beforeEach(() => {
    // Create a mock child process
    mockChildProcess = {
      on: vi.fn(),
      kill: vi.fn(),
    };

    // Get mocked functions
    mockRemove = vi.mocked(cmdModule.remove);
    mockTsc = vi.mocked(cmdModule.tsc);
    mockCopyfiles = vi.mocked(cmdModule.copyfiles);
    mockExec = vi.mocked(cmdModule.exec);

    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    mockRemove.mockReturnValue(
      mockChildProcess as unknown as childProcess.ChildProcess,
    );
    mockTsc.mockReturnValue(
      mockChildProcess as unknown as childProcess.ChildProcess,
    );
    mockCopyfiles.mockReturnValue(
      mockChildProcess as unknown as childProcess.ChildProcess,
    );
    mockExec.mockReturnValue(
      mockChildProcess as unknown as childProcess.ChildProcess,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create TaskQueue with only tsc task when only tscConfig is provided", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      expect(taskQueue).toBeInstanceOf(TaskQueue);
    });

    it("should create TaskQueue with all tasks when all configs are provided", () => {
      const options: TaskQueueOptions = {
        removeConfig: { filepath: "dist" },
        tscConfig: ["--project", "tsconfig.json"],
        copyfilesConfig: { rootDir: "src", outDir: "dist" },
        execConfig: { filepath: "dist/index.js" },
      };

      const taskQueue = new TaskQueue(options);
      expect(taskQueue).toBeInstanceOf(TaskQueue);
    });

    it("should create TaskQueue with partial configs", () => {
      const options: TaskQueueOptions = {
        removeConfig: { filepath: "dist" },
        tscConfig: ["--project", "tsconfig.json"],
        execConfig: { filepath: "dist/index.js" },
      };

      const taskQueue = new TaskQueue(options);
      expect(taskQueue).toBeInstanceOf(TaskQueue);
    });
  });

  describe("start", () => {
    it("should execute only tsc task when only tscConfig is provided", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      taskQueue.start();

      expect(mockTsc).toHaveBeenCalledWith(["--project", "tsconfig.json"]);
      expect(mockRemove).not.toHaveBeenCalled();
      expect(mockCopyfiles).not.toHaveBeenCalled();
      expect(mockExec).not.toHaveBeenCalled();
    });

    it("should execute all tasks in correct order when all configs are provided", () => {
      const options: TaskQueueOptions = {
        removeConfig: { filepath: "dist" },
        tscConfig: ["--project", "tsconfig.json"],
        copyfilesConfig: { rootDir: "src", outDir: "dist" },
        execConfig: { filepath: "dist/index.js" },
      };

      const taskQueue = new TaskQueue(options);
      taskQueue.start();

      // Only the first task (remove) should be called initially
      expect(mockRemove).toHaveBeenCalledWith({ filepath: "dist" });
      expect(mockTsc).not.toHaveBeenCalled();
      expect(mockCopyfiles).not.toHaveBeenCalled();
      expect(mockExec).not.toHaveBeenCalled();
    });

    it("should execute next task when current task completes successfully", () => {
      const options: TaskQueueOptions = {
        removeConfig: { filepath: "dist" },
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      taskQueue.start();

      // Simulate successful completion of remove task
      const mockOn = mockChildProcess.on as ReturnType<typeof vi.fn>;
      const onCloseCallback = mockOn.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;

      expect(onCloseCallback).toBeDefined();
      onCloseCallback(0, null); // code = 0 (success), signal = null

      expect(mockTsc).toHaveBeenCalledWith(["--project", "tsconfig.json"]);
    });

    it("should not execute next task when current task fails", () => {
      const options: TaskQueueOptions = {
        removeConfig: { filepath: "dist" },
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      const closeListener = vi.fn();
      taskQueue.on("close", closeListener);
      taskQueue.start();

      // Simulate failed completion of remove task
      const mockOn = mockChildProcess.on as ReturnType<typeof vi.fn>;
      const onCloseCallback = mockOn.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;

      expect(onCloseCallback).toBeDefined();
      onCloseCallback(1, null); // code = 1 (failure), signal = null

      expect(mockTsc).not.toHaveBeenCalled();
      expect(closeListener).toHaveBeenCalledWith(1, null);
    });

    it("should not execute next task when current task is terminated by signal", () => {
      const options: TaskQueueOptions = {
        removeConfig: { filepath: "dist" },
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      const closeListener = vi.fn();
      taskQueue.on("close", closeListener);
      taskQueue.start();

      // Simulate termination by signal
      const mockOn = mockChildProcess.on as ReturnType<typeof vi.fn>;
      const onCloseCallback = mockOn.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;

      expect(onCloseCallback).toBeDefined();
      onCloseCallback(null, "SIGTERM");

      expect(mockTsc).not.toHaveBeenCalled();
      expect(closeListener).toHaveBeenCalledWith(null, "SIGTERM");
    });

    it("should call close listener when all tasks complete successfully", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      const closeListener = vi.fn();
      taskQueue.on("close", closeListener);
      taskQueue.start();

      // Simulate successful completion of the only task (tsc)
      const mockOn = mockChildProcess.on as ReturnType<typeof vi.fn>;
      const onCloseCallback = mockOn.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;

      expect(onCloseCallback).toBeDefined();
      onCloseCallback(0, null);

      expect(closeListener).toHaveBeenCalledWith(0, null);
    });

    it("should return the same instance for method chaining", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      const result = taskQueue.start();

      expect(result).toBe(taskQueue);
    });

    it("should not start again if already started", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      taskQueue.start();
      taskQueue.start(); // Second call

      // Should only be called once
      expect(mockTsc).toHaveBeenCalledTimes(1);
    });

    it("should throw error when no tasks are available", () => {
      // This is an edge case that shouldn't happen in normal usage
      // but the code has protection for it
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);

      // Mock the tasks array to be empty to trigger the error
      (taskQueue as any).tasks = [];

      expect(() => taskQueue.start()).toThrow(
        "Internal Error. No task to execute. This should not happen. If you see this error, please open an issue.",
      );
    });
  });

  describe("on", () => {
    it("should register close event listener", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      const closeListener = vi.fn();
      const result = taskQueue.on("close", closeListener);

      expect(result).toBe(taskQueue);
    });

    it("should replace existing listener when called multiple times", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      const firstListener = vi.fn();
      const secondListener = vi.fn();

      taskQueue.on("close", firstListener);
      taskQueue.on("close", secondListener);
      taskQueue.start();

      // Simulate task completion
      const mockOn = mockChildProcess.on as ReturnType<typeof vi.fn>;
      const onCloseCallback = mockOn.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;

      onCloseCallback(0, null);

      expect(firstListener).not.toHaveBeenCalled();
      expect(secondListener).toHaveBeenCalledWith(0, null);
    });
  });

  describe("stop", () => {
    it("should kill current subprocess when running", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      taskQueue.start();

      const result = taskQueue.stop();

      expect(mockChildProcess.kill).toHaveBeenCalled();
      expect(result).toBe(taskQueue);
    });

    it("should not throw error when no subprocess is running", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);

      expect(() => taskQueue.stop()).not.toThrow();
    });

    it("should not stop again if already stopped", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      taskQueue.start();
      taskQueue.stop();
      taskQueue.stop(); // Second call

      // Should only be called once
      expect(mockChildProcess.kill).toHaveBeenCalledTimes(1);
    });
  });

  describe("isRunning", () => {
    it("should return false when not started", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);

      expect(taskQueue.isRunning()).toBe(false);
    });

    it("should return true when running", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      taskQueue.start();

      expect(taskQueue.isRunning()).toBe(true);
    });

    it("should return false after task completion", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      taskQueue.start();

      // Simulate task completion
      const mockOn = mockChildProcess.on as ReturnType<typeof vi.fn>;
      const onCloseCallback = mockOn.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;

      onCloseCallback(0, null);

      expect(taskQueue.isRunning()).toBe(false);
    });

    it("should return true after stopping (until close event is triggered)", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const taskQueue = new TaskQueue(options);
      taskQueue.start();
      taskQueue.stop();

      // After stop() is called, isRunning() should still return true
      // because currentSubprocess is only set to undefined in the close event
      expect(taskQueue.isRunning()).toBe(true);

      // Simulate the close event after kill
      const mockOn = mockChildProcess.on as ReturnType<typeof vi.fn>;
      const onCloseCallback = mockOn.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;

      onCloseCallback(null, "SIGTERM"); // Simulate termination by signal

      expect(taskQueue.isRunning()).toBe(false);
    });
  });

  describe("integration scenarios", () => {
    it("should execute complete workflow: remove -> tsc -> copyfiles -> exec", () => {
      const options: TaskQueueOptions = {
        removeConfig: { filepath: "dist" },
        tscConfig: ["--project", "tsconfig.json"],
        copyfilesConfig: { rootDir: "src", outDir: "dist" },
        execConfig: { filepath: "dist/index.js" },
      };

      // Create separate mock child processes for each task
      const mockRemoveProcess = { on: vi.fn(), kill: vi.fn() };
      const mockTscProcess = { on: vi.fn(), kill: vi.fn() };
      const mockCopyfilesProcess = { on: vi.fn(), kill: vi.fn() };
      const mockExecProcess = { on: vi.fn(), kill: vi.fn() };

      mockRemove.mockReturnValue(
        mockRemoveProcess as unknown as childProcess.ChildProcess,
      );
      mockTsc.mockReturnValue(
        mockTscProcess as unknown as childProcess.ChildProcess,
      );
      mockCopyfiles.mockReturnValue(
        mockCopyfilesProcess as unknown as childProcess.ChildProcess,
      );
      mockExec.mockReturnValue(
        mockExecProcess as unknown as childProcess.ChildProcess,
      );

      const taskQueue = new TaskQueue(options);
      taskQueue.start();

      // Step 1: remove task starts
      expect(mockRemove).toHaveBeenCalledWith({ filepath: "dist" });

      // Step 2: remove completes, tsc starts
      const removeCloseCallback = mockRemoveProcess.on.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;
      removeCloseCallback(0, null);

      expect(mockTsc).toHaveBeenCalledWith(["--project", "tsconfig.json"]);

      // Step 3: tsc completes, copyfiles starts
      const tscCloseCallback = mockTscProcess.on.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;
      tscCloseCallback(0, null);

      expect(mockCopyfiles).toHaveBeenCalledWith({
        rootDir: "src",
        outDir: "dist",
      });

      // Step 4: copyfiles completes, exec starts
      const copyfilesCloseCallback = mockCopyfilesProcess.on.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;
      copyfilesCloseCallback(0, null);

      expect(mockExec).toHaveBeenCalledWith({ filepath: "dist/index.js" });
    });

    it("should handle method chaining", () => {
      const options: TaskQueueOptions = {
        tscConfig: ["--project", "tsconfig.json"],
      };

      const closeListener = vi.fn();
      const taskQueue = new TaskQueue(options);

      const result = taskQueue.on("close", closeListener).start();

      expect(result).toBe(taskQueue);
      expect(mockTsc).toHaveBeenCalled();
    });

    it("should handle early termination in multi-task scenario", () => {
      const options: TaskQueueOptions = {
        removeConfig: { filepath: "dist" },
        tscConfig: ["--project", "tsconfig.json"],
        copyfilesConfig: { rootDir: "src", outDir: "dist" },
        execConfig: { filepath: "dist/index.js" },
      };

      const taskQueue = new TaskQueue(options);
      const closeListener = vi.fn();
      taskQueue.on("close", closeListener);
      taskQueue.start();

      // remove task fails
      const mockOn = mockChildProcess.on as ReturnType<typeof vi.fn>;
      const onCloseCallback = mockOn.mock.calls.find(
        (call) => call[0] === "close",
      )?.[1] as CloseCallback;
      onCloseCallback(1, null);

      // Subsequent tasks should not be executed
      expect(mockTsc).not.toHaveBeenCalled();
      expect(mockCopyfiles).not.toHaveBeenCalled();
      expect(mockExec).not.toHaveBeenCalled();
      expect(closeListener).toHaveBeenCalledWith(1, null);
    });
  });
});
