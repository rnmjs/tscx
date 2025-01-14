#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import minimist from "minimist";
import { Action } from "../action.ts";

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
  .option("-h, --help", "Display help for command.")
  .allowUnknownOption()
  .action(async (options, cmd) => {
    if (options.help) {
      cmd.outputHelp();
      console.log(`\n${"=".repeat(process.stdout.columns)}\n`);
      // TODO: using npx seems not good
      childProcess.spawnSync("npx", ["tsc", "--help"], { stdio: "inherit" });
      return;
    }
    const isDir = async (p: string) =>
      (await fs.stat(path.resolve(process.cwd(), p))).isDirectory();
    if (options.project && (await isDir(options.project))) {
      options.project = path.join(options.project, "tsconfig.json");
    }
    const { _, ...extraOptions } = minimist(cmd.args);
    new Action({ ...options, ...extraOptions }).start();
  })
  .parse();
