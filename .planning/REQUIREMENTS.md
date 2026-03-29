# Requirements — Content Creation System

**Project:** Content Creation System (GSD-Adapted)
**Version:** v1
**Generated:** 2026-03-12

---

## v1 Requirements

### Global Layer (GBL)

- [x] **GBL-01**: Creator can define and store editorial guidance (voice, tone, niche, audience, content goals) as a portable Markdown file at `~/.claude/content-creation/guidance.md`, read by every content project on init
- [x] **GBL-02**: System ships with a starter mental model library (~10 named frameworks with descriptions and application prompts) at `~/.claude/content-creation/mental-models.md`; creator can extend with new models
- [x] **GBL-03**: System ships with a starter virality pattern library (hook templates, structure archetypes, narrative patterns) at `~/.claude/content-creation/virality-patterns.md`; creator can extend with new patterns

### Subject Capture & Alignment (SUBJ)

- [ ] **SUBJ-01**: Creator can input a subject in freeform (prose, fragments, or bullets) to initialize a content project
- [ ] **SUBJ-02**: System aligns the subject against editorial guidance (GBL-01) before work begins, surfaces mismatches, and requires creator confirmation to proceed
- [ ] **SUBJ-03**: System outputs a structured subject scope (angle intent, target audience, tone intent) for creator approval before the research phase begins

### Research (RES)

- [ ] **RES-01**: Creator can capture their existing knowledge and beliefs about the subject via a structured prompt before research agents run
- [ ] **RES-02**: Creator can provide references as project inputs — URLs (fetched and extracted) or pasted text — stored per-project, used to inform research and ideation
- [ ] **RES-03**: Research agent maps the subject landscape — existing arguments, publicly known data, counterpoints, angle gaps — and produces a structured knowledge map scoped to the confirmed subject
- [ ] **RES-04**: Research is scoped to the current project; research outputs from one project do not bleed into another

### Ideation (IDEA)

- [ ] **IDEA-01**: System generates 3–7 distinct angles for the subject, including contrarian, narrative, how-to, data-driven, personal experience, and predictive framings, informed by research outputs
- [ ] **IDEA-02**: System applies named mental models from the global library (GBL-02) to the subject and generates non-obvious angles beyond the initial set
- [ ] **IDEA-03**: Creator can react to generated angles with their own instincts and hunches; system incorporates creator feedback and refines the angle options
- [ ] **IDEA-04**: Creator can add new references mid-ideation (URLs or pasted text); system incorporates them and re-runs ideation with the additional context

### Drafting (DRAFT)

- [ ] **DRAFT-01**: System generates a complete Substack article (1000–3000 words) based on the selected angle, research outputs, creator knowledge, and editorial guidance — with voice preservation as primary quality constraint
- [ ] **DRAFT-02**: Article draft is output as clean Substack-compatible Markdown: H1 title, H2 section headers, bold for emphasis, no raw HTML — ready to copy-paste into Substack editor
- [ ] **DRAFT-03**: Article draft enforces required structure: headline, subheadline/deck, hook introduction, body sections with clear progression, conclusion with payoff

### Curation (CUR)

- [ ] **CUR-01**: System analyzes the article's hook (first 2–3 sentences) against hook frameworks from the global library (GBL-03) and rewrites with specific, targeted improvements
- [ ] **CUR-02**: Creator can flag specific sections for improvement; system revises flagged sections and presents the updated draft; loop repeats indefinitely until creator issues an explicit "finalize" command
- [ ] **CUR-03**: System performs structural critique — pacing, section length balance, narrative arc — and generates specific, actionable improvement suggestions
- [ ] **CUR-04**: Creator can request re-generation of a single named section (e.g., introduction, conclusion, a specific body section) without modifying the rest of the article

### LinkedIn (LI)

- [ ] **LI-01**: System extracts the core insight or "why click" element from the finalized article — not a summary, but the specific compelling reason a LinkedIn reader would want to read the full piece
- [ ] **LI-02**: System generates a LinkedIn post with a strong opening line optimized for scroll-stop, using LinkedIn-specific hook patterns (pattern interrupt, bold claim, counter-narrative)
- [ ] **LI-03**: Post copy organically builds to a "read the full article" closing with a link placeholder; character count stays within LinkedIn's above-fold display threshold

### Project Infrastructure (INFRA)

