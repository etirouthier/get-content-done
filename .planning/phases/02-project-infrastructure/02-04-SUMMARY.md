---
phase: 02-project-infrastructure
plan: 04
subsystem: infra
tags: [install-script, workflow, state-management, output-directory]

# Dependency graph
requires:
  - phase: 02-project-infrastructure
    provides: content-tools.cjs with project-init, state-checkpoint, add-reference subcommands
  - phase: 02-project-infrastructure
    provides: content-new.md workflow with 5-step subject capture flow
provides:
  - install-content.js deploys workflow files (content-new.md, content-resume.md) to global layer on every run
  - content-new.md records output_dir in state.json after project-init so Phase 6/8 know where to write final deliverables
  - End-of-session verification block confirms full project directory structure after /content:new completes
affects: [phase-06-draft, phase-08-linkedin, any phase writing article.md or linkedin-1.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Workflow files are code (always overwritten on install re-run), not creator content
    - output_dir stored in state.json subject_capture.inputs so downstream phases read it without configuration

key-files:
  created: []
  modified:
    - bin/install-content.js
    - content-creation/workflows/content-new.md

key-decisions:
  - "Workflow files (content-new.md, content-resume.md) treated as code — always overwritten on install re-run, like BIN_FILES"
  - "output_dir stored via state-checkpoint in subject_capture step — no new top-level write needed, downstream phases read from steps.subject_capture.inputs.output_dir"
  - "End-of-session verification block added at workflow level (not content-tools.cjs level) — keeps data layer clean, verification is executor concern"

patterns-established:
  - "installWorkflowFile(): same structure as installBinFile() — source-check guard + always-overwrite copy"
  - "output_dir checkpoint call immediately after subject checkpoint — both written in same sub-step, atomic pair"

requirements-completed: [INFRA-03, INFRA-04]

# Metrics
duration: 1min
completed: 2026-03-29
---

# Phase 2 Plan 04: Output Directory Infrastructure and Workflow Deployment Summary

**install-content.js now deploys workflow .md files to global layer, and content-new.md records output_dir in state.json so Phase 6/8 can write article.md and linkedin-1.md without path configuration**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-29T09:29:19Z
- **Completed:** 2026-03-29T09:30:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- install-content.js additive update: WORKFLOW_FILES array + installWorkflowFile() + install loop deploy content-new.md and content-resume.md to ~/.claude/content-creation/workflows/ on every run
- content-new.md records output_dir in state.json via state-checkpoint call after project-init, closing the path-discovery gap for Phase 6 (article draft) and Phase 8 (LinkedIn copy)
- End-of-session verification block added to content-new.md to confirm .content/state.json, .content/references/, .content/inspiration/, and {slug}/ all exist after /content:new completes

## Task Commits

Each task was committed atomically:

1. **Task 1: Update install-content.js to deploy workflow files** - `ff999f4` (feat)
2. **Task 2: Record output_dir in state.json and verify end-to-end directory structure** - `9b76dc9` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `bin/install-content.js` - Added WORKFLOW_FILES array, installWorkflowFile() function, and workflow install loop
- `content-creation/workflows/content-new.md` - Added output_dir state-checkpoint after project-init and end-of-session directory verification block

## Decisions Made
- Workflow files are code, always overwritten on install re-run (same treatment as BIN_FILES)
- output_dir stored via state-checkpoint in subject_capture step — uses existing subcommand, no new flag needed
- Verification block placed at workflow level so content-tools.cjs remains a pure data layer

## Deviations from Plan

None - plan executed exactly as written.

Note: content-resume.md does not yet exist in source — installer skips it gracefully with "! Skipping" message as designed. This is expected behavior; content-resume.md will be created in a later plan.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 (Project Infrastructure) complete: content-tools.cjs, /content:new workflow, /content:resume workflow skeleton, output directories, and state.json path tracking all in place
- Phase 3 can proceed: alignment agent has access to output_dir via state.json
- Phase 6 and Phase 8 can write article.md and linkedin-1.md to {slug}/ without additional configuration

---
*Phase: 02-project-infrastructure*
*Completed: 2026-03-29*
