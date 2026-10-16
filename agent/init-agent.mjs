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
 * With `--experimental-agents` (epic #545, until P5.2 flips the default):
 *  3. The MIE UI agent team — `.github/agents/mieweb-ui-*.agent.md` and
 *     the `.github/skills/mieweb-ui-*` dirs, each stamped with a managed
 *     marker so reruns refresh them, plus an agent-roster section in the
 *     `AGENTS.md` block for tools without native subagent support.
 *
 * Idempotent: rerun after upgrading @mieweb/ui to refresh all targets.
 * Managed-marker rules are specified in agent/README.md.
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const command = process.argv[2];
const experimentalAgents = process.argv.includes('--experimental-agents');
if (command !== 'init-agent') {
  console.log('Usage: npx @mieweb/ui init-agent [--experimental-agents]');
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

// --- 2. Agent team (only with --experimental-agents) --------------------
const MARKER_PREFIX = '<!-- mieweb-ui:managed ';
const marker = `${MARKER_PREFIX}@mieweb/ui@${pkg.version} -->`;
// Marker goes on the first body line — after frontmatter if present.
const withMarker = (content) => {
  const fm = content.match(/^---\n[\s\S]*?\n---\n/);
  return fm
    ? `${fm[0]}${marker}\n${content.slice(fm[0].length)}`
    : `${marker}\n${content}`;
};
const isManaged = (path) => readFileSync(path, 'utf8').includes(MARKER_PREFIX);
const frontmatterField = (content, field) =>
  content.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1].trim();
const warnUserFile = (label) =>
  console.warn(
    `⚠ skipped ${label} — exists without a managed marker (user-created); not overwritten`
  );
const warnOrphan = (label) =>
  console.warn(
    `⚠ ${label} is installed but no longer shipped by @mieweb/ui — remove manually if unwanted`
  );

let roster = '';
if (experimentalAgents) {
  const agentLines = [];
  const skillLines = [];

  // Agents: file granularity.
  const agentsTemplateDir = join(here, 'agents');
  const agentTemplates = readdirSync(agentsTemplateDir)
    .filter((f) => f.endsWith('.agent.md'))
    .sort();
  const destAgentsDir = join(targetRoot, '.github', 'agents');
  for (const file of agentTemplates) {
    const content = readFileSync(join(agentsTemplateDir, file), 'utf8');
    const dest = join(destAgentsDir, file);
    if (existsSync(dest) && !isManaged(dest)) {
      warnUserFile(`.github/agents/${file}`);
    } else {
      mkdirSync(destAgentsDir, { recursive: true });
      writeFileSync(dest, withMarker(content));
      console.log(`✔ wrote .github/agents/${file}`);
    }
    agentLines.push(
      `- **${frontmatterField(content, 'name')}** (\`.github/agents/${file}\`): ${frontmatterField(content, 'description')}`
    );
  }

  // Skills: directory granularity — managed iff SKILL.md carries the marker.
  const skillsTemplateDir = join(here, 'skills');
  const skillTemplates = readdirSync(skillsTemplateDir, {
    withFileTypes: true,
  })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const destSkillsDir = join(targetRoot, '.github', 'skills');
  for (const dir of skillTemplates) {
    const srcDir = join(skillsTemplateDir, dir);
    const skillContent = readFileSync(join(srcDir, 'SKILL.md'), 'utf8');
    const destSkill = join(destSkillsDir, dir, 'SKILL.md');
    if (existsSync(destSkill) && !isManaged(destSkill)) {
      warnUserFile(`.github/skills/${dir}/`);
    } else {
      mkdirSync(join(destSkillsDir, dir), { recursive: true });
      for (const f of readdirSync(srcDir).sort()) {
        const content = readFileSync(join(srcDir, f), 'utf8');
        writeFileSync(
          join(destSkillsDir, dir, f),
          f.endsWith('.md') ? withMarker(content) : content
        );
      }
      console.log(`✔ wrote .github/skills/${dir}/`);
    }
    skillLines.push(
      `- \`${dir}\` (\`.github/skills/${dir}/SKILL.md\`): ${frontmatterField(skillContent, 'description')}`
    );
  }

  // Report (never delete) installed mieweb-ui-* artifacts we no longer ship.
  if (existsSync(destAgentsDir)) {
    for (const f of readdirSync(destAgentsDir)) {
      if (
        f.startsWith('mieweb-ui-') &&
        f.endsWith('.agent.md') &&
        !agentTemplates.includes(f)
      )
        warnOrphan(`.github/agents/${f}`);
    }
  }
  if (existsSync(destSkillsDir)) {
    for (const d of readdirSync(destSkillsDir)) {
      if (d.startsWith('mieweb-ui-') && !skillTemplates.includes(d))
        warnOrphan(`.github/skills/${d}/`);
    }
  }

  roster = [
    '',
    '',
    '## MIE UI agent team (experimental)',
    '',
    'Installed by `npx @mieweb/ui init-agent --experimental-agents`. Tools with',
    'native agent support (VS Code Copilot) discover these automatically; other',
    'tools should read the files below and adopt the matching persona. Start with',
    'the **MIE UI Design Agent** for any @mieweb/ui question.',
    '',
    '### Agents',
    '',
    ...agentLines,
    '',
    '### Skills',
    '',
    ...skillLines,
  ].join('\n');
}

// --- 3. AGENTS.md marked block ------------------------------------------
const BEGIN = '<!-- mieweb-ui:begin -->';
const END = '<!-- mieweb-ui:end -->';
// Same rules, minus the VS Code-specific frontmatter. The roster rides inside
// the block so AGENTS.md-only tools see the team too (empty when flagless —
// the default run stays byte-identical to the pre-team behavior).
const body = template.replace(/^---\n[\s\S]*?\n---\n+/, '');
const block = `${BEGIN}\n${body.trimEnd()}${roster}\n${END}`;

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
