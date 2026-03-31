# CLI Batch Validation Tasks (T2–T8)

## Overview

**Parent issue**: [#40 CLI - JSON batch execution](https://github.com/Kiriketsuki/TrKixel/issues/40)
**Prerequisite**: PR #71 landed the spec, test fixtures, OKLCH fix, and `mkdir` hardening. This PR executes the fixtures against `trkixel run` and fixes any bugs found.

**Command under test**: `node cli/index.js run <instructions.json> -o <output.trkixel.json>`

---

## T2 — Smoke test: create + paint + SVG export

**Fixture**: `cli/test-fixtures/smoke.json`
**Command**: `node cli/index.js run cli/test-fixtures/smoke.json -o test-out/smoke-state.trkixel.json`

**Acceptance criteria**:
- [ ] Exit code is 0
- [ ] `test-out/smoke-state.trkixel.json` exists and is valid JSON
- [ ] `gridData["2,3"]` is `"#ff0000"`
- [ ] `gridData["1,2"]` is an OKLCH color string (painted via `oklch(60% 0.15 200)`)
- [ ] `test-out/smoke.svg` exists and contains `<polygon` elements
- [ ] State file has `version`, `config`, `gridData`, `palette` keys
- [ ] `config.rows` is 5, `config.cols` is 5

**Key files**:
- `cli/commands/run.js` — batch executor (create, paint, export ops)
- `cli/state.js` — `createState()`, `saveState()`, `engineStateToFileState()`
- `src/core/export.js` — `renderSVG(engine)`
- `src/core/engine.js` — `createEngine()`, `setColorFromHex()`, `setColor()`, `paintCells()`

**Potential issues**:
- `setColor(l, c, h)` in engine may store OKLCH differently than the raw string — verify `gridData["1,2"]` is a valid color, not `undefined`
- SVG rendering needs `getTrianglePath()` from geometry — verify engine config has derived `widthTriangles`/`heightTriangles`
- `saveState` in `cli/state.js:39-45` checks `access(dir)` and throws if dir doesn't exist, but `run.js` now calls `mkdir` before `saveState` — verify both don't conflict

---

## T3 — Flood fill test

**Fixture**: `cli/test-fixtures/fill.json`
**Command**: `node cli/index.js run cli/test-fixtures/fill.json -o test-out/fill-state.trkixel.json`

**Acceptance criteria**:
- [ ] Exit code is 0
- [ ] `gridData["2,3"]` is `"#0000ff"` (was `"#ff0000"`, flood-filled to blue)
- [ ] `gridData["2,4"]` is `"#0000ff"` (adjacent same-color cell, also flood-filled)
- [ ] `gridData["2,5"]` is `"#00ff00"` (different color, NOT flood-filled)
- [ ] Other cells are null/absent (unpainted)

**Key files**:
- `cli/commands/run.js:137-163` — fill op handler
- `src/logic/autotrixel/actions.js` — `fillBucket()` flood fill implementation
- `src/logic/autotrixel/geometry.js` — triangle adjacency for flood fill

**Potential issues**:
- Flood fill adjacency in triangular grids is non-trivial — up-pointing and down-pointing triangles have different neighbor sets
- `fillBucket()` may depend on internal engine state (e.g., `currentFill`) — verify `applyColor()` is called before `fillAtCell()`
- Fill fixture paints cells `(2,3)` and `(2,4)` red, then `(2,5)` green, then fills `(2,3)` blue — verify `(2,4)` is recolored but `(2,5)` is not

---

## T4 — Palette import test

**Fixture**: `cli/test-fixtures/palette-import.json` + `cli/test-fixtures/palette.gpl`
**Command**: `node cli/index.js run cli/test-fixtures/palette-import.json -o test-out/palette-state.trkixel.json`

**Acceptance criteria**:
- [ ] Exit code is 0
- [ ] Output state `palette` array contains 4 hex colors from the GPL file:
  - `"#ff0000"` (Red)
  - `"#00ff00"` (Green)
  - `"#0000ff"` (Blue)
  - `"#ffff00"` (Yellow)
- [ ] `config.rows` is 3, `config.cols` is 3
- [ ] `gridData` is empty (no paint ops in this fixture)

**Key files**:
- `cli/commands/run.js:206-220` — palette op handler
- `src/logic/palette-utils.js` — `parseGPL()` parser
- `cli/test-fixtures/palette.gpl` — GIMP Palette with 4 colors

**Potential issues**:
- `palette-import.json` uses relative path `"cli/test-fixtures/palette.gpl"` — verify CWD resolution (must run from repo root)
- `parseGPL()` skips lines with `:` (header fields) — verify the `Name: Test Palette` line is correctly skipped
- `run.js:218` assigns `palette = parseGPL(gplContent)` but the palette op doesn't require a prior `create` — verify this works (palette op has no engine guard)

---

## T5 — Error path tests

Four sub-tests, one per error fixture. Each must exit with code 1 and produce specific stderr output.

### T5a — Unknown operation

**Fixture**: `cli/test-fixtures/error-unknown-op.json`
**Command**: `node cli/index.js run cli/test-fixtures/error-unknown-op.json -o /dev/null`

**Acceptance**:
- [ ] Exit code is 1
- [ ] stderr contains `"unknown operation: dance"`

**Key code**: `cli/commands/run.js:222-224` — default case in switch

### T5b — Paint without create

**Fixture**: `cli/test-fixtures/error-no-create.json`
**Command**: `node cli/index.js run cli/test-fixtures/error-no-create.json -o /dev/null`

**Acceptance**:
- [ ] Exit code is 1
- [ ] stderr contains `requires a "create" op first`

**Key code**: `cli/commands/run.js:108-110` — `if (!engine)` guard in paint case

### T5c — Out-of-bounds cell

**Fixture**: `cli/test-fixtures/error-oob.json`
**Command**: `node cli/index.js run cli/test-fixtures/error-oob.json -o /dev/null`

**Acceptance**:
- [ ] Exit code is 1
- [ ] stderr contains `out of bounds`

**Key code**: `cli/commands/run.js:37-45` — `validateCellBounds()`

### T5d — Malformed JSON

**Fixture**: `cli/test-fixtures/error-bad-json.txt`
**Command**: `node cli/index.js run cli/test-fixtures/error-bad-json.txt -o /dev/null`

**Acceptance**:
- [ ] Exit code is 1
- [ ] stderr contains `could not read or parse`

**Key code**: `cli/commands/run.js:57-63` — try/catch around `JSON.parse()`

---

## T6 — State file round-trip

**Depends on**: T2 (uses T2's output state file)
**No dedicated fixture** — validates T2's output structurally.

**Acceptance criteria**:
- [ ] `test-out/smoke-state.trkixel.json` is valid JSON (parseable)
- [ ] Contains top-level keys: `version`, `config`, `gridData`, `palette`
- [ ] `version` is a positive integer (currently `1`)
- [ ] `config` contains `rows`, `cols`, `triSize` with numeric values
- [ ] `gridData` is an object with string keys in `"row,col"` format
- [ ] `palette` is an array (may be empty)

**Key files**:
- `cli/state.js:46-52` — `saveState()` output structure
- `cli/state.js:55-64` — `engineStateToFileState()` serialization

**Verification method**: Read the file, `JSON.parse()` it, check key presence and types.

---

## T7 — Bug fixes

**Depends on**: T2–T6

Any bugs discovered during T2–T6 are fixed inline. This is not a standalone task — it tracks cumulative fixes.

**Process**:
1. For each failing test in T2–T6, diagnose root cause
2. Fix the implementation (in `cli/commands/run.js`, `cli/state.js`, `src/core/engine.js`, etc.)
3. Re-run the failing fixture to confirm the fix
4. Verify no regressions on other fixtures

**Exit criteria**:
- [ ] All T2–T6 acceptance criteria pass after fixes
- [ ] No regressions on existing CLI subcommands (`create`, `paint`, `fill`, `export`, `palette`)

---

## T8 — PNG export test (should-have)

**Priority**: Medium — only attempt if T2–T7 are green.

**Prerequisite**: `canvas` (node-canvas) npm package must be installed. This has native build dependencies (Cairo, Pango, pkg-config).

**Command**: Modify `smoke.json` to export PNG, or create a new fixture:
```json
[
  { "op": "create", "rows": 5, "cols": 5 },
  { "op": "paint", "cell": "2,3", "color": "#ff0000" },
  { "op": "export", "format": "png", "output": "test-out/smoke.png" }
]
```

**Acceptance criteria**:
- [ ] `npm install canvas` succeeds (native build)
- [ ] Exit code is 0
- [ ] `test-out/smoke.png` exists and is a valid PNG file (starts with PNG magic bytes `\x89PNG`)
- [ ] File size is non-zero

**Key files**:
- `cli/commands/run.js:188-198` — PNG export branch
- `src/core/adapters/node.js` — `createNodeCanvasAdapter()` — wraps `canvas` package
- `src/core/export.js` — `renderPNG(engine, adapter)`

**Potential issues**:
- `canvas` native build may fail if Cairo/Pango dev headers are missing (`sudo pacman -S cairo pango` on Arch)
- If build fails, this task is skipped per spec: "Test SVG first; defer PNG if build fails"
- `createNodeCanvasAdapter()` may throw a descriptive error if `canvas` is not installed — verify `run.js:190-194` catches it cleanly

---

## Execution Order

```
T2 (smoke) ──┐
T3 (fill)  ──┤
T4 (palette) ┼── T7 (bug fixes) ── T8 (PNG, optional)
T5 (errors) ─┤
T6 (round-trip) ← depends on T2 output
```

T2–T5 can run in parallel. T6 depends on T2's output. T7 is ongoing. T8 is optional.

---

## References

- Spec: `cli-json-batch-execution-spec.md`
- Fixtures: `cli/test-fixtures/`
- CLI entry: `cli/index.js`
- Batch executor: `cli/commands/run.js`
- Engine: `src/core/engine.js`
- State: `cli/state.js`
- Epic: [#32 Native OS App & Agent CLI](https://github.com/Kiriketsuki/TrKixel/issues/32)
- Task issue: [#40 CLI - JSON batch execution](https://github.com/Kiriketsuki/TrKixel/issues/40)

---
*Authored by: Clault KiperS 4.6*
