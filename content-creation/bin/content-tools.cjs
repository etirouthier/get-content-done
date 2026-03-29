#!/usr/bin/env node
'use strict';

/**
 * content-tools.cjs — CLI data layer for content pipeline workflows
 *
 * Manages per-project state, directory scaffolding, slug generation,
 * reference storage, and project archiving.
 *
 * Usage: node content-tools.cjs <subcommand> [args] [--cwd <path>]
 *
 * Subcommands:
 *   init                                      Check global layer + active project status
 *   generate-slug "<text>"                    Convert text to URL-safe slug
 *   project-init "<subject>"                  Scaffold new project directories + state.json
 *   state-read                                Return parsed state.json
 *   state-checkpoint --step S --sub-step SS   Update current step + optional field
 *     [--field F --value V]
 *   project-archive                           Archive current project to .content/archive/{slug}/
 *   add-reference --type T --source URL       Write reference/inspiration file + update state.json
 *     --content "text" [--step S]
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_DIR   = '.content';
const GLOBAL_LAYER  = path.join(os.homedir(), '.claude', 'content-creation');
const GLOBAL_ANCHOR = path.join(GLOBAL_LAYER, 'guidance.md');

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const rawArgs = process.argv.slice(2);

// Extract --cwd before dispatching
let cwd = process.cwd();
const cwdIdx = rawArgs.indexOf('--cwd');
if (cwdIdx !== -1 && rawArgs[cwdIdx + 1]) {
  cwd = rawArgs[cwdIdx + 1];
  rawArgs.splice(cwdIdx, 2);
}

const args = rawArgs;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Write result JSON to stdout. If >50KB, write to tmp file and output @file: ref.
 */
