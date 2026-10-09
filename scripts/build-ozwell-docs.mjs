#!/usr/bin/env node
/**
 * Build the docs corpus the embedded Ozwell assistant answers
 * "how do I use X?" questions from (.storybook/manager-head.html,
 * get_component_docs tool).
 *
 * Extracts, into .storybook/public/ozwell/docs.json:
 * - src/catalog/*.mdx        → per-category selection guidance ("Which one?")
 * - src/components/** JSDoc  → per-component description + @example snippets
 *
 * Runs as part of `storybook`/`build-storybook`; the output is generated,
 * not committed.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '.storybook/public/ozwell/docs.json');

/** Strip a JSDoc block to plain text lines (without comment markers). */
function jsdocLines(block) {
  return block
    .split('\n')
    .map((l) => l.replace(/^\s*\/?\*+\/?\s?/, '').replace(/\*\/\s*$/, ''))
    .join('\n')
    .trim()
    .split('\n');
}

/** Parse a JSDoc block into { description, examples[] }. */
function parseJsdoc(block) {
  const lines = jsdocLines(block);
  const description = [];
  const examples = [];
  let example = null;
  for (const line of lines) {
    if (/^@example\b/.test(line)) {
      if (example) examples.push(example.trim());
      example = '';
    } else if (/^@\w+/.test(line)) {
      if (example) examples.push(example.trim());
      example = null; // other tags (@param, @see…) end the example and are skipped
    } else if (example !== null) {
      example += line + '\n';
    } else {
      description.push(line);
    }
  }
  if (example) examples.push(example.trim());
  return { description: description.join('\n').trim(), examples };
}

// --- Category guidance from src/catalog/*.mdx ---------------------------
const categories = {};
const catalogDir = join(root, 'src/catalog');
for (const file of readdirSync(catalogDir)) {
  if (!file.endsWith('.mdx')) continue;
  const raw = readFileSync(join(catalogDir, file), 'utf8');
  const metaTag = raw.match(/<Meta[^>]*\/>/);
  const title = raw.match(/<Meta\s+title="([^"]+)"/)?.[1];
  if (!title || !metaTag) continue;
  // Drop only the MDX preamble (imports + <Meta/>); a global import strip
  // would also delete import lines inside fenced usage examples.
  const content = raw
    .slice(raw.indexOf(metaTag[0]) + metaTag[0].length)
    .trim();
  // 'Inputs/Actions/Overview' → key 'Inputs/Actions'
  const key = title.replace(/\/Overview$/, '');
  categories[key] = { title, content };
}

// --- Component JSDoc from src/components/**/*.tsx -----------------------
const components = {};
const componentsDir = join(root, 'src/components');
const files = readdirSync(componentsDir, { recursive: true })
  .filter(
    (f) =>
      f.endsWith('.tsx') &&
      !/\.(stories|test|spec)\.tsx$/.test(f) &&
      !f.includes('__tests__')
  )
  .map((f) => join(componentsDir, f));

// Matches a JSDoc block (no `*/` inside) directly above a capitalized
// function/const declaration; `export` is optional because many components
// are declared unexported (e.g. React.forwardRef) and exported at the
// bottom of the file.
const exportRe =
  /\/\*\*((?:[^*]|\*(?!\/))*)\*\/\s*(?:export )?(?:function|const) ([A-Z][A-Za-z0-9]*)/g;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(exportRe)) {
    const [, block, name] = m;
    const { description, examples } = parseJsdoc('/**' + block + '*/');
    if (!description && !examples.length) continue;
    // Keep the richest doc if a name is exported from several files.
    const existing = components[name];
    const score = description.length + examples.join('').length;
    const existingScore = existing
      ? existing.description.length + existing.examples.join('').length
      : -1;
    if (score > existingScore) components[name] = { description, examples };
  }
}

