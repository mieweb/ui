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

// User-authored content (form fields, rich-text editors) must never be sent to Loco.
const EDITABLE_SELECTOR =
  'input, textarea, select, option, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';

// translate="no" excludes text from sync; data-notranslate alone only stops runtime DOM rewrites.
const PROTECTED_SELECTOR = `${EDITABLE_SELECTOR}, [data-loco-ignore="true"], [translate="no"]`;
const IGNORE_SELECTOR = `${SKIP_SELECTOR}, ${PROTECTED_SELECTOR}, [data-loco-translated]`;

// Best-effort net only, not a PII boundary: live sync is a dev-server opt-in for curated
// demo content, so stories must mark realistic personal/clinical data translate="no".
const SENSITIVE_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(https?:\/\/|www\.)/i,
  /\d{4,}/,
  /\d{3}[\s.-]\d{2,}/,
  /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/,
];

// Matches the runtime's own limit: anything longer is never translated anyway.
const MAX_PHRASE_LENGTH = 1000;

const isSensitive = (value: string) =>
  SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

function isUsefulPhrase(value: string): boolean {
  if (!value) return false;
  if (value.length < 2 || value.length > MAX_PHRASE_LENGTH) return false;
  if (/^[\d\s.,:%+-/()]+$/.test(value)) return false;
  return !isSensitive(value);
}

function containsProtectedText(element: Element, key: string): boolean {
  const text = normalizeText(key);
  return Array.from(element.querySelectorAll(PROTECTED_SELECTOR)).some((protectedElement) => {
    const protectedText = normalizeText(protectedElement.textContent ?? '');
    return protectedText !== '' && text.includes(protectedText);
  });
}

// Elements the runtime derives contexts from (its domContextSelectors, plus table headers).
const CONTEXT_SOURCE_SELECTOR = 'h1, h2, h3, h4, h5, h6, label, legend, caption, figcaption, th, form';

type ProtectedContent = {
  /** Text of each protected element. */
  texts: string[];
  /** Full text of every context source that contains protected text. */
  sources: string[];
};

function collectProtectedContent(doc: Document): ProtectedContent {
  const protectedElements = Array.from(doc.querySelectorAll(PROTECTED_SELECTOR));
  const sources = new Set<string>();
  for (const element of protectedElements) {
    for (let source = element.closest(CONTEXT_SOURCE_SELECTOR); source; ) {
      sources.add(normalizeText(source.textContent ?? ''));
      source = source.parentElement?.closest(CONTEXT_SOURCE_SELECTOR) ?? null;
    }
  }
  return {
    texts: protectedElements.map((element) => normalizeText(element.textContent ?? '')).filter(Boolean),
    sources: [...sources].filter(Boolean),
  };
}

// The runtime builds context from nearby headings/labels ("Section > Field"), which can
// sit inside a protected region even when the phrase itself does not.
function isSafeContext(context: string, getProtected: () => ProtectedContent): boolean {
  return context.split(' > ').every((segment) => {
    const text = normalizeText(segment);
    if (!text) return true;
    if (isSensitive(text)) return false;
    const { texts, sources } = getProtected();
    return (
      // Both ways: a heading may be partly protected ("<span translate=no>Jane Doe</span> details").
      !texts.some((protectedText) => protectedText.includes(text) || text.includes(protectedText)) &&
      // The runtime truncates contexts to 60 characters, which can cut a protected name
      // ("… Jane Doe-Smi"): reject any prefix of a heading that contains protected text.
      !sources.some((source) => source.startsWith(text))
    );
  });
}

/** A phrase as discovered by the Loco runtime (`Loco.scan()`). */
export type LocoTextnode = {
  key: string;
  context?: string;
  element?: Element | null;
  /** Set by Loco.scan() when apply() would drop inline content (e.g. <code>) from the element. */
  lossy?: boolean;
};

/**
 * Keeps runtime-discovered phrases that sit inside one of `roots` and outside ignored or
 * sensitive regions, and whose context carries no protected or sensitive text. Keys and
 * contexts pass through unchanged so they match what `Loco.apply()` looks up (including
 * `{{text:N}}` placeholders).
 */
export function filterLocoTextnodes(
  nodes: LocoTextnode[],
  roots: Element | Element[]
): LocoKeyEntry[] {
  const scanRoots = Array.isArray(roots) ? roots : [roots];
  const seen = new Set<string>();
  const entries: LocoKeyEntry[] = [];
  let protectedContent: ProtectedContent | undefined;
  const getProtected = () =>
    (protectedContent ??= collectProtectedContent(scanRoots[0]?.ownerDocument ?? document));
  for (const { key, context = '', element, lossy } of nodes) {
    if (
      !element ||
      !scanRoots.some((root) => root.contains(element)) ||
      element.closest(IGNORE_SELECTOR)
    ) {
      continue;
    }
    if (!isUsefulPhrase(key)) continue;
    // Translating these would delete the dropped inline content, so leave them in English.
    if (lossy) continue;
    // The runtime joins inline children into one phrase, so a protected descendant's text
    // can end up inside the key ("Patient: <span translate=no>Jane Doe</span>").
    if (containsProtectedText(element, key)) continue;
    // Drop rather than blank an unsafe context: apply() looks up the exact key/context pair.
    if (context && !isSafeContext(context, getProtected)) continue;
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
