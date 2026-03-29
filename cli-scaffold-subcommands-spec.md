# Feature: cli-scaffold-subcommands

## Overview

**User Story**: As an AI agent or power user, I want a CLI to create, manipulate, and export triangle-pixel art so that I can generate trixel art programmatically without a browser.

**Problem**: The TrKixel engine is locked inside a browser SPA. Every operation -- creating a canvas, painting cells, exporting images -- requires the GUI. There is no way to script, automate, or integrate trixel creation into agent workflows or asset pipelines.

**Out of Scope**:
- Native OS desktop app (separate spec under epic #32)
- Real-time preview / GUI within the CLI
- WebSocket or HTTP server mode
- Undo history in the CLI (canvas state files serve as checkpoints)

---

## Success Condition

> This feature is complete when `trkixel --help` shows all subcommands, and a full pipeline -- create, paint, fill, export (PNG + SVG), palette import, and batch run -- executes end-to-end producing correct output files.

---

## Open Questions

| # | Question | Raised By | Resolved |
|:--|:---------|:----------|:---------|
| 1 | Should the CLI support reading canvas state from stdin for piping? | spec | [ ] |

---

## Scope

### Must-Have
- **CLI entry point**: `cli/index.js` with commander, `bin` field in package.json, `trkixel --help` shows all subcommands with descriptions. Acceptance: `npx trkixel --help` outputs formatted help text listing create, paint, fill, export, palette, run.
- **State file layer**: `cli/state.js` reads/writes `.trkixel.json` files storing `{ version, config: { rows, cols, triSize }, gridData, palette }`. Converts rows/cols/triSize to engine pixel dimensions (width, height, triSide, widthTriangles, heightTriangles) at load time. Acceptance: round-trip create -> save -> load -> save produces identical files.
- **`trkixel create`**: Initialize canvas with `--rows N --cols N` (required), `--tri-size N` (default: 30), `-o path` (required). Outputs a `.trkixel.json` with empty gridData. Acceptance: `trkixel create --rows 10 --cols 10 -o canvas.trkixel.json` produces a valid state file.
- **`trkixel paint`**: Set cells to a color. `-i path` (required), `--cell r,c` (repeatable), `--color "..."` (required, OKLCH or hex). Writes back to input file. Acceptance: `trkixel paint -i canvas.trkixel.json --cell 3,4 --color "#ff0000"` updates gridData["3,4"].
- **`trkixel fill`**: Flood fill from seed cell. `-i path`, `--cell r,c`, `--color "..."`. Acceptance: fills all adjacent same-colored cells with the new color.
- **`trkixel export`**: Render to PNG or SVG. `-i path`, `-o path`, `--format png|svg`. PNG requires the `canvas` npm package -- if missing, exits with code 1 and a clear error message ("Install the `canvas` package for PNG export"). SVG always works. Acceptance: produces valid PNG/SVG matching grid contents.
- **`trkixel palette`**: Import a `.gpl` palette file. `-i path`, `--import palette.gpl`. Stores parsed colors in the state file's palette array. Acceptance: palette array contains hex colors from the GPL file.
- **`trkixel run`**: Execute a JSON instruction file. Takes `instructions.json` positional arg, `-o path` for final state output. Operations execute against a single in-memory engine instance; final state written once at end. Acceptance: `trkixel run instructions.json -o canvas.trkixel.json` applies all operations sequentially.
- **Error handling**: All commands exit with code 1 and write to stderr on invalid input (out-of-bounds cell, bad color format, missing file, unknown format, unknown batch operation).

### Should-Have
- **`trkixel subdivide`**: Split a trixel into 4 sub-triangles. `-i path`, `--cell r,c`.
- **Palette export**: `trkixel palette -i path --export palette.gpl` writes current palette to GPL format.
- **Dry-run mode**: `trkixel run --dry-run instructions.json` validates without executing.

### Nice-to-Have
- **Interactive REPL**: `trkixel repl` for exploratory use.
- **Stdin pipe**: Read canvas state from stdin, write to stdout, enabling Unix pipe chains.
- **Grid overlay toggle**: `--grid` flag on export to include/exclude grid lines in output.

---

## Technical Plan

**Affected Components**:

| File | Status | Notes |
|:-----|:-------|:------|
| `cli/index.js` | New | Entry point. `#!/usr/bin/env node`, commander setup, registers subcommands from `cli/commands/`. |
| `cli/state.js` | New | `.trkixel.json` read/write. Converts rows/cols/triSize to engine pixel config at load, and back at save. |
| `cli/commands/create.js` | New | `trkixel create` — initializes engine, saves empty state. |
| `cli/commands/paint.js` | New | `trkixel paint` — loads state, calls `engine.paintCells()`, saves. |
| `cli/commands/fill.js` | New | `trkixel fill` — loads state, calls `engine.fillAtCell()`, saves. |
| `cli/commands/export.js` | New | `trkixel export` — loads state, calls `renderPNG()` or `renderSVG()`, writes output file. |
| `cli/commands/palette.js` | New | `trkixel palette` — loads state, parses GPL via `parseGPL()`, saves palette to state. |
| `cli/commands/run.js` | New | `trkixel run` — reads instruction JSON, creates engine, executes ops sequentially, saves final state. |
| `package.json` | Modify | Add `"bin": { "trkixel": "./cli/index.js" }`, add `commander` to dependencies. |
| `src/core/engine.js` | Reuse | `createEngine(options)` — headless state management. All CLI commands instantiate this. |
| `src/core/export.js` | Reuse | `renderPNG(engine, adapter)`, `renderSVG(engine)` — headless export functions. |
| `src/core/canvas-adapter.js` | Reuse | `validateAdapter()` — runtime guard for adapter interface. |
| `src/core/adapters/node.js` | Modify | Implement real node-canvas adapter (conditional on `canvas` package availability). |
| `src/logic/trkixel/geometry.js` | Reuse | Pure triangle math. Used by engine internally. |
| `src/logic/trkixel/actions.js` | Reuse | `batchPaintCells()`, `fillBucket()`. Used by engine internally. |
| `src/logic/trkixel/utils.js` | Reuse | OKLCH/RGB/Hex conversion. Used by engine internally. |
| `src/logic/palette-utils.js` | Reuse | `parseGPL()` — GPL format parser. |

**State File Format** (`.trkixel.json`):

```json
{
  "version": 1,
  "config": {
    "rows": 10,
    "cols": 10,
    "triSize": 30
  },
  "gridData": {
    "3,4": "oklch(60% 0.15 200)",
    "5,6": { "type": "image", "imageId": "bg1" },
    "7,8": { "subdivided": true, "children": ["#ff0000", null, "#00ff00", null] }
  },
  "palette": ["#ff0000", "#00ff00", "#0000ff"]
}
```

**State Conversion** (`cli/state.js`):

The `.trkixel.json` format stores human-friendly `rows`, `cols`, `triSize`. The engine expects pixel dimensions. `state.js` handles conversion:

```
Load:  rows/cols/triSize → width = cols * (triSize / 2)
                          height = rows * (triSize * sqrt(3) / 2)
                          triSide = triSize
                          widthTriangles = cols
                          heightTriangles = rows

Save:  Extract rows/cols/triSize from config, discard derived pixel values.
```

**Node Canvas Adapter** (`src/core/adapters/node.js`):

Currently a throwing stub. For PNG export, implement conditional loading:

```js
export function createNodeCanvasAdapter() {
    let createCanvas;
    try {
        ({ createCanvas } = await import("canvas"));
    } catch {
        throw new Error(
            'PNG export requires the "canvas" npm package. Install it with: npm install canvas'
        );
    }
    return {
        createCanvas(width, height) { return createCanvas(width, height); },
        canvasToBlob(canvas) { return Promise.resolve(canvas.toBuffer("image/png")); },
    };
}
```

**Dependencies**:
- `commander` — CLI framework (added to dependencies)
- `canvas` — optional, not in dependencies. Users install manually for PNG export.

**Data Model Changes**: None (no database).

**API Contracts**: N/A (CLI, not HTTP).

**Risks**:

| Risk | Likelihood | Mitigation |
|:-----|:-----------|:-----------|
| node-canvas native build deps fail on user systems | Medium | Make optional. SVG + state ops work without it. Clear error message with install instructions. |
| OKLCH color rendering differs between browser and node-canvas | Low | Color conversion is manual math (utils.js converts to sRGB). Same code path in both environments. |
| ES module import path issues (cli/ importing from src/core/) | Low | Both are plain ES modules. package.json already has `"type": "module"`. Relative imports work. |
| Large grid performance with JSON serialization | Low | gridData is a flat string-keyed object. JSON.parse/stringify handles millions of keys efficiently. |

---

## Acceptance Scenarios

```gherkin
Feature: trkixel-cli
  As an AI agent
  I want a CLI for triangle-pixel art
  So that I can generate trixel art programmatically

  Rule: CLI entry point

    Scenario: Show help text
      When I run `trkixel --help`
      Then stdout lists subcommands: create, paint, fill, export, palette, run
      And each subcommand has a one-line description
      And the exit code is 0

    Scenario: Unknown subcommand
      When I run `trkixel dance`
      Then the CLI exits with code 1
      And stderr contains an error message

  Rule: Canvas creation

    Scenario: Create a new canvas with default triangle size
      Given no existing canvas file
      When I run `trkixel create --rows 10 --cols 10 -o canvas.trkixel.json`
      Then a file `canvas.trkixel.json` is created
      And it contains version 1
      And config has rows=10, cols=10, triSize=30
      And gridData is an empty object
      And palette is an empty array

    Scenario: Create with custom triangle size
      When I run `trkixel create --rows 5 --cols 8 --tri-size 50 -o canvas.trkixel.json`
      Then config has rows=5, cols=8, triSize=50

    Scenario: Create fails when output directory does not exist
      When I run `trkixel create --rows 10 --cols 10 -o /nonexistent/dir/canvas.trkixel.json`
      Then the CLI exits with code 1
      And stderr contains an error message

  Rule: Cell painting

    Scenario: Paint a single cell
      Given a canvas file with an empty 10x10 grid
      When I run `trkixel paint -i canvas.trkixel.json --cell 3,4 --color "oklch(60% 0.15 200)"`
      Then gridData["3,4"] equals "oklch(60% 0.15 200)"

    Scenario: Paint multiple cells in one command
      Given a canvas file with an empty 10x10 grid
      When I run `trkixel paint -i canvas.trkixel.json --cell 3,4 --cell 5,6 --color "#ff0000"`
      Then gridData["3,4"] and gridData["5,6"] both equal "#ff0000"

    Scenario: Paint fails for out-of-bounds cell
      Given a canvas file with a 10x10 grid
      When I run `trkixel paint -i canvas.trkixel.json --cell 99,99 --color "#ff0000"`
      Then the CLI exits with code 1
      And stderr contains "out of bounds"

    Scenario: Paint fails for invalid color format
      Given a canvas file with a 10x10 grid
      When I run `trkixel paint -i canvas.trkixel.json --cell 3,4 --color "notacolor"`
      Then the CLI exits with code 1
      And stderr contains "invalid color"

  Rule: Flood fill

    Scenario: Fill a contiguous region
      Given a canvas with cells 3,4 and 3,5 both colored "#ff0000"
      And cell 3,6 colored "#00ff00"
      When I run `trkixel fill -i canvas.trkixel.json --cell 3,4 --color "#0000ff"`
      Then cells 3,4 and 3,5 are "#0000ff"
      And cell 3,6 remains "#00ff00"

    Scenario: Fill on empty cell fills only that cell
      Given a canvas with all cells empty
      When I run `trkixel fill -i canvas.trkixel.json --cell 3,4 --color "#ff0000"`
      Then all previously empty cells are "#ff0000"

  Rule: Export

    Scenario: Export canvas as SVG
      Given a canvas file with painted cells
      When I run `trkixel export -i canvas.trkixel.json -o art.svg --format svg`
      Then a valid SVG file is written to `art.svg`
      And it contains polygon elements for each painted cell

    Scenario: Export canvas as PNG (canvas package installed)
      Given a canvas file with painted cells
      And the `canvas` npm package is installed
      When I run `trkixel export -i canvas.trkixel.json -o art.png --format png`
      Then a valid PNG file is written to `art.png`
      And the image dimensions match the canvas configuration

    Scenario: Export PNG fails gracefully without canvas package
      Given the `canvas` npm package is NOT installed
      When I run `trkixel export -i canvas.trkixel.json -o art.png --format png`
      Then the CLI exits with code 1
      And stderr contains "Install the `canvas` package for PNG export"

    Scenario: Export fails for unknown format
      When I run `trkixel export -i canvas.trkixel.json -o art.bmp --format bmp`
      Then the CLI exits with code 1
      And stderr contains "unsupported format"

  Rule: Palette management

    Scenario: Import a GPL palette
      Given a canvas file and a valid `palette.gpl` file
      When I run `trkixel palette -i canvas.trkixel.json --import palette.gpl`
      Then the canvas state palette array contains the GPL colors as hex strings

    Scenario: Import fails for missing palette file
      When I run `trkixel palette -i canvas.trkixel.json --import nonexistent.gpl`
      Then the CLI exits with code 1
      And stderr contains an error message

  Rule: Batch execution

    Scenario: Run a batch instruction file
      Given an instructions.json containing:
        ```json
        [
          {"op": "create", "rows": 5, "cols": 5},
          {"op": "paint", "cell": "2,3", "color": "#ff0000"},
          {"op": "export", "format": "svg", "output": "out.svg"}
        ]
        ```
      When I run `trkixel run instructions.json -o canvas.trkixel.json`
      Then canvas.trkixel.json contains a painted cell at 2,3
      And out.svg exists as a valid SVG

    Scenario: Batch fails on invalid operation
      Given an instructions.json containing an unknown operation "dance"
      When I run `trkixel run instructions.json -o canvas.trkixel.json`
      Then the CLI exits with code 1
      And stderr contains "unknown operation: dance"

    Scenario: Batch fails on malformed JSON
      Given an instructions.json containing invalid JSON
      When I run `trkixel run instructions.json -o canvas.trkixel.json`
      Then the CLI exits with code 1
      And stderr contains an error about JSON parsing
```

---

## Task Breakdown

| ID   | Task | Priority | Dependencies | Status  |
|:-----|:-----|:---------|:-------------|:--------|
| T1   | CLI scaffold: `cli/index.js` with commander, `bin` field in package.json, `trkixel --help` | High | None | pending |
| T2   | State layer: `cli/state.js` — read/write `.trkixel.json`, rows/cols/triSize to engine config conversion | High | None | pending |
| T3   | Node canvas adapter: implement conditional `canvas` import in `src/core/adapters/node.js` | High | None | pending |
| T4   | `create` command: `cli/commands/create.js` | High | T1, T2 | pending |
| T5   | `paint` command: `cli/commands/paint.js` | High | T1, T2 | pending |
| T6   | `fill` command: `cli/commands/fill.js` | High | T1, T2 | pending |
| T7   | `export` command: `cli/commands/export.js` (PNG + SVG) | High | T1, T2, T3 | pending |
| T8   | `palette` command: `cli/commands/palette.js` | Med | T1, T2 | pending |
| T9   | `run` command: `cli/commands/run.js` (JSON batch) | Med | T4, T5, T6, T7, T8 | pending |
| T10  | Integration test: end-to-end pipeline (create -> paint -> fill -> export -> palette -> run) | High | T9 | pending |

---

## Exit Criteria

- [ ] `trkixel --help` shows all subcommands with descriptions
- [ ] All Must-Have acceptance scenarios pass (manual CLI test or scripted)
- [ ] `.trkixel.json` round-trips correctly (create -> save -> load -> save produces identical output)
- [ ] SVG export produces valid output with correct triangle geometry
- [ ] PNG export works when `canvas` is installed, fails gracefully when absent
- [ ] `trkixel run` executes multi-step instruction files correctly
- [ ] All error cases exit with code 1 and write actionable messages to stderr
- [ ] No regressions on browser app (`npm run dev` — paint, fill, export, palette all work)
- [ ] `npm run build` passes with no errors

---

## References

- Epic: #32 (Native OS App and Agent CLI)
- Issues: #38 (Scaffold and implement subcommands), #40 (JSON batch execution)
- Prior spec: `trkixel-cli-spec.md` (T4, T5, T6 scope)
- Engine: `src/core/engine.js` — `createEngine(options)` factory
- Export: `src/core/export.js` — `renderPNG()`, `renderSVG()`
- Palette: `src/logic/palette-utils.js` — `parseGPL()`
- PR: (draft, to be created after first commit)

---
*Authored by: Clault KiperS 4.6*
