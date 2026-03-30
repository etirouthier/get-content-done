---
name: content:new
description: Initialize a new content project — captures subject, intent, knowledge, references, and inspiration before any agents run
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
  - Task
---

<objective>
Start a new content project. Captures five inputs sequentially (subject, angle intent, existing knowledge, references, inspiration examples), creates the project directory structure, and writes pipeline state to .content/state.json. This is the first step of the content creation pipeline.

Creates:
- .content/state.json — pipeline state (single source of truth)
- .content/references/ — research reference files
- .content/inspiration/ — style/tone example files
- {subject-slug}/ — deliverables directory (article.md and linkedin-1.md written by later phases)
</objective>

<execution_context>
@~/.claude/content-creation/workflows/content-new.md
@~/.claude/content-creation/guidance.md
</execution_context>

<process>
Execute the content-new workflow from @~/.claude/content-creation/workflows/content-new.md end-to-end.
Capture each input completely before proceeding to the next question.
Write state.json checkpoint after each input is captured.
</process>
