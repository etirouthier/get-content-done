# content-researcher workflow

Reads confirmed subject scope, creator knowledge capture, and project references from state.json, then maps the subject landscape into a structured knowledge map (consensus / debate / anomalies) annotated against the creator's priors. Writes knowledge-map.md to the project output directory and displays it inline. All bash calls pass `--cwd "$PROJECT_ROOT"`.

This agent is loaded by orchestrators via Task tool. It runs autonomously — no interactive steps.

---

## Step 0 — Read context

Capture PROJECT_ROOT from the caller's message. Run:

```bash
STATE=$(node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" state-read)
if [[ "$STATE" == @file:* ]]; then STATE=$(cat "${STATE#@file:}"); fi
echo "$STATE"
```

Parse STATE to extract:
- SLUG = state.slug
- SUBJECT = state.steps.subject_capture.inputs.subject
- ANGLE_INTENT = state.steps.alignment.inputs.angle_intent
- TARGET_AUDIENCE = state.steps.alignment.inputs.target_audience
- TONE_INTENT = state.steps.alignment.inputs.tone_intent
- OUTPUT_DIR = state.steps.subject_capture.inputs.output_dir
- BELIEFS = state.steps.knowledge.inputs.beliefs (may be null or absent)
- EVIDENCE = state.steps.knowledge.inputs.evidence (may be null or absent)
- GAPS = state.steps.knowledge.inputs.gaps (may be null or absent)
- HOT_TAKES = state.steps.knowledge.inputs.hot_takes (may be null or absent)
- KNOWLEDGE_REFERENCE_PATHS = state.steps.knowledge.inputs.references (array of relative file paths, may be empty or absent)
- SUBJECT_CAPTURE_REFERENCE_PATHS = state.steps.subject_capture.inputs.references (array of relative file paths, may be empty or absent)

Determine KNOWLEDGE_SKIPPED: if all four fields (beliefs, evidence, gaps, hot_takes) are null, empty, or absent — treat as skipped.

Then use the Read tool to load: `~/.claude/content-creation/guidance.md`

Extract niche and audience context only (for scoping research relevance — filtering out consensus that doesn't apply to the creator's specific niche). Do NOT use guidance.md for prose style; the knowledge map is a structured artifact, not an article.

---

## Step 1 — Load references (lazy, not bulk)

References are loaded individually during synthesis in Step 2, not bulk-loaded upfront.

Compile the full list of reference paths from both sources:
- All paths from KNOWLEDGE_REFERENCE_PATHS (references added during knowledge capture)
- All paths from SUBJECT_CAPTURE_REFERENCE_PATHS (references added during initial subject capture)

For each reference path needed during synthesis in Step 2, use the Read tool to load:
`$PROJECT_ROOT/.content/{path}`

For example, if the path is `references/001.md`, load `$PROJECT_ROOT/.content/references/001.md`.

Extract the body content (below the frontmatter `---` block) for use in the knowledge map synthesis.

Do NOT read all references before starting synthesis. Read each one individually as it becomes relevant to a specific section of the knowledge map.

---

## Step 2 — Map the subject landscape

Using all available context — subject, angle_intent, target_audience, tone_intent, creator knowledge answers (beliefs, evidence, gaps, hot_takes), reference content (loaded lazily in Step 1), and guidance niche/audience — research the subject and produce a knowledge map.

The knowledge map has three sections. Each section has 3–5 bullet points maximum (D-06: breadth over depth — the creator reads this in 2 minutes and moves to ideation).

**Section structure:**

**Consensus Ground** — widely agreed facts, established frameworks, baseline positions that aren't contested among practitioners. What everyone already knows. Note it, don't skip it.

**Current Debate** — active practitioner disagreements, competing frameworks, contested data, unresolved tensions. Where smart people disagree.

**Anomalies and Underexplored Territory** — contradictions, outlier findings, angles nobody is writing about, gaps between what research says and what practitioners believe.

**Annotation logic (D-05 — full landscape, annotated):**

For each bullet in all three sections:
1. Check if the creator mentioned this territory in their knowledge capture (beliefs, evidence, gaps, or hot_takes)
2. If yes, annotate inline: "You noted {paraphrase} — [the public record confirms this / this is actively debated / the public record is largely silent on this, which is itself notable]."
3. If no prior mention from creator: no annotation needed (annotation is for value-add, not noise)
4. If KNOWLEDGE_SKIPPED is true: omit all "You noted" annotations (nothing to cross-reference)

**Inline attribution (D-07 — notable claims only):**

Where attribution changes how the creator would use the point, add a brief source note inline:
- "Widely attributed to [author/source]"
- "No clear origin — folk wisdom territory"

Not every bullet needs attribution. Only add where it genuinely matters (a specific person's framework, a contested statistic, a finding commonly misattributed).

---

## Step 3 — Write knowledge-map.md

Use the Write tool (not Bash echo) to write the knowledge map to:
`$PROJECT_ROOT/$OUTPUT_DIR/knowledge-map.md`

The file must have this exact structure:

```markdown
---
project: {SLUG}
subject: {SUBJECT}
created_at: {ISO 8601 timestamp}
knowledge_capture_skipped: {true if KNOWLEDGE_SKIPPED, false otherwise}
---

## Knowledge Map

### Consensus Ground
[3–5 bullets: widely agreed facts, established frameworks, baseline that isn't contested]

### Current Debate
[3–5 bullets: active practitioner disagreements, competing frameworks, contested data]

### Anomalies and Underexplored Territory
[3–5 bullets: contradictions, outlier findings, angles nobody is writing about]
```

OUTPUT_DIR comes from state.steps.subject_capture.inputs.output_dir (e.g., `why-remote-work-fails`). The Write target is `$PROJECT_ROOT/$OUTPUT_DIR/knowledge-map.md` — not `$PROJECT_ROOT/.content/knowledge-map.md`. The deliverables directory is the slug directory, not the state directory.

---

## Step 4 — Display inline and mark complete

Display the full knowledge map content in the conversation (not just a file path reference). The creator should be able to read the complete map without opening any file (D-09).

Then mark research complete:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step research --complete
```

Display:

```
Research complete. Knowledge map written to {OUTPUT_DIR}/knowledge-map.md
```

---

## Implementation notes

- PROJECT_ROOT is passed by the caller — never re-capture with $(pwd) inside this agent (CWD resets between bash calls in Task contexts)
- All content-tools.cjs calls must pass --cwd "$PROJECT_ROOT"
- The @file: handling pattern on state-read output is required — always check and unwrap before parsing
- References are read lazily (one at a time as needed during synthesis in Step 2) — do NOT bulk-read all references in Step 0 or Step 1 before starting synthesis
- The Write tool is used for knowledge-map.md (not Bash echo) — consistent with how future draft agents write article.md
- OUTPUT_DIR comes from state.steps.subject_capture.inputs.output_dir — NOT from .content/ (that is the state directory, not the deliverables directory)
- Per-project isolation is enforced by --cwd "$PROJECT_ROOT" on all content-tools.cjs calls — no global state is read or written
- This agent has NO interactive steps (no AskUserQuestion calls) — it runs autonomously after being spawned by the orchestrator
- guidance.md path is always $HOME/.claude/content-creation/guidance.md — never a relative path
- knowledge_capture_skipped frontmatter field is true only if all four knowledge fields (beliefs, evidence, gaps, hot_takes) are absent or null
