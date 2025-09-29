import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";
import {
  getInclude,
  getOutDir,
  getRootDir,
  getTsConfig,
} from "./tsconfig-utils.ts";

describe("tsconfig-utils", () => {
  it("getTsConfig", () => {
    // 1.
    const tsconfig = getTsConfig();
    expect(tsconfig.compilerOptions).toBeInstanceOf(Object);
    expect(tsconfig.include).toSatisfy(
      (value: any) => value === undefined || Array.isArray(value),
    );
    expect(tsconfig.exclude).toSatisfy(
      (value: any) => value === undefined || Array.isArray(value),
    );
    expect(tsconfig.files).toSatisfy(
      (value: any) => value === undefined || Array.isArray(value),
    );

    // 2.
    expect(getRootDir(tsconfig)).toBe(path.join(process.cwd(), "src"));
    expect(getOutDir(tsconfig)).toBe(path.join(process.cwd(), "dist"));
  });

  it("getRootDir", () => {
    // 1
    const rootDir1 = getRootDir({
      compilerOptions: { rootDir: "foo" },
    });
    expect(rootDir1).toBe(path.join(process.cwd(), "foo"));

    // 2.
    const rootDir2 = getRootDir({
      files: [
        "./src/foo/bar/baz1.ts",
        "./src/foo/bar/baz2.ts",
        "./src/foo/baz3.ts",
        "./src/foo/baz/baz4.ts",
      ],
    });
    expect(rootDir2).toBe(path.join(process.cwd(), "src", "foo"));
  });

  it("getOutDir", () => {
    // 1.
    expect(getOutDir({})).toBe(undefined);

    // 2.
    expect(() => getOutDir({ compilerOptions: { outDir: "." } })).toThrow(
      '"outDir" in tsconfig.json should not be current or parent directory',
    );
    expect(() => getOutDir({ compilerOptions: { outDir: ".." } })).toThrow(
      '"outDir" in tsconfig.json should not be current or parent directory',
    );

    // 3.
    expect(getOutDir({ compilerOptions: { outDir: "foo" } })).toBe(
      path.join(process.cwd(), "foo"),
    );
  });

  it("getInclude", () => {
    // 1.
    expect(getInclude({})).toEqual([process.cwd()]);

    // 2.
    expect(getInclude({ include: ["foo"] })).toEqual([
      path.resolve(process.cwd(), "foo"),
    ]);
  });
});
