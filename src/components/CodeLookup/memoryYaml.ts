/**
 * YAML import/export for CodeLookup memory buckets — back up a picklist, move
 * it to another machine, or ship a curated starter set for a context.
 *
 * `js-yaml` is an optional peer dependency, loaded lazily on first use (same
 * pattern as `MediaEditor/ScriptPanel`), so nothing is pulled into bundles
 * that never import/export. `yaml.load` uses the safe default schema.
 *
 * Document shape (`version: 1`):
 *
 * ```yaml
 * version: 1
 * exported: 2026-07-31T19:00:00.000Z
 * buckets:
 *   - user: alice
 *     context: med-orders
 *     codes:
 *       - fullid: FDBMEDNAME3722
 *         label: Lasix
 *         codetype: FDB MEDNAME
 *         fullcode: '3722'
 *         domain: med
 *         count: 3
 *         lastUsed: 2026-07-31T18:00:00.000Z
 * ```
 */

import {
  getAllEntries,
  mergeEntries,
  type MemoryEntry,
  type MemoryScope,
} from './memoryStore';

export const MEMORY_YAML_VERSION = 1;

let yamlPromise: Promise<typeof import('js-yaml')> | null = null;
function loadYaml() {
  yamlPromise ??= import(/* @vite-ignore */ 'js-yaml').catch(
    (cause: unknown) => {
      yamlPromise = null; // let a later install work without a page reload
      throw new Error(
        'CodeLookup memory YAML needs the optional peer dependency `js-yaml`. Install it to use exportMemoryYaml/importMemoryYaml.',
        { cause }
      );
    }
  );
  return yamlPromise;
}

interface YamlCode {
  fullid: string;
  label: string;
  codetype: string;
  fullcode: string;
  domain: string;
  count: number;
  lastUsed?: string;
}

interface YamlBucket {
  user: string;
  context: string;
  codes: YamlCode[];
}

interface YamlDoc {
  version: number;
  exported?: string;
  buckets: YamlBucket[];
}

function isoOrUndefined(ms: number): string | undefined {
  return ms > 0 ? new Date(ms).toISOString() : undefined;
}

/** Group entries into buckets, codes ordered as the picklist shows them. */
function toDoc(entries: readonly MemoryEntry[]): YamlDoc {
  const grouped = new Map<string, MemoryEntry[]>();
  for (const e of entries) {
    const key = `${e.userId}|${e.context}`;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(e);
    else grouped.set(key, [e]);
  }
  const buckets = [...grouped.values()].map((list) => {
    list.sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);
    return {
      user: list[0].userId,
      context: list[0].context,
      codes: list.map((e) => ({
        fullid: e.fullid,
        label: e.label,
        codetype: e.codetype,
        fullcode: e.fullcode,
        domain: e.domain,
        count: e.count,
        lastUsed: isoOrUndefined(e.lastUsed),
      })),
    };
  });
  return {
    version: MEMORY_YAML_VERSION,
    exported: new Date().toISOString(),
    buckets: buckets.sort(
      (a, b) =>
        a.user.localeCompare(b.user) || a.context.localeCompare(b.context)
    ),
  };
}

/**
 * Serialize memory to YAML: one bucket when `scope` is given, otherwise every
 * bucket in this browser.
 */
export async function exportMemoryYaml(scope?: MemoryScope): Promise<string> {
  const [yaml, entries] = await Promise.all([loadYaml(), getAllEntries(scope)]);
  return yaml.dump(toDoc(entries), { noRefs: true, lineWidth: 100 });
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';
}

/** Read one code row; returns null when it lacks the fields to be usable. */
function toEntry(
  raw: unknown,
  userId: string,
  context: string
): MemoryEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const fullid = str(c.fullid);
  if (!fullid) return null;
  const count = typeof c.count === 'number' && c.count > 0 ? c.count : 1;
  const lastUsed = c.lastUsed
    ? // js-yaml parses unquoted ISO timestamps into Date objects
      c.lastUsed instanceof Date
      ? c.lastUsed.getTime()
      : Date.parse(str(c.lastUsed))
    : 0;
  return {
    userId,
    context,
    fullid,
    label: str(c.label),
    codetype: str(c.codetype),
    fullcode: str(c.fullcode),
    domain: str(c.domain),
    count,
    lastUsed: Number.isFinite(lastUsed) ? lastUsed : 0,
    pendingDelta: 0,
  };
}

export interface ImportMemoryOptions {
  /**
   * Merge every bucket in the document into this one bucket instead of the
   * users/contexts it names — how a curated starter set is handed to the
   * current user.
   */
  scope?: MemoryScope;
}

export interface ImportMemoryResult {
  /** Codes merged into the store. */
  imported: number;
  /** Buckets read from the document. */
  buckets: number;
  /** Rows skipped for missing/invalid fields. */
  skipped: number;
}

/**
 * Merge a YAML document into the store (`count`/`lastUsed` keep the larger
 * value, so importing is idempotent and never loses local usage). Throws on a
 * document that isn't a recognizable memory export.
 */
export async function importMemoryYaml(
  text: string,
  { scope }: ImportMemoryOptions = {}
): Promise<ImportMemoryResult> {
  const yaml = await loadYaml();
  const doc = yaml.load(text) as Partial<YamlDoc> | undefined;
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.buckets))
    throw new Error(
      'Not a CodeLookup memory export: expected a `buckets` list.'
    );
  if (doc.version !== undefined && doc.version > MEMORY_YAML_VERSION)
    throw new Error(
      `Unsupported memory export version ${doc.version} (this build reads ${MEMORY_YAML_VERSION}).`
    );

  const entries: MemoryEntry[] = [];
  let skipped = 0;
  for (const bucket of doc.buckets) {
    if (!bucket || typeof bucket !== 'object') {
      skipped++;
      continue;
    }
    const userId = scope?.userId ?? str(bucket.user) ?? '';
    const context = scope?.context ?? str(bucket.context) ?? '';
    if (!userId || !context || !Array.isArray(bucket.codes)) {
      skipped++;
      continue;
    }
    for (const raw of bucket.codes) {
      const entry = toEntry(raw, userId, context);
      if (entry) entries.push(entry);
      else skipped++;
    }
  }

  const imported = await mergeEntries(entries, scope);
  return { imported, buckets: doc.buckets.length, skipped };
}
