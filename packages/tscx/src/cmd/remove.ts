import fs from "node:fs";

/**
 * @param filepath absolute filepath
 */
export async function remove(filepath: string) {
  await new Promise<void>((resolve, reject) => {
    fs.stat(filepath, (err) => {
      if (err) {
        // do nothing if file not found
        err.code === "ENOENT" ? resolve() : reject(err);
        return;
      }
      fs.rm(filepath, { recursive: true }, (e) => (e ? reject(e) : resolve()));
    });
  });
}
