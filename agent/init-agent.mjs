#!/usr/bin/env node
/**
 * `npx @mieweb/ui init-agent`
 *
 * Installs @mieweb/ui's AI-agent rules into the consuming repository:
 *  1. `.github/instructions/mieweb-ui.instructions.md` — auto-applied by
 *     VS Code Copilot (and compatible tools) to matching files.
 *  2. A marked block in `AGENTS.md` — read by Claude Code, Cursor, Codex,
 *     and other agents that follow the AGENTS.md convention.
 *
 * Idempotent: rerun after upgrading @mieweb/ui to refresh both targets.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const command = process.argv[2];
if (command !== 'init-agent') {
  console.log('Usage: npx @mieweb/ui init-agent');
  process.exit(command ? 1 : 0);
}

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));
const template = readFileSync(join(here, 'mieweb-ui.instructions.md'), 'utf8');
const targetRoot = resolve(process.cwd());

// --- 1. VS Code instructions file --------------------------------------
const instructionsDir = join(targetRoot, '.github', 'instructions');
const instructionsPath = join(instructionsDir, 'mieweb-ui.instructions.md');
mkdirSync(instructionsDir, { recursive: true });
writeFileSync(instructionsPath, template);
console.log(`✔ wrote .github/instructions/mieweb-ui.instructions.md`);

// --- 2. AGENTS.md marked block ------------------------------------------
const BEGIN = '<!-- mieweb-ui:begin -->';
const END = '<!-- mieweb-ui:end -->';
// Same rules, minus the VS Code-specific frontmatter.
const body = template.replace(/^---\n[\s\S]*?\n---\n+/, '');
const block = `${BEGIN}\n${body.trimEnd()}\n${END}`;

const agentsPath = join(targetRoot, 'AGENTS.md');
if (!existsSync(agentsPath)) {
  writeFileSync(agentsPath, `${block}\n`);
  console.log('✔ created AGENTS.md');
} else {
  const current = readFileSync(agentsPath, 'utf8');
  const start = current.indexOf(BEGIN);
  const end = start === -1 ? -1 : current.indexOf(END, start + BEGIN.length);
  let updated;
  if (start !== -1 && end !== -1) {
    updated = current.slice(0, start) + block + current.slice(end + END.length);
    console.log('✔ refreshed @mieweb/ui block in AGENTS.md');
  } else {
    updated = `${current.trimEnd()}\n\n${block}\n`;
    console.log('✔ appended @mieweb/ui block to AGENTS.md');
  }
  writeFileSync(agentsPath, updated);
}

console.log(`\n@mieweb/ui@${pkg.version} agent rules installed.`);
