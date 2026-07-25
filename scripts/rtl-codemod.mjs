#!/usr/bin/env node
/**
 * RTL codemod: rewrites physical-direction Tailwind classes to their CSS
 * logical-property equivalents inside component source files.
 *
 * Companion to rtl-scan.mjs (the ratchet guard): the codemod rewrites, the
 * scan verifies. Run the scan after every codemod pass.
 *
 * Token mapping (variant prefixes like `md:`/`hover:` and negative `-` are
 * preserved):
 *   ml- / mr-            -> ms- / me-        (also scroll-ml/scroll-mr)
 *   pl- / pr-            -> ps- / pe-        (also scroll-pl/scroll-pr)
 *   left- / right-       -> start- / end-
 *   text-left/right      -> text-start/text-end
 *   rounded-l / -r       -> rounded-s / -e
 *   rounded-tl/tr/bl/br  -> rounded-ss/se/es/ee
 *   border-l / -r        -> border-s / -e
 *
 * NOT rewritten (printed as NEEDS-MANUAL — they require judgment):
 *   space-x-   (prefer flex gap-; else add rtl:space-x-reverse)
 *   divide-x-  (needs added rtl:divide-x-reverse)
 *
 * Usage:
 *   node scripts/rtl-codemod.mjs <path...>          # dry run: print replacements
 *   node scripts/rtl-codemod.mjs --write <path...>  # apply changes
 *
 * <path...> are files or directories (searched recursively for .tsx, skipping
 * .stories.tsx / .test.tsx — same scope as rtl-scan.mjs).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Ordered: longer/more-specific prefixes first so e.g. `scroll-ml-` and
// `rounded-tl-` win over `ml-` / `rounded-l-`.
const PREFIX_MAP = [
  ['scroll-ml-', 'scroll-ms-'],
  ['scroll-mr-', 'scroll-me-'],
  ['scroll-pl-', 'scroll-ps-'],
  ['scroll-pr-', 'scroll-pe-'],
  ['rounded-tl-', 'rounded-ss-'],
  ['rounded-tr-', 'rounded-se-'],
  ['rounded-bl-', 'rounded-es-'],
  ['rounded-br-', 'rounded-ee-'],
  ['rounded-l-', 'rounded-s-'],
  ['rounded-r-', 'rounded-e-'],
  ['border-l-', 'border-s-'],
  ['border-r-', 'border-e-'],
  ['text-left', 'text-start'],
  ['text-right', 'text-end'],
  ['left-', 'start-'],
  ['right-', 'end-'],
  ['ml-', 'ms-'],
  ['mr-', 'me-'],
  ['pl-', 'ps-'],
  ['pr-', 'pe-'],
];

// Bare (suffix-less) forms.
const BARE_MAP = {
  'rounded-tl': 'rounded-ss',
  'rounded-tr': 'rounded-se',
  'rounded-bl': 'rounded-es',
  'rounded-br': 'rounded-ee',
  'rounded-l': 'rounded-s',
  'rounded-r': 'rounded-e',
  'border-l': 'border-s',
  'border-r': 'border-e',
};

function mapToken(token) {
  if (BARE_MAP[token]) return BARE_MAP[token];
  for (const [from, to] of PREFIX_MAP) {
    if (token === from) return to;
    if (token.startsWith(from)) return to + token.slice(from.length);
  }
  return null;
}

// Same detection pattern as rtl-scan.mjs: leading boundary group, optional
// negative sign, variant prefixes, then the physical utility token (group 3).
// Spacing/inset suffixes are restricted to real Tailwind values (numbers,
// fractions, px, auto, full, arbitrary [..]) so prose like "right-click" in
// comments and copy is never rewritten.
const VALUE =
  '(?:\\d+/\\d+|\\d+(?:\\.\\d+)?|px|auto|full|\\[[^\\]\\s]+\\])(?![-\\w])';
const PHYSICAL_UTILITIES = new RegExp(
  '(^|[\\s\'"`{:])(-?(?:[a-z-]+:)*)(' +
    [
      '(?:scroll-)?m[lr]-' + VALUE,
      '(?:scroll-)?p[lr]-' + VALUE,
      '(?:left|right)-' + VALUE,
      'text-(?:left|right)(?![-\\w])',
      'rounded-(?:[lr]|[tb][lr])(?:-[^\\s\'"`]+)?(?![-\\w])',
      'border-[lr](?:-[^\\s\'"`]+)?(?![-\\w])',
    ].join('|') +
    ')',
  'g'
);

// `left-1/2` (or `right-1/2`) paired with `translate-x-1/2` on the same line
// is the physical centering idiom: a centered element renders identically in
// LTR and RTL, so it is skipped (rtl-scan.mjs exempts it for the same reason).
function isCenteringIdiom(token, lineText) {
  return (
    /^(?:left|right)-1\/2$/.test(token) && lineText.includes('translate-x-1/2')
  );
}

const NEEDS_MANUAL = new RegExp(
  '(^|[\\s\'"`{:])-?(?:[a-z-]+:)*((?:space-x|divide-x)(?:-(?!reverse)[^\\s\'"`]+)?)',
  'g'
);

// A `space-x-*`/`divide-x-*` utility accompanied by its rtl:*-reverse remedy
// on the same line is already RTL-correct — no manual attention needed.
function isHandledReverse(token, lineText) {
  return (
    (/^space-x-/.test(token) && lineText.includes('rtl:space-x-reverse')) ||
    (/^divide-x/.test(token) && lineText.includes('rtl:divide-x-reverse'))
  );
}

function walk(path, files = []) {
  if (statSync(path).isFile()) {
    files.push(path);
    return files;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const p = join(path, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (
      /\.tsx$/.test(entry.name) &&
      !/\.(stories|test)\.tsx$/.test(entry.name)
    )
      files.push(p);
  }
  return files;
}

const args = process.argv.slice(2);
const write = args.includes('--write');
const paths = args.filter((a) => a !== '--write');

if (paths.length === 0) {
  console.error(
    'Usage: node scripts/rtl-codemod.mjs [--write] <file-or-dir...>'
  );
  process.exit(1);
}

let totalReplacements = 0;
let totalManual = 0;
let changedFiles = 0;

for (const file of paths.flatMap((p) => walk(join(root, p)))) {
  const rel = relative(root, file);
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const replacements = [];
  const manual = [];

  const out = lines
    .map((text, i) => {
      let updated = text.replace(
        PHYSICAL_UTILITIES,
        (full, boundary, variants, token) => {
          if (isCenteringIdiom(token, text)) return full;
          const mapped = mapToken(token);
          if (!mapped) return full;
          replacements.push({
            line: i + 1,
            from: variants + token,
            to: variants + mapped,
          });
          return boundary + variants + mapped;
        }
      );
      for (const m of updated.matchAll(NEEDS_MANUAL)) {
        if (isHandledReverse(m[2], updated)) continue;
        manual.push({ line: i + 1, token: m[2] });
      }
      return updated;
    })
    .join('\n');

  if (replacements.length === 0 && manual.length === 0) continue;

  if (replacements.length > 0) {
    changedFiles++;
    totalReplacements += replacements.length;
    console.log(`${rel}:`);
    for (const { line, from, to } of replacements) {
      console.log(`  ${line}: ${from} -> ${to}`);
    }
    if (write && out !== src) writeFileSync(file, out);
  }
  for (const { line, token } of manual) {
    totalManual++;
    console.log(`  NEEDS-MANUAL ${rel}:${line}: ${token}`);
  }
}

console.log(
  `\n${write ? 'Applied' : 'Dry run:'} ${totalReplacements} replacement(s) in ${changedFiles} file(s).` +
    (totalManual ? ` ${totalManual} site(s) need manual attention.` : '')
);
if (!write && totalReplacements > 0) {
  console.log('Re-run with --write to apply.');
}
