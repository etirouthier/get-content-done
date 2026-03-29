---
name: content:resume
description: Resume an active content project — displays all captured inputs and continues from the current pipeline step
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---

<objective>
Resume an in-progress content project. Reads .content/state.json, displays a full context refresh (current pipeline step + all captured inputs with references and inspiration content shown), then continues from the exact step where the session ended.

Use this command after any session boundary — exiting Claude Code mid-pipeline, closing a browser tab, or returning the next day.
</objective>

<execution_context>
@~/.claude/content-creation/workflows/content-resume.md
@~/.claude/content-creation/guidance.md
</execution_context>

<process>
Execute the content-resume workflow from @~/.claude/content-creation/workflows/content-resume.md end-to-end.
Display the full project context before continuing any pipeline work.
</process>
