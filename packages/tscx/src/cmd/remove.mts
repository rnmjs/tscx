import fs from "node:fs";
import process from "node:process";

/**
 * @param filepath absolute filepath
 */
async function remove(filepath: string) {
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

const filepath = process.argv[2];
if (!filepath) {
  throw new Error("File path is required");
}

await remove(filepath);
