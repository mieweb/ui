#!/usr/bin/env node
/**
 * Catalog guard: validates every Storybook entry against the taxonomy in
 * .storybook/taxonomy.json and the metadata contract in CONTRIBUTING.md
 * ("Stories & documentation"), then emits the catalog manifest (#421).
 *
 * Fails on:
 *   - a title that is not `Tier/Family/Component` with a known tier + family
 *   - a family with more than `maxFamilySize` members
 *   - a Meta without exactly one `scope:*` and one `maturity:*` tag, or whose
 *     scope contradicts the tier it is filed under
 *   - a missing / duplicate / malformed stable `id`
 *   - a missing `parameters.docs.description.component`, unless the id is
 *     grandfathered in catalog-baseline.json (ratchet — entries can only leave)
 *   - a `parameters.catalog.relationships[]` item with an unknown type, an
 *     unknown target, no `why`, or a reciprocal type that the target does not
 *     return
 *   - a `.storybook/preview.tsx` storySort order that drifted from taxonomy.json
 *     (Storybook parses storySort statically, so it cannot import the JSON)
 *
 * Usage:
 *   node scripts/catalog-check.mjs                    # validate (CI)
 *   node scripts/catalog-check.mjs --manifest out.json  # also write the manifest
 *   node scripts/catalog-check.mjs --update-baseline  # re-record undocumented ids
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStorySortParameter, loadCsf } from 'storybook/internal/csf-tools';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src');
const TAXONOMY = JSON.parse(
  readFileSync(join(root, '.storybook', 'taxonomy.json'), 'utf8')
);
const BASELINE_PATH = join(root, 'scripts', 'catalog-baseline.json');
const args = process.argv.slice(2);
const updateBaseline = args.includes('--update-baseline');
const manifestIdx = args.indexOf('--manifest');
const manifestPath = manifestIdx >= 0 ? args[manifestIdx + 1] : null;

const tiers = new Map(TAXONOMY.tiers.map((t) => [t.name, t]));
const errors = [];
const warnings = [];
const rel = (file) => relative(root, file);

// ---------------------------------------------------------------------------
// Static evaluation of the Meta's `parameters` object (only literals matter).
// ---------------------------------------------------------------------------
function evalNode(node) {
  if (!node) return undefined;
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value;
    case 'NullLiteral':
      return null;
    case 'TemplateLiteral':
      return node.quasis.map((q) => q.value.cooked).join('${…}');
    case 'ArrayExpression':
      return node.elements.map(evalNode);
    case 'ObjectExpression': {
      const out = {};
      for (const p of node.properties) {
        if (p.type !== 'ObjectProperty') continue;
        const key = p.key.type === 'Identifier' ? p.key.name : evalNode(p.key);
        out[key] = evalNode(p.value);
      }
      return out;
    }
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
      return evalNode(node.expression);
    case 'BinaryExpression':
      if (node.operator === '+') {
        const l = evalNode(node.left);
        const r = evalNode(node.right);
        if (typeof l === 'string' && typeof r === 'string') return l + r;
      }
      return undefined;
    case 'CallExpression':
      // `[...].join('\n')` is the common multi-line description idiom.
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.property.name === 'join' &&
        node.callee.object.type === 'ArrayExpression'
      ) {
        const sep = evalNode(node.arguments[0]) ?? ',';
        return evalNode(node.callee.object).join(sep);
      }
      return undefined;
    default:
      // Identifier / imported constant: treat as "present but opaque".
      return undefined;
  }
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.stories\.tsx?$|\.mdx$/.test(entry.name)) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------
function parseTitle(title, file) {
  const parts = title.split('/');
  const tier = tiers.get(parts[0]);
  if (!tier) {
    errors.push(`${rel(file)}: unknown tier "${parts[0]}" in title "${title}"`);
    return null;
  }
  if (tier.flat) {
    if (parts.length > 2) {
      errors.push(
        `${rel(file)}: flat tier "${tier.name}" allows Tier/Component only: "${title}"`
      );
    }
    return {
      tier: tier.name,
      family: null,
      name: parts.slice(1).join('/') || null,
    };
  }
  if (parts.length !== 3) {
    errors.push(
      `${rel(file)}: title must be Tier/Family/Component: "${title}"`
    );
    return null;
  }
  if (!tier.families.includes(parts[1])) {
    errors.push(
      `${rel(file)}: unknown family "${parts[1]}" under "${tier.name}" (see .storybook/taxonomy.json)`
    );
    return null;
  }
  return { tier: tier.name, family: parts[1], name: parts[2] };
}

const entries = [];
for (const file of walk(SRC)) {
  const code = readFileSync(file, 'utf8');
  if (file.endsWith('.mdx')) {
    const m = code.match(/<Meta\s+title="([^"]+)"/);
    if (!m) continue; // MDX attached to a component via `of` — covered by its CSF
    const where = parseTitle(m[1], file);
    if (where) entries.push({ kind: 'mdx', file, title: m[1], ...where });
    continue;
  }
  let csf;
  try {
    csf = loadCsf(code, { makeTitle: (t) => t, fileName: file }).parse();
  } catch (e) {
    errors.push(
      `${rel(file)}: could not parse CSF (${e.message.split('\n')[0]})`
    );
    continue;
  }
  const meta = csf.meta ?? {};
  if (!meta.title) {
    errors.push(`${rel(file)}: Meta has no title`);
    continue;
  }
  const where = parseTitle(meta.title, file);
  if (!where) continue;
  const parameters = evalNode(csf._metaAnnotations.parameters) ?? {};
  const description = parameters?.docs?.description?.component;
  entries.push({
    kind: 'csf',
    file,
    title: meta.title,
    id: meta.id,
    tags: meta.tags ?? [],
    component: meta.component,
    description,
    hasDescription:
      description === undefined
        ? csf._metaAnnotations.parameters !== undefined &&
          /description:\s*\{[^}]*component/.test(code)
        : String(description).trim().length >= 40,
    catalog: parameters?.catalog,
    stories: csf.stories.map((s) => s.name),
    ...where,
  });
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------
const csfEntries = entries.filter((e) => e.kind === 'csf');
const byId = new Map();
const landing = TAXONOMY.landingPage;

for (const e of csfEntries) {
  const loc = rel(e.file);
  if (!e.id)
    errors.push(
      `${loc}: Meta needs a stable \`id\` (kebab-case, e.g. "${slug(e.family ?? e.tier)}-${slug(e.name)}")`
    );
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id))
    errors.push(`${loc}: id "${e.id}" must be kebab-case`);
  else if (byId.has(e.id))
    errors.push(
      `${loc}: duplicate id "${e.id}" (also ${rel(byId.get(e.id).file)})`
    );
  else byId.set(e.id, e);

  const scope = e.tags.filter((t) => t.startsWith('scope:'));
  const maturity = e.tags.filter((t) => t.startsWith('maturity:'));
  if (scope.length !== 1 || !TAXONOMY.scopeTags.includes(scope[0]))
    errors.push(
      `${loc}: exactly one scope tag required (${TAXONOMY.scopeTags.join(' | ')}), got [${scope}]`
    );
  if (maturity.length !== 1 || !TAXONOMY.maturityTags.includes(maturity[0]))
    errors.push(
      `${loc}: exactly one maturity tag required (${TAXONOMY.maturityTags.join(' | ')}), got [${maturity}]`
    );
  const tierScope = tiers.get(e.tier).scope;
  if (
    tierScope &&
    scope[0] &&
    scope[0] !== tierScope &&
    scope[0] !== 'scope:application-local'
  )
    errors.push(
      `${loc}: tier "${e.tier}" holds ${tierScope} entries but Meta is tagged ${scope[0]}`
    );
  if (!e.tags.includes('autodocs'))
    errors.push(`${loc}: Meta needs the "autodocs" tag`);
  e.scope = scope[0];
  e.maturity = maturity[0];
}

// Family size (landing pages excluded).
const families = new Map();
for (const e of entries) {
  if (!e.family || e.name === landing) continue;
  const key = `${e.tier}/${e.family}`;
  families.set(key, [...(families.get(key) ?? []), e]);
}
for (const [key, members] of families) {
  if (members.length > TAXONOMY.maxFamilySize)
    errors.push(
      `${key}: ${members.length} members > ${TAXONOMY.maxFamilySize} — split the family or merge variants into one component`
    );
  if (
    !entries.some((e) => `${e.tier}/${e.family}` === key && e.name === landing)
  )
    warnings.push(
      `${key}: no "${landing}" landing page yet (src/catalog/<Family>.mdx)`
    );
}
for (const tier of TAXONOMY.tiers) {
  if (tier.flat) continue;
  if (tier.families.length > TAXONOMY.maxFamilySize)
    errors.push(
      `taxonomy: tier "${tier.name}" has ${tier.families.length} families > ${TAXONOMY.maxFamilySize}`
    );
}

// preview.tsx storySort must mirror the taxonomy. Storybook's grammar: a name
// followed by an array orders that name's children.
{
  const expected = TAXONOMY.tiers.flatMap((t) =>
    t.families
      ? [t.name, t.families.flatMap((f) => [f, [landing, '*']])]
      : [t.name]
  );
  const previewPath = join(root, '.storybook', 'preview.tsx');
  let actual;
  try {
    actual = getStorySortParameter(readFileSync(previewPath, 'utf8'))?.order;
  } catch (e) {
    errors.push(
      `.storybook/preview.tsx: could not read storySort (${e.message.split('\n')[0]})`
    );
  }
  if (actual && JSON.stringify(actual) !== JSON.stringify(expected))
    errors.push(
      `.storybook/preview.tsx: storySort.order differs from taxonomy.json — regenerate it with:\n` +
        `  node -e "const t=require('./.storybook/taxonomy.json');console.log(JSON.stringify(t.tiers.flatMap(x=>x.families?[x.name,x.families.flatMap(f=>[f,[t.landingPage,'*']])]:[x.name])))"`
    );
}

// Description ratchet.
let baseline = [];
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
} catch {
  /* first run */
}
const undocumented = csfEntries
  .filter((e) => e.id && !e.hasDescription)
  .map((e) => e.id)
  .sort();
