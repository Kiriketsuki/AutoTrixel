---
## Adversarial Council -- Merge PR #70: CLI Scaffold + Rename to TrKixel

> Convened: 2026-03-29T19:25:00 | Advocates: 1 | Critics: 2 | Rounds: 2/4 | Motion type: CODE

### Motion
Should we merge PR #70 (feature/38-cli-scaffold-subcommands → main)? This PR renames AutoTrixel to TrKixel across the codebase and scaffolds CLI subcommands with commander.js. 103 files changed, 9315 insertions, 1225 deletions. Evaluate: correctness of the rename (no stale AutoTrixel refs), CLI scaffold quality, headless engine adapter readiness, Tauri config consistency, and risk of breaking the existing web app.

### Advocate Positions
**ADVOCATE-1**: The rename is complete at every user-facing boundary: `package.json` name and bin, Tauri config (`productName`, `identifier`), `Cargo.toml`, `index.html` title and favicon, public SVG asset. The CLI scaffold is well-structured with six subcommands, consistent error handling via `process.stderr.write` + `process.exit(1)`, and correct stdout/stderr separation for scripting. The Node adapter gracefully degrades when `canvas` is unavailable. The web app is completely untouched — no regressions. The `src/logic/autotrixel/` directory is intentionally preserved and documented in `CLAUDE.md:29`.

### Critic Positions
**CRITIC-1**: Three defects raised. (1) `canvas` npm package absent from `package.json` — PNG export fails on any fresh install with no manifest signal. (2) `.gitnexus/meta.json` stale repoPath — **withdrawn** (gitignored, not tracked). (3) `autotrixel/` directory rename incomplete — narrowed to a PR scope characterization issue, not a blocking defect. Additionally raised: `run.js:148` palette op missing validation for `op.import` field (LOW).

**CRITIC-2**: Four findings raised. (1) `canvas` undeclared in `package.json` — same as CRITIC-1's finding 1. (2) `autotrixel/` directory rename incomplete — same narrowed position. (3) `.gitnexus/meta.json` stale repoPath — **withdrawn** (gitignored). (4) `fill.js:77` `setTool("pencil")` before `fillAtCell` is a semantic imprecision (LOW). Late finding: `run.js:15` oklch color parsing unconditionally divides L by 100 regardless of `%` suffix — **silent wrong-output bug** confirmed by ARBITER.

### Questioner Findings
QUESTIONER did not submit probes during the debate. The ARBITER performed independent verification of all cited claims. All substantiated findings were verified against source code with file:line citations.

### Key Conflicts
- **`canvas` in `package.json`** — ADVOCATE-1 initially argued graceful degradation was sufficient; critics argued the packaging gap was the defect regardless of error handling quality. ADVOCATE-1 conceded an `optionalDependencies` entry is warranted. — **resolved: all parties agree on pre-merge fix**
- **`autotrixel/` directory rename scope** — Critics argued the PR overclaims "rename across the codebase" when the core module directory is unchanged. ADVOCATE-1 argued it's intentional, documented legacy. — **resolved: characterization note, not a blocking condition**
- **`run.js:15` oklch parsing** — Late finding by CRITIC-2, verified by ARBITER. ADVOCATE-1 did not contest. — **resolved: substantiated bug, included as pre-merge fix**

### Concessions
- **CRITIC-1** conceded `.gitnexus/meta.json` is gitignored and not a PR concern (to ADVOCATE-1)
- **CRITIC-2** conceded `.gitnexus/meta.json` on the same grounds (to ADVOCATE-1)
- **CRITIC-1** conceded `autotrixel/` imports are functionally correct; narrowed to scope characterization
- **CRITIC-2** conceded `autotrixel/` is not a merge blocker
- **ADVOCATE-1** conceded `canvas` should be in `optionalDependencies` pre-merge
- **ADVOCATE-1** conceded `fill.js:77` `setTool("pencil")` is a copy-paste imprecision
- **ADVOCATE-1** conceded the PR description overclaims the rename scope

### Regression Lineage
No regression lineage — no prior fix involvement.

### Arbiter Recommendation
**CONDITIONAL**