- [x] **INFRA-01**: One slash command (`/content:new`) initializes an isolated content project directory with structured pipeline state tracking
- [x] **INFRA-02**: Pipeline state persists between sessions — creator can exit and resume at any pipeline step without losing work
- [x] **INFRA-03**: References (URLs and pasted text) are stored per-project in the project directory; scoped to that project only
- [x] **INFRA-04**: Final output files are written to the project's `{slug}/` directory (e.g., `why-remote-work-fails/article.md` and `why-remote-work-fails/linkedin-1.md`)

---

## v2 Requirements (Deferred)

These are valuable but not blocking for v1. Defer until the v1 pipeline is validated with real content.

- **Reference library in global knowledge base** — past articles + example articles indexed with summaries; accessible per-project for voice matching. Deferred: not day-one critical; editorial guidance covers voice without it.
- **Past production log** — per-article metadata (title, date, angle, subject, performance notes); prevents repetition, enables series. Deferred: only useful after producing content.
- **Deep-dive sourcing agent** — find specific citations, statistics, quotable passages at quality-over-volume. Deferred: landscape mapping agent is sufficient for MVP.
- **Multiple LinkedIn post variants** — 2–3 variants with different hooks and framing for A/B testing. Deferred: one strong post is MVP; variants are an enhancement.
- **Inline citation placement** — citations embedded at point of use in the draft. Deferred: link-list format acceptable for MVP.
- **Global layer onboarding wizard** (`/content:setup`) — guided setup flow for first-time editorial guidance creation. Deferred: creator can write guidance.md directly for MVP.

---

## Out of Scope

These are explicitly excluded. Reasoning included to prevent re-adding.

- **Direct Substack/LinkedIn API publishing** — copy-paste workflow is intentional; API adds auth complexity without improving content quality; creator controls the publish moment
- **SEO keyword optimization** — competing objective with virality/resonance; if needed, build as a separate optional post-pipeline step, never in the main curation loop
- **Automated posting schedules** — requires platform API integration + credential storage + error handling; removes creator control over publish timing
- **Social media image/visual generation** — separate creative discipline; generated images are rarely publication-ready; out of focus for written content system
- **Multi-creator / team collaboration** — incompatible with single-creator file-based design; separate product dimension
- **Automated performance analytics** — requires external API integration; creator notes performance manually in past production log (v2)
- **Content calendar / idea backlog** — different workflow mode; build as `/content:plan` command if needed (not in current scope)
- **Grammar / spelling autocorrect** — commoditized; available in every editor; not a content strategy system concern

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GBL-01 | Phase 1 — Global Layer Foundation | Complete |
| GBL-02 | Phase 1 — Global Layer Foundation | Complete |
| GBL-03 | Phase 1 — Global Layer Foundation | Complete |
| INFRA-01 | Phase 2 — Project Infrastructure | Complete |
| INFRA-02 | Phase 2 — Project Infrastructure | Complete |
| INFRA-03 | Phase 2 — Project Infrastructure | Complete |
| INFRA-04 | Phase 2 — Project Infrastructure | Complete |
| SUBJ-01 | Phase 3 — Subject Capture and Alignment | Pending |
| SUBJ-02 | Phase 3 — Subject Capture and Alignment | Pending |
| SUBJ-03 | Phase 3 — Subject Capture and Alignment | Pending |
| RES-01 | Phase 4 — Research | Pending |
| RES-02 | Phase 4 — Research | Pending |
| RES-03 | Phase 4 — Research | Pending |
| RES-04 | Phase 4 — Research | Pending |
| IDEA-01 | Phase 5 — Ideation Loop | Pending |
| IDEA-02 | Phase 5 — Ideation Loop | Pending |
| IDEA-03 | Phase 5 — Ideation Loop | Pending |
| IDEA-04 | Phase 5 — Ideation Loop | Pending |
| DRAFT-01 | Phase 6 — Draft Generation | Pending |
| DRAFT-02 | Phase 6 — Draft Generation | Pending |
| DRAFT-03 | Phase 6 — Draft Generation | Pending |
| CUR-01 | Phase 7 — Curation Loop | Pending |
| CUR-02 | Phase 7 — Curation Loop | Pending |
| CUR-03 | Phase 7 — Curation Loop | Pending |
| CUR-04 | Phase 7 — Curation Loop | Pending |
| LI-01 | Phase 8 — LinkedIn Output | Pending |
| LI-02 | Phase 8 — LinkedIn Output | Pending |
| LI-03 | Phase 8 — LinkedIn Output | Pending |
