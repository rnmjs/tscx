import fs from "node:fs/promises";
import path from "node:path";

/**
 * Copy non-ts/non-js files to outDir
 * @param rootDir absolute path
 * @param outDir absolute path
 */
export async function copyfiles(rootDir: string, outDir: string) {
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
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(filepath, dest);
  });
}
