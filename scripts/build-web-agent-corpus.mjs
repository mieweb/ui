#!/usr/bin/env node
/**
 * Web-agent corpus generator (#545 / #784).
 *
 * Publishes the agent team as a fetch-only document corpus so a web-based
 * AI agent handed nothing but https://ui.mieweb.org/ can discover and use
 * the design system — no installs, no repo. Generated from the SAME sources
 * `init-agent` ships (agent/skills, agent/agents, agent/mieweb-ui.instructions.md),
 * so there is no second corpus to maintain.
 *
 * Emits into the Storybook static output (rides the existing Pages deploy):
 *
 *   llms.txt                      index at the conventional probe path
 *   agent.md                      fetch-first entry (agent/web/entry.md template
 *                                 + routing table parsed from the design agent)
 *   instructions.md               agent/mieweb-ui.instructions.md, verbatim
 *   skills/<name>.md              each agent/skills/<name>/SKILL.md
 *   skills/<name>-<extra>.md      extra skill files (e.g. selection-guidance)
 *   guides/<slug>.md              each specialist .agent.md, frontmatter folded
 *                                 into a header + a web-reading note
 *
 * Deterministic output (no timestamps). Self-checks at the end: every corpus
 * URL referenced by an emitted file must resolve to an emitted file, and no
 * template placeholder may survive.
 *
 * Usage: node scripts/build-web-agent-corpus.mjs [--out <dir>]   (default storybook-static)
 */
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const outDir = resolve(
  root,
  outArg !== -1 ? process.argv[outArg + 1] : 'storybook-static'
);
// Cloudflare Pages preview builds (non-main branches) self-reference the
// preview URL so the whole corpus is crawlable before merge; production,
// CI, and local builds all emit the canonical host.
const BASE =
  process.env.CF_PAGES_BRANCH &&
  process.env.CF_PAGES_BRANCH !== 'main' &&
  process.env.CF_PAGES_URL
    ? process.env.CF_PAGES_URL
    : 'https://ui.mieweb.org';

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// --- helpers ---------------------------------------------------------------

/** Parse a simple single-line-values YAML frontmatter block. */
function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { attrs: {}, body: source };
  const attrs = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) attrs[kv[1]] = kv[2].trim();
  }
  return { attrs, body: source.slice(match[0].length) };
}

/** First sentence of a description, for llms.txt notes. */
function firstSentence(text) {
  const idx = text.indexOf('. ');
  return idx === -1 ? text : text.slice(0, idx + 1);
}

const emitted = new Map(); // url path (e.g. 'skills/x.md') -> content
function emit(relPath, content) {
  // Source docs hardcode the canonical host; rewrite so preview deploys
  // self-reference (no-op when BASE is the canonical host).
  emitted.set(relPath, content.replaceAll('https://ui.mieweb.org', BASE));
}

// --- skills ----------------------------------------------------------------

const skillsDir = join(root, 'agent/skills');
const skills = []; // { name, description, url }
for (const dir of readdirSync(skillsDir).sort()) {
  const skillPath = join(skillsDir, dir, 'SKILL.md');
  if (!existsSync(skillPath)) continue;
  let source = readFileSync(skillPath, 'utf8');
  // Rewrite relative links to extra skill files to their flattened URLs.
  source = source.replaceAll(
    /\]\(\.\/([\w-]+\.md)\)/g,
    (_, file) => `](${BASE}/skills/${dir}-${file})`
  );
  const { attrs } = parseFrontmatter(source);
  emit(`skills/${dir}.md`, source);
  skills.push({
    name: dir,
    description: attrs.description ?? '',
    url: `${BASE}/skills/${dir}.md`,
  });
  // Extra files in the skill directory (e.g. selection-guidance.md).
  for (const file of readdirSync(join(skillsDir, dir)).sort()) {
    if (file === 'SKILL.md' || !file.endsWith('.md')) continue;
    emit(
      `skills/${dir}-${file}`,
      readFileSync(join(skillsDir, dir, file), 'utf8')
    );
    skills.push({
      name: `${dir} — ${file.replace(/\.md$/, '')}`,
      description: `Companion document to the ${dir} skill.`,
      url: `${BASE}/skills/${dir}-${file}`,
    });
  }
}

// --- guides (specialist agents) ---------------------------------------------

const agentsDir = join(root, 'agent/agents');
const agentFiles = readdirSync(agentsDir)
  .filter((f) => f.endsWith('.agent.md'))
  .sort();

// Display name -> guide slug, for routing-table + cross-reference rewriting.
const agentSlugByName = new Map();
const parsedAgents = agentFiles.map((file) => {
  const source = readFileSync(join(agentsDir, file), 'utf8');
  const { attrs, body } = parseFrontmatter(source);
  const slug = file.replace(/^mieweb-ui-/, '').replace(/\.agent\.md$/, '');
  agentSlugByName.set(attrs.name, slug);
  return { file, slug, name: attrs.name, description: attrs.description, body };
});

const WEB_READING_NOTE = `> **Reading this from the web?** This guide was written for an installed
> subagent team. Where it says "delegate to the MIE UI *X* Agent", fetch that
> domain's guide at \`${BASE}/guides/<domain>.md\` (index in
> [agent.md](${BASE}/agent.md)); where it says "load the \`mieweb-ui-<name>\`
> skill", fetch \`${BASE}/skills/mieweb-ui-<name>.md\`. Handoffs and tools do
> not apply.`;