function output(result) {
  const json = JSON.stringify(result, null, 2);
  if (json.length > 50 * 1024) {
    const tmpFile = path.join(os.tmpdir(), `content-tools-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, json, 'utf8');
    process.stdout.write(`@file:${tmpFile}\n`);
  } else {
    process.stdout.write(json + '\n');
  }
}

/**
 * Write error to stderr and exit with code 1.
 */
function fail(msg) {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
}

/**
 * Parse named flags from args array.
 * Returns object: { flagName: value, ... }
 */
function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      const key = argv[i].slice(2);
      flags[key] = argv[i + 1];
      i++;
    } else if (argv[i].startsWith('--')) {
      flags[argv[i].slice(2)] = true;
    }
  }
  return flags;
}

/**
 * Resolve path relative to cwd (the --cwd override or process.cwd()).
 */
function cwdPath(...parts) {
  return path.join(cwd, ...parts);
}

/**
 * Generate a URL-safe slug from text.
 * Truncates at 60 chars at last word boundary.
 */
function slugify(text) {
  let slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length > 60) {
    const truncated = slug.slice(0, 61); // grab up to index 60 inclusive
    const lastDash  = truncated.lastIndexOf('-', 60);
    slug = lastDash > 0 ? slug.slice(0, lastDash) : slug.slice(0, 60);
    slug = slug.replace(/-+$/, '');
  }

  return slug;
}

/**
 * Read and parse .content/state.json. Returns null if missing.
 */
function readState() {
  const statePath = cwdPath(CONTENT_DIR, 'state.json');
  if (!fs.existsSync(statePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (e) {
    fail(`state.json parse error: ${e.message}`);
  }
}

/**
 * Write state.json atomically (synchronous writeFileSync).
 */
function writeState(state) {
  const statePath = cwdPath(CONTENT_DIR, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Build the initial state.json schema for a new project.
 */
function buildInitialState(subject, slug) {
  return {
    schema_version: '1',
    slug,
    subject,
    created_at: new Date().toISOString(),
    current: { step: 'subject_capture', sub_step: 'subject_captured' },
    steps: {
      subject_capture: {
        completed: false,
        inputs: { subject: null, intent: null, knowledge: null, references: [], inspiration: [] },
        actions: [],
        timestamp: null,
      },
      alignment:  { completed: false, inputs: {}, actions: [], timestamp: null },
      knowledge:  { completed: false, inputs: {}, actions: [], timestamp: null },
      research:   { completed: false, inputs: {}, actions: [], timestamp: null },
      ideation:   { completed: false, inputs: {}, actions: [], timestamp: null },
      draft:      { completed: false, inputs: {}, actions: [], timestamp: null },
      curation:   { completed: false, inputs: {}, actions: [], timestamp: null },
      linkedin:   { completed: false, inputs: {}, actions: [], timestamp: null },
    },
  };
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

/**
 * init — Check global layer presence and active project status.
 */
function cmdInit() {
  const globalLayerExists   = fs.existsSync(GLOBAL_ANCHOR);
  const statePath           = cwdPath(CONTENT_DIR, 'state.json');
  const activeProjectExists = fs.existsSync(statePath);

  const result = { global_layer_exists: globalLayerExists, active_project_exists: activeProjectExists };

  if (activeProjectExists) {
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      result.active_project_slug = state.slug || null;
      result.active_project_step = (state.current && state.current.step) || null;
    } catch (_) {
      // Corrupted state — still report exists but no details
    }
  }

  output(result);
}

/**
 * generate-slug "<text>" — Convert text to URL-safe slug.
 */
function cmdGenerateSlug() {
  const text = args[1];
  if (!text) fail('Usage: generate-slug "<text>"');
  output({ slug: slugify(text) });
}

/**
 * project-init "<subject>" — Scaffold new project directories and state.json.
 * Archives existing project if one is active.
 */
function cmdProjectInit() {
  const subject = args[1];
  if (!subject) fail('Usage: project-init "<subject>"');

  const slug       = slugify(subject);
  const contentDir = cwdPath(CONTENT_DIR);
  const statePath  = cwdPath(CONTENT_DIR, 'state.json');

  // Archive existing project if one exists
  if (fs.existsSync(statePath)) {
    cmdProjectArchiveInternal();
  }

  // Create directory structure
  fs.mkdirSync(contentDir, { recursive: true });
  fs.mkdirSync(path.join(contentDir, 'references'),  { recursive: true });
  fs.mkdirSync(path.join(contentDir, 'inspiration'), { recursive: true });
  fs.mkdirSync(path.join(contentDir, 'archive'),     { recursive: true });
  fs.mkdirSync(cwdPath(slug), { recursive: true });

  // Write initial state.json
  const state = buildInitialState(subject, slug);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');

  output({ project_dir: CONTENT_DIR, output_dir: slug, slug });
}

/**
 * state-read — Return parsed state.json or error if missing.
 */
function cmdStateRead() {
  const state = readState();
  if (!state) {
    output({ error: 'no active project' });
  } else {
    output(state);
  }
}

/**
 * state-checkpoint — Update current step + optional field in state.json.
 * Flags: --step, --sub-step, --field, --value, --complete
 *
 * When --complete is present:
 *   - Sets state.steps[step].completed = true
 *   - Advances state.current.step to next step in pipeline order
 *   - Resets state.current.sub_step to null
 */
function cmdStateCheckpoint() {
  const flags    = parseFlags(args.slice(1));
  const step     = flags['step'];
  const subStep  = flags['sub-step'];
  const field    = flags['field'];
  const value    = flags['value'];
  const complete = flags['complete'] === true || flags['complete'] === 'true';

  if (!step) fail('state-checkpoint requires --step');
  if (!complete && !subStep) fail('state-checkpoint requires --sub-step (or --complete to skip sub-step)');

  const PIPELINE_ORDER = [
    'subject_capture', 'alignment', 'knowledge', 'research',
    'ideation', 'draft', 'curation', 'linkedin',
  ];

  const state = readState();
  if (!state) fail('no active project');

  // Ensure step exists in state
  if (!state.steps[step]) {
    state.steps[step] = { completed: false, inputs: {}, actions: [], timestamp: null };
  }

  // Update field if provided
  if (field !== undefined && value !== undefined) {
    try {
      state.steps[step].inputs[field] = JSON.parse(value);
    } catch (_) {
      state.steps[step].inputs[field] = value;
    }
  }

  // Handle --complete flag
  if (complete) {
    state.steps[step].completed = true;

    // Advance pipeline step to next step
    const idx     = PIPELINE_ORDER.indexOf(step);
    const nextStep = idx !== -1 && idx + 1 < PIPELINE_ORDER.length
      ? PIPELINE_ORDER[idx + 1]
      : step;

    state.current = { step: nextStep, sub_step: null };
  } else {
    // Update current pointer normally
    state.current = { step, sub_step: subStep };
  }

  // Update timestamp
  state.steps[step].timestamp = new Date().toISOString();

  writeState(state);
  output({ ok: true });
}

/**
 * Internal project-archive logic (called from project-init and directly).
 */
function cmdProjectArchiveInternal() {
  const statePath  = cwdPath(CONTENT_DIR, 'state.json');
  const contentDir = cwdPath(CONTENT_DIR);

  if (!fs.existsSync(statePath)) {
    fail('no active project to archive');
  }

  let slug;
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    slug = state.slug;
  } catch (e) {
    fail(`state.json parse error: ${e.message}`);
  }

  if (!slug) fail('state.json is missing slug field');

  const archiveDir = path.join(contentDir, 'archive', slug);
  fs.mkdirSync(archiveDir, { recursive: true });

  // Copy everything in .content/ except archive/ itself
  const entries = fs.readdirSync(contentDir);
  for (const entry of entries) {
    if (entry === 'archive') continue;
    const src  = path.join(contentDir, entry);
    const dest = path.join(archiveDir, entry);
    fs.cpSync(src, dest, { recursive: true });
  }

  // Wipe active project files (leave archive/ intact)
  for (const entry of entries) {
    if (entry === 'archive') continue;
    const src = path.join(contentDir, entry);
    fs.rmSync(src, { recursive: true, force: true });
  }

  return slug;
}

/**
 * project-archive — Archive current project (public subcommand).
 */
function cmdProjectArchive() {
  const slug = cmdProjectArchiveInternal();
  output({ archived_to: `${CONTENT_DIR}/archive/${slug}` });
}

/**
 * add-reference — Write a reference or inspiration file and update state.json.
 * Flags: --type (reference|inspiration), --source, --content, --step
 */
function cmdAddReference() {
  const flags = parseFlags(args.slice(1));
  const type    = flags['type'];
  const source  = flags['source'] || '';
  const content = flags['content'];
  const stepArg = flags['step'];

  if (!type)    fail('add-reference requires --type (reference|inspiration)');
  if (!content) fail('add-reference requires --content');
  if (type !== 'reference' && type !== 'inspiration') {
    fail('--type must be "reference" or "inspiration"');
  }

  const state = readState();
  if (!state) fail('no active project');

  // Determine step (default to current step from state)
  const step = stepArg || (state.current && state.current.step) || 'subject_capture';

  // Determine the directory and state field
  const typeDir        = type === 'reference' ? 'references' : 'inspiration';
  const stateField     = type === 'reference' ? 'references' : 'inspiration';
  const typeDirPath    = cwdPath(CONTENT_DIR, typeDir);

  // Count existing files to determine index
  fs.mkdirSync(typeDirPath, { recursive: true });
  const existingFiles  = fs.readdirSync(typeDirPath).filter(f => f.endsWith('.md'));
  const index          = existingFiles.length + 1;
  const indexPadded    = String(index).padStart(3, '0');
  const filename       = `${indexPadded}.md`;
  const filePath       = path.join(typeDirPath, filename);
  const relPath        = `${typeDir}/${filename}`;

  // Build frontmatter + content
  const addedAt = new Date().toISOString();
  const fileContent = [
    '---',
    `type: ${type}`,
    `index: ${index}`,
    `source_url: ${source}`,
    `added_at: ${addedAt}`,
    `step: ${step}`,
    '---',
    '',
    content,
    '',
  ].join('\n');

  // Write the file
  fs.writeFileSync(filePath, fileContent, 'utf8');

  // Update state.json
  if (!state.steps[step]) {
    state.steps[step] = { completed: false, inputs: {}, actions: [], timestamp: null };
  }
  if (!state.steps[step].inputs[stateField]) {
    state.steps[step].inputs[stateField] = [];
  }
  state.steps[step].inputs[stateField].push(relPath);

  writeState(state);

  output({ file: relPath, index });
}

// ---------------------------------------------------------------------------
// CLI router
// ---------------------------------------------------------------------------

try {
  switch (args[0]) {
    case 'init':
      cmdInit();
      break;

    case 'generate-slug':
      cmdGenerateSlug();
      break;

    case 'project-init':
      cmdProjectInit();
      break;

    case 'state-read':
      cmdStateRead();
      break;

    case 'state-checkpoint':
      cmdStateCheckpoint();
      break;

    case 'project-archive':
      cmdProjectArchive();
      break;

    case 'add-reference':
      cmdAddReference();
      break;

    default:
      fail(`Unknown subcommand: ${args[0]}. Valid: init, generate-slug, project-init, state-read, state-checkpoint, project-archive, add-reference`);
  }
} catch (err) {
  fail(err.message);
}
