type LocoKeyEntry = {
  key: string;
  context: string;
};

type LocoSyncResponse = {
  ok?: boolean;
  registered?: number;
  error?: string;
};

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'SVG',
  'PATH',
  'KBD',
  'META',
  'LINK',
]);

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function isUsefulPhrase(value: string): boolean {
  if (!value) return false;
  if (value.length < 2 || value.length > 180) return false;
  if (/^[\d\s.,:%+-/()]+$/.test(value)) return false;
  return true;
}

export function collectLocoKeysFromElement(root: HTMLElement): LocoKeyEntry[] {
  const collected = new Map<string, LocoKeyEntry>();

  const addPhrase = (raw: string) => {
    const phrase = normalizeText(raw);
    if (!isUsefulPhrase(phrase)) return;
    if (collected.has(phrase)) return;
    collected.set(phrase, { key: phrase, context: '' });
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (parent) {
      const tagName = parent.tagName;
      if (
        !SKIP_TAGS.has(tagName) &&
        !parent.closest('[data-loco-ignore="true"]')
      ) {
        addPhrase(textNode.nodeValue || '');
      }
    }
    node = walker.nextNode();
  }

  const attrNodes = root.querySelectorAll<HTMLElement>(
    '[aria-label], [title], [placeholder]'
  );
  for (const el of attrNodes) {
    if (el.closest('[data-loco-ignore="true"]')) continue;
    const ariaLabel = el.getAttribute('aria-label');
    const title = el.getAttribute('title');
    const placeholder = (el as HTMLInputElement).placeholder;
    if (ariaLabel) addPhrase(ariaLabel);
    if (title) addPhrase(title);
    if (placeholder) addPhrase(placeholder);
  }

  return Array.from(collected.values());
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
