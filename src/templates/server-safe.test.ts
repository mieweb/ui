import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

// React Server Components cannot call these, and `createContext` at module
// scope throws on import under the `react-server` condition.
const CLIENT_ONLY =
  /\b(useState|useEffect|useLayoutEffect|useInsertionEffect|useReducer|useContext|useRef|useImperativeHandle|useSyncExternalStore|useTransition|useOptimistic|useActionState|createContext)\b|^['"]use client['"]/m;

function resolveImport(from: string, spec: string): string | undefined {
  const base = resolve(dirname(from), spec);
  return [
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ].find(existsSync);
}

/** Every source file reachable from `entry` through relative imports. */
function moduleGraph(entry: string, seen = new Set<string>()): Set<string> {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  const source = readFileSync(entry, 'utf8');
  for (const [, spec] of source.matchAll(
    /^\s*(?:import|export)\b[^'"]*?from\s+['"](\.[^'"]+)['"]/gm
  )) {
    const file = resolveImport(entry, spec);
    if (file) moduleGraph(file, seen);
  }
  return seen;
}

describe('@mieweb/ui/templates', () => {
  it('reaches no client-only React API, so Server Components can import it', () => {
    const entry = resolve(here, '../templates.ts');
    const graph = [...moduleGraph(entry)].filter(
      (f) => !/\.(stories|test)\.tsx?$/.test(f)
    );
    expect(graph.length).toBeGreaterThan(15);
    const offenders = graph
      .filter((f) => CLIENT_ONLY.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(resolve(here, '..').length + 1));
    expect(offenders).toEqual([]);
  });
});
