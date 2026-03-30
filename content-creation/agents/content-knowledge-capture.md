# content-knowledge-capture workflow

Reads state.json, offers a skip gate, captures the creator's existing knowledge via 4 guided questions with per-answer checkpoints, prompts for optional reference URLs or pasted text attributed to the knowledge step, and marks the knowledge step complete. All bash calls pass `--cwd "$PROJECT_ROOT"`.

This agent is loaded by orchestrators via Task tool. It owns the full knowledge capture session from start to completion.

---

## Step 0 — Read context

Capture PROJECT_ROOT from the caller's message. Run:

```bash
STATE=$(node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" state-read)
if [[ "$STATE" == @file:* ]]; then STATE=$(cat "${STATE#@file:}"); fi
echo "$STATE"
```

Parse STATE to extract:
- SUBJECT = state.steps.subject_capture.inputs.subject
- ANGLE_INTENT = state.steps.alignment.inputs.angle_intent
- TARGET_AUDIENCE = state.steps.alignment.inputs.target_audience
- TONE_INTENT = state.steps.alignment.inputs.tone_intent
- OUTPUT_DIR = state.steps.subject_capture.inputs.output_dir

Also check for already-captured knowledge inputs (for resume support):
- EXISTING_BELIEFS = state.steps.knowledge.inputs.beliefs (may be null)
- EXISTING_EVIDENCE = state.steps.knowledge.inputs.evidence (may be null)
- EXISTING_GAPS = state.steps.knowledge.inputs.gaps (may be null)
- EXISTING_HOT_TAKES = state.steps.knowledge.inputs.hot_takes (may be null)

Display context summary:

```
--- Knowledge Capture ---

Subject: {SUBJECT}
Angle: {ANGLE_INTENT}
Audience: {TARGET_AUDIENCE}
```

---

## Step 1 — Skip gate

ONLY run this step if NO knowledge inputs already exist (all four fields are null). If any field is already populated, skip this step and proceed to Step 2 (resume from where the session left off — the individual question skips in Step 2 will handle already-answered fields).

Use AskUserQuestion:
- question: "Do you have existing knowledge about this subject you'd like to capture? This helps the research agent focus on what's new to you."
- options:
  - "Yes - I have beliefs, evidence, or hot takes to share"
  - "No - skip this step, research the full landscape"

If "No - skip this step, research the full landscape": call `state-checkpoint --step knowledge --complete` immediately and display this message, then exit:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step knowledge --complete
```

```
Knowledge capture skipped. Research will map the full landscape.
Current step: research
```

If "Yes - I have beliefs, evidence, or hot takes to share": proceed to Step 2.

---

## Step 2 — Guided questions

Ask 4 questions sequentially via AskUserQuestion. For each question, skip it if the corresponding field already exists in state (resume support — the creator has already answered this question in a prior session).

**Q1 — Beliefs** (skip if EXISTING_BELIEFS is not null):

Use AskUserQuestion:
- question: "What do you already believe is true about this subject? (Your working assumptions — things you'd bet on even without proof)"
- No options, freeform text answer

After receiving the answer, checkpoint immediately:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step knowledge --sub-step beliefs_captured \
  --field beliefs --value '"$BELIEFS"'
```

**Q2 — Evidence** (skip if EXISTING_EVIDENCE is not null):

Use AskUserQuestion:
- question: "What evidence or experience backs up your beliefs? (Personal observations, data you've seen, conversations, things you've read)"
- No options, freeform text answer

After receiving the answer, checkpoint immediately:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step knowledge --sub-step evidence_captured \
  --field evidence --value '"$EVIDENCE"'
```

**Q3 — Gaps** (skip if EXISTING_GAPS is not null):

Use AskUserQuestion:
- question: "Where are your knowledge gaps? (Things you suspect but can't prove, areas where you're guessing, questions you'd want the research to answer)"
- No options, freeform text answer

After receiving the answer, checkpoint immediately:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step knowledge --sub-step gaps_captured \
  --field gaps --value '"$GAPS"'
```

**Q4 — Hot takes** (skip if EXISTING_HOT_TAKES is not null):

Use AskUserQuestion:
- question: "Any contrarian instincts or hot takes? (Things most people get wrong about this subject, unpopular opinions you hold, claims you'd argue against the consensus on)"
- No options, freeform text answer

After receiving the answer, checkpoint immediately:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step knowledge --sub-step hot_takes_captured \
  --field hot_takes --value '"$HOT_TAKES"'
```

---

## Step 3 — Reference ingestion (optional)

Use AskUserQuestion:
- question: "Do you have any reference URLs or text to add? These inform the research agent — completely optional."
- options:
  - "Yes - I have references to add"
  - "No - skip references, proceed to research"

If "No - skip references, proceed to research": proceed to Step 4.

If "Yes - I have references to add": enter a loop. Use AskUserQuestion (freeform, no options):
- question: "Paste a URL or text reference. Type 'done' when finished."

For each response:
- If the response is "done" or empty: exit loop, proceed to Step 4
- If the response is a URL (starts with http:// or https://): store with `--source "$URL" --content ""`
- If the response is pasted text (not a URL): store with `--source "" --content "$TEXT"`

For each reference:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  add-reference --type reference --source "$SOURCE" --content "$CONTENT" --step knowledge
```

After each add-reference call, use AskUserQuestion:
- question: "Another reference, or done?"

After the loop exits (creator typed 'done' or chose skip), write the references checkpoint:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step knowledge --sub-step references_captured
```

(Note: state.json references array is already updated atomically by each add-reference call — this checkpoint marks the sub-step complete, not individual references)

---

## Step 4 — Mark complete

Mark the knowledge step complete (advances pipeline to research step):

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step knowledge --complete
```

Display session completion:

```
--- Knowledge Captured ---

Your knowledge has been saved. Research agent will run next.
Current step: research
```

---

## Implementation notes

- PROJECT_ROOT is passed by the caller — never re-capture with $(pwd) inside this agent (CWD resets between bash calls in Task contexts)
- All content-tools.cjs calls must pass --cwd "$PROJECT_ROOT"
- String values passed to --value must be JSON-encoded: wrap strings in escaped quotes '"$VAR"'
- The @file: handling pattern on state-read output is required — always check and unwrap
- AskUserQuestion is the only interactive tool; no raw text prompts that wait for input
- Checkpoint writes happen BEFORE proceeding to the next question (immediate, not batched)
- The skip gate in Step 1 runs only when ALL four knowledge fields are null — if any field is populated, the session was interrupted; proceed to Step 2 and let the per-question skip logic handle resume
- All add-reference calls use --step knowledge (not --step subject_capture) — references added during knowledge capture are attributed to the knowledge pipeline step
- If AskUserQuestion is not available as a tool in the current context, display the question and wait for the creator's response before continuing
