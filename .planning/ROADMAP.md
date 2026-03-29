# Roadmap: Content Creation System (GSD-Adapted)

## Overview

This roadmap builds a systematic content creation pipeline on the existing GSD infrastructure. The pipeline guides a creator from raw subject idea through research, ideation, long-form Substack drafting, curation, and LinkedIn post generation — preserving the creator's voice throughout. Phases are strictly ordered by dependency: the global editorial knowledge base must exist before any content agent runs, individual pipeline steps are validated independently before integration, and the integrated `/content:new` command is assembled last. Nine phases, 28 requirements, zero orphans.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Global Layer Foundation** - Editorial guidance, mental models, and virality patterns installed at `~/.claude/content-creation/` (completed 2026-03-26)
- [ ] **Phase 2: Project Infrastructure** - Per-content project initialization, pipeline state tracking, and output directory structure
- [ ] **Phase 3: Subject Capture and Alignment** - Creator inputs a subject, system aligns against editorial guidance, outputs confirmed scope
- [ ] **Phase 4: Research** - Creator knowledge capture, reference ingestion, and research agent maps the subject landscape
- [ ] **Phase 5: Ideation Loop** - Two-pass ideation with mental model application and creator-seeded angle generation
- [ ] **Phase 6: Draft Generation** - Full Substack article produced from approved angle with voice preservation as primary constraint
- [ ] **Phase 7: Curation Loop** - Iterative curation with hook analysis, structural critique, and creator-controlled exit
- [ ] **Phase 8: LinkedIn Output** - Final LinkedIn post generation framed as transmission, not summary
- [ ] **Phase 9: Integrated Pipeline** - `/content:new` chains all 8 steps into a single validated workflow

## Phase Details

### Phase 1: Global Layer Foundation
**Goal**: Creator can define and store the editorial knowledge base that every downstream content agent depends on
**Depends on**: Nothing (first phase)
**Requirements**: GBL-01, GBL-02, GBL-03
**Success Criteria** (what must be TRUE):
  1. Creator can write `~/.claude/content-creation/guidance.md` with voice, tone, niche, audience, and content goals — and the file is read by content projects on init
  2. System ships with a starter mental model library at `~/.claude/content-creation/mental-models.md` containing 10+ named frameworks including both structuring and provocation frameworks; creator can add new models
  3. System ships with a starter virality pattern library at `~/.claude/content-creation/virality-patterns.md` containing hook templates, structure archetypes, and narrative patterns; creator can extend it
  4. Creator can annotate voice exemplars in the guidance file using the annotated-example format (excerpt + specific observation), not prose voice description alone
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Install global layer directory structure, guidance template, and install script
- [ ] 01-02-PLAN.md — Author starter mental model library (10+ lenses, operations, and angle-generation recipes)
- [ ] 01-03-PLAN.md — Author starter virality pattern library (Substack + LinkedIn hook patterns and structure archetypes)

### Phase 2: Project Infrastructure
**Goal**: Creator can initialize an isolated per-content project that persists pipeline state across sessions
**Depends on**: Phase 1
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Running `/content:new` creates an isolated `.content/` project directory with structured pipeline state tracking
  2. Creator can exit and resume at any pipeline step without losing work — pipeline state survives session boundaries
  3. References (URLs and pasted text) are stored in the project directory, scoped to that project only, and not accessible from other projects
  4. Final output files are written to the project's `{slug}/` directory (e.g., `why-remote-work-fails/article.md` and `why-remote-work-fails/linkedin-1.md`)
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Build content-tools.cjs data layer module and update install-content.js to deploy it
- [ ] 02-02-PLAN.md — Create /content:new command file and 5-question session workflow with per-sub-step checkpoints
- [ ] 02-03-PLAN.md — Create /content:resume command file and workflow with full context display and continuation routing
- [ ] 02-04-PLAN.md — Update installer to deploy workflow files and record output_dir in state.json

### Phase 3: Subject Capture and Alignment
**Goal**: Creator can input a subject in freeform and receive a confirmed scope aligned with editorial guidance before any research begins
**Depends on**: Phase 2
**Requirements**: SUBJ-01, SUBJ-02, SUBJ-03
**Success Criteria** (what must be TRUE):
  1. Creator can enter a subject as prose, fragments, or bullets and the system accepts it without requiring structured input
  2. System surfaces any mismatches between the subject and the creator's editorial guidance (niche, audience, tone) and requires creator confirmation before proceeding — off-niche subjects are soft-gated, not hard-blocked
  3. System outputs a structured subject scope (angle intent, target audience, tone intent) for creator approval, and no research begins until the creator explicitly confirms
