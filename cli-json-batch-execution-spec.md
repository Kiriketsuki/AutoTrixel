# Feature: cli-json-batch-execution

## Overview

**User Story**: As an AI agent or power user, I want to validate that `trkixel run instructions.json` works end-to-end so that the JSON batch execution command is production-ready.

**Problem**: The `trkixel run` command was scaffolded in PR #70 but has never been tested. It may contain bugs that prevent it from meeting the acceptance criteria in issue #40. Without validation, the command cannot be relied upon for agent workflows or asset pipelines.

**Out of Scope**:
- Adding new operations beyond what's already scaffolded (create, paint, fill, export, palette)
- Automated test framework setup
- Dry-run mode (should-have in the CLI spec, separate task)
- Interactive REPL or stdin piping

---

## Success Condition

> This feature is complete when `trkixel run` successfully executes a multi-operation instruction file (create + paint + fill + palette + export) and produces correct output files, and all error paths exit with code 1 and descriptive stderr.

---

## Open Questions

| # | Question | Raised By | Resolved |
|:--|:---------|:----------|:---------|
| 1 | Should `canvas` (node-canvas) be installed as a dependency for PNG export, or should PNG be deferred? | spec | [ ] |

---

## Scope

### Must-Have
- **Smoke test**: `create` + `paint` + SVG `export` batch runs successfully and produces valid output files. Acceptance: SVG file contains polygon elements, `.trkixel.json` state reflects painted cells.
- **Flood fill test**: `create` + `paint` multiple cells + `fill` produces correct flood-filled state. Acceptance: adjacent same-colored cells are recolored, non-adjacent cells are unaffected.
- **Palette import test**: `create` + `palette` import from a `.gpl` file stores palette in final state. Acceptance: output `.trkixel.json` palette array contains imported colors.
- **Error path: unknown op**: Instruction file with `{"op": "dance"}` exits with code 1 and stderr contains "unknown operation: dance".
- **Error path: missing create**: Paint op without prior create exits with code 1 and descriptive stderr.
- **Error path: out-of-bounds cell**: Paint op targeting cell beyond grid dimensions exits with code 1 and stderr contains "out of bounds".
- **Error path: bad JSON**: Malformed instruction file exits with code 1 and descriptive stderr.
- **State file round-trip**: Output `.trkixel.json` from a batch can be loaded back by another batch (via a second `run` that reads the state).
- **Bug fixes**: Any bugs discovered during testing are fixed inline.

### Should-Have
- **PNG export test**: Install `canvas` dependency and verify PNG export within a batch produces a valid PNG file.

### Nice-to-Have
- **Reusable test fixtures**: Save test instruction files as `cli/test-fixtures/*.json` for future re-runs.

---

## Technical Plan

**Affected Components**:

| File | Status | Notes |
|:-----|:-------|:------|
| `cli/commands/run.js` | Test + fix | Primary target. All batch logic lives here. |
| `cli/state.js` | Test | State serialization/deserialization. |
| `src/core/engine.js` | Test | Headless engine API called by run.js. |
| `src/core/export.js` | Test | SVG rendering (PNG if canvas installed). |
| `src/core/adapters/node.js` | Test | Node-canvas adapter for PNG. |
| `src/logic/palette-utils.js` | Test | GPL parser used by palette op. |
| `src/core/config-utils.js` | Test | State-to-engine config conversion. |
| `package.json` | Maybe modify | Add `canvas` dependency if PNG test is in scope. |

**Data Model Changes**: None. Uses existing `.trkixel.json` format.

**Dependencies**:
- `commander` -- already installed
- `canvas` (node-canvas) -- NOT installed. Required for PNG export. Native build dependency (Cairo/Pango).

**Risks**:

| Risk | Likelihood | Mitigation |
|:-----|:-----------|:-----------|
| node-canvas native build fails on this system | Medium | Test SVG first; defer PNG if build fails. Graceful error message already in run.js. |
| Engine API mismatch with run.js expectations | Low | Engine and run.js were scaffolded together in same PR. Verify by reading both. |
| Color conversion edge cases (OKLCH with unusual values) | Low | Test with both hex and OKLCH colors in instruction files. |

---

## Acceptance Scenarios

