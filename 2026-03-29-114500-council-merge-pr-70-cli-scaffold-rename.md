---
## Adversarial Council -- Merge PR #70: CLI Scaffold + Rename to TrKixel (Re-review)

> Convened: 2026-03-29T11:45:00 | Advocates: 1 | Critics: 2 | Rounds: 2/4 | Motion type: CODE

### Motion
Should we merge PR #70 (feature/38-cli-scaffold-subcommands -> main)? This PR renames AutoTrixel to TrKixel across the codebase and scaffolds CLI subcommands with commander.js. 104 files changed, 9410 insertions, 1225 deletions. Evaluate: correctness of the rename, CLI scaffold quality, headless engine adapter readiness, Tauri config consistency, web app regression risk, and whether the prior council's 4 fixes were applied correctly.

### Advocate Positions
**ADVOCATE-1**: All 4 prior council fixes verified at cited lines: `canvas` in `optionalDependencies` (`package.json:31-33`), oklch L parsing conditional on `%` suffix (`run.js:17`), `setTool("pencil")` removed from `fill.js:77`, palette `op.import` validation added (`run.js:150`). CLI scaffold is well-structured with 6 subcommands, consistent error handling, correct stdout/stderr separation. Rename is complete at all user-facing boundaries. Web app is unaffected. Conceded the palette gap in Tauri `getState()` is real and passes the pre-existence test, but argued it is a scaffolding limitation with a narrow data-loss path (no palette-import menu action in Tauri), not a blocker for the CLI deliverable.

### Critic Positions
**CRITIC-1**: Initially raised two defects: (1) `paint.js:26` ReferenceError in `collectCell` and (2) `App.vue:19` syntax error. Both were **phantom** -- the quoted code does not exist in the source. CRITIC-1 conceded both unconditionally after independent verification. Adopted CRITIC-2's palette finding; in final summary argued CONDITIONAL: the Tauri save path is fully wired (`menu-handler.js:23-33`), the fix is one line matching `cli/state.js:70-78`, and merging known silent data loss when the correct pattern exists in the same PR is the strongest argument against deferring.

**CRITIC-2**: Initially raised three defects: (1) duplicate `const arrayBuffer` in `export-ops.js:11-12`, (2) palette data loss via `engine.getState()` in Tauri save path, (3) color slider bug in `createTrKixel.js:175-176`. Defects 1 and 3 were **phantom** -- conceded after independent verification. Defect 2 was **verified as real**: `engine.js:198` returns `palette: []` and `file-ops.js:24` calls it on every Tauri save. Successfully challenged the ARBITER's pre-existence ruling. In final summary argued: the save path is not a stub (no TODO, no warning), the internal inconsistency with the CLI path demonstrates the author knew palette needed threading, and the fix is trivially available.

### Questioner Findings
QUESTIONER did not submit probes during the debate. The ARBITER performed independent source verification of all 7 claims across both rounds (2 from CRITIC-1, 3 from CRITIC-2, and 2 prior-council fix verifications from ADVOCATE-1). All phantom findings were caught and challenged by the ARBITER before other agents corroborated.

### Key Conflicts
- **CRITIC-1 phantom findings** -- CRITIC-1 cited fabricated code for both `paint.js:26` and `App.vue:19`. ARBITER verified against source, ADVOCATE-1 independently confirmed, CRITIC-2 independently confirmed. CRITIC-1 conceded both. -- **resolved: withdrawn**
- **CRITIC-2 phantom findings** -- CRITIC-2 cited fabricated code for `export-ops.js:11-12` and `createTrKixel.js:175-176`. ARBITER verified against source. CRITIC-2 conceded both. -- **resolved: withdrawn**
- **Palette data loss pre-existence ruling** -- ARBITER initially ruled CRITIC-2's palette finding failed the pre-existence test (engine has never stored palette). CRITIC-1 and CRITIC-2 objected: `file-ops.js` is new code in this PR, the concern did not exist before, and the CLI path in the same PR handles palette correctly. ARBITER reversed the ruling. ADVOCATE-1 conceded the pre-existence argument. -- **resolved: finding accepted as in-scope, LOW severity**
- **Palette finding severity** -- Both critics argued CONDITIONAL (fix before merge): save path is fully wired, fix is one line, internal inconsistency with CLI proves awareness. ADVOCATE-1 argued FOR with follow-up: Tauri has no palette-import menu action, data loss path is narrow, CLI deliverable is correct. -- **unresolved: severity disagreement between FOR (advocate) and CONDITIONAL (critics)**

