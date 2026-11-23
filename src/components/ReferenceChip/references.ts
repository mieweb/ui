import type * as React from 'react';
import { Lexer, type Tokens } from 'marked';

/**
 * A record a person picked while writing — a teammate, a ticket, a document —
 * as one suggestion in a trigger's list. What `kind` and `id` mean is the
 * host's; the library only carries them.
 */
export interface ReferenceOption {
  /** The {@link ReferenceTrigger.kind} this option belongs to. */
  kind: string;
  /** The record's id, as the host knows it. */
  id: string;
  /** Text of the chip and of the saved link, e.g. `@Ann Lee` or `TH-12: Fix login`. */
  label: string;
  /** Secondary text in the suggestion list. */
  description?: string;
  /** Leading node in the suggestion list (an avatar, an icon). */
  icon?: React.ReactNode;
  /** Trailing meta text in the suggestion list (e.g. a status). */
  meta?: string;
}

/**
 * One kind of reference: the character that opens its suggestion list, how to
 * find candidates, and how a picked one is written as a link and read back.
 * The host supplies one per kind — e.g. `@` for people, `#` for tickets.
 */
export interface ReferenceTrigger {
  /** Stable name of the kind, e.g. `'person'` or `'ticket'`. */
  kind: string;
  /** The character that opens the list, e.g. `'@'`. One character. */
  char: string;
  /** Accessible name of the suggestion list. Pass a translated string. */
  label: string;
  /** Candidates for the text typed after `char` (may be empty). */
  search: (query: string) => ReferenceOption[] | Promise<ReferenceOption[]>;
  /** The link a picked record is saved as. */
  toHref: (id: string) => string;
  /** The record id a link points at, or null when the link isn't this kind. */
  fromHref: (href: string) => string | null;
}

/** A reference found in saved text. */
export interface Reference {
  kind: string;
  id: string;
  label: string;
  href: string;
}

/** The kind and id `href` refers to, by the first trigger that claims it. */
export function matchReference(
  href: string,
  triggers: readonly ReferenceTrigger[]
): { kind: string; id: string } | null {
  for (const trigger of triggers) {
    const id = trigger.fromHref(href);
    if (id) return { kind: trigger.kind, id };
  }
  return null;
}

// A token, or a table cell (`{ text, tokens }`, no `type`), and where its
// nested tokens sit.
interface Nested {
  type?: string;
  text?: string;
  tokens?: Nested[];
  items?: Nested[];
  header?: Nested[];
  rows?: Nested[][];
}

// The links in `tokens`, in order. Code holds no tokens and images are
// skipped, so a link quoted in either never counts.
function* linksIn(tokens: readonly Nested[]): Generator<Tokens.Link> {
  for (const token of tokens) {
    if (token.type === 'image') continue;
    if (token.type === 'link') {
      yield token as Tokens.Link;
      continue;
    }
    for (const children of [
      token.tokens,
      token.items,
      token.header,
      ...(token.rows ?? []),
    ]) {
      if (Array.isArray(children)) yield* linksIn(children);
    }
  }
}

// Named character references decoded in labels; others stay as written.
const NAMED_REFERENCES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  ndash: '–',
  mdash: '—',
};

// Marked keeps character references (`&amp;`, `&#169;`) as written in text
// tokens; a reader sees the characters.
function decodeReferences(text: string): string {
  return text.replace(
    /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));/g,
    (match, dec?: string, hex?: string, name?: string) => {
      // Own keys only: `&constructor;` must not reach Object.prototype.
      if (name) {
        return Object.hasOwn(NAMED_REFERENCES, name)
          ? NAMED_REFERENCES[name]
          : match;
      }
      const code = dec ? Number(dec) : parseInt(hex!, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
  );
}

// The text a reader sees in inline `tokens`: escapes and character
// references resolved, emphasis marks and inline HTML tags dropped,
// code-span contents kept literal.
function plainText(tokens: readonly Nested[]): string {
  return tokens
    .map((token) => {
      if (token.type === 'html') return '';
      if (token.type === 'codespan') return token.text ?? '';
      if (token.tokens) return plainText(token.tokens);
      return token.type === 'text'
        ? decodeReferences(token.text ?? '')
        : (token.text ?? '');
    })
    .join('');
}

/**
 * The references in Markdown `text`, in order, each once: every link one of
 * `triggers` claims. Links quoted in code and images don't count. Use it to
 * read what a saved post refers to; the host still checks the ids are valid.
 */
export function referencesIn(
  text: string,
  triggers: readonly ReferenceTrigger[]
): Reference[] {
  const seen = new Set<string>();
  const found: Reference[] = [];
  for (const link of linksIn(new Lexer().lex(text) as Nested[])) {
    const { href } = link;
    const label = plainText(link.tokens as Nested[]);
    const match = matchReference(href, triggers);
    if (!match) continue;
    const key = `${match.kind}\u0000${match.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ ...match, label, href });
  }
  return found;
}
