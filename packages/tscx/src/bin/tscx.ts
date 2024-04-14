#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { Action } from "../action.js";

const version: string = JSON.parse(
  await fs.readFile(
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "package.json",
    ),
    "utf8",
  ),
).version;

new Command()
  .name("tscx")
  .version(version)
  .description("The TypeScript Compiler. Run `tsc` under the hood.")
  .option(
    "-p, --project <path>",
    "Compile the project given the path to its configuration file, or to a folder with a 'tsconfig.json'.",
    "tsconfig.json",
  )
  .option("-w, --watch", "Watch input files.", false)
  .option(
    "-r, --remove",
    "Remove output folder before before every compilation.",
    false,
  )
  .option(
    "-c, --copyfiles",
    "Copy non-ts files to output folder after every compilation.",
    false,
  )
  .option(
    "-e, --exec <path>",
    "Execute the specified js file after compilation success",
  )
  .action((options) => {
    new Action(options).start();
  })
  .parse();
