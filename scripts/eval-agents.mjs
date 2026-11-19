#!/usr/bin/env node
/**
 * Eval harness for the MIE UI agent team (#608, part of #545 Phase 5).
 *
 * The golden-question sets in agent/evals/*.md are graded by a human driving
 * the installed team (see agent/evals/README.md); answers cannot be scored
 * without a model. What CAN be scripted — and is, here — is everything
 * deterministic around that loop:
 *
 *   validate (default)  Lint the eval corpus. Fails on:
 *                         - an entry missing Ask / Expect / Agent / Source
 *                         - a malformed or duplicate id, or a wrong prefix
 *                           for its domain file
 *                         - an Agent that is not an installed roster agent
 *                         - a Source citing a repo path that does not exist
 *                         - a domain file below the 20-entry floor, or a
 *                           domain missing from the README table (and vice
 *                           versa)
 *   --sheet [n]         Emit a run sheet: a stratified sample of n questions
 *                       per domain (default 4; --full for every entry) as
 *                       markdown with a Score field per entry. Deterministic
 *                       for a given --seed (default: today's date).
 *   --score <file>      Score a filled-in run sheet: per-domain PASS /
 *                       PARTIAL / FAIL tally plus the failing ids. Exits
 *                       non-zero on any FAIL or unscored entry.
 *
 * Usage:
 *   node scripts/eval-agents.mjs                        # validate (CI)
 *   node scripts/eval-agents.mjs --sheet 4 > /tmp/sheet.md
 *   node scripts/eval-agents.mjs --sheet --full --out agent/evals/runs/2026-11-20-sheet.md
 *   node scripts/eval-agents.mjs --score agent/evals/runs/2026-11-20-sheet.md
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EVALS = join(root, 'agent', 'evals');
const MIN_ENTRIES = 20;

// Domain file → required id prefix. Mirrors the README table.
const DOMAINS = {
  'selection.md': 'SEL',
  'styling.md': 'STY',
  'install.md': 'INS',
  'a11y.md': 'A11Y',
  'i18n.md': 'I18N',
  'migration.md': 'MIG',
  'richtext.md': 'RT',
  'grids.md': 'GRD',
  'datavis.md': 'DV',
  'views.md': 'VW',
  'superchat.md': 'SC',
};

// Repo-root directories a Source path token may live under.
const PATH_ROOTS = ['agent/', 'lessons/', 'src/', 'scripts/', 'packages/', '.storybook/'];

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const argAfter = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
};

// ---------------------------------------------------------------------------
// Parse an eval file into entries.
// ---------------------------------------------------------------------------
const FIELDS = ['Ask', 'Expect', 'Agent', 'Source'];

function parseEvalFile(file) {
  const text = readFileSync(join(EVALS, file), 'utf8');
  const entries = [];
  const blocks = text.split(/^### /m).slice(1);
  for (const block of blocks) {
    const [headingLine, ...rest] = block.split('\n');
    const body = rest.join('\n');
    const heading = headingLine.trim();
    const m = heading.match(/^([A-Z0-9]+)-(\d+) — (.+)$/);
    const entry = {
      file,
      heading,
      prefix: m?.[1] ?? null,
      num: m ? Number(m[2]) : null,
      title: m?.[3] ?? null,
      fields: {},
    };
    for (const f of FIELDS) {
      // A field runs from its bullet to the next field bullet or block end.
      const fm = body.match(
        new RegExp(`^- \\*\\*${f}:\\*\\* ?([\\s\\S]*?)(?=^- \\*\\*(?:${FIELDS.join('|')}):\\*\\*|^#|(?![\\s\\S]))`, 'm')
      );
      if (fm && fm[1].trim()) entry.fields[f] = fm[1].trim().replace(/\s+/g, ' ');
    }
    entries.push(entry);
  }
  return entries;
}

function rosterAgents() {
  const dir = join(root, 'agent', 'agents');
  const names = new Set();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.agent.md'))) {
    const m = readFileSync(join(dir, f), 'utf8').match(/^name:\s*(.+)$/m);
    if (m) names.add(m[1].trim());
  }
  return names;
}

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------
function validate() {
  const errors = [];
  const agents = rosterAgents();
  const readme = readFileSync(join(EVALS, 'README.md'), 'utf8');
  const seen = new Set();

  for (const [file, prefix] of Object.entries(DOMAINS)) {
    if (!existsSync(join(EVALS, file))) {
      errors.push(`${file}: domain file missing`);
      continue;
    }
    if (!readme.includes(`](./${file})`))
      errors.push(`README.md: missing table row for ${file}`);
    const entries = parseEvalFile(file);
    if (entries.length < MIN_ENTRIES)
      errors.push(`${file}: ${entries.length} entries — below the ${MIN_ENTRIES}-entry floor`);
    for (const e of entries) {
      const id = e.prefix && e.num !== null ? `${e.prefix}-${e.num}` : e.heading;
      const where = `${file} › ${id}`;
      if (!e.prefix || e.num === null || !e.title)
        errors.push(`${where}: malformed heading (expected "### ${prefix}-<n> — <title>")`);
      else if (e.prefix !== prefix)
        errors.push(`${where}: id prefix ${e.prefix}- but this file requires ${prefix}-`);
      if (seen.has(id)) errors.push(`${where}: duplicate id`);
      seen.add(id);
      for (const f of FIELDS)
        if (!e.fields[f]) errors.push(`${where}: missing **${f}** field`);
      if (e.fields.Agent) {
        const name = [...agents].find((a) => e.fields.Agent.startsWith(a));
        if (!name)
          errors.push(`${where}: Agent "${e.fields.Agent.slice(0, 50)}…" does not start with a roster agent name`);
      }
      for (const p of sourcePaths(e.fields.Source ?? ''))
        if (!existsSync(join(root, p))) errors.push(`${where}: Source path not found: ${p}`);
    }
  }

  // README table must not list files this script does not know about.
  for (const m of readme.matchAll(/\]\(\.\/([a-z0-9-]+\.md)\)/g))
    if (m[1] !== 'README.md' && !DOMAINS[m[1]])
      errors.push(`README.md: table lists ${m[1]}, unknown to scripts/eval-agents.mjs DOMAINS`);

  // Every top-level eval file must be registered, or it silently escapes
  // validation and --full sheets.
  for (const f of readdirSync(EVALS))
    if (f.endsWith('.md') && f !== 'README.md' && !DOMAINS[f])
      errors.push(`${f}: unregistered eval file — add it to scripts/eval-agents.mjs DOMAINS and the README table`);

  if (errors.length) {
    console.error(`eval-agents: ${errors.length} error(s)\n`);
    for (const e of errors) console.error(`  ✖ ${e}`);
    process.exit(1);
  }
  const total = Object.keys(DOMAINS).reduce((n, f) => n + parseEvalFile(f).length, 0);
  console.log(`eval-agents: ${total} entries across ${Object.keys(DOMAINS).length} domain files — all valid`);
}

/** Extract checkable repo paths from a Source field: any token rooted at a
 * PATH_ROOTS directory, file or directory alike (src/brands/ccme.css,
 * src/components/Modal). Bare filenames (MAINTAINERS.md, Views.mdx) are not
 * checkable; `mieweb-ui.instructions.md` is special-cased to its canonical
 * home. */