The PR is structurally sound: the rename is correct at all user-facing boundaries, the CLI scaffold architecture is well-organized (one file per command, consistent error codes, proper stdout/stderr separation), the Tauri config is consistent, and the web app is completely unaffected. Two concrete code defects must be fixed before merge: (1) `canvas` must be declared in `optionalDependencies` to close the packaging gap all parties acknowledged, and (2) `run.js:15` must conditionally divide L by 100 only when `%` is present, matching the correct behavior in `fill.js:10` and `paint.js:28-32`. Both fixes are small and well-scoped.

### Conditions (required before merge)

1. **Add `canvas` to `optionalDependencies` in `package.json`** — All three agents agreed this is necessary. One-line addition.
2. **Fix `run.js:15` oklch L parsing** — Unconditional `/100` produces silent wrong output for decimal-form oklch inputs. Must check for `%` suffix before dividing, consistent with `fill.js:10` and `paint.js:28-32`.

### Suggested Fixes

#### Fixes (all in-PR)

1. **Add `canvas` to `optionalDependencies`** — `package.json` (add new key) — HIGH — PNG export dependency invisible to npm; no manifest signal for optional native capability
   CITE: `package.json` L:absent (no `canvas` entry anywhere in file)
   CITE: `src/core/adapters/node.js` L:4

2. **Fix oklch L value parsing in `run.js` `parseColor`** — `cli/commands/run.js` L:15 — HIGH — Silent wrong output: decimal-form oklch colors (e.g., `oklch(0.6 0.15 200)`) produce L=0.006 instead of L=0.6, rendering near-black. Inconsistent with `fill.js:10` and `paint.js:28-32` which correctly check for `%` before dividing.
   CITE: `cli/commands/run.js` L:15
   CITE: `cli/commands/fill.js` L:10 (correct implementation)
   CITE: `cli/commands/paint.js` L:28-32 (correct implementation)

3. **Fix `setTool("pencil")` before `fillAtCell` in `fill.js`** — `cli/commands/fill.js` L:77 — LOW — Semantic imprecision: sets tool to "pencil" before a bucket-fill operation. Currently a no-op (`engine.fillAtCell` ignores `currentTool`), but semantically wrong. Either change to `setTool("bucket")` or remove the call entirely (consistent with `run.js:108` which omits it).
   CITE: `cli/commands/fill.js` L:77
   CITE: `src/core/engine.js` L:281-282 (fillAtCell does not read currentTool)
   CITE: `cli/commands/run.js` L:108 (fill op without setTool)

4. **Validate `op.import` in `run.js` palette handler** — `cli/commands/run.js` L:148 — LOW — Missing input validation: if `op.import` is undefined, `readFile(undefined)` throws TypeError caught by the catch block but produces confusing error message `could not read "undefined"`. Add a guard checking `op.import` is a non-empty string before calling `readFile`.
   CITE: `cli/commands/run.js` L:148

#### PR Description Amendments

- Update the PR description to clarify the rename scope: "Renames AutoTrixel to TrKixel at all user-facing boundaries (package name, CLI binary, Tauri config, public assets, HTML). The internal module directory `src/logic/autotrixel/` is intentionally preserved as documented legacy (`CLAUDE.md:29`)."

#### Critical Discoveries
None. No OWASP Top 10, data loss, or compliance issues were identified.

### Verification Results
| # | Finding | Citations | Verdict | Action |
|---|---------|-----------|---------|--------|
| 1 | canvas missing from package.json | `package.json` (absent), `src/core/adapters/node.js` L:4 | VERIFIED | Retained |
| 2 | run.js:15 oklch L parsing bug | `cli/commands/run.js` L:15, `cli/commands/fill.js` L:10, `cli/commands/paint.js` L:28-32 | VERIFIED | Retained |
| 3 | fill.js:77 setTool("pencil") before fillAtCell | `cli/commands/fill.js` L:77, `src/core/engine.js` L:281-282, `cli/commands/run.js` L:108 | VERIFIED | Retained |
| 4 | run.js:148 palette op missing validation | `cli/commands/run.js` L:148 | VERIFIED | Retained |

Verification: 4 verified, 0 phantom (purged), 0 unverified (retained for review)
All findings verified against codebase.
---
