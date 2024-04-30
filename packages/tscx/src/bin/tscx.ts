#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
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
    "Remove output folder before every compilation.",
    false,
  )
  .option(
    "-c, --copyfiles",
    "Copy non-ts files to output folder after every compilation.",
    false,
  )
  .option(
    "-s, --script <scr>",
    "Run 'npm run <scr>' after every successful compilation. This will run before --exec option.",
  )
  .option(
    "-e, --exec <path>",
    "Execute or restart the specified js file after every successful compilation.",
  )
  .action(async (options) => {
    const isDir = async (p: string) =>
      (await fs.stat(path.resolve(process.cwd(), p))).isDirectory();
    if (options.project && (await isDir(options.project))) {
      options.project = path.join(options.project, "tsconfig.json");
    }
    new Action(options).start();
  })
  .parse();