function sourcePaths(source) {
  const out = new Set();
  const roots = PATH_ROOTS.map((r) => r.replace('.', '\\.').slice(0, -1)).join('|');
  for (const m of source.matchAll(new RegExp(`(?<![\\w@/.-])(?:${roots})/[\\w./-]+`, 'g'))) {
    const token = m[0].replace(/[.,;:)]+$/, '');
    if (token.includes('/')) out.add(token);
  }
  if (/(?:^|[\s(])mieweb-ui\.instructions\.md/.test(source))
    out.add('agent/mieweb-ui.instructions.md');
  return out;
}

// ---------------------------------------------------------------------------
// --sheet
// ---------------------------------------------------------------------------
function makeSheet() {
  const n = Number(argAfter('--sheet')) || 4;
  const full = flag('--full');
  const seed = argAfter('--seed') ?? new Date().toISOString().slice(0, 10);
  const lines = [
    `# Eval run sheet — ${new Date().toISOString().slice(0, 10)} (seed: ${seed})`,
    '',
    `Generated by \`node scripts/eval-agents.mjs --sheet${full ? ' --full' : ` ${n}`} --seed ${seed}\`.`,
    'Drive each **Ask** through the installed MIE UI Design Agent (method:',
    '[README.md](../README.md)), then set each **Score** to PASS, PARTIAL, or',
    'FAIL and add Notes. Score with `--score <this file>`.',
    '',
  ];
  for (const file of Object.keys(DOMAINS)) {
    const entries = parseEvalFile(file).filter((e) => e.prefix);
    const picked = full ? entries : sample(entries, n, `${seed}:${file}`);
    lines.push(`## ${file.replace('.md', '')}`, '');
    for (const e of picked) {
      lines.push(
        `### ${e.heading}`,
        '',
        `- **Ask:** ${e.fields.Ask}`,
        `- **Expect:** ${e.fields.Expect}`,
        `- **Agent:** ${e.fields.Agent}`,
        `- **Score:** _unscored_`,
        `- **Notes:**`,
        ''
      );
    }
  }
  const out = argAfter('--out');
  const text = lines.join('\n');
  if (out) {
    writeFileSync(resolve(out), text);
    console.log(`eval-agents: run sheet written to ${out}`);
  } else process.stdout.write(text + '\n');
}

