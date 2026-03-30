#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
    .name("trkixel")
    .description("Triangle-pixel art CLI — create, manipulate, and export trixel art programmatically")
    .version(pkg.version);

// Register subcommands
const { registerCreate } = await import("./commands/create.js");
const { registerPaint } = await import("./commands/paint.js");
const { registerFill } = await import("./commands/fill.js");
const { registerExport } = await import("./commands/export.js");
const { registerPalette } = await import("./commands/palette.js");
const { registerRun } = await import("./commands/run.js");

registerCreate(program);
registerPaint(program);
registerFill(program);
registerExport(program);
registerPalette(program);
registerRun(program);

program.parse(process.argv);