```gherkin
Feature: cli-json-batch-execution
  As an AI agent
  I want to run batch instruction files
  So that I can generate trixel art programmatically

  Rule: Happy-path batch execution

    Scenario: Create + paint + SVG export
      Given an instructions.json containing:
        | [{"op":"create","rows":5,"cols":5},{"op":"paint","cell":"2,3","color":"#ff0000"},{"op":"export","format":"svg","output":"test-out.svg"}] |
      When I run `node cli/index.js run instructions.json -o test-state.trkixel.json`
      Then test-state.trkixel.json exists with gridData["2,3"] = "#ff0000"
      And test-out.svg exists and contains "<polygon" elements
      And exit code is 0

    Scenario: Flood fill changes contiguous region
      Given an instructions.json containing create(5,5) + paint(2,3,"#ff0000") + paint(2,4,"#ff0000") + fill(2,3,"#0000ff")
      When I run the batch
      Then gridData["2,3"] and gridData["2,4"] are "#0000ff"
      And exit code is 0

    Scenario: Palette import stores colors in state
      Given a valid palette.gpl file and instructions.json containing create(5,5) + palette(import:"palette.gpl")
      When I run the batch
      Then the output state palette array contains the GPL colors
      And exit code is 0

  Rule: Error handling

    Scenario: Unknown operation exits with error
      Given an instructions.json containing [{"op":"dance"}]
      When I run the batch
      Then exit code is 1
      And stderr contains "unknown operation: dance"

    Scenario: Paint without create exits with error
      Given an instructions.json containing only [{"op":"paint","cell":"0,0","color":"#ff0000"}]
      When I run the batch
      Then exit code is 1
      And stderr contains "requires a \"create\" op first"

    Scenario: Out-of-bounds cell exits with error
      Given a create(5,5) followed by paint(99,99,"#ff0000")
      When I run the batch
      Then exit code is 1
      And stderr contains "out of bounds"

    Scenario: Malformed JSON exits with error
      Given an instructions file containing "not valid json {{{}"
      When I run the batch
      Then exit code is 1
      And stderr contains "could not read or parse"

  Rule: State round-trip

    Scenario: Output state can be consumed by subsequent operations
      Given batch 1 creates a canvas and paints cells
      And batch 1 output is saved to state.trkixel.json
      Then state.trkixel.json is valid JSON with version, config, gridData, palette keys
```

---

## Task Breakdown

| ID   | Task | Priority | Dependencies | Status  |
|:-----|:-----|:---------|:-------------|:--------|
| T1   | Create test instruction files (smoke, fill, palette, error cases) | High | None | done |
| T2   | Run smoke test: create + paint + SVG export | High | T1 | pending |
| T3   | Run flood fill test | High | T1 | pending |
| T4   | Run palette import test (needs a sample .gpl file) | High | T1 | pending |
| T5   | Run all error path tests (unknown op, missing create, OOB, bad JSON) | High | T1 | pending |
| T6   | Validate state file round-trip (output is valid, re-loadable) | High | T2 | pending |
| T7   | Fix any bugs discovered in T2-T6 | High | T2-T6 | pending |
| T8   | (Should-have) Install `canvas`, test PNG export in batch | Med | T7 | pending |

---

## Exit Criteria

> These criteria and tasks T2–T8 are scoped to the follow-on implementation PR, not to the preparatory PR that landed the spec and fixtures.

- [ ] All must-have acceptance scenarios pass (manual CLI verification)
- [ ] All error paths exit with code 1 and descriptive stderr
- [ ] Output `.trkixel.json` is valid and contains expected state
- [ ] SVG export produces valid SVG with correct geometry
- [ ] No regressions on existing CLI subcommands (create, paint, fill, export, palette)
- [ ] All bugs found during testing are fixed and re-verified

---

## References

- Epic: [#32 Native OS App & Agent CLI](https://github.com/Kiriketsuki/TrKixel/issues/32)
- Task issue: [#40 CLI - JSON batch execution](https://github.com/Kiriketsuki/TrKixel/issues/40)
- CLI spec: `trkixel-cli-spec.md` (T6 section)
- Scaffold PR: [#70 feat: scaffold CLI subcommands and rename to TrKixel](https://github.com/Kiriketsuki/TrKixel/pull/70)
- Engine: `src/core/engine.js`
- Batch command: `cli/commands/run.js`

---
*Authored by: Clault KiperS 4.6*