/** Deterministic stratified sample: stable shuffle keyed on a string seed. */
function sample(entries, n, seedStr) {
  let h = 2166136261;
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const keyed = entries.map((e) => {
    h = Math.imul(h ^ e.num, 2654435761);
    return [h >>> 0, e];
  });
  return keyed
    .sort((a, b) => a[0] - b[0])
    .slice(0, n)
    .map(([, e]) => e)
    .sort((a, b) => a.num - b.num);
}

// ---------------------------------------------------------------------------
// --score
// ---------------------------------------------------------------------------
function score() {
  const file = argAfter('--score');
  if (!file || !existsSync(resolve(file))) {
    console.error('eval-agents: --score requires a run-sheet path');
    process.exit(1);
  }
  const text = readFileSync(resolve(file), 'utf8');
  const tally = {}; // domain → {PASS, PARTIAL, FAIL, unscored: []}
  const failures = [];
  let domain = null;
  let entry = null;
  for (const line of text.split('\n')) {
    const d = line.match(/^## ([a-z0-9-]+)$/);
    if (d) {
      if (entry) record();
      entry = null;
      domain = d[1];
    }
    const h = line.match(/^### ([A-Z0-9]+-\d+)/);
    if (h) {
      if (entry) record();
      entry = { id: h[1], score: null };
    }
    const s = line.match(/^- \*\*Score:\*\* *(PASS|PARTIAL|FAIL)\b/);
    if (s && entry) entry.score = s[1];
  }
  if (entry) record();

  function record() {
    const t = (tally[domain] ??= { PASS: 0, PARTIAL: 0, FAIL: 0, unscored: [] });
    if (!entry.score) t.unscored.push(entry.id);
    else {
      t[entry.score]++;
      if (entry.score !== 'PASS') failures.push(`${entry.id}: ${entry.score}`);
    }
  }

  console.log('| Domain | PASS | PARTIAL | FAIL | unscored |');
  console.log('| --- | --- | --- | --- | --- |');
  let bad = 0;
  let total = 0;
  for (const [d, t] of Object.entries(tally)) {
    console.log(`| ${d} | ${t.PASS} | ${t.PARTIAL} | ${t.FAIL} | ${t.unscored.join(' ') || '—'} |`);
    bad += t.FAIL + t.unscored.length;
    total += t.PASS + t.PARTIAL + t.FAIL + t.unscored.length;
  }
  if (!total) {
    console.error('eval-agents: no entries found in the run sheet — wrong file, or truncated?');
    process.exit(1);
  }
  if (failures.length) console.log(`\nNon-PASS: ${failures.join(', ')}`);
  if (bad) {
    console.error(`\neval-agents: ${bad} FAIL/unscored — file corpus fixes per agent/evals/README.md`);
    process.exit(1);
  }
  console.log('\neval-agents: run clean');
}

if (flag('--sheet')) makeSheet();
else if (flag('--score')) score();
else validate();
