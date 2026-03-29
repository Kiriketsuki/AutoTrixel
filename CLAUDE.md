# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

No test framework is configured. Testing is manual (browser-based).

## Architecture

TrKixel is a triangle-pixel art editor — a single-page Vue 3 app that renders and manipulates triangular grids on HTML Canvas.

### Core Pattern: Imperative Engine + Vue Shell

The app uses a **hybrid architecture**. Vue components handle the sidebar UI, but the canvas engine (`createTrKixel`) is a standalone imperative module that directly manipulates DOM elements via `id` selectors. Vue's `App.vue` mounts the engine into the root element and exposes it to sidebar components via `shallowRef`.

- `src/logic/createTrKixel.js` — **The engine.** A single factory function that returns an API object. It owns all canvas state: `gridData` (the pixel data), tool state, undo history, zoom/pan, background image, and event listeners. This is the largest and most critical file.
- `src/components/Sidebar.vue` — Orchestrates sidebar sections. Receives the engine instance as a prop and delegates to child components.
- `src/components/PaintControls.vue` — Color picker (OKLCH), palette management (import/export `.gpl`), and image fill uploads. Calls engine methods like `setColor()`, `registerImage()`.
- `src/components/OklchPicker.vue` — Full OKLCH color picker with three 2D gamut-mapped canvases (L×C, C×H, H×L). Renders pixel-by-pixel via `ImageData`.

### Engine Internals (`src/logic/autotrixel/`)

The engine logic is split into focused modules:

- **`geometry.js`** — Triangle math: `getTrianglePath()`, `pixelToGrid()` (hit-testing which triangle the cursor is over), `getTriangleCluster()` (brush size expansion), barycentric coordinate calculations for subdivision drilling.
- **`drawing.js`** — Canvas rendering: `fullRedraw()` (batched color drawing + complex items like subdivided triangles and image fills), `drawCursor()`, `drawGridLines()`.
- **`actions.js`** — Mutation operations: `batchPaintCells()`, `fillBucket()` (flood fill with adjacency for triangular grids), `interpolateStroke()` (continuous stroke interpolation).
- **`export.js`** — Export to PNG (via temp canvas + `toBlob`) and SVG (string building with recursive subdivision support).
- **`constants.js`** — `DEFAULT_CONFIG` and `REQUIRED_SELECTORS` (the engine validates all required DOM elements exist on init).
- **`utils.js`** — OKLCH ↔ RGB ↔ Hex color conversion (manual matrix math, not a library).

### Key Data Structures

- **`gridData`** — Plain object keyed by `"row,col"` strings. Values are either:
  - A CSS color string (`"oklch(60% 0.15 200)"` or `"#ff0000"`)
  - An object `{ type: "image", imageId: "..." }` for image fills
  - An object `{ subdivided: true, children: [child0, child1, child2, child3] }` for recursive subdivision (each child can itself be subdivided, a color string, or null)
- **Triangle orientation** — A triangle at `(r, c)` points up if `r % 2 === |c| % 2`, otherwise down. This parity rule is used everywhere.

### Subdivision System

Trixels can be subdivided into 4 sub-triangles (connecting edge midpoints). Subdivision is recursive — each sub-triangle can be further subdivided. The engine uses barycentric coordinates to determine which sub-triangle the cursor is in, drilling down recursively through `processSubdivision()` in `createTrKixel.js`.

## Color System

Colors use OKLCH throughout. The theme in `src/style.css` defines a Tailwind 4 `@theme` block with semantic color tokens (primary=blue, secondary=red, tertiary=purple) using OKLCH values with lightness variants (`-light`, `-dark`, `--1`, `-1` suffixes for ±0.05 L steps).

## Branching & Versioning

- **`main`** — Development branch. PRs from `feature/*` or `bug/*` branches.
- **`release`** — Production. Receives periodic PRs from `main`. Deploys to GitHub Pages on push.
- Branch naming: `feature/{name}` or `bug/{name}`.
- Version format: `YY.MM.minor.patch` (in `VERSION` file and `package.json`).
- Version bumps are automatic via CI when feature/bug branches merge to `main` (`version-bump.yml`).
- The `base` in `vite.config.js` is `/TrKixel/` for GitHub Pages deployment.

## Tools

Five drawing tools: `pencil`, `bucket` (flood fill), `eraser`, `picker` (eyedropper), `subdivide` (split trixel into 4 sub-triangles). Tool state is managed inside the engine; Vue buttons call `setTool(name)`.

## Engine-Vue Communication

The engine returns an API object from `createTrKixel()`. Vue components call these methods directly — there is no Vuex/Pinia store.

**Returned API:** `select`, `updateDimensions`, `resetCanvas`, `exportImage`, `exportSVG`, `destroy`, `registerImage`, `setCurrentImage`, `onBgChange`, `updateBackground`, `setControlMode`, `setColor(l, c, h)`, `onColorChange(cb)`, `setTool`, `undoAction`.

Note: The return object currently has duplicate keys (`setCurrentImage` x2, `onBgChange` x2) — the second silently overwrites the first. Not currently a bug since both are the same reference, but worth knowing.

## Gotchas

- **DOM id coupling**: The engine discovers UI elements via `REQUIRED_SELECTORS` in `constants.js` — a hardcoded list of `#id` strings. If any Vue component renames or removes an element's `id`, `createTrKixel()` will throw on init. Always check `REQUIRED_SELECTORS` when modifying template `id` attributes.
- **No state management library**: All canvas state lives inside the `createTrKixel` closure. There is no reactive store. Vue components only see what the engine explicitly exposes.
- **Undo is shallow**: History stores `JSON.stringify(gridData)` snapshots (max 10). Image fill references (`imageId`) survive undo but the actual `HTMLImageElement` lives in a separate `imageRegistry` Map that is not part of undo history.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **TrKixel** (245 symbols, 672 relationships, 20 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/TrKixel/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/TrKixel/context` | Codebase overview, check index freshness |
| `gitnexus://repo/TrKixel/clusters` | All functional areas |
| `gitnexus://repo/TrKixel/processes` | All execution flows |
| `gitnexus://repo/TrKixel/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
