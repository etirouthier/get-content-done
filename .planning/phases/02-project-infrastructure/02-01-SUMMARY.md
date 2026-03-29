---
phase: 02-project-infrastructure
plan: 01
subsystem: infra
tags: [nodejs, cjs, cli, state-management, json, file-io]

# Dependency graph
requires:
  - phase: 01-global-layer-foundation
    provides: Global ~/.claude/content-creation/ directory with guidance.md anchor file
provides:
  - content-tools.cjs CLI binary with 7 subcommands for content pipeline state management
  - Per-project .content/ directory scaffolding with locked state.json schema
  - Project archiving to .content/archive/{slug}/
  - Slug generation (60-char limit, word boundary truncation)
  - Reference and inspiration file storage with state.json sync
  - bin/install-content.js deploys content-tools.cjs to global ~/.claude/content-creation/bin/
affects:
  - 02-project-infrastructure (content-new.md workflow depends on content-tools.cjs)
  - All subsequent pipeline phases that call content-tools.cjs for state I/O

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CJS Node.js CLI binary with --cwd flag for subagent CWD-reset safety
    - output()/fail() helper pattern mirroring gsd-tools.cjs
    - Atomic state.json writes via synchronous writeFileSync
    - Padded 3-digit file index for reference/inspiration files

key-files:
  created:
    - content-creation/bin/content-tools.cjs
  modified:
    - bin/install-content.js

key-decisions:
  - "content-tools.cjs uses --cwd flag override for all file ops — prevents CWD-reset bugs in subagent contexts"
  - "add-reference writes file + updates state.json atomically in single subcommand call — no partial write risk"
  - "project-init auto-archives existing project before creating new one — single active project invariant enforced by the tool"
  - "BIN_FILES in installer always overwrites on re-run (code is not creator content)"

patterns-established:
  - "content-tools.cjs: --cwd <path> flag parsed first, all path operations use the override"
  - "State updates: readState() → mutate in memory → writeState() (never partial writes)"
  - "Reference indexing: count existing .md files in dir + 1, padded to 3 digits"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04]

# Metrics
duration: 2min
completed: 2026-03-29
---

# Phase 2 Plan 01: Content-Tools CLI Summary

**CJS Node.js CLI (`content-tools.cjs`) with 7 subcommands for per-project state management, slug generation, directory scaffolding, archiving, and reference storage — deployed via updated install-content.js**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T09:20:49Z
- **Completed:** 2026-03-29T09:22:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Built complete `content-tools.cjs` binary with all 7 Phase 2 subcommands callable from source and global install
- `project-init` creates exact state.json schema from CONTEXT.md with 8 pipeline steps
- `add-reference` atomically writes .md file with frontmatter + appends path to state.json references/inspiration array
- `--cwd` flag prevents CWD-reset bugs in all subagent-invoked file operations
- Updated `install-content.js` to deploy `content-tools.cjs` to `~/.claude/content-creation/bin/`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create content-tools.cjs with all Phase 2 subcommands** - `00e9781` (feat)
2. **Task 2: Update install-content.js to deploy content-tools.cjs** - `b0a464d` (feat)

**Plan metadata:** (docs: complete plan — see final commit)

## Files Created/Modified
- `content-creation/bin/content-tools.cjs` - CJS CLI binary; 7 subcommands; --cwd flag; ~300 lines
- `bin/install-content.js` - Added BIN_FILES array, installBinFile(), and bin tools install step

## Decisions Made
- `--cwd` flag parsed first from argv and spliced out before dispatch — all path helpers use this override throughout
- `add-reference` writes the .md file then immediately updates state.json in the same call to eliminate the partial-write failure mode
- `project-init` calls `cmdProjectArchiveInternal()` before creating the new project — archive happens as part of init, not as a separate manual step
- `installBinFile()` unconditionally overwrites (no existence check) because bin tools are versioned code, not editable creator content

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `content-tools.cjs` is fully functional from both source and global install locations
- All 7 subcommands verified via automated tests against temp directories
- `node ~/.claude/content-creation/bin/content-tools.cjs <subcommand>` pattern ready for use in content-new.md workflow (Phase 2 Plan 02)
- state.json schema locked and matches CONTEXT.md exactly — downstream pipeline agents can rely on schema stability

---
*Phase: 02-project-infrastructure*
*Completed: 2026-03-29*