if (updateBaseline) {
  writeFileSync(BASELINE_PATH, JSON.stringify(undocumented, null, 2) + '\n');
  console.log(
    `catalog-check: baseline rewritten with ${undocumented.length} undocumented ids`
  );
} else {
  const baselineSet = new Set(baseline);
  for (const id of undocumented) {
    if (!baselineSet.has(id))
      errors.push(
        `${rel(byId.get(id).file)}: "${id}" has no parameters.docs.description.component — write it (six-heading template in CONTRIBUTING) rather than adding to the baseline`
      );
  }
  for (const id of baseline) {
    if (!undocumented.includes(id))
      errors.push(
        `scripts/catalog-baseline.json: "${id}" is documented (or gone) — remove it (run with --update-baseline)`
      );
  }
}

// Relationships.
const reciprocal = TAXONOMY.reciprocalRelationships;
for (const e of csfEntries) {
  const relsRaw = e.catalog?.relationships;
  if (relsRaw === undefined) continue;
  const loc = rel(e.file);
  if (!Array.isArray(relsRaw)) {
    errors.push(
      `${loc}: parameters.catalog.relationships must be an array of { type, target, why }`
    );
    continue;
  }
  for (const r of relsRaw) {
    if (!r || typeof r !== 'object') {
      errors.push(`${loc}: relationship must be an object literal`);
      continue;
    }
    if (!TAXONOMY.relationshipTypes.includes(r.type))
      errors.push(
        `${loc}: relationship type "${r.type}" not in [${TAXONOMY.relationshipTypes.join(', ')}]`
      );
    const target = byId.get(r.target);
    if (!target) {
      errors.push(
        `${loc}: relationship target "${r.target}" is not a known Meta id`
      );
      continue;
    }
    if (!r.why || String(r.why).trim().length < 10)
      errors.push(
        `${loc}: relationship ${e.id} → ${r.target} needs a one-line \`why\``
      );
    const back = reciprocal[r.type];
    if (back) {
      const returned = (target.catalog?.relationships ?? []).some(
        (t) => t && t.target === e.id && t.type === back
      );
      if (!returned)
        errors.push(
          `${rel(target.file)}: "${r.target}" must declare { type: '${back}', target: '${e.id}' } to reciprocate ${loc}`
        );
    }
  }
  if (e.catalog.entry && typeof e.catalog.entry !== 'string')
    errors.push(
      `${loc}: parameters.catalog.entry must be a string like "@mieweb/ui/datavis"`
    );
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Report + manifest
// ---------------------------------------------------------------------------
const counts = {};
for (const e of csfEntries) {
  counts[e.tier] ??= {};
  counts[e.tier][e.family ?? '(flat)'] =
    (counts[e.tier][e.family ?? '(flat)'] ?? 0) + 1;
}
console.log(
  `catalog-check: ${csfEntries.length} components, ${entries.length - csfEntries.length} docs pages, ${undocumented.length} without description`
);
for (const [tier, fams] of Object.entries(counts)) {
  console.log(
    `  ${tier}: ${Object.entries(fams)
      .map(([f, n]) => `${f} ${n}`)
      .join(' · ')}`
  );
}

if (manifestPath) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    taxonomy: TAXONOMY.tiers.map((t) => ({
      name: t.name,
      families: t.families ?? [],
    })),
    entries: csfEntries
      .map((e) => ({
        id: e.id,
        title: e.title,
        tier: e.tier,
        family: e.family,
        name: e.name,
        scope: e.scope?.replace('scope:', ''),
        maturity: e.maturity?.replace('maturity:', ''),
        component: e.component,
        file: rel(e.file),
        docsUrl: `?path=/docs/${e.id}--docs`,
        documented: e.hasDescription,
        stories: e.stories,
        ...(e.catalog ?? {}),
      }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    pages: entries
      .filter((e) => e.kind === 'mdx')
      .map((e) => ({ title: e.title, file: rel(e.file) })),
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`catalog-check: manifest written to ${rel(manifestPath)}`);
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
if (errors.length) {
  console.error(`\ncatalog-check: ${errors.length} error(s)`);
  process.exit(1);
}
console.log(
  `catalog-check: ok${warnings.length ? ` (${warnings.length} warning(s))` : ''}`
);
