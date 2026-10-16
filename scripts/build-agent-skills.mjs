#!/usr/bin/env node
/**
 * Agent-skill generator (#545 / #589).
 *
 * Generates the committed, shipped SKILL.md templates under agent/skills/
 * from source, so they cannot drift (agent/README.md governing rule 5):
 *
 *   catalog → agent/skills/mieweb-ui-catalog/{SKILL.md,selection-guidance.md}
 *             from the catalog manifest (via scripts/catalog-check.mjs) +
 *             src/catalog/*.mdx family pages. SKILL.md stays compact
 *             (inventory + per-family policy lines); the "Which one?"
 *             comparison tables live in selection-guidance.md, which the
 *             skill tells agents to read on demand.
 *
 * Usage:
 *   node scripts/build-agent-skills.mjs            # write all skills
 *   node scripts/build-agent-skills.mjs --check    # exit 1 if committed output is stale
 *
 * Output is deterministic (no timestamps, stable sort) so regeneration
 * produces a stable diff. Managed markers are added by init-agent.mjs at
 * install time, not here.
 */
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkMode = process.argv.includes('--check');
const STORYBOOK_URL = 'https://ui.mieweb.org/';

// --- Catalog manifest (validates the catalog as a side effect) -----------
function loadManifest() {
  const tmp = mkdtempSync(join(tmpdir(), 'mieweb-ui-manifest-'));
  const manifestPath = join(tmp, 'catalog-manifest.json');
  try {
    execFileSync(
      'node',
      [join(root, 'scripts/catalog-check.mjs'), '--manifest', manifestPath],
      {
        stdio: ['ignore', 'ignore', 'inherit'],
      }
    );
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// --- src/catalog/*.mdx → selection-relevant extract per family ------------
// The full pages total ~180 KB, so the skill keeps only what selection
// needs: the title, the family policy blockquote, and the "Which one?"
// comparison. Everything else stays on the Storybook Overview page.
function loadFamilyPages() {
  const dir = join(root, 'src/catalog');
  const pages = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.mdx')) continue;
    const raw = readFileSync(join(dir, file), 'utf8');
    const meta = raw.match(/<Meta title="([^"]+)" \/>/);
    if (!meta) continue;
    const [tier, family] = meta[1].split('/');
    const body = raw.slice(raw.indexOf(meta[0]) + meta[0].length);
    const title = body.match(/^# .+$/m)?.[0] ?? `# ${family}`;
    const quote = body.match(/^(?:> .*\n?)+/m)?.[0].trimEnd() ?? '';
    const start = body.indexOf('## Which one?');
    let whichOne = '';
    if (start !== -1) {
      const rest = body.slice(start);
      const next = rest.indexOf('\n## ');
      whichOne = (next === -1 ? rest : rest.slice(0, next)).trimEnd();
    }
    const extract = [title, quote, whichOne]
      .filter(Boolean)
      .join('\n\n')
      // Storybook-relative links → absolute, so agents can follow them.
      .replaceAll('](?path=', `](${STORYBOOK_URL}?path=`)
      // Strip prettier's table-column padding — it dominates the file size.
      .split('\n')
      .map((line) =>
        line.startsWith('|')
          ? line.replace(/ {2,}/g, ' ').replace(/-{4,}/g, '---')
          : line
      )
      .join('\n');
    pages.push({
      tier,
      family,
      file,
      quote: quote.replaceAll('](?path=', `](${STORYBOOK_URL}?path=`),
      body: extract,
    });
  }
  return pages;
}

// --- Inventory: tier → family → compact component list --------------------
function inventorySection(manifest) {
  const annotate = (e) => {
    const notes = [];
    if (e.maturity !== 'stable') notes.push(e.maturity);
    return notes.length ? `${e.name} _(${notes.join(', ')})_` : e.name;
  };
  const lines = [];
  for (const tier of manifest.taxonomy) {
    const entries = manifest.entries.filter((e) => e.tier === tier.name);
    if (!entries.length) continue;
    lines.push(`### ${tier.name}`, '');
    const families = [...new Set(entries.map((e) => e.family))].sort();
    for (const family of families) {
      const names = entries
        .filter((e) => e.family === family)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(annotate);
      // Flat tiers (Foundations, Deprecated) have no families.
      lines.push(
        family
          ? `- **${family}:** ${names.join(', ')}`
          : `- ${names.join(', ')}`
      );
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

// --- Entry points (selection-relevant subset of package.json exports) -----
const ENTRY_POINTS = [
  ['`@mieweb/ui`', 'All general-purpose components (the default import)'],
  [
    '`@mieweb/ui/datavis`',
    'DataVis NITRO grid + graph — the default for all tables (deps bundled)',
  ],
  ['`@mieweb/ui/esheet`', 'eSheet form-field adapters'],
  [
    '`@mieweb/ui/kerebron`',
    'RichEditor / CodeEditor (keeps Kerebron WASM optional)',
  ],
  ['`@mieweb/ui/hooks`', 'Shared React hooks'],
  ['`@mieweb/ui/utils`', 'Utility functions'],
  ['`@mieweb/ui/tailwind-preset`', 'Tailwind preset (design tokens)'],
  [
    '`@mieweb/ui/brands`',
    'Brand CSS + presets (bluehive, mieweb, webchart, …)',
  ],
  [
    '`@mieweb/ui/templates`',
    'Landing-page sections + LandingPage renderer (Server Component safe)',
  ],
  [
    '`@mieweb/ui/deck`',
    'Full-screen slide decks from JSON slides (client-only)',
  ],
  ['`@mieweb/ui/maps`', 'Leaflet maps (PointMap; peer: leaflet)'],
  ['`@mieweb/ui/globe`', 'Globe showcase (peers: react-globe.gl, three)'],
  ['`@mieweb/ui/org-chart`', 'OrgChart (peers: @xyflow/react, elkjs)'],
  [
    '`@mieweb/ui/motion`',
    'MotionProvider (keeps the motion dependency optional)',
  ],
  ['`@mieweb/ui/q`', 'Q editor (peer: @mieweb/q)'],
  [
    '`@mieweb/ui/ag-grid`',
    '**Deprecated** — never in new code; use `/datavis`',
  ],
];

function buildCatalogSkill() {
  const manifest = loadManifest();
  const pages = loadFamilyPages();
  const total = manifest.entries.length;

  const generatedNote =
    '<!-- GENERATED by scripts/build-agent-skills.mjs — do not edit by hand. Regenerate with `pnpm agent:skills`. -->';

  // Per-family policy one-liners: the blockquote from each family page.
  const policies = pages
    .filter((p) => p.quote)
    .map((p) => `**${p.family}** (${p.tier}):\n\n${p.quote}`)
    .join('\n\n');

  const guidance = pages
    .map((p) => `<!-- source: src/catalog/${p.file} (${p.tier}) -->\n${p.body}`)
    .join('\n\n---\n\n');

  const skill = `---
name: mieweb-ui-catalog
description: Component inventory and selection guidance for the @mieweb/ui design system. USE WHEN choosing a component ("which component for X?", "Card or Panel?", "which table?"), checking whether a component exists, finding the import entry point, or linking to its docs.
---

${generatedNote}

# @mieweb/ui component catalog

${total} cataloged components. Full docs: ${STORYBOOK_URL} (Storybook; sidebar is Tier / Family / Component, every family has an Overview page).

For per-component "Which one?" comparison tables, read [selection-guidance.md](./selection-guidance.md) in this skill and jump to the family's section.

**Selection ground rules** (from the installed \`mieweb-ui.instructions.md\` — they always apply):

1. Tables and data grids start with **DataVis NITRO**; \`Table\` only for a few static rows. \`AGGrid\` is deprecated.
2. Two or more adjacent buttons, or one with a long/unpredictable label → \`ButtonGroup\`.
3. Use an existing component before writing your own — raw HTML that duplicates a component is a violation.
4. Use composition slots and variant/size props, not custom markup or className hacks.

## Entry points

| Entry | Use for |
| ----- | ------- |
${ENTRY_POINTS.map(([e, d]) => `| ${e} | ${d} |`).join('\n')}

## Inventory

Components by tier and family. Maturity noted when not stable.

${inventorySection(manifest)}

## Family policies

The one-line rule that governs each family. When a task touches a family, read its full "Which one?" table in [selection-guidance.md](./selection-guidance.md).

${policies}
`;

  const reference = `${generatedNote}

# @mieweb/ui selection guidance by family

Extracted from the catalog family pages (\`src/catalog/*.mdx\`): the family policy and the "Which one?" comparison. Each family's Storybook Overview page has the full version (how the pieces fit together, shared limitations).

${guidance}
`;

  return { 'SKILL.md': skill, 'selection-guidance.md': reference };
}

// --- Write / check ---------------------------------------------------------
const skills = [
  { dir: 'agent/skills/mieweb-ui-catalog', build: buildCatalogSkill },
];

let stale = false;
for (const { dir, build } of skills) {
  const files = build();
  for (const [name, next] of Object.entries(files)) {
    const outPath = join(root, dir, name);
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
    if (checkMode) {
      if (current !== next) {
        console.error(`✗ stale: ${dir}/${name} — run \`pnpm agent:skills\``);
        stale = true;
      } else {
        console.log(`✔ up to date: ${dir}/${name}`);
      }
    } else {
      mkdirSync(join(root, dir), { recursive: true });
      writeFileSync(outPath, next);
      console.log(
        `✔ wrote ${dir}/${name} (${(next.length / 1024).toFixed(1)} KB)`
      );
    }
  }
}
if (stale) process.exit(1);
