#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import minimist from "minimist";
import { tscPath } from "../common.ts";
import { Main } from "../main.ts";

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
    "-e, --exec <path>",
    "Execute or restart the specified js file after every successful compilation.",
  )
  .option("-h, --help", "Display help for command.")
  .allowUnknownOption()
  .action(async (options, cmd: Command) => {
    if (options.help) {
      cmd.outputHelp();
      console.log(`\n${"=".repeat(process.stdout.columns)}\n`);
      childProcess.spawnSync("node", [tscPath, "--help"], { stdio: "inherit" });
      return;
    }
    const { watch, ...otherOptions } = options;
    const { _, ...extraOptions } = minimist(cmd.args);
    const main = new Main({
      ...otherOptions,
      ...extraOptions,
    });
    if (watch) {
      main.watch();
    } else {
      const code = await main.compile();
      process.exit(code);
    }
  })
  .parse();