const guides = []; // { slug, name, description, url }
for (const agent of parsedAgents) {
  if (agent.slug === 'design') continue; // folded into agent.md
  const skillLinks = skills
    .filter(
      (s) => !s.name.includes(' ') && agent.body.includes(`\`${s.name}\``)
    )
    .map((s) => `[${s.name}](${s.url})`);
  const header = [
    `> ${agent.description}`,
    '',
    WEB_READING_NOTE,
    skillLinks.length
      ? `\n**Skills referenced by this guide:** ${skillLinks.join(' · ')}`
      : '',
    '',
  ].join('\n');
  emit(`guides/${agent.slug}.md`, `${header}\n${agent.body}`);
  guides.push({
    slug: agent.slug,
    name: agent.name,
    description: agent.description,
    url: `${BASE}/guides/${agent.slug}.md`,
  });
}

// --- agent.md (entry) --------------------------------------------------------

const design = parsedAgents.find((a) => a.slug === 'design');
if (!design) throw new Error('design agent not found');

// Parse the orchestrator's "Route to specialists" table so the web routing
// table cannot drift from the shipped one.
const routeSection = design.body.match(
  /## Route to specialists\n([\s\S]*?)\n## /
);
if (!routeSection) throw new Error('routing table not found in design agent');
const routingRows = routeSection[1]
  .split('\n')
  .filter((l) => l.startsWith('|') && !/^\|[\s-|]+\|$/.test(l))
  .slice(1) // header row
  .map((line) => {
    const cells = line.split('|').map((c) => c.trim());
    const [, question, agentName] = cells;
    const slug = agentSlugByName.get(agentName);
    if (!slug) throw new Error(`no agent for routing row: ${agentName}`);
    return `| ${question} | [${agentName.replace(/^MIE UI | Agent$/g, '')} guide](${BASE}/guides/${slug}.md) |`;
  });
routingRows.unshift('| ---- | ---- |');

let entry = readFileSync(join(root, 'agent/web/entry.md'), 'utf8')
  .replaceAll('{{VERSION}}', pkg.version)
  .replace('{{ROUTING_TABLE}}', routingRows.join('\n'))
  .replace(
    '{{SKILL_INDEX}}',
    skills.map((s) => `- [${s.name}](${s.url})`).join('\n')
  )
  .replace(
    '{{GUIDE_INDEX}}',
    guides.map((g) => `- [${g.name}](${g.url})`).join('\n')
  )
  .replaceAll(/\{\{SKILL_URL:([\w-]+)\}\}/g, (_, name) => {
    const skill = skills.find(
      (s) => s.name === name || s.url.endsWith(`/skills/${name}.md`)
    );
    if (!skill) throw new Error(`unknown skill in entry template: ${name}`);
    return `[${name}](${skill.url})`;
  });
emit('agent.md', entry);

// --- instructions.md (verbatim) ----------------------------------------------

emit(
  'instructions.md',
  readFileSync(join(root, 'agent/mieweb-ui.instructions.md'), 'utf8')
);

// --- llms.txt -----------------------------------------------------------------

const llms = [
  `# @mieweb/ui — MIE design system (v${pkg.version})`,
  '',
  '> React component library and design system by MIE. This index is for AI',
  '> agents: start at the agent entry document, follow the rules document for',
  '> all UI work, and fetch skills/guides as the task demands. The library is',
  `> installed from npm as \`@mieweb/ui\`; human docs are at ${BASE}/.`,
  '',
  '## Start here',
  '',
  `- [Agent entry — setup recipes, routing, full index](${BASE}/agent.md): how`,
  '  to set up the package in any environment and which document answers what',
  `- [Rules for AI agents](${BASE}/instructions.md): non-negotiable project`,
  '  rules (NITRO-first tables, tokens not hardcoded colors, lucide-react',
  '  icons, a11y, i18n/RTL)',
  '',
  '## Skills (reference knowledge)',
  '',
  ...skills.map((s) => `- [${s.name}](${s.url}): ${firstSentence(s.description)}`),
  '',
  '## Guides (domain workflows)',
  '',
  ...guides.map((g) => `- [${g.name}](${g.url}): ${firstSentence(g.description)}`),
  '',
].join('\n');
emit('llms.txt', llms);

// --- self-check + write -------------------------------------------------------

const problems = [];
const corpusLink = new RegExp(
  `${BASE.replace(/[.\\/]/g, '\\$&')}/([\\w./-]+\\.(?:md|txt))`,
  'g'
);
for (const [path, content] of emitted) {
  for (const [, url] of content.matchAll(corpusLink)) {
    if (!emitted.has(url)) problems.push(`${path}: dead corpus link → ${url}`);
  }
  // Only agent.md is template-expanded; source docs legitimately contain {{ }}
  // in code examples.
  if (path === 'agent.md') {
    const leftover = content.match(/\{\{[^}]+\}\}/);
    if (leftover) problems.push(`${path}: unresolved placeholder ${leftover[0]}`);
  }
}
if (problems.length) {
  console.error('web-agent corpus self-check FAILED:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}

for (const [path, content] of emitted) {
  const target = join(outDir, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}
console.log(
  `web-agent corpus: ${emitted.size} files → ${outDir} (${[...emitted.keys()].filter((k) => !k.includes('/')).join(', ')} + skills/ + guides/)`
);
