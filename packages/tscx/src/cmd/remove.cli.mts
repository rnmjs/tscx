#!/usr/bin/env node
import process from "node:process";
import { remove } from "./remove.js";

const filepath = process.argv[2];
if (!filepath) {
  throw new Error("File path is required");
}

await remove(filepath);
