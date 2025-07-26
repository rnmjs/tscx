import module from "node:module";
import process from "node:process";

function getTscPath() {
  try {
    return module
      .createRequire(`${process.cwd()}/`)
      .resolve("typescript/bin/tsc");
  } catch (error) {
    try {
      return module
        .createRequire(import.meta.url)
        .resolve("typescript/bin/tsc");
    } catch {
      throw error;
    }
  }
}

export const tscPath = getTscPath();
