# content-new workflow

Sequential capture of five inputs for a new content project. Each step writes a checkpoint before proceeding to the next question. All bash calls pass `--cwd "$PROJECT_ROOT"` where PROJECT_ROOT is captured once in Step 0.

---

## Step 0 — Initialize and gate-check

Capture the project root and run the init check:

```bash
PROJECT_ROOT=$(pwd)
INIT=$(node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" init)
```

Parse the JSON result:

- If `global_layer_exists` is false: Display this message and STOP (do not proceed):
  ```
  Global layer not installed.
  Run: node bin/install-content.js
  ```
- If `active_project_exists` is true: Display the existing project status:
  ```
  Active project found: {active_project_slug} (at step: {active_project_step})
  ```
  Use AskUserQuestion to ask: "Resume this project or start fresh?"
  - If "Resume" → Stop here, tell the creator to run `/content:resume` to continue
  - If "Start fresh" → Continue to Step 1 (the existing project will be archived by project-init automatically)

If `global_layer_exists` is true and no active project exists, proceed directly to Step 1.

---

## Step 1 — Capture subject

Use AskUserQuestion:
- question: "What are you writing about? (Describe the subject — prose, fragments, or a question is fine)"
- No options, freeform text answer

After receiving the answer, initialize the project directory:

```bash
INIT_RESULT=$(node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" project-init "$SUBJECT")
```

Parse `INIT_RESULT` for `slug` and `output_dir`. Display brief confirmation:
```
Project created: {slug}/
Pipeline state: .content/state.json
```

Write checkpoint immediately:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step subject_capture --sub-step subject_captured \
  --field subject --value '"$SUBJECT"'
```

(Note: the `--value` argument must be JSON-encoded — wrap the string variable in escaped quotes: `'"$SUBJECT"'`)

Record output_dir so later phases can find the output directory without configuration:

```bash
# Record output_dir as a top-level input in subject_capture so later phases can find it
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step subject_capture --sub-step subject_captured \
  --field output_dir --value '"'"$OUTPUT_DIR"'"'
```

---

## Step 2 — Capture intent / angle intent

Use AskUserQuestion:
- question: "What's your point of view? What do you want to say about this subject? (Angle intent, thesis, or the contrarian take you have in mind — freeform)"
- No options, freeform text answer

After receiving the answer, write checkpoint immediately:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step subject_capture --sub-step intent_captured \
  --field intent --value '"$INTENT"'
```

---

## Step 3 — Capture existing knowledge

Use AskUserQuestion:
- question: "What do you already know about this subject? (Brain dump — your existing beliefs, experiences, observations, and hunches. This scopes what the research agent should treat as already covered.)"
- No options, freeform text answer

After receiving the answer, write checkpoint immediately:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step subject_capture --sub-step knowledge_captured \
  --field knowledge --value '"$KNOWLEDGE"'
```

---

## Step 4 — Capture references

Use AskUserQuestion:
- question: "Any references you already have in mind? (URLs or paste text — these become research references. Enter each one, or type 'done' to skip.)"
- No options, freeform text answer

This is a loop. After each response:
- If the input is "done" or empty → exit the loop
- If the reference is a URL (starts with http:// or https://): store with `--type reference --source "$URL" --content ""`
- If the reference is pasted text (not a URL): store with `--type reference --source "" --content "$TEXT"`

For each reference, call add-reference:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  add-reference --type reference --source "$SOURCE" --content "$CONTENT" --step subject_capture
```

After each add-reference call, ask the follow-up question using AskUserQuestion:
- question: "Another reference, or done?"

After all references are collected, write checkpoint:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step subject_capture --sub-step references_captured
```

(Note: state.json references array is already updated atomically by each add-reference call — this checkpoint marks the step complete, not the individual references)

---

## Step 5 — Capture inspiration examples

Use AskUserQuestion:
- question: "Any content examples you admire around this subject or style? (URLs or paste text — stored as inspiration, not research. These are style/tone guides for the draft agent. Type 'done' to skip.)"
- No options, freeform text answer

Same loop as Step 4, but use `--type inspiration` for each stored item:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  add-reference --type inspiration --source "$SOURCE" --content "$CONTENT" --step subject_capture
```

After each add-reference call, ask the follow-up question using AskUserQuestion:
- question: "Another inspiration example, or done?"

After all inspiration examples are collected, mark the subject_capture step as complete:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step subject_capture --sub-step complete
```

---

## Step 6 — Run alignment

Subject capture is complete. Spawn the content-aligner to perform editorial alignment and scope generation.

Spawn a Task with this instruction:

"Run the content-aligner workflow.
@~/.claude/content-creation/agents/content-aligner.md

PROJECT_ROOT: {PROJECT_ROOT}"

The content-aligner handles the full alignment session through to scope approval. When the Task completes, the alignment step is written to state.json and the session is done.

---

## Step 7 — Display scope summary

After the content-aligner Task completes, display a mid-session summary:

```
--- Alignment Complete ---

Subject:    {state.steps.subject_capture.inputs.subject}
Angle:      {state.steps.alignment.inputs.angle_intent}
Audience:   {state.steps.alignment.inputs.target_audience}
Tone:       {state.steps.alignment.inputs.tone_intent}

Proceeding to knowledge capture...
```

Read the state to populate this summary:
```bash
MIDSTATE=$(node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" state-read)
if [[ "$MIDSTATE" == @file:* ]]; then MIDSTATE=$(cat "${MIDSTATE#@file:}"); fi
```

Parse MIDSTATE to extract subject, angle_intent, target_audience, tone_intent for display.

---

## Step 8 — Knowledge capture

Spawn a Task with this instruction:

"Run the content-knowledge-capture workflow.
@~/.claude/content-creation/agents/content-knowledge-capture.md

PROJECT_ROOT: {PROJECT_ROOT}"

The content-knowledge-capture agent handles the skip gate, guided questions, and optional reference ingestion. When the Task completes, the knowledge step is marked complete in state.json.

---

## Step 9 — Research

After the knowledge capture Task completes, spawn the researcher automatically — no confirmation gate.

Spawn a Task with this instruction:

"Run the content-researcher workflow.
@~/.claude/content-creation/agents/content-researcher.md

PROJECT_ROOT: {PROJECT_ROOT}"

The content-researcher agent produces knowledge-map.md and displays it inline. When the Task completes, the research step is marked complete in state.json.

---

## Step 10 — Session complete

After the content-researcher Task completes, display a final summary:

```
Session complete. Research phase done.

Subject:         {subject}
Angle:           {angle_intent}
Knowledge map:   {output_dir}/knowledge-map.md
Current step:    ideation

Run /content:resume to continue to ideation.
```

Read the final state to populate:
```bash
FINAL_STATE=$(node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" state-read)
if [[ "$FINAL_STATE" == @file:* ]]; then FINAL_STATE=$(cat "${FINAL_STATE#@file:}"); fi
```

Parse FINAL_STATE to extract subject, angle_intent, output_dir, and current step for display.

---

## Implementation notes

- All bash calls pass `--cwd "$PROJECT_ROOT"` — PROJECT_ROOT is captured once in Step 0 and never re-captured
- Checkpoint writes happen BEFORE proceeding to the next question (immediate, not batched)
- String values passed to `--value` in state-checkpoint must be JSON-encoded: wrap strings in escaped quotes `'"$VAR"'`
- If AskUserQuestion is not available as a tool in the current context, display the question and wait for the creator's response before continuing
- Step 0 gate-check must complete (global_layer_exists confirmed true) before any project-init call is made
