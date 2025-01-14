import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { remove } from "./remove.ts";

const TMP = os.tmpdir();
const tmpFilePath = path.resolve(TMP, "tscx_tmp_file_name");
const tmpDirPath = path.resolve(TMP, "tscx_tmp_dir_name");
const tmpDirPathChild = path.resolve(tmpDirPath, "tscx_tmp_dir_name_child");

describe("remove", () => {
  beforeAll(async () => {
    await fs.writeFile(tmpFilePath, "foo");

    await fs.mkdir(tmpDirPath);
    await fs.mkdir(tmpDirPathChild);
    await fs.writeFile(path.resolve(tmpDirPathChild, "file"), "bar");
  });

  afterAll(async () => {
    await fs.rm(tmpFilePath, { force: true });
    await fs.rm(tmpDirPath, { force: true, recursive: true });
  });

  it("should remove file", async () => {
    expect((await fs.stat(tmpFilePath)).isFile()).toBe(true);
    expect(fs.access(tmpFilePath)).resolves.toBeUndefined();
    await remove(tmpFilePath);
    expect(fs.access(tmpFilePath)).rejects.toBeInstanceOf(Error);
  });

  it("show remove dir", async () => {
    expect((await fs.stat(tmpDirPath)).isDirectory()).toBe(true);
    expect(fs.access(tmpDirPath)).resolves.toBeUndefined();
    await remove(tmpDirPath);
    expect(fs.access(tmpDirPath)).rejects.toBeInstanceOf(Error);
  });
});
