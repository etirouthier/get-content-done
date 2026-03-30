# content-resume workflow

Reads `.content/state.json`, displays a full project context refresh, and continues the pipeline from the exact step where the session ended. All bash calls pass `--cwd "$PROJECT_ROOT"` where PROJECT_ROOT is captured once in Step 0.

---

## Step 0 — Read state

Capture the project root and read the current pipeline state:

```bash
PROJECT_ROOT=$(pwd)
STATE=$(node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" state-read)
```

Parse the JSON result:

- If `error` field is present (no active project): Display the following message and STOP:
  ```
  No active content project found in this directory.
  Run /content:new to start a project.
  ```

- If state.json exists but the JSON cannot be parsed (parse error): Display the following message and STOP:
  ```
  state.json could not be parsed. The file may be corrupted.
  Last known state: .content/state.json

  Options:
  1. Inspect .content/state.json directly and fix the JSON
  2. Run /content:new to start a fresh project (existing state will be archived)
  ```

If state is valid JSON with no error field, proceed to Step 1.

---

## Step 1 — Display full context refresh

Read the state object and display a structured summary. Expand references and inspiration files by reading each one with the Read tool.

**Expand references:**

For each path in `state.steps.subject_capture.inputs.references`:
- Use the Read tool to read `.content/{path}` (e.g., `.content/references/001.md`)
- Extract: `source_url` from the frontmatter, and the full body content below the frontmatter block

**Expand inspiration:**

For each path in `state.steps.subject_capture.inputs.inspiration`:
- Use the Read tool to read `.content/{path}` (e.g., `.content/inspiration/001.md`)
- Extract: `source_url` from the frontmatter, and the first 200 characters of the body content

**Display the following context block:**

```
--- Project Context ---

Subject: {state.subject}
Slug: {state.slug}
Created: {state.created_at}

Current step: {state.current.step} / {state.current.sub_step}

--- Captured Inputs ---

Subject: {state.steps.subject_capture.inputs.subject}

Intent: {state.steps.subject_capture.inputs.intent || "(not yet captured)"}

Knowledge: {state.steps.subject_capture.inputs.knowledge || "(not yet captured)"}

References ({count}):
{For each reference: display source_url + first 300 chars of body content}

Inspiration ({count}):
{For each inspiration: display source_url + first 200 chars of body content}

--- Pipeline Status ---

{For each step in ["subject_capture", "alignment", "knowledge", "research", "ideation", "draft", "curation", "linkedin"]:
  ✓ {step}  (if completed: true)
  → {step}  (if this is state.current.step)
  ○ {step}  (if not yet started)
}
```

If references or inspiration arrays are empty, display `(none)` for that section.

---

## Step 2 — Continue from current step

Determine the continuation action based on `state.current.step` and `state.steps.subject_capture.completed`:

**Case A — subject_capture is not yet complete:**

The first session is incomplete. Resume the `/content:new` sequence from the current sub_step without re-asking already-answered questions.

Read `state.steps.subject_capture.inputs` to identify which fields are already populated:
- If `subject` is missing → re-run from Step 1 of the content-new workflow
- If `intent` is missing → re-run from Step 2 (skip subject question)
- If `knowledge` is missing → re-run from Step 3 (skip subject and intent questions)
- If references checkpoint not reached → re-run from Step 4 (skip subject/intent/knowledge)
- If inspiration checkpoint not reached → re-run from Step 5 (skip all earlier questions)

Pass `--cwd "$PROJECT_ROOT"` to all content-tools.cjs calls when running remaining steps.

**Case B — subject_capture is complete, alignment step is current or not yet completed:**

Condition: `state.steps.subject_capture.completed === true` AND `state.steps.alignment.completed !== true`

This covers both "alignment never started" (fresh resume after capture) and "alignment started but interrupted before scope approval" (partial alignment state).

Subject capture is complete. Spawning content-aligner to continue the alignment and scope generation session.

Spawn a Task with this instruction:

"Run the content-aligner workflow.
@~/.claude/content-creation/agents/content-aligner.md

PROJECT_ROOT: {PROJECT_ROOT}"

The content-aligner will pick up from the current alignment sub-step. When the Task completes, the alignment step is written to state.json and the session is done.

**Case C — any other step is current:**

```
Current step: {state.current.step}
This step is handled by a later phase. Run the appropriate content command for this step.
```

---

## Implementation notes

- PROJECT_ROOT is captured once in Step 0 and never re-captured (CWD resets between bash calls in subagent contexts)
- All content-tools.cjs calls must pass `--cwd "$PROJECT_ROOT"`
- References and inspiration are read with the Read tool — not just listed as paths — so the creator sees actual content (pitfall: displaying paths instead of content)
- Do NOT re-ask questions already captured. The sub_step checkpoint in state.json tells you exactly where the session stopped. Read state.json inputs to confirm which fields are populated before resuming
- If AskUserQuestion is not available as a tool in the current context, display the question and wait for the creator's response before continuing
