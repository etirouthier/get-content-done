---
phase: 02-project-infrastructure
plan: 02
subsystem: infra
tags: [content-tools, slash-command, workflow, state-machine, sequential-capture]

# Dependency graph
requires:
  - phase: 02-project-infrastructure/02-01
    provides: content-tools.cjs CLI with init, project-init, state-checkpoint, add-reference subcommands

provides:
  - commands/content/content-new.md — /content:new slash command registration
  - content-creation/workflows/content-new.md — 5-question sequential capture workflow with checkpoints

affects:
  - 02-03 (content:resume command — resumes from subject_capture complete)
  - 03-alignment-research (reads state.json subject/intent/knowledge/references populated here)
  - All downstream phases that depend on .content/state.json pipeline state

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Slash command pattern (name in frontmatter, execution_context @-reference, process block)
    - Sequential capture with immediate checkpoint writes before next question
    - Gate-check pattern (global_layer_exists false → stop with install instruction)
    - Active project detection with resume/fresh-start branching before capture begins
    - JSON-encoded --value arguments for state-checkpoint string fields

key-files:
  created:
    - commands/content/content-new.md
    - content-creation/workflows/content-new.md
  modified: []

key-decisions:
  - "Workflow file is prose-and-bash (no YAML frontmatter) — it is a workflow, not a command registration"
  - "guidance.md included in execution_context of command file so creator editorial context is available during first session"
  - "Checkpoint written immediately after each sub-step answer, not batched at end of session"

patterns-established:
  - "Sequential capture pattern: AskUserQuestion → immediate checkpoint → next question (never batched)"
  - "Gate-check at Step 0: global_layer_exists must be true before any project-init call"
  - "Loop pattern for multi-value inputs (references, inspiration): add-reference per item, checkpoint after loop completes"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: 2min
completed: 2026-03-29
---

# Phase 2 Plan 02: content-new Command and Workflow Summary

**`/content:new` slash command with 5-question sequential capture workflow — subject, intent, knowledge, references, inspiration — writing state.json checkpoints after each answer**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T09:25:15Z
- **Completed:** 2026-03-29T09:27:16Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `commands/content/content-new.md` as the registered `/content:new` slash command entry point
- Authored `content-creation/workflows/content-new.md` with all 5 sequential capture steps and immediate checkpoints
- Step 0 gate-check prevents running without global layer installed; active project detection offers resume or start-fresh before capture begins

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /content:new command file** - `375d298` (feat)
2. **Task 2: Author content-new.md workflow** - `935bbab` (feat)

## Files Created/Modified

- `commands/content/content-new.md` — Slash command registration for /content:new; references workflow at ~/.claude/content-creation/workflows/content-new.md
- `content-creation/workflows/content-new.md` — Full session workflow: gate-check, 5 AskUserQuestion steps, checkpoint after each, loop handling for references/inspiration, final confirmation summary

## Decisions Made

- Workflow file uses prose-and-bash format with no YAML frontmatter — it is a workflow document loaded by execution_context, not a command registration
- `guidance.md` included in command file's execution_context so creator editorial context is available to the agent during the first session
- Checkpoint writes are immediate (before proceeding to next question), not batched — matches the "after each sub-step answer, state.json is written to disk immediately" must-have truth

## Deviations from Plan

None - plan executed exactly as written.

The plan noted a typo in the task description (`$HOME/.claire/...` should be `$HOME/.claude/...`). The correct path was used in the authored workflow file — this was an obvious typo fix, not a deviation.

## Issues Encountered

None. The install script (bin/install-content.js) already handles the `workflows/` subdirectory via `const SUBDIRS = ['bin', 'workflows', 'templates']` — no update needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/content:new` command is registered and ready to invoke in Claude Code
- Workflow will deploy correctly via `node bin/install-content.js` (workflows/ already in SUBDIRS)
- state.json subject_capture step will be complete after a full session, ready for 02-03 (content:resume) and Phase 3 alignment/research agents

---
*Phase: 02-project-infrastructure*
*Completed: 2026-03-29*
