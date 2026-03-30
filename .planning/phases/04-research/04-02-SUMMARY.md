---
phase: 04-research
plan: 02
subsystem: agent
tags: [content-researcher, knowledge-map, research-agent, creator-priors, lazy-loading]

# Dependency graph
requires:
  - phase: 04-01
    provides: content-knowledge-capture agent and knowledge step inputs in state.json
  - phase: 03-01
    provides: content-aligner.md canonical agent pattern (Step 0, --cwd, @file: handling)

provides:
  - content-researcher.md specialist agent with three-section knowledge map output
  - knowledge-map.md written to {output_dir}/ with frontmatter and creator-prior annotations
  - Lazy reference loading pattern for agents with variable reference counts
  - Inline attribution pattern ("Widely attributed to" / "No clear origin")

affects:
  - Phase 04-03: content-new.md/content-resume.md wiring — researcher spawned via Task after knowledge capture
  - Phase 05: Ideation agents read knowledge-map.md for research-informed angle generation

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lazy reference loading: read each reference individually during synthesis, not bulk-read in Step 0"
    - "Creator-prior annotation: 'You noted {paraphrase} — [confirms/debated/silent]' cross-references knowledge capture against public landscape"
    - "KNOWLEDGE_SKIPPED detection: all four fields (beliefs, evidence, gaps, hot_takes) null/absent = skip all annotations"
    - "D-06 density constraint: 3-5 bullets max per section — breadth over depth"

key-files:
  created:
    - content-creation/agents/content-researcher.md
  modified:
    - bin/install-content.js

key-decisions:
  - "Lazy reference loading adopted (not bulk): references read individually during synthesis to avoid context overload with many reference files (Pitfall 2 from 04-RESEARCH.md)"
  - "OUTPUT_DIR from state.steps.subject_capture.inputs.output_dir — deliverables path, not .content/ state directory"
  - "Agent is fully autonomous (no AskUserQuestion calls) — runs headlessly after Task spawn by orchestrator"
  - "Installer updated with content-researcher.md in AGENT_FILES — agent-as-code semantics (always overwritten)"

patterns-established:
  - "Write tool for deliverable files: knowledge-map.md uses Write tool, not Bash echo — consistent with future article.md pattern"
  - "knowledge_capture_skipped frontmatter flag: boolean in output file indicating whether creator priors were available for cross-referencing"
  - "Dual reference source loading: check both knowledge.inputs.references AND subject_capture.inputs.references for complete reference set"

requirements-completed:
  - RES-03
  - RES-04

# Metrics
duration: 3min
completed: 2026-03-30
---

# Phase 04 Plan 02: Research Agent Summary

**content-researcher agent with lazy reference loading, creator-prior annotation, and three-section knowledge map (consensus / debate / anomalies) written to the project deliverables directory**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-30T14:43:13Z
- **Completed:** 2026-03-30T14:45:45Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- content-researcher.md agent authored, following the exact content-aligner.md four-section structure (Step 0 context read, Steps 1-3 synthesis and write, Step 4 display + complete)
- Three-section knowledge map with creator-prior cross-referencing ("You noted" annotation phrasing) and inline attribution for notable claims
- Lazy reference loading pattern documented — prevents context overload when projects have many references
- bin/install-content.js updated to deploy content-researcher.md on `node bin/install-content.js` runs

## Task Commits

Each task was committed atomically:

1. **Task 1: Author content-researcher.md agent file** - `355bd2b` (feat)

**Plan metadata:** _(final commit pending)_

## Files Created/Modified
- `content-creation/agents/content-researcher.md` - Research agent: reads state.json + references, maps subject landscape into knowledge-map.md, writes to {output_dir}/, displays inline, marks research step complete
- `bin/install-content.js` - Added agents/content-researcher.md to AGENT_FILES array

## Decisions Made
- Lazy reference loading over bulk-read: The plan explicitly calls this out (Pitfall 2) because researchers may have many reference files; Step 0 reads only state.json, Step 1 documents the pattern, Step 2 loads lazily during synthesis
- OUTPUT_DIR sourced from state.steps.subject_capture.inputs.output_dir — the deliverables slug directory (e.g., `why-remote-work-fails/knowledge-map.md`), not .content/ (state directory)
- No interactive steps: agent is fully autonomous (no AskUserQuestion calls), consistent with D-08 (automatic trigger after knowledge capture)

## Deviations from Plan

### Auto-added Missing Critical Functionality

**1. [Rule 2 - Missing functionality] Added content-researcher.md to install-content.js AGENT_FILES**
- **Found during:** Task 1 execution
- **Issue:** 04-RESEARCH.md explicitly states AGENT_FILES must include 'agents/content-researcher.md' — the agent cannot be deployed without it
- **Fix:** Added 'agents/content-researcher.md' to AGENT_FILES in bin/install-content.js (additive change)
- **Files modified:** bin/install-content.js
- **Commit:** 355bd2b (included in same task commit)

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- content-researcher.md is ready to be wired into content-new.md (Steps 8-10) and content-resume.md (Cases C-D) in Plan 04-03
- Researcher is spawned via Task tool with `PROJECT_ROOT: {PROJECT_ROOT}` in instruction body (same pattern as content-aligner)
- knowledge-map.md output is available in {slug}/ directory for downstream ideation agents (Phase 05)

---
*Phase: 04-research*
*Completed: 2026-03-30*
