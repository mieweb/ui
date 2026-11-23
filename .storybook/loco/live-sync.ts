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

// The runtime builds context from nearby headings/labels ("Section > Field"), which can
// sit inside a protected region even when the phrase itself does not.
function isSafeContext(context: string, protectedTexts: () => string[]): boolean {
  return context.split(' > ').every((segment) => {
    const text = normalizeText(segment);
    return (
      !text ||
      (!isSensitive(text) &&
        !protectedTexts().some(
          // Both ways: a heading may be partly protected ("<span translate=no>Jane Doe</span> details").
          (protectedText) => protectedText.includes(text) || text.includes(protectedText)
        ))
    );
  });
}

/** A phrase as discovered by the Loco runtime (`Loco.textnodes()`). */
export type LocoTextnode = {
  key: string;
  context?: string;
  element?: Element | null;
};

/**
 * Keeps runtime-discovered phrases that sit inside one of `roots` and outside ignored or
 * sensitive regions, and whose context carries no protected or sensitive text. Keys/contexts are passed through unchanged so they match
 * what `Loco.apply()` looks up (including `{{text:N}}` placeholders).
 */
export function filterLocoTextnodes(
  nodes: LocoTextnode[],
  roots: Element | Element[]
): LocoKeyEntry[] {
  const scanRoots = Array.isArray(roots) ? roots : [roots];
  const seen = new Set<string>();
  const entries: LocoKeyEntry[] = [];
  let protectedTexts: string[] | undefined;
  const getProtectedTexts = () =>
    (protectedTexts ??= Array.from(
      (scanRoots[0]?.ownerDocument ?? document).querySelectorAll(PROTECTED_SELECTOR),
      (element) => normalizeText(element.textContent ?? '')
    ).filter(Boolean));
  for (const { key, context = '', element } of nodes) {
    if (
      !element ||
      !scanRoots.some((root) => root.contains(element)) ||
      element.closest(IGNORE_SELECTOR)
    ) {
      continue;
    }
    if (!isUsefulPhrase(key)) continue;
    // The runtime joins inline children into one phrase, so a protected descendant's text
    // can end up inside the key ("Patient: <span translate=no>Jane Doe</span>").
    if (containsProtectedText(element, key)) continue;
    // Drop rather than blank an unsafe context: apply() looks up the exact key/context pair.
    if (context && !isSafeContext(context, getProtectedTexts)) continue;
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