// --- Storybook docs metadata from src/**/*.stories.tsx -------------------
// The `docs.description.component` blocks in the stories files are this
// repo's canonical user-facing guidance (use/don't-use, limitations,
// relationships) and the meta carries the title ↔ export mapping (e.g.
// story 'ReconciliationPanel' → export `AIReconciliationPanel`).
const stories = {};
const srcDir = join(root, 'src');
const storyFiles = readdirSync(srcDir, { recursive: true })
  .filter((f) => f.endsWith('.stories.tsx'))
  .map((f) => join(srcDir, f));

/**
 * Return the source of the object literal starting at `src[start]` ('{'),
 * balancing braces while skipping strings, template literals (incl. ${}),
 * and comments — meta docs descriptions contain braces inside backticks.
 */
function sliceObjectLiteral(src, start) {
  let depth = 0;
  const stack = []; // template-literal nesting
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '/' && next === '/') {
      i = src.indexOf('\n', i);
      if (i === -1) break;
    } else if (ch === '/' && next === '*') {
      i = src.indexOf('*/', i) + 1;
    } else if (ch === "'" || ch === '"') {
      for (i++; i < src.length && src[i] !== ch; i++) if (src[i] === '\\') i++;
    } else if (ch === '`') {
      for (i++; i < src.length; i++) {
        if (src[i] === '\\') i++;
        else if (src[i] === '$' && src[i + 1] === '{') {
          stack.push('tpl');
          i++;
          break;
        } else if (src[i] === '`') break;
      }
    } else if (ch === '}' && stack.length) {
      // resume the template literal that the ${} interrupted
      stack.pop();
      for (i++; i < src.length; i++) {
        if (src[i] === '\\') i++;
        else if (src[i] === '$' && src[i + 1] === '{') {
          stack.push('tpl');
          i++;
          break;
        } else if (src[i] === '`') break;
      }
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Return the source of the CSF meta object — the object literal bound to
 * the default export. Sample data earlier in the file may contain its own
 * `title:`/`component:` fields, so field extraction must be scoped here.
 * Fenced examples can contain their own default exports (e.g.
 * `export default function Page()` in LandingPage.stories.tsx), so every
 * candidate is tried and only one that resolves to an object literal with
 * a `title:` string — the CSF meta contract — is accepted.
 */
function metaObjectSource(src) {
  for (const m of src.matchAll(/export default(?:\s+(\w+)\s*;?|\s*(\{))/g)) {
    const ident = m[1];
    if (ident === 'function' || ident === 'class' || ident === 'async') continue;
    let start = -1;
    if (ident) {
      const decl = src.match(new RegExp(`const ${ident}[^=]*=\\s*\\{`));
      if (decl) start = decl.index + decl[0].length - 1;
    } else {
      start = m.index + m[0].length - 1;
    }
    if (start === -1) continue;
    const obj = sliceObjectLiteral(src, start);
    if (obj && /\btitle:\s*['"]/.test(obj)) return obj;
  }
  return null;
}

for (const file of storyFiles) {
  const src = readFileSync(file, 'utf8');
  const meta = metaObjectSource(src);
  if (!meta) continue;
  const title = meta.match(/\btitle:\s*['"]([^'"]+)['"]/)?.[1];
  if (!title) continue;
  const componentName = meta.match(/\bcomponent:\s*([A-Za-z0-9_]+)/)?.[1] ?? null;
  const descMatch = meta.match(
    /description:\s*\{\s*component:\s*(?:`((?:[^`\\]|\\[\s\S])*)`|'((?:[^'\\]|\\.)*)')/
  );
  let description = descMatch ? (descMatch[1] ?? descMatch[2]) : null;
  if (description) description = description.replace(/\\([`$'\\])/g, '$1').trim();
  if (componentName || description) {
    stories[title] = { component: componentName, description };
  }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    categories,
    components,
    stories,
  })
);
console.log(
  `ozwell docs: ${Object.keys(components).length} components, ` +
    `${Object.keys(stories).length} story guides, ` +
    `${Object.keys(categories).length} category guides → ${out.replace(root + '/', '')}`
);
