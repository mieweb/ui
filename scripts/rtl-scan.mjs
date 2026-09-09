#!/usr/bin/env node
/**
 * RTL guard: scans src/components for physical-direction Tailwind classes
 * (ml-/mr-/pl-/pr-/left-/right-/text-left/rounded-l/border-r/space-x-/…)
 * that break right-to-left layouts. Use CSS logical properties instead
 * (ms-/me-/ps-/pe-/start-/end-/text-start/rounded-s/border-e/gap-…).
 *
 * Works as a ratchet: existing offenders are recorded in rtl-baseline.json.
 * The scan fails only when a file's count INCREASES or a new file offends,
 * so the migration can proceed batch-by-batch without breaking CI.
 *
 * Genuinely physical usages (e.g. mouse-coordinate drag math) can be exempted
 * with an `rtl-ignore` comment on the same line or the line directly above,
 * ideally with a reason: `// rtl-ignore -- resize handles use clientX math`.
 *
 * Usage:
 *   node scripts/rtl-scan.mjs            # scan + compare against baseline (CI)
 *   node scripts/rtl-scan.mjs --update   # rewrite baseline after a migration batch
 *   node scripts/rtl-scan.mjs --list     # print every match (file:line: token)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_DIR = join(root, 'src', 'components');
const BASELINE_PATH = join(root, 'scripts', 'rtl-baseline.json');

// Physical-direction utilities (with optional variant prefixes like `hover:`,
// `md:` and optional negative `-`). Logical equivalents in comments.
// Note: a leading boundary group is matched (not a lookbehind) to keep the
// pattern portable and obvious; the utility token itself is capture group 2.
// Spacing/inset suffixes are restricted to real Tailwind values (numbers,
// fractions, px, auto, full, arbitrary [..]) so prose like "right-click" or
// "left-border" in comments and copy is not flagged.
const VALUE =
  '(?:\\d+/\\d+|\\d+(?:\\.\\d+)?|px|auto|full|\\[[^\\]\\s]+\\])(?![-\\w])';
const PHYSICAL_UTILITIES = new RegExp(
  '(^|[\\s\'"`{:])-?(?:[a-z-]+:)*(' +
    [
      '(?:scroll-)?m[lr]-' + VALUE, // ml-/mr- → ms-/me-
      '(?:scroll-)?p[lr]-' + VALUE, // pl-/pr- → ps-/pe-
      '(?:left|right)-' + VALUE, // left-/right- → start-/end-
      'text-(?:left|right)(?![-\\w])', // → text-start/text-end
      'rounded-(?:[lr]|[tb][lr])(?:-[^\\s\'"`]+)?(?![-\\w])', // → rounded-s/e/ss/se/es/ee
      'border-[lr](?:-[^\\s\'"`]+)?(?![-\\w])', // → border-s/border-e
      'space-x-(?!reverse)[^\\s\'"`]+', // → gap- (or rtl:space-x-reverse)
      'divide-x(?:-(?!reverse)[^\\s\'"`]+)?(?![-\\w])', // needs rtl:divide-x-reverse
    ].join('|') +
    ')',
  'g'
);

// A `space-x-*`/`divide-x-*` utility accompanied by its rtl:*-reverse remedy
// on the same line is already RTL-correct.
function isHandledReverse(token, lineText) {
  return (
    (/^space-x-/.test(token) && lineText.includes('rtl:space-x-reverse')) ||
    (/^divide-x/.test(token) && lineText.includes('rtl:divide-x-reverse'))
  );
}

// `left-1/2` (or `right-1/2`) paired with `translate-x-1/2` on the same line
// is the physical centering idiom — a centered element renders identically in
// LTR and RTL, so it is direction-neutral and exempt from the guard.
function isCenteringIdiom(token, lineText) {
  return (
    /^(?:left|right)-1\/2$/.test(token) && lineText.includes('translate-x-1/2')
  );
}

// An `rtl-ignore` comment (`// rtl-ignore` or `/* rtl-ignore */`) on the same
// line or the line directly above marks a genuinely physical usage (e.g.
// mouse-coordinate drag/resize math) as exempt. Only comment forms count, so
// the guard cannot be bypassed by string content.
const RTL_IGNORE = /(?:\/\/|\/\*|\{\/\*)\s*rtl-ignore\b/;
function isExplicitlyIgnored(lines, index) {
  return (
    RTL_IGNORE.test(lines[index]) ||
    (index > 0 && RTL_IGNORE.test(lines[index - 1]))
  );
}

// Best-effort logical equivalent for an offending token, shown in failure
// output so the fix is copy-pasteable.
function logicalEquivalent(token) {
  if (/^space-x-/.test(token))
    return `${token.replace(/^space-x-/, 'gap-x-')} (or keep it and add rtl:space-x-reverse)`;
  if (/^divide-x/.test(token)) return `${token} rtl:divide-x-reverse`;
  return token
    .replace(/^((?:scroll-)?[mp])l-/, '$1s-')
    .replace(/^((?:scroll-)?[mp])r-/, '$1e-')
    .replace(/^left-/, 'start-')
    .replace(/^right-/, 'end-')
    .replace(/^text-left$/, 'text-start')
    .replace(/^text-right$/, 'text-end')
    .replace(/^rounded-tl(?=$|-)/, 'rounded-ss')
    .replace(/^rounded-tr(?=$|-)/, 'rounded-se')
    .replace(/^rounded-bl(?=$|-)/, 'rounded-es')
    .replace(/^rounded-br(?=$|-)/, 'rounded-ee')
    .replace(/^rounded-l(?=$|-)/, 'rounded-s')
    .replace(/^rounded-r(?=$|-)/, 'rounded-e')
    .replace(/^border-l(?=$|-)/, 'border-s')
    .replace(/^border-r(?=$|-)/, 'border-e');
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else if (
      /\.tsx$/.test(entry.name) &&
      !/\.(stories|test)\.tsx$/.test(entry.name)
    )
      files.push(path);
  }
  return files;
}

function scan() {
  const results = new Map(); // relPath -> [{ line, token }]
  for (const file of walk(COMPONENTS_DIR)) {
    const rel = relative(root, file);
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((text, i) => {
      if (isExplicitlyIgnored(lines, i)) return;
      for (const match of text.matchAll(PHYSICAL_UTILITIES)) {
        if (isCenteringIdiom(match[2], text)) continue;
        if (isHandledReverse(match[2], text)) continue;
        if (!results.has(rel)) results.set(rel, []);
        results.get(rel).push({ line: i + 1, token: match[2] });
      }
    });
  }
  return results;
}

const results = scan();
const counts = Object.fromEntries(
  [...results.entries()].map(([file, matches]) => [file, matches.length]).sort()
);
const total = Object.values(counts).reduce((a, b) => a + b, 0);

const arg = process.argv[2];

if (arg === '--update') {
  writeFileSync(BASELINE_PATH, JSON.stringify(counts, null, 2) + '\n');
  console.log(
    `Baseline updated: ${Object.keys(counts).length} files, ${total} matches.`
  );
  process.exit(0);
}

if (arg === '--list') {
  for (const [file, matches] of results) {
    for (const { line, token } of matches)
      console.log(`${file}:${line}: ${token}`);
  }
  console.log(`\nTotal: ${total} matches in ${results.size} files.`);
  process.exit(0);
}

let baseline = {};
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
} catch {
  console.error(`No baseline found at ${relative(root, BASELINE_PATH)}.`);
  console.error('Run: node scripts/rtl-scan.mjs --update');
  process.exit(1);
}

const failures = [];
let improved = 0;
for (const [file, count] of Object.entries(counts)) {
  const allowed = baseline[file] ?? 0;
  if (count > allowed) failures.push({ file, count, allowed });
  else if (count < allowed) improved++;
}
const cleaned = Object.keys(baseline).filter((f) => !(f in counts)).length;

if (failures.length > 0) {
  const inActions = process.env.GITHUB_ACTIONS === 'true';
  // GitHub workflow commands require %/CR/LF escaping in data, plus :/, in
  // property values: https://docs.github.com/actions/reference/workflow-commands-for-github-actions
  const esc = (s) =>
    String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  const escProp = (s) => esc(s).replace(/:/g, '%3A').replace(/,/g, '%2C');
  console.error(
    'RTL guard: new physical-direction Tailwind classes detected.\n'
  );
  for (const { file, count, allowed } of failures) {
    console.error(`  ${file}: ${count} matches (baseline allows ${allowed})`);
    for (const { line, token } of results.get(file)) {
      console.error(
        `    ${file}:${line}: ${token} → ${logicalEquivalent(token)}`
      );
      if (inActions) {
        // Inline annotation on the offending line in the PR "Files changed" tab.
        console.log(
          `::error file=${escProp(file)},line=${line},title=RTL guard::` +
            esc(
              `'${token}' breaks RTL layouts — use '${logicalEquivalent(token)}' instead. ` +
                `If this usage is genuinely physical (e.g. pointer-coordinate math), add a '// rtl-ignore -- <reason>' comment.`
            )
        );
      }
    }
  }
  console.error(`
How to fix:
  1. Replace each class with its logical equivalent shown above
     (physical left/right → direction-aware start/end).
  2. If the class string is NEW (not already in the Tailwind safelist), add it
     to BOTH src/tailwind-preset.ts and src/tailwind-preset.cjs.
  3. Only if the usage is genuinely physical (e.g. drag/resize clientX math),
     exempt it with a comment on the same line or the line above:
       // rtl-ignore -- <reason>

Reproduce locally: pnpm rtl:scan   (all matches: node scripts/rtl-scan.mjs --list)
Background: https://github.com/mieweb/ui/issues/319`);
  process.exit(1);
}

console.log(
  `RTL guard passed: ${total} matches in ${results.size} files (within baseline).`
);
if (improved > 0 || cleaned > 0) {
  console.log(
    `${improved + cleaned} file(s) improved — tighten the ratchet: node scripts/rtl-scan.mjs --update`
  );
}
