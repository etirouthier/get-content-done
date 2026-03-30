---
phase: 04-research
plan: 03
subsystem: content-orchestration
tags: [wiring, workflow, agents, installer, routing]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [full-knowledge-to-research-pipeline, content-resume-routing]
  affects: [content-new.md, content-resume.md, install-content.js, content-resume-command]
tech_stack:
  added: []
  patterns: [task-spawn-pattern, sequential-auto-trigger, state-condition-routing]
key_files:
  created: []
  modified:
    - content-creation/workflows/content-new.md
    - content-creation/workflows/content-resume.md
    - bin/install-content.js
    - commands/content/content-resume.md
decisions:
  - "content-new.md Step 7 changed from session-end to mid-session transition — session now continues through Steps 8-10"
  - "Steps 8 and 9 use the established Task-spawn pattern with PROJECT_ROOT passthrough"
  - "content-resume.md Case C auto-triggers Case D after knowledge Task completes — no separate resume needed for sequential knowledge→research flow"
  - "Case E replaces the old Case C stub — same message, correct label for post-research steps"
  - "content-knowledge-capture.md added to AGENT_FILES (content-researcher.md was already present)"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_modified: 4
---

# Phase 4 Plan 3: Agent Wiring Summary

**One-liner:** Orchestrator wiring connecting content-knowledge-capture and content-researcher into both /content:new (Steps 8-10) and /content:resume (Cases C-D) entry points, with installer and command file updates.

## What Was Built

### Task 1: content-new.md Steps 8-10

Extended `content-creation/workflows/content-new.md` with three new steps after the alignment session:

- **Step 7** (modified): Changed from a session-end display to a mid-session "Alignment Complete" transition summary reading MIDSTATE and displaying subject/angle/audience/tone before proceeding to knowledge capture.
- **Step 8**: Spawns `content-knowledge-capture` via Task using the established pattern (`@~/.claude/content-creation/agents/content-knowledge-capture.md` + `PROJECT_ROOT`). The agent handles skip gate, guided questions, and optional reference ingestion autonomously.
- **Step 9**: Auto-triggers `content-researcher` via Task immediately after Step 8 completes — no confirmation gate (D-08 pattern). The agent produces knowledge-map.md autonomously.
- **Step 10**: Final session summary displaying subject, angle_intent, knowledge-map.md path, and ideation as next step. Reads FINAL_STATE to populate the display.

### Task 2: content-resume.md Cases C-D, installer, command file

Replaced the old Case C stub in `content-creation/workflows/content-resume.md`:

- **Case C** (new): Routes to `content-knowledge-capture` when alignment is complete but knowledge is not. Checks for partial knowledge inputs (`beliefs` field) to support resume-mid-capture. After Task completes, auto-triggers Case D if research is still incomplete.
- **Case D** (new): Routes to `content-researcher` when knowledge is complete but research is not. After Task completes, displays completion message with knowledge-map.md path and ideation as next step.
- **Case E** (new): Fallback for all post-research steps. Contains the same "handled by a later phase" message that was previously in old Case C — just correctly labeled.

Updated `bin/install-content.js`: Added `'agents/content-knowledge-capture.md'` to AGENT_FILES array. (`content-researcher.md` was already present from a prior commit.)

Updated `commands/content/content-resume.md`: Added `Task` to the `allowed-tools` list so the resume command context has Task tool access for spawning agents.

## Decisions Made

1. **content-new.md Step 7 changed from session-end to mid-session transition** — the session now continues through Steps 8-10 rather than terminating after alignment. The "Session complete" label moved to Step 10.

2. **Case C auto-triggers Case D** — after the knowledge Task completes in Case C, the workflow immediately checks research state and spawns the researcher if needed. This mirrors the D-08 auto-trigger pattern from content-new.md and avoids requiring a separate `/content:resume` call between knowledge and research.

3. **Case E preserves the old Case C message** — the fallback for later-phase steps uses the same text ("handled by a later phase"), just under the correct case label.

4. **content-knowledge-capture.md added to AGENT_FILES** — the file was not yet in the installer despite the agent existing from Plan 04-01. Added alongside the already-present content-researcher.md.

## Deviations from Plan

### Auto-fixed Issues

None.

### Installer observation

The plan description said to change AGENT_FILES "from" a single-entry array with only `content-aligner.md` to a three-entry array. In reality, `content-researcher.md` was already present from a prior commit (likely added in Plan 04-02's summary commit). The fix was to add only `content-knowledge-capture.md`, resulting in the correct three-entry array. No behavior change — the end state matches the plan's acceptance criteria exactly.

## Known Stubs

None. All Task spawns reference real agent files authored in Plans 04-01 and 04-02. The `{PROJECT_ROOT}` placeholder is a runtime variable, not a stub — it is populated from Step 0 of each workflow.

## Verification Results

```
grep "Step 8\|Step 9\|Step 10" content-creation/workflows/content-new.md  → 3 matches
grep "Case C\|Case D\|Case E" content-creation/workflows/content-resume.md → 3 matches (+ auto-trigger mention)
grep "content-knowledge-capture\|content-researcher" bin/install-content.js → 2 matches
grep "Task" commands/content/content-resume.md → 1 match
grep -c "content-knowledge-capture" content-creation/workflows/content-new.md → 1
grep -c "content-researcher" content-creation/workflows/content-new.md → 1
```

All checks pass.

## Self-Check: PASSED

- content-creation/workflows/content-new.md: FOUND (verified Steps 8-10 present)
- content-creation/workflows/content-resume.md: FOUND (verified Cases C-D-E present)
- bin/install-content.js: FOUND (verified content-knowledge-capture.md in AGENT_FILES)
- commands/content/content-resume.md: FOUND (verified Task in allowed-tools)
- Commit 742fee2: FOUND (Task 1)
- Commit 71acbb2: FOUND (Task 2)