**Plans**: TBD

Plans:
- [ ] 03-01: Build subject capture step with freeform input handling
- [ ] 03-02: Implement editorial alignment check against GBL-01 guidance with mismatch surfacing
- [ ] 03-03: Build structured scope output and creator approval checkpoint

### Phase 4: Research
**Goal**: Creator's existing knowledge informs research scope, and research agents map the subject landscape distinguishing known ground from contested from underexplored
**Depends on**: Phase 3
**Requirements**: RES-01, RES-02, RES-03, RES-04
**Success Criteria** (what must be TRUE):
  1. Creator can capture their existing knowledge and beliefs about the subject through a structured prompt before any research agent runs — this output explicitly scopes what the research agent should treat as already covered
  2. Creator can provide URLs (fetched and extracted) or pasted text as project references, stored per-project, available to research and ideation agents
  3. Research agent produces a structured knowledge map scoped to the confirmed subject with three explicit sections: (a) consensus ground to skip, (b) current practitioner debate, (c) specific contradictions and anomalies — not a generic survey
  4. Research outputs are fully isolated to the current project and do not bleed into any other content project
**Plans**: TBD

Plans:
- [ ] 04-01: Build creator knowledge capture step with structured "what do you already know?" prompt
- [ ] 04-02: Implement URL fetch + pasted-text reference ingestion into per-project storage
- [ ] 04-03: Build `content-researcher` agent with knowledge-map output structure (consensus / debate / anomalies)
- [ ] 04-04: Verify research scope isolation (per-project output, no cross-project access)

### Phase 5: Ideation Loop
**Goal**: Creator seeds angles first, then agents expand using mental models and research, producing non-obvious angle options the creator can refine
**Depends on**: Phase 4
**Requirements**: IDEA-01, IDEA-02, IDEA-03, IDEA-04
**Success Criteria** (what must be TRUE):
  1. System generates 3–7 distinct angles covering contrarian, narrative, how-to, data-driven, personal experience, and predictive framings — all informed by Phase 4 research outputs, not generated from priors alone
  2. System applies named mental models from GBL-02 to the subject and surfaces angles beyond the initial 3–7 set — each model-generated angle includes explicit reasoning for why it is non-obvious
  3. Creator can provide their own instincts and hunches as seeds before agents generate anything; agent expansion is anchored to creator seeds, not the reverse
  4. Creator can add new references mid-ideation (URLs or pasted text) and the system re-runs ideation incorporating the new context without requiring the creator to restart the round
**Plans**: TBD

Plans:
- [ ] 05-01: Build two-pass ideation: creator seeds first, then `content-ideator` agent expands
- [ ] 05-02: Implement mental model application pass (GBL-02) with non-obvious angle generation
- [ ] 05-03: Build creator feedback loop — reaction capture, angle refinement, mid-ideation reference injection
- [ ] 05-04: Build angle selection checkpoint (creator confirms selected angle before draft)

### Phase 6: Draft Generation
**Goal**: System produces a complete, copy-paste-ready Substack article in the creator's voice from the approved angle and research context
**Depends on**: Phase 5
**Requirements**: DRAFT-01, DRAFT-02, DRAFT-03
**Success Criteria** (what must be TRUE):
  1. System generates a complete Substack article (1,000–3,000 words) using voice exemplars from GBL-01 as primary voice specification — the draft sounds like the creator, not generic AI prose
  2. Article is output as clean Substack-compatible Markdown: H1 title, H2 section headers, bold for emphasis, no raw HTML — ready to copy-paste into the Substack editor without reformatting
  3. Article follows the required structure: headline, subheadline/deck, hook introduction, body sections with clear progression, conclusion with payoff — no structural sections missing
**Plans**: TBD

Plans:
- [ ] 06-01: Build `content-drafter` agent with voice exemplar loading as primary context (not optional)
- [ ] 06-02: Implement Deep Specific Insight Structure template (hook → setup → counterintuitive core → evidence → implications → reframe → CTA)
- [ ] 06-03: Build `/content:draft` command + workflow with Substack Markdown output validation

