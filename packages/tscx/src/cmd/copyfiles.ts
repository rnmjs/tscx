import fs from "node:fs/promises";
import path from "node:path";

/**
 * Copy non-ts/non-js files to outDir
 * @param rootDirectory absolute path
 * @param outDirectory absolute path
 */
export async function copyfiles(rootDirectory: string, outDirectory: string) {
  const rootDir = path.resolve(rootDirectory);
  const outDir = path.resolve(outDirectory);
  const walkDir = async (
    dir: string,
    cb: (filepath: string) => Promise<void>,
  ) => {
    await Promise.all(
      (await fs.readdir(dir))
        .map((filepath) => path.resolve(dir, filepath))
        .map(async (filepath) => {
          const stat = await fs.stat(filepath);
          if (
            stat.isFile() &&
            !/\.(js|cjs|mjs|jsx|ts|cts|mts|tsx)$/.test(filepath)
          ) {
            await cb(filepath);
          }
          if (
            stat.isDirectory() &&
            !filepath.startsWith(outDir) &&
            !filepath.endsWith(`${path.sep}node_modules`) &&
            !filepath.endsWith(`${path.sep}.git`)
          ) {
            await walkDir(filepath, cb);
          }
        }),
    );
  };
  await walkDir(rootDir, async (filepath) => {
    const dest = filepath.replace(rootDir, outDir);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(filepath, dest);
  });
}
