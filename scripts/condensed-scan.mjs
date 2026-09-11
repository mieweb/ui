#!/usr/bin/env node
/**
 * Condensed-density coverage audit.
 *
 * Condensed mode is CSS-only: body.condensed rules in
 * src/styles/condensed-view.css key off data-slot attributes emitted by
 * components. A component "supports condensed" only when its slots (or a
 * shared slot it reuses, e.g. data-slot="input") appear in that stylesheet.
 *
 * This scan reports the two failure modes found in practice (Autocomplete,
 * CodeLookup — PR #443):
 *   1. components that emit data-slot values with no condensed rule, and
 *   2. components that emit no data-slot attributes at all (invisible to
 *      condensed mode entirely).
 *
 * Usage:
 *   node scripts/condensed-scan.mjs          # summary report
 *   node scripts/condensed-scan.mjs --list   # include every uncovered slot
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_DIR = join(root, 'src', 'components');
const CSS_PATH = join(root, 'src', 'styles', 'condensed-view.css');

const listMode = process.argv.includes('--list');

// ---------------------------------------------------------------------------
// Collect slot names referenced by condensed-view.css
// ---------------------------------------------------------------------------
const css = readFileSync(CSS_PATH, 'utf8');
const coveredSlots = new Set(
  [...css.matchAll(/\[data-slot=['"]([^'"]+)['"]\]/g)].map((m) => m[1])
);

// ---------------------------------------------------------------------------
// Collect slot names emitted by components
// ---------------------------------------------------------------------------
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const isSource = (path) =>
  /\.tsx$/.test(path) && !/\.(stories|test)\.tsx$/.test(path);

/** component folder name directly under src/components */
const componentOf = (path) =>
  relative(COMPONENTS_DIR, path).split(sep)[0];

const emitted = new Map(); // component -> Set of literal slot names
const dynamic = new Map(); // component -> count of data-slot={...} usages
const slotless = new Map(); // component -> sibling components it composes

const files = [...walk(COMPONENTS_DIR)].filter(isSource);
const byComponent = new Map();
for (const file of files) {
  const component = componentOf(file);
  if (!byComponent.has(component)) byComponent.set(component, []);
  byComponent.get(component).push(file);
}

for (const [component, componentFiles] of byComponent) {
  const slots = new Set();
  const composes = new Set();
  let dynamicCount = 0;
  for (const file of componentFiles) {
    const text = readFileSync(file, 'utf8');
    // JSX attribute only (preceded by whitespace) — not selector strings or
    // Tailwind arbitrary variants like [&_[data-slot="ai-tool-call"]]:p-2.
    for (const m of text.matchAll(/(?<=\s)data-slot=["']([^"']+)["']/g)) {
      slots.add(m[1]);
    }
    // data-slot={expr} — literal value can't be extracted statically
    dynamicCount += [...text.matchAll(/(?<=\s)data-slot=\{/g)].length;
    // Sibling-component imports: a wrapper composing another component may
    // render its slots without emitting any itself (e.g. CountryDropdown →
    // CountryDropdownBase), so "slotless" needs manual verification.
    for (const m of text.matchAll(/from\s+['"]\.\.\/([\w-]+)/g)) {
      if (m[1] !== component && byComponent.has(m[1])) composes.add(m[1]);
    }
  }
  if (slots.size === 0 && dynamicCount === 0) slotless.set(component, composes);
  if (slots.size > 0) emitted.set(component, slots);
  if (dynamicCount > 0) dynamic.set(component, dynamicCount);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const uncovered = new Map(); // component -> uncovered slot names
for (const [component, slots] of emitted) {
  const missing = [...slots].filter((s) => !coveredSlots.has(s)).sort();
  if (missing.length > 0) uncovered.set(component, missing);
}

const sortedUncovered = [...uncovered.entries()].sort(
  (a, b) => b[1].length - a[1].length
);

console.log(`Condensed coverage audit (src/components vs condensed-view.css)`);
console.log(`  components scanned:        ${byComponent.size}`);
console.log(`  slots covered by CSS:      ${coveredSlots.size}`);
console.log(`  components w/o any slot:   ${slotless.size}`);
console.log(`  components w/ uncovered:   ${uncovered.size}\n`);

if (slotless.size > 0) {
  console.log(`── No data-slot attributes at all (invisible to condensed) ──`);
  for (const [component, composes] of [...slotless.entries()].sort()) {
    console.log(
      `  ${component}` +
        (composes.size > 0
          ? ` (composes ${[...composes].sort().join(', ')} — verify manually)`
          : '')
    );
  }
  console.log();
}

if (sortedUncovered.length > 0) {
  console.log(`── Emitted slots with no condensed rule ──`);
  for (const [component, missing] of sortedUncovered) {
    const total = emitted.get(component).size;
    console.log(
      `  ${component}: ${missing.length}/${total} slots uncovered` +
        (listMode ? `\n      ${missing.join('\n      ')}` : '')
    );
  }
  console.log();
}

if (dynamic.size > 0) {
  console.log(
    `── Dynamic data-slot={…} (verify manually) ──`
  );
  for (const [component, count] of [...dynamic.entries()].sort())
    console.log(`  ${component} (${count})`);
}
