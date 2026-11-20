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
 *   api-cheatsheet.md             agent/web/api-cheatsheet.md, verbatim
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
// preview so the whole corpus is crawlable before merge; production, CI,
// and local builds all emit the canonical host. Use CF_PAGES_URL's
// per-commit hash host, not the stable branch-alias host: web-agent
// fetchers cache per-host refusals (e.g. from Cloudflare's forced noindex
// on *.pages.dev before the _headers override), so a reused alias host can
// stay poisoned across pushes while a fresh hash host has no history. All
// corpus links stay same-origin with the handed-out URL either way.
function previewBase() {
  const { CF_PAGES_BRANCH: branch, CF_PAGES_URL: url } = process.env;
  if (!branch || branch === 'main' || !url) return null;
  return new URL(url).origin;
}
const BASE = previewBase() ?? 'https://ui.mieweb.org';

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

// --- api-cheatsheet.md (verbatim) ---------------------------------------------

// Verified prop signatures for the components whose APIs deviate from
// Radix/shadcn conventions. Web agents that skip the full skill docs code
// from convention and crash at runtime (verified: Select options array,
// Modal onOpenChange, Checkbox native onChange, NITRO wire format) — this
// sheet is small enough to ride the root-page embed as the guaranteed floor.
emit(
  'api-cheatsheet.md',
  readFileSync(join(root, 'agent/web/api-cheatsheet.md'), 'utf8')
);

// --- llms.txt -----------------------------------------------------------------

const llms = [
  `# @mieweb/ui — MIE design system (v${pkg.version})`,
  '',
  '> React component library and design system by MIE. This index is for AI',
  '> agents: start at the agent entry document, follow the rules document for',
  '> all UI work, and fetch skills/guides as the task demands. The library is',
  `> installed from npm as \`@mieweb/ui\`; human docs are at ${BASE}/.`,
  '>',
  '> If your browsing tool refuses to open links discovered in this document,',
  '> do not stall or ask for file uploads: ask the user to paste the specific',
  '> URLs into the chat — pasted URLs fetch successfully.',
  '',
  '## Start here',
  '',
  `- [Agent entry — setup recipes, routing, full index](${BASE}/agent.md): how`,
  '  to set up the package in any environment and which document answers what',
  `- [Rules for AI agents](${BASE}/instructions.md): non-negotiable project`,
  '  rules (NITRO-first tables, tokens not hardcoded colors, lucide-react',
  '  icons, a11y, i18n/RTL)',
  `- [API cheat sheet](${BASE}/api-cheatsheet.md): verified prop signatures`,
  '  for the components agents most often guess wrong (Select, Checkbox,',
  '  Modal, NITRO grid wire format) — read before writing component code',
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

// Real robots.txt (otherwise the SPA fallback serves the Storybook HTML
// shell for it, which strict agent fetchers may treat as a parse failure).
emit(
  'robots.txt',
  [
    'User-agent: *',
    'Allow: /',
    '',
    '# AI agents: machine-readable docs for this design system:',
    `# ${BASE}/llms.txt`,
    `# ${BASE}/agent.md`,
    '',
  ].join('\n')
);

// Preview-only: Cloudflare injects `X-Robots-Tag: noindex` on *.pages.dev,
// which polite AI fetchers treat as do-not-fetch for discovered URLs. Try
// overriding it via the Pages `_headers` file so web agents can dry-run the
// corpus pre-merge. Never emitted for production builds.
if (BASE !== 'https://ui.mieweb.org') {
  emit('_headers', ['/*', '  X-Robots-Tag: all', ''].join('\n'));
}

// --- self-check + write -------------------------------------------------------

const problems = [];
// Match any absolute .md/.txt URL, then compare the origin by plain string
// prefix (no dynamic RegExp — hostname checks via regex trip CodeQL and are
// easy to get subtly wrong).
const docLink = /https:\/\/[\w.-]+\/[\w./-]+\.(?:md|txt)/g;
for (const [path, content] of emitted) {
  for (const [full] of content.matchAll(docLink)) {
    if (!full.startsWith(`${BASE}/`)) continue;
    const url = full.slice(BASE.length + 1);
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

// Patch the built Storybook shell's discovery pointers to absolute URLs on
// this deploy's host. The source pointers in .storybook/manager-head.html are
// origin-relative (correct for any host), but Claude-style web fetchers only
// open URLs that literally appeared in a prior fetch result — a relative
// "/llms.txt" resolves fine yet fails that whitelist (verified empirically,
// mieweb/ui#784).
const indexHtml = join(outDir, 'index.html');
if (existsSync(indexHtml)) {
  const html = readFileSync(indexHtml, 'utf8');
  let patched = html
    .replaceAll('content="/llms.txt"', `content="${BASE}/llms.txt"`)
    .replaceAll('href="/agent.md"', `href="${BASE}/agent.md"`);
  if (!patched.includes(`content="${BASE}/llms.txt"`)) {
    console.error(
      'web-agent corpus: WARNING — discovery pointers not found in index.html (manager-head.html changed?)'
    );
  }
  // Embed the llms.txt index AND the full rules document verbatim in the
  // shell so a SINGLE fetch of the root URL hands any agent the complete
  // component/skill index plus the non-negotiable project rules. Several web
  // fetchers (verified: Claude's, ChatGPT's) refuse to follow even
  // same-origin discovered links on low-trust hosts, and the Storybook shell
  // is otherwise empty to a non-JS fetcher — the embed is the guaranteed
  // floor that keeps such agents grounded instead of inventing APIs. Hide it
  // from humans via a stylesheet rule only: readability-style extractors
  // strip elements carrying hidden/aria-hidden/inline display:none (verified
  // empirically — Claude reported "no component content" with those
  // present), but they do not apply <style> sheets, while browsers do.
  // display:none also hides it from screen readers. Refreshed on every run:
  // any prior embed is replaced, never duplicated, so reruns pick up corpus
  // changes (escaped content cannot contain a literal "</pre>").
  const embedText = [
    llms,
    '',
    '---',
    '',
    emitted.get('instructions.md'),
    '',
    '---',
    '',
    emitted.get('api-cheatsheet.md'),
  ].join('\n');
  const escaped = embedText
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  const embed = `<style>#llms-txt{display:none}</style><pre id="llms-txt">\n${escaped}\n</pre>`;
  patched = patched.replace(
    /<style>#llms-txt\{display:none\}<\/style><pre id="llms-txt">[\s\S]*?<\/pre>/,
    ''
  );
  patched = patched.includes('</body>')
    ? patched.replace('</body>', `${embed}</body>`)
    : patched + embed;
  if (patched !== html) {
    writeFileSync(indexHtml, patched);
  }
}
console.log(
  `web-agent corpus: ${emitted.size} files → ${outDir} (${[...emitted.keys()].filter((k) => !k.includes('/')).join(', ')} + skills/ + guides/)`
);