### Concessions
- **CRITIC-1** conceded `paint.js:26` ReferenceError was phantom (to ARBITER/ADVOCATE-1)
- **CRITIC-1** conceded `App.vue:19` syntax error was phantom (to ARBITER/ADVOCATE-1)
- **CRITIC-2** conceded `export-ops.js:11-12` duplicate declaration was phantom (to ARBITER)
- **CRITIC-2** conceded `createTrKixel.js:175-176` slider bug was phantom (to ARBITER)
- **ADVOCATE-1** conceded palette gap in `getState()` is real and passes the pre-existence test (to CRITIC-1/CRITIC-2), but maintained it is not a merge blocker
- **ARBITER** reversed pre-existence ruling on palette finding (to CRITIC-1/CRITIC-2)

### Regression Lineage
No regression lineage. The prior council's 4 fixes (commit 153f450) are all correctly applied and verified. None of the current findings trace to those fixes.

### Prior Council Comparison
The prior council (2026-03-29T19:25:00) found 4 verified issues and recommended CONDITIONAL merge. All 4 conditions have been met:
1. `canvas` in `optionalDependencies` -- **confirmed** at `package.json:31-33`
2. `run.js` oklch L parsing -- **confirmed** at `run.js:17` (conditional on `%` suffix)
3. `fill.js` `setTool("pencil")` removed -- **confirmed** at `fill.js:77` (no setTool call before fillAtCell)
4. `run.js` palette `op.import` validation -- **confirmed** at `run.js:150` (guard for non-empty string)

This re-review council confirms all prior findings were addressed. The one new finding (palette loss in Tauri save) was not identified by the prior council because the Tauri file-ops was added in the same commit series.

### Arbiter Recommendation
**FOR**

The PR is ready to merge. All 4 prior council conditions are verified as met. The rename is correct at all user-facing boundaries. The CLI scaffold is well-structured with consistent error handling, proper stdout/stderr separation, and correct palette threading. The headless engine and adapters are sound. The web app compiles and is unaffected by the changes. Of the 5 code-level defect claims raised by critics in this re-review, 4 were phantom (fabricated code) and 1 (palette loss in Tauri save) is a verified LOW-severity gap in new scaffolding code. The palette gap is real and in-scope but does not block merge: the Tauri app has no palette import UI, the data loss scenario requires cross-tool file editing, and the CLI deliverable (the stated purpose of issue #38) handles palette correctly. The palette gap should be tracked as a follow-up issue.

### Conditions (if CONDITIONAL)
None. This is a FOR recommendation.

### Suggested Fixes

#### Fixes (all in-PR)
No issues identified that require fixing before merge.

#### Noted for Follow-up
- **Tauri save path drops palette data** -- `src/tauri/file-ops.js` L:24 and L:36 call `engine.getState()` which returns `palette: []` (`src/core/engine.js` L:198). The CLI path correctly uses `engineStateToFileState(engine, palette)` at `cli/state.js` L:70-78. When Tauri gains palette import UI, `file-ops.js` should thread palette the same way the CLI does. LOW severity -- the Tauri app currently has no palette import UI so the data loss scenario is narrow (cross-tool file editing only).
  CITE: `src/tauri/file-ops.js` L:24
  CITE: `src/tauri/file-ops.js` L:36
  CITE: `src/core/engine.js` L:198
  CITE: `cli/state.js` L:70-78 (correct pattern)

#### PR Description Amendments
- None needed. The PR description already clarifies rename scope and lists all 4 prior council fixes.

#### Critical Discoveries
None. No OWASP Top 10, data loss (at merge-blocking severity), or compliance issues were identified.

### Verification Results
| # | Finding | Source | Citations | Verdict | Action |
|---|---------|--------|-----------|---------|--------|
| 1 | Prior fix: canvas optionalDeps | Prior council | `package.json` L:31-33 | VERIFIED APPLIED | Confirmed |
| 2 | Prior fix: oklch L parsing | Prior council | `cli/commands/run.js` L:17 | VERIFIED APPLIED | Confirmed |
| 3 | Prior fix: setTool removed | Prior council | `cli/commands/fill.js` L:77 | VERIFIED APPLIED | Confirmed |
| 4 | Prior fix: palette op validation | Prior council | `cli/commands/run.js` L:150 | VERIFIED APPLIED | Confirmed |
| 5 | paint.js collectCell ReferenceError | CRITIC-1 | `cli/commands/paint.js` L:38-41 | PHANTOM | Purged |
| 6 | App.vue syntax error | CRITIC-1 | `src/App.vue` L:19 | PHANTOM | Purged |
| 7 | export-ops.js duplicate const | CRITIC-2 | `src/tauri/export-ops.js` L:11-12 | PHANTOM | Purged |
| 8 | createTrKixel.js slider bug | CRITIC-2 | `src/logic/createTrKixel.js` L:176-178 | PHANTOM | Purged |
| 9 | Tauri save drops palette | CRITIC-2 | `file-ops.js` L:24, `engine.js` L:198 | VERIFIED | Noted for follow-up |

Verification: 4 prior fixes confirmed, 1 new finding verified (LOW, follow-up), 4 phantom findings purged, 0 unverified.
---
