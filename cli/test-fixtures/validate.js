#!/usr/bin/env node
/**
 * Acceptance criteria validator for T2–T8 batch validation tasks (T8 requires canvas).
 * Run from repo root: node cli/test-fixtures/validate.js
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function check(description, ok) {
  if (ok) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.log(`[FAIL] ${description}`);
    failed++;
  }
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
}

function runExpectFailure(cmd) {
  try {
    execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    return { exitCode: 0, stderr: "" };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stderr: (err.stderr ?? "") + (err.stdout ?? ""),
    };
  }
}

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

// ── setup: clean test-out/ ────────────────────────────────────────────────────

const testOutDir = path.resolve("test-out");
if (fs.existsSync(testOutDir)) {
  fs.rmSync(testOutDir, { recursive: true, force: true });
}
fs.mkdirSync(testOutDir, { recursive: true });

console.log("Running acceptance tests...\n");

// ── T2: Smoke test ────────────────────────────────────────────────────────────

console.log("=== T2: Smoke test ===");
try {
  run(
    "node cli/index.js run cli/test-fixtures/smoke.json -o test-out/smoke-state.trkixel.json"
  );

  check("T2 exit code 0", true);

  const smokeStatePath = "test-out/smoke-state.trkixel.json";
  check("T2 state file exists", fs.existsSync(smokeStatePath));

  let state;
  try {
    state = readJSON(smokeStatePath);
    check("T2 state is valid JSON", true);
  } catch {
    check("T2 state is valid JSON", false);
    state = null;
  }

  if (state) {
    check('T2 gridData["2,3"] === "#ff0000"', state.gridData?.["2,3"] === "#ff0000");
    check(
      'T2 gridData["1,2"] === "oklch(60% 0.15 200)"',
      state.gridData?.["1,2"] === "oklch(60% 0.15 200)"
    );
    check("T2 state has 'version' key", "version" in state);
    check("T2 state has 'config' key", "config" in state);
    check("T2 state has 'gridData' key", "gridData" in state);
    check("T2 state has 'palette' key", "palette" in state);
    check("T2 config.rows === 5", state.config?.rows === 5);
    check("T2 config.cols === 5", state.config?.cols === 5);
  }

  const svgPath = "test-out/smoke.svg";
  check("T2 smoke.svg exists", fs.existsSync(svgPath));
  if (fs.existsSync(svgPath)) {
    const svgContent = fs.readFileSync(svgPath, "utf-8");
    const polygonCount = (svgContent.match(/<polygon/g) ?? []).length;
    check("T2 smoke.svg contains exactly 2 <polygon", polygonCount === 2);
  }
} catch (err) {
  check("T2 command exited with code 0", false);
  console.error("  Error:", err.message);
}

// ── T3: Flood fill ────────────────────────────────────────────────────────────

console.log("\n=== T3: Flood fill ===");
try {
  run(
    "node cli/index.js run cli/test-fixtures/fill.json -o test-out/fill-state.trkixel.json"
  );

  check("T3 exit code 0", true);

  let state;
  try {
    state = readJSON("test-out/fill-state.trkixel.json");
    check("T3 state is valid JSON", true);
  } catch {
    check("T3 state is valid JSON", false);
    state = null;
  }

  if (state) {
    check('T3 gridData["2,3"] === "#0000ff"', state.gridData?.["2,3"] === "#0000ff");
    check('T3 gridData["2,4"] === "#0000ff"', state.gridData?.["2,4"] === "#0000ff");
    check('T3 gridData["2,5"] === "#00ff00"', state.gridData?.["2,5"] === "#00ff00");
    const keyCount = Object.keys(state.gridData ?? {}).length;
    check("T3 gridData has exactly 3 entries", keyCount === 3);
  }
} catch (err) {
  check("T3 command exited with code 0", false);
  console.error("  Error:", err.message);
}

// ── T4: Palette import ────────────────────────────────────────────────────────

console.log("\n=== T4: Palette import ===");
try {
  run(
    "node cli/index.js run cli/test-fixtures/palette-import.json -o test-out/palette-state.trkixel.json"
  );

  check("T4 exit code 0", true);

  let state;
  try {
    state = readJSON("test-out/palette-state.trkixel.json");
    check("T4 state is valid JSON", true);
  } catch {
    check("T4 state is valid JSON", false);
    state = null;
  }

  if (state) {
    const expectedPalette = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];
    check(
      "T4 palette === [#ff0000, #00ff00, #0000ff, #ffff00]",
      JSON.stringify(state.palette) === JSON.stringify(expectedPalette)
    );
    check("T4 config.rows === 3", state.config?.rows === 3);
    check("T4 config.cols === 3", state.config?.cols === 3);
    check(
      "T4 gridData is empty object",
      typeof state.gridData === "object" &&
        state.gridData !== null &&
        Object.keys(state.gridData).length === 0
    );
  }
} catch (err) {
  check("T4 command exited with code 0", false);
  console.error("  Error:", err.message);
}

// ── T5: Error paths ───────────────────────────────────────────────────────────

console.log("\n=== T5: Error paths ===");

// T5a: unknown operation
{
  const result = runExpectFailure(
    "node cli/index.js run cli/test-fixtures/error-unknown-op.json -o /dev/null"
  );
  check("T5a exit code 1", result.exitCode === 1);
  check(
    'T5a stderr contains "unknown operation: dance"',
    result.stderr.includes("unknown operation: dance")
  );
}

// T5b: no create op first
{
  const result = runExpectFailure(
    "node cli/index.js run cli/test-fixtures/error-no-create.json -o /dev/null"
  );
  check("T5b exit code 1", result.exitCode === 1);
  check(
    'T5b stderr contains requires a "create" op first',
    result.stderr.includes('requires a "create" op first')
  );
}

// T5c: out of bounds
{
  const result = runExpectFailure(
    "node cli/index.js run cli/test-fixtures/error-oob.json -o /dev/null"
  );
  check("T5c exit code 1", result.exitCode === 1);
  check(
    'T5c stderr contains "out of bounds"',
    result.stderr.includes("out of bounds")
  );
}

// T5d: bad JSON input file
{
  const result = runExpectFailure(
    "node cli/index.js run cli/test-fixtures/error-bad-json.txt -o /dev/null"
  );
  check("T5d exit code 1", result.exitCode === 1);
  check(
    'T5d stderr contains "could not read or parse"',
    result.stderr.includes("could not read or parse")
  );
}

// ── T6: State file round-trip (validates T2 output) ──────────────────────────

console.log("\n=== T6: State file round-trip ===");

const smokeStatePath = "test-out/smoke-state.trkixel.json";
if (!fs.existsSync(smokeStatePath)) {
  console.log("[SKIP] T6 skipped — smoke-state.trkixel.json missing (T2 failed)");
} else {
  // T2 already parsed this file; re-read here for T6's independent schema checks
  const state = readJSON(smokeStatePath);

  if (state) {
    const topKeys = ["version", "config", "gridData", "palette"];
    check(
      "T6 has top-level keys: version, config, gridData, palette",
      topKeys.every((k) => k in state)
    );
    check(
      "T6 version is a positive integer",
      Number.isInteger(state.version) && state.version > 0
    );

    const cfg = state.config ?? {};
    check(
      "T6 config has numeric rows, cols, triSize",
      typeof cfg.rows === "number" &&
        typeof cfg.cols === "number" &&
        typeof cfg.triSize === "number"
    );

    check("T6 gridData is an object", typeof state.gridData === "object" && state.gridData !== null);

    const gridKeys = Object.keys(state.gridData ?? {});
    const allKeysValid =
      gridKeys.length === 0 ||
      gridKeys.every((k) => /^\d+,\d+$/.test(k));
    check('T6 gridData keys are in "row,col" format', allKeysValid);

    check("T6 palette is an array", Array.isArray(state.palette));
  }
}

// ── T8: PNG export (optional — skips if canvas not installed) ────────────────
// Requires: npm install canvas (native build — needs Cairo + Pango headers)
//   Arch Linux: sudo pacman -S cairo pango
//   Debian/Ubuntu: sudo apt install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

console.log("\n=== T8: PNG export ===");

let canvasAvailable = false;
try {
  execSync("node -e \"require('canvas')\"", { stdio: ["pipe", "pipe", "pipe"] });
  canvasAvailable = true;
} catch {}

if (!canvasAvailable) {
  console.log("[SKIP] T8 skipped — canvas package not installed");
} else {
  try {
    run(
      "node cli/index.js run cli/test-fixtures/png-export.json -o test-out/png-state.trkixel.json"
    );
    check("T8 exit code 0", true);

    const pngPath = "test-out/smoke.png";
    check("T8 smoke.png exists", fs.existsSync(pngPath));

    if (fs.existsSync(pngPath)) {
      const buf = fs.readFileSync(pngPath);
      check("T8 smoke.png is non-zero size", buf.length > 0);
      check(
        "T8 smoke.png has PNG magic bytes",
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
      );
    }
  } catch (err) {
    check("T8 command exited with code 0", false);
    console.error("  Error:", err.message);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${"─".repeat(40)}`);
console.log(`Total: ${total}  Passed: ${passed}  Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
