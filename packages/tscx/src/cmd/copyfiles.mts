import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

/**
 * Copy non-ts/non-js files to outDir
 * @param rootDir absolute path
 * @param outDir absolute path
 */
async function copyfiles(rootDir: string, outDir: string) {
  rootDir = path.resolve(rootDir);
  outDir = path.resolve(outDir);
  async function walkDir(dir: string, cb: (filepath: string) => Promise<void>) {
    await Promise.all(
      (await fs.readdir(dir))
        .map((filepath) => path.resolve(dir, filepath))
        .map(async (filepath) => {
          if ((await fs.stat(filepath)).isDirectory()) {
            if (
              !filepath.startsWith(outDir) &&
              !filepath.endsWith(`${path.sep}node_modules`)
            ) {
              await walkDir(filepath, cb);
            }
          } else {
            if (!/\.(js|cjs|mjs|jsx|ts|cts|mts|tsx)$/.test(filepath)) {
              await cb(filepath);
            }
          }
        }),
    );
  }
  await walkDir(rootDir, async (filepath) => {
    const dest = filepath.replace(rootDir, outDir);
    console.log("Copy", filepath, "=>", dest);
    await fs.copyFile(filepath, dest);
  });
}

const rootDir = process.argv[2];
const outDir = process.argv[3];
if (!rootDir || !outDir) {
  throw new Error("`rootDir` and `outDir` are required");
}

await copyfiles(rootDir, outDir);