### Phase 7: Curation Loop
**Goal**: Creator iteratively refines the draft for virality using hook analysis and structural critique until they issue an explicit finalize command
**Depends on**: Phase 6
**Requirements**: CUR-01, CUR-02, CUR-03, CUR-04
**Success Criteria** (what must be TRUE):
  1. System analyzes the article's hook (first 2–3 sentences) against hook frameworks from GBL-03 and rewrites with specific, targeted improvements — not generic "make it more compelling" suggestions
  2. Creator can flag specific sections for improvement; system revises flagged sections and presents the updated draft; this loop repeats indefinitely until the creator issues an explicit "finalize" command
  3. System performs structural critique covering pacing, section length balance, and narrative arc — critique is specific and actionable, not impressionistic
  4. Creator can request re-generation of a single named section (introduction, conclusion, or a specific body section) without any other part of the article being modified
**Plans**: TBD

Plans:
- [ ] 07-01: Build `content-curator` agent with hook analysis against GBL-03 virality patterns
- [ ] 07-02: Implement creator-flagged section revision with indefinite loop and explicit-finalize exit
- [ ] 07-03: Implement structural critique (pacing, section balance, narrative arc) as distinct pass from hook curation
- [ ] 07-04: Build single-section re-generation capability (named section, rest of article unchanged)

### Phase 8: LinkedIn Output
**Goal**: System generates a LinkedIn post framed as transmission (not summary) that drives click-through with a strong scroll-stop opening
**Depends on**: Phase 7
**Requirements**: LI-01, LI-02, LI-03
**Success Criteria** (what must be TRUE):
  1. System extracts the core "why click" element from the finalized article — the one sentence that, if read out of context, would provoke engagement — not a summary of what the article covers
  2. System generates a LinkedIn post with a strong opening line using LinkedIn-specific hook patterns (pattern interrupt, bold claim, counter-narrative) optimized for scroll-stop in the above-fold first line
  3. Post builds organically to a "read the full article" closing with a link placeholder, stays within LinkedIn's above-fold display threshold, and uses LinkedIn formatting conventions (short paragraphs, white space, no outbound links in body)
**Plans**: TBD

Plans:
- [ ] 08-01: Build `content-linkedin` agent framed as "transmission not summary" with provocation-first extraction
- [ ] 08-02: Implement LinkedIn post generation with hook-type targeting and formatting constraints
- [ ] 08-03: Build `/content:linkedin` command + workflow with output to `{slug}/linkedin-1.md`

### Phase 9: Integrated Pipeline
**Goal**: Creator can run a single `/content:new` command and progress through the complete 8-step pipeline with creator gates at subject alignment, angle selection, and curation approval
**Depends on**: Phase 8
**Requirements**: None new — assembles Phases 1–8 into a single validated workflow
**Success Criteria** (what must be TRUE):
  1. Running `/content:new "subject"` initializes a content project and drives the creator through all 8 pipeline steps in order — no manual command chaining required
  2. Creator gates at steps 3 (reference gathering), 5 (angle selection), and 7 (curation approval) stop the pipeline and return structured output; a continuation agent resumes after the creator responds
  3. Full pipeline mode and lightweight mode (skip research, go direct to draft) are selectable at the entry point before any agents are spawned
  4. Final output files (`article.md` and `linkedin-1.md`) are written to `{slug}/` only after explicit creator approval at the curation gate
**Plans**: TBD

Plans:
- [ ] 09-01: Build integrated `/content:new` workflow chaining all 8 steps with creator gate checkpoints
- [ ] 09-02: Implement full vs. lightweight mode routing at pipeline entry point
- [ ] 09-03: End-to-end validation run: full pipeline from subject to final outputs

## Progress

**Execution Order:**
Phases execute in strict numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Global Layer Foundation | 3/3 | Complete   | 2026-03-26 |
| 2. Project Infrastructure | 2/4 | In Progress|  |
| 3. Subject Capture and Alignment | 0/3 | Not started | - |
| 4. Research | 0/4 | Not started | - |
| 5. Ideation Loop | 0/4 | Not started | - |
| 6. Draft Generation | 0/3 | Not started | - |
| 7. Curation Loop | 0/4 | Not started | - |
| 8. LinkedIn Output | 0/3 | Not started | - |
| 9. Integrated Pipeline | 0/3 | Not started | - |
