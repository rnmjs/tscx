import childProcess from "node:child_process";
import process from "node:process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as tsconfigUtils from "../tsconfig-utils.ts";
import { tsc } from "./index.ts";

// Mock dependencies
vi.mock("node:child_process");
vi.mock("../tsconfig-utils.ts");
vi.mock("../common.ts", () => ({
  tscPath: "/mock/path/to/tsc",
}));
vi.mock("../debug.ts", () => ({
  debug: vi.fn(),
}));

const mockSpawn = vi.mocked(childProcess.spawn);
const mockGetTsConfigPath = vi.mocked(tsconfigUtils.getTsConfigPath);
const mockCreateTempTsConfig = vi.mocked(tsconfigUtils.createTempTsConfig);
const mockCleanupTempTsConfig = vi.mocked(tsconfigUtils.cleanupTempTsConfig);

describe("tsc", () => {
  let mockChildProcess: any = {
    on: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockChildProcess = {
      on: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    };

    mockSpawn.mockReturnValue(mockChildProcess);
    mockGetTsConfigPath.mockReturnValue("/mock/tsconfig.json");
    mockCreateTempTsConfig.mockReturnValue("/mock/temp-tsconfig.json");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("when no exclude or include patterns are provided", () => {
    it("should call tsc directly with original options", () => {
      tsc(["--noEmit", "--strict"]);

      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        ["/mock/path/to/tsc", "--noEmit", "--strict"],
        { stdio: "inherit" },
      );
      expect(mockCreateTempTsConfig).not.toHaveBeenCalled();
      expect(mockCleanupTempTsConfig).not.toHaveBeenCalled();
    });

    it("should handle empty options array", () => {
      tsc([]);

      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        ["/mock/path/to/tsc"],
        { stdio: "inherit" },
      );
    });
  });

  describe("when exclude patterns are provided", () => {
    it("should create temp tsconfig with exclude patterns", () => {
      tsc(["--exclude", "**/*.test.ts", "**/*.spec.ts", "--noEmit"]);

      expect(mockGetTsConfigPath).toHaveBeenCalledWith(undefined);
      expect(mockCreateTempTsConfig).toHaveBeenCalledWith(
        "/mock/tsconfig.json",
        ["**/*.test.ts", "**/*.spec.ts"],
        undefined,
      );
      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        [
          "/mock/path/to/tsc",
          "--project",
          "/mock/temp-tsconfig.json",
          "--noEmit",
        ],
        { stdio: "inherit" },
      );
    });

    it("should handle exclude patterns at the end of options", () => {
      tsc(["--noEmit", "--exclude", "**/*.test.ts"]);

      expect(mockCreateTempTsConfig).toHaveBeenCalledWith(
        "/mock/tsconfig.json",
        ["**/*.test.ts"],
        undefined,
      );
      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        [
          "/mock/path/to/tsc",
          "--project",
          "/mock/temp-tsconfig.json",
          "--noEmit",
        ],
        { stdio: "inherit" },
      );
    });

    it("should preserve existing project option when exclude patterns are used", () => {
      tsc(["--project", "custom-tsconfig.json", "--exclude", "**/*.test.ts"]);

      expect(mockGetTsConfigPath).toHaveBeenCalledWith("custom-tsconfig.json");
      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        ["/mock/path/to/tsc", "--project", "/mock/temp-tsconfig.json"],
        { stdio: "inherit" },
      );
    });

    it("should handle -p shorthand for project option", () => {
      tsc(["-p", "build.json", "--exclude", "**/*.test.ts"]);

      expect(mockGetTsConfigPath).toHaveBeenCalledWith("build.json");
      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        ["/mock/path/to/tsc", "-p", "/mock/temp-tsconfig.json"],
        { stdio: "inherit" },
      );
    });
  });

  describe("when include patterns are provided", () => {
    it("should create temp tsconfig with include patterns", () => {
      tsc(["--include", "src/**/*.ts", "lib/**/*.ts", "--noEmit"]);

      expect(mockCreateTempTsConfig).toHaveBeenCalledWith(
        "/mock/tsconfig.json",
        undefined,
        ["src/**/*.ts", "lib/**/*.ts"],
      );
      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        [
          "/mock/path/to/tsc",
          "--project",
          "/mock/temp-tsconfig.json",
          "--noEmit",
        ],
        { stdio: "inherit" },
      );
    });
  });

  describe("when both exclude and include patterns are provided", () => {
    it("should create temp tsconfig with both patterns", () => {
      tsc([
        "--exclude",
        "**/*.test.ts",
        "**/*.spec.ts",
        "--include",
        "src/**/*.ts",
        "--noEmit",
      ]);

      expect(mockCreateTempTsConfig).toHaveBeenCalledWith(
        "/mock/tsconfig.json",
        ["**/*.test.ts", "**/*.spec.ts"],
        ["src/**/*.ts"],
      );
      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        [
          "/mock/path/to/tsc",
          "--project",
          "/mock/temp-tsconfig.json",
          "--noEmit",
        ],
        { stdio: "inherit" },
      );
    });

    it("should handle patterns in different order", () => {
      tsc([
        "--include",
        "src/**/*.ts",
        "--noEmit",
        "--exclude",
        "**/*.test.ts",
      ]);

      expect(mockCreateTempTsConfig).toHaveBeenCalledWith(
        "/mock/tsconfig.json",
        ["**/*.test.ts"],
        ["src/**/*.ts"],
      );
      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        [
          "/mock/path/to/tsc",
          "--project",
          "/mock/temp-tsconfig.json",
          "--noEmit",
        ],
        { stdio: "inherit" },
      );
    });
  });

  describe("cleanup behavior", () => {
    it("should cleanup temp tsconfig on process close", () => {
      tsc(["--exclude", "**/*.test.ts"]);

      expect(mockChildProcess.on).toHaveBeenCalledWith(
        "close",
        expect.any(Function),
      );

      // Simulate process close
      const closeHandler = (mockChildProcess.on.mock.calls as any[]).find(
        (call: any) => call[0] === "close",
      )?.[1] as (() => void) | undefined;
      closeHandler?.();

      expect(mockCleanupTempTsConfig).toHaveBeenCalledWith(
        "/mock/temp-tsconfig.json",
      );
    });

    it("should cleanup temp tsconfig on process error", () => {
      tsc(["--exclude", "**/*.test.ts"]);

      expect(mockChildProcess.on).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );

      // Simulate process error
      const errorHandler = (mockChildProcess.on.mock.calls as any[]).find(
        (call: any) => call[0] === "error",
      )?.[1] as (() => void) | undefined;
      errorHandler?.();

      expect(mockCleanupTempTsConfig).toHaveBeenCalledWith(
        "/mock/temp-tsconfig.json",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty exclude patterns", () => {
      tsc(["--exclude", "--noEmit"]);

      // Should not create temp config for empty patterns
      expect(mockCreateTempTsConfig).not.toHaveBeenCalled();
      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        ["/mock/path/to/tsc", "--exclude", "--noEmit"],
        { stdio: "inherit" },
      );
    });

    it("should handle exclude option without patterns at end", () => {
      tsc(["--noEmit", "--exclude"]);

      // Should not create temp config for empty patterns
      expect(mockCreateTempTsConfig).not.toHaveBeenCalled();
      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        ["/mock/path/to/tsc", "--noEmit", "--exclude"],
        { stdio: "inherit" },
      );
    });

    it("should handle multiple exclude/include options (first one is used)", () => {
      tsc([
        "--exclude",
        "old1.ts",
        "old2.ts",
        "--include",
        "src/**/*.ts",
        "--exclude",
        "**/*.test.ts",
      ]);

      // Should use the first exclude patterns found
      expect(mockCreateTempTsConfig).toHaveBeenCalledWith(
        "/mock/tsconfig.json",
        ["old1.ts", "old2.ts"],
        ["src/**/*.ts"],
      );
    });
  });

  describe("return value", () => {
    it("should return the spawned child process", () => {
      const result = tsc(["--noEmit"]);

      expect(result).toBe(mockChildProcess);
    });
  });
});
