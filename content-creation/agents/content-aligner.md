# content-aligner workflow

Reads state.json and guidance.md, performs four-dimension editorial alignment check, handles mismatches, generates and gets approval on a 3-field subject scope, and writes the approved scope to state.json.

This agent is loaded by orchestrators via Task tool. It owns the full alignment session from start to completion.

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
- INTENT = state.steps.subject_capture.inputs.intent

Then use the Read tool to load: `~/.claude/content-creation/guidance.md`

**Mostly-blank guidance detection:** After reading guidance.md, strip all lines that are: blank, only `---`, only `# ...` headers, or only `*...*` italic placeholders (lines matching the pattern `^\*[^*]+\*$`). Count remaining non-empty words. If word count is under 50, treat guidance as mostly blank. Display:

```
Your guidance.md appears mostly empty — alignment skipped. Consider filling it in for better results.
```

Then skip directly to Step 2 (scope generation) without running the alignment check.

---

## Step 1 — Four-dimension alignment check

Compare the subject/intent against guidance.md across four dimensions: Niche fit, Audience fit, Tone fit, Content goals fit.

For each dimension, determine: Strong fit (no concern), Possible mismatch (worth surfacing), or Unknown (guidance section appears blank for this dimension).

Display the alignment summary in this exact format:

```
--- Alignment Check ---

✓ Niche: [fit description tied to specific language from guidance.md]
✓ Tone: [fit description]
⚠ Audience: [mismatch description — quote specific guidance.md language]
✓ Content goals: [fit description]

[N mismatch(es) found / All dimensions clear]
```

Use ✓ for fit, ⚠ for mismatch, ? for unknown/blank dimension.

**If ALL dimensions show ✓ (no mismatches):** Display "All dimensions clear." and proceed directly to Step 2.

**If any dimension shows ⚠:** Use AskUserQuestion:
- question: "The alignment check found a mismatch. How do you want to proceed?"
- options:
    - "Proceed as-is — I understand the mismatch and want to continue"
    - "Adjust my angle — show me the mismatch and let me revise"
    - "Stop — save my work and exit. I'll revisit the subject later"

**If "Proceed as-is":** Proceed to Step 2.

**If "Stop":** Display:

```
Saved. Your subject capture is complete.
Run /content:resume to continue when ready.
```

Then end the session (do not write any alignment checkpoint).

**If "Adjust my angle":** Show:

```
Your current intent: [INTENT from state.json]
Concern: [the specific mismatch dimension and why]

What angle do you want to take instead?
```

Use AskUserQuestion (freeform, no options) to capture the revised intent.

Write the revised intent to state.json:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step alignment --sub-step intent_revised \
  --field intent --value '"$REVISED_INTENT"'
```

Then use AskUserQuestion:
- question: "Re-check alignment with your updated angle, or proceed straight to scope?"
- options:
    - "Re-check — run alignment again with my updated angle"
    - "Proceed — skip to scope generation"

If "Re-check": Update INTENT to the revised value and repeat Step 1 from the top (re-read guidance, re-run comparison with new intent).
If "Proceed": Continue to Step 2.

---

## Step 2 — Generate subject scope

Using the confirmed subject + intent (post-adjustment if applicable), generate a 3-field scope:

- **angle_intent**: The specific angle or argument this article will make. Derived from subject + intent + any niche/goals context from guidance.md. One sentence, specific. Not a restatement of the subject — the argument the article makes.
- **target_audience**: Who this is written for. Synthesized from subject, intent, and guidance.md audience section. One sentence, specific. E.g. "Mid-level engineering managers navigating distributed team performance reviews."
- **tone_intent**: The voice and register appropriate for this piece. Derived from guidance.md tone section and the subject's nature. E.g. "Measured analytical, first-person where evidence is personal, skeptical of conventional wisdom."

Display scope in this exact format:

```
--- Subject Scope ---

Angle intent:    [angle_intent value]
Target audience: [target_audience value]
Tone intent:     [tone_intent value]
```

---

## Step 3 — Scope approval loop

Use AskUserQuestion:
- question: "Does this scope capture your intent?"
- options:
    - "Yes — approve this scope and proceed to research"
    - "No — regenerate (describe what's off)"

**If "Yes":** Proceed to Step 4.

**If "No":** Use AskUserQuestion (freeform, no options):
- question: "What's off? Describe what you want changed."

Receive feedback. Revise the scope based on the feedback. Write interim checkpoint:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step alignment --sub-step scope_generated \
  --field angle_intent --value '"$ANGLE_INTENT"'
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step alignment --sub-step scope_generated \
  --field target_audience --value '"$TARGET_AUDIENCE"'
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step alignment --sub-step scope_generated \
  --field tone_intent --value '"$TONE_INTENT"'
```

Display the revised scope in the same format and repeat Step 3. No limit on regeneration rounds.

---

## Step 4 — Write approved scope and mark complete

Write all three scope fields:

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step alignment --sub-step scope_generated \
  --field angle_intent --value '"$ANGLE_INTENT"'

node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step alignment --sub-step scope_generated \
  --field target_audience --value '"$TARGET_AUDIENCE"'

node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step alignment --sub-step scope_generated \
  --field tone_intent --value '"$TONE_INTENT"'
```

Mark alignment complete (advances pipeline to next step):

```bash
node "$HOME/.claude/content-creation/bin/content-tools.cjs" --cwd "$PROJECT_ROOT" \
  state-checkpoint --step alignment --complete
```

Display session completion:

```
--- Session Complete ---

Your subject scope is confirmed:

Angle intent:    [angle_intent]
Target audience: [target_audience]
Tone intent:     [tone_intent]

Alignment saved. Project is ready for research.
Current step: research
```

---

## Implementation notes

- PROJECT_ROOT is passed by the caller — never re-capture with $(pwd) inside this agent (CWD resets between bash calls in Task contexts)
- All content-tools.cjs calls must pass --cwd "$PROJECT_ROOT"
- String values passed to --value must be JSON-encoded: wrap strings in escaped quotes '"$VAR"'
- The @file: handling pattern on state-read output is required — always check and unwrap
- guidance.md path is always $HOME/.claude/content-creation/guidance.md — never a relative path
- AskUserQuestion is the only interactive tool; no raw text prompts that wait for input
