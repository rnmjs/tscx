import fs from "node:fs";

/**
 * @param filepath absolute filepath
 */
export async function remove(filepath: string) {
  await new Promise<void>((resolve, reject) => {
    fs.stat(filepath, (err) => {
      if (err) {
        return err.code === "ENOENT" ? resolve() : reject(err); // do nothing if file not found
      }
      fs.rm(filepath, { recursive: true }, (e) => (e ? reject(e) : resolve()));
    });
  });
  console.log(`Removed ${filepath}`);
}
