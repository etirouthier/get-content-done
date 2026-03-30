// Run: node bin/install-content.js
//
// Installs the content-creation global layer to ~/.claude/content-creation/.
// Creator-owned files (guidance.md, examples-viral-*.md) are never overwritten on re-run.
// System files (mental-models.md, virality-patterns.md) are always re-copied on re-run.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SRC    = path.join(__dirname, '..', 'content-creation');
const TARGET = path.join(os.homedir(), '.claude', 'content-creation');

// ---------------------------------------------------------------------------
// File lists
// ---------------------------------------------------------------------------

// Creator-owned: skip on re-run to protect edits.
const CREATOR_FILES = [
  'guidance.md',
  'examples-viral-substack.md',
  'examples-viral-linkedin.md',
];

// System files: always overwrite on re-run (agent knowledge base, not user content).
const SYSTEM_FILES = [
  'mental-models.md',
  'virality-patterns.md',
];

// Subdirectories to create inside TARGET (in addition to the root).
const SUBDIRS = ['bin', 'workflows', 'templates', 'agents'];

// Bin tools: always overwrite on re-run (code, not creator content).
const BIN_FILES = [
  'bin/content-tools.cjs',
];

// Workflow files: always overwrite on re-run (code, not creator content).
const WORKFLOW_FILES = [
  'workflows/content-new.md',
  'workflows/content-resume.md',
];

// Agent files: always overwrite on re-run (code, not creator content).
const AGENT_FILES = [
  'agents/content-aligner.md',
  'agents/content-researcher.md',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDirs() {
  fs.mkdirSync(TARGET, { recursive: true });
  for (const dir of SUBDIRS) {
    fs.mkdirSync(path.join(TARGET, dir), { recursive: true });
  }
}

function installCreatorFile(file) {
  const src  = path.join(SRC, file);
  const dest = path.join(TARGET, file);

  if (!fs.existsSync(src)) {
    console.log(`  ! Skipping ${file} (not yet in source)`);
    return;
  }

  if (fs.existsSync(dest)) {
    console.log(`  ~ Skipped  ${file} (already exists — preserving your edits)`);
  } else {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Installed ${file}`);
  }
}

function installBinFile(file) {
  const src  = path.join(SRC, file);
  const dest = path.join(TARGET, file);
  if (!fs.existsSync(src)) {
    console.log(`  ! Skipping ${file} (not yet in source)`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${file} → ${dest} (bin)`);
}

function installWorkflowFile(file) {
  const src  = path.join(SRC, file);
  const dest = path.join(TARGET, file);
  if (!fs.existsSync(src)) {
    console.log(`  ! Skipping ${file} (not yet in source)`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${file} → ${dest} (workflow)`);
}

function installAgentFile(file) {
  const src  = path.join(SRC, file);
  const dest = path.join(TARGET, file);
  if (!fs.existsSync(src)) {
    console.log(`  ! Skipping ${file} (not yet in source)`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${file} → ${dest} (agent)`);
}

function installSystemFile(file) {
  const src  = path.join(SRC, file);
  const dest = path.join(TARGET, file);

  if (!fs.existsSync(src)) {
    console.log(`  ! Skipping ${file} (not yet in source)`);
    return;
  }

  fs.copyFileSync(src, dest);
  console.log(`  ✓ Installed ${file}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('Installing content-creation global layer...\n');

  ensureDirs();

  console.log('Creator files (skip if present):');
  for (const file of CREATOR_FILES) {
    installCreatorFile(file);
  }

  console.log('\nSystem files (always updated):');
  for (const file of SYSTEM_FILES) {
    installSystemFile(file);
  }

  console.log('\nInstalling bin tools...');
  for (const file of BIN_FILES) {
    installBinFile(file);
  }

  console.log('\nInstalling workflows...');
  for (const file of WORKFLOW_FILES) {
    installWorkflowFile(file);
  }

  console.log('\nInstalling agents...');
  for (const file of AGENT_FILES) {
    installAgentFile(file);
  }

  console.log(`\ncontent-creation global layer installed at ${TARGET}`);
}

main();
