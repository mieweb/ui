type LocoKeyEntry = {
  key: string;
  context: string;
};

type LocoSyncResponse = {
  ok?: boolean;
  registered?: number;
  error?: string;
};

// Text anywhere inside these (e.g. <pre><code><span>, <svg><text>) is never UI copy.
const SKIP_SELECTOR = 'script, style, noscript, code, pre, svg, kbd';

// translate="no" excludes text from sync; data-notranslate alone only stops runtime DOM rewrites.
const IGNORE_SELECTOR = `${SKIP_SELECTOR}, [data-loco-ignore="true"], [translate="no"], [data-loco-translated]`;

// Best-effort net only — live sync is a dev-server opt-in, so mark sensitive regions translate="no".
const SENSITIVE_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(https?:\/\/|www\.)/i,
  /\d{4,}/,
  /\d{3}[\s.-]\d{2,}/,
  /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/,
];

function isUsefulPhrase(value: string): boolean {
  if (!value) return false;
  if (value.length < 2 || value.length > 180) return false;
  if (/^[\d\s.,:%+-/()]+$/.test(value)) return false;
  return !SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
}

/** A phrase as discovered by the Loco runtime (`Loco.textnodes()`). */
export type LocoTextnode = {
  key: string;
  context?: string;
  element?: Element | null;
};

/**
 * Keeps runtime-discovered phrases that sit inside `root` and outside ignored or
 * sensitive regions. Keys/contexts are passed through unchanged so they match
 * what `Loco.apply()` looks up (including `{{text:N}}` placeholders).
 */
export function filterLocoTextnodes(
  nodes: LocoTextnode[],
  root: Element
): LocoKeyEntry[] {
  const seen = new Set<string>();
  const entries: LocoKeyEntry[] = [];
  for (const { key, context = '', element } of nodes) {
    if (
      !element ||
      !root.contains(element) ||
      element.closest(IGNORE_SELECTOR)
    ) {
      continue;
    }
    if (!isUsefulPhrase(key)) continue;
    const id = `${key}\0${context}`;
    if (seen.has(id)) continue;
    seen.add(id);
    entries.push({ key, context });
  }
  return entries;
}

export async function postLocoTextnodes(params: {
  serverUrl: string;
  keys: LocoKeyEntry[];
  pageUrl: string;
  apiKey?: string;
}): Promise<LocoSyncResponse> {
  const serverBase = params.serverUrl.replace(/\/$/, '');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (params.apiKey) {
    headers['x-api-key'] = params.apiKey;
  }

  const response = await fetch(`${serverBase}/api/textnodes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      keys: params.keys,
      url: params.pageUrl,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Loco sync failed (${response.status}): ${body}`);
  }

  return (await response.json()) as LocoSyncResponse;
}
