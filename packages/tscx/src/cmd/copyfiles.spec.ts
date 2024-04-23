import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyfiles } from "./copyfiles.js";

const TMP1 = path.resolve(os.tmpdir(), "tscx_tmp_for_copy1");
const scrDirPath1 = path.resolve(TMP1, "src");
const distDirPath1 = path.resolve(TMP1, "dist");

const TMP2 = path.resolve(os.tmpdir(), "tscx_tmp_for_copy2");
const scrDirPath2 = path.resolve(TMP2, "src");
const distDirPath2 = path.resolve(TMP2, "dist");

const TMP3 = path.resolve(os.tmpdir(), "tscx_tmp_for_copy3");
const scrDirPath3 = path.resolve(TMP3, "src");
const distDirPath3 = path.resolve(TMP3, "dist");

describe("copyfiles", () => {
  beforeEach(async () => {
    await fs.mkdir(TMP1);
    await fs.mkdir(scrDirPath1);
    await fs.mkdir(distDirPath1);
    await fs.mkdir(TMP2);
    await fs.mkdir(scrDirPath2);
    await fs.mkdir(distDirPath2);
    await fs.mkdir(TMP3);
    await fs.mkdir(scrDirPath3);
    await fs.mkdir(distDirPath3);
  });
  afterEach(async () => {
    await fs.rm(TMP1, { force: true, recursive: true });
    await fs.rm(TMP2, { force: true, recursive: true });
    await fs.rm(TMP3, { force: true, recursive: true });
  });

  it("should copy files when src and dist are peers", async () => {
    // 1. prepare
    await fs.mkdir(path.resolve(distDirPath1, "a", "b"), { recursive: true });

    await fs.mkdir(path.resolve(scrDirPath1, "a", "b"), { recursive: true });
    await fs.writeFile(path.resolve(scrDirPath1, "a", "c"), "foo");
    await fs.mkdir(path.resolve(scrDirPath1, "a", "b", "node_modules"), {
      recursive: true,
    });
    await fs.writeFile(
      path.resolve(scrDirPath1, "a", "b", "node_modules", "d"),
      "bar",
    );
    await fs.writeFile(path.resolve(scrDirPath1, "a", "b", "e"), "baz");

    // 2. call
    await copyfiles(scrDirPath1, distDirPath1);

    // 3. expect
    expect(await fs.readdir(scrDirPath1)).toStrictEqual(["a"]);
    expect(await fs.readdir(path.resolve(scrDirPath1, "a"))).toStrictEqual([
      "b",
      "c",
    ]);
    expect(await fs.readFile(path.resolve(scrDirPath1, "a", "c"), "utf8")).toBe(
      "foo",
    );
    expect(await fs.readdir(path.resolve(scrDirPath1, "a", "b"))).toStrictEqual(
      ["e", "node_modules"],
    );
    expect(
      await fs.readFile(
        path.resolve(scrDirPath1, "a", "b", "node_modules", "d"),
        "utf8",
      ),
    ).toBe("bar");
    expect(
      await fs.readFile(path.resolve(scrDirPath1, "a", "b", "e"), "utf8"),
    ).toBe("baz");

    expect(await fs.readdir(distDirPath1)).toStrictEqual(["a"]);
    expect(await fs.readdir(path.resolve(distDirPath1, "a"))).toStrictEqual([
      "b",
      "c",
    ]);
    expect(
      await fs.readFile(path.resolve(distDirPath1, "a", "c"), "utf8"),
    ).toBe("foo");
    expect(
      await fs.readdir(path.resolve(distDirPath1, "a", "b")),
    ).toStrictEqual(["e"]);
    expect(
      await fs.readFile(path.resolve(distDirPath1, "a", "b", "e"), "utf8"),
    ).toBe("baz");
  });

  it("should copy files when src and dist are not peers", async () => {
    // 1. prepare
    await fs.writeFile(path.resolve(scrDirPath2, "a"), "foo");
    await fs.writeFile(path.resolve(TMP2, "b"), "bar");
    await fs.mkdir(path.resolve(distDirPath2, "src"));

    // 2. call
    await copyfiles(TMP2, distDirPath2);

    // 3. expect
    expect(await fs.readdir(distDirPath2)).toStrictEqual(["b", "src"]);
    expect(await fs.readFile(path.resolve(distDirPath2, "b"), "utf8")).toBe(
      "bar",
    );
    expect(await fs.readdir(path.resolve(distDirPath2, "src"))).toStrictEqual([
      "a",
    ]);
    expect(
      await fs.readFile(path.resolve(distDirPath2, "src", "a"), "utf8"),
    ).toBe("foo");
  });

  it("should copy if destination folder is empty", async () => {
    await fs.mkdir(path.resolve(scrDirPath3, "foo"));
    await fs.writeFile(path.resolve(scrDirPath3, "foo", "bar.txt"), "bar");

    await copyfiles(scrDirPath3, distDirPath3);

    expect(
      await fs.readFile(path.resolve(distDirPath3, "foo", "bar.txt"), "utf8"),
    ).toBe("bar");
  });
});
