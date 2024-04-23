import childProcess from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { Compiler } from "./compiler.js";

describe("compiler", () => {
  it("should get include", () => {
    const exec = vi.spyOn(childProcess, "execSync").mockReturnValue(
      JSON.stringify({
        include: ["foo"],
        compilerOptions: { strict: true, rootDir: ".", outDir: "dist" },
      }),
    );
    const compiler = new Compiler({
      project: "tsconfig.json",
      remove: false,
      copyfiles: false,
    });

    expect(exec.mock.calls.length).toBe(1);
    expect(compiler.getInclude()).toStrictEqual(["foo"]);

    compiler.refreshTsConfig();
    expect(exec.mock.calls.length).toBe(2);
  });

  it("should fail when compilerOptions is empty", () => {
    const exec = vi
      .spyOn(childProcess, "execSync")
      .mockReturnValue(
        JSON.stringify({ include: ["foo"], compilerOptions: {} }),
      );

    expect(
      () =>
        new Compiler({
          project: "tsconfig.json",
          remove: false,
          copyfiles: false,
        }),
    ).toThrow(/^Tsconfig.compilerOptions is empty!$/);
    expect(exec.mock.calls.length).toBe(1);
  });
});
