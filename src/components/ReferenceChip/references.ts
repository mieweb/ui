import { decodeNamedCharacterReference } from 'decode-named-character-reference';
import { Lexer, type Tokens } from 'marked';
import type { MentionOption } from '../Messaging/useMentionAutocomplete';

/**
 * A record a person picked while writing — a teammate, a ticket, a document —
 * as one suggestion in a trigger's list. It is an `@mention` option (the same
 * `MentionOption` `ChatComposer`'s `mentionOptions` take, drawn by the same
 * `MentionMenu`) plus the kind it belongs to; a pick is saved as a link, so
 * `MentionOption.value` doesn't apply. What `kind` and `id` mean is the
 * host's; the library only carries them.
 */
export interface ReferenceOption extends Omit<MentionOption, 'value'> {
  /** The {@link ReferenceTrigger.kind} this option belongs to. */
  kind: string;
  /** The record's id, as the host knows it. */
  id: string;
  /** Text of the chip and of the saved link, e.g. `@Ann Lee` or `TH-12: Fix login`. */
  label: string;
}

/**
 * One kind of reference: the character that opens its suggestion list, how to
 * find candidates, and how a picked one is written as a link and read back.
 * The host supplies one per kind — e.g. `@` for people, `#` for tickets.
 *
 * Triggers extend the library's existing `@mention` (`useMentionAutocomplete`
 * and `MentionMenu`), not a second one: the same list, keyboard and ARIA,
 * opened by any character, searched as you type, and saving a link to the
 * record instead of `@word` text.
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

/**
 * The kind and id `href` refers to, by the first trigger that claims it. A
 * trigger that throws on a malformed link (say `decodeURIComponent` on
 * `/people/%E0%A4`) doesn't claim it, so the link stays an ordinary link
 * instead of taking the message down.
 */
export function matchReference(
  href: string,
  triggers: readonly ReferenceTrigger[]
): { kind: string; id: string } | null {
  for (const trigger of triggers) {
    let id: string | null;
    try {
      id = trigger.fromHref(href);
    } catch {
      continue;
    }
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

// A numeric character reference's character, by CommonMark's rules (as
// micromark, which SuperChat renders with): NUL, controls other than
// whitespace, surrogates, noncharacters and anything past U+10FFFF read as
// U+FFFD — so `&#128;` is "\uFFFD", not a C1 control.
function numericReference(code: number): string {
  if (
    code < 9 ||
    code === 11 ||
    (code > 13 && code < 32) ||
    (code > 126 && code < 160) ||
    (code > 0xd7ff && code < 0xe000) ||
    (code > 0xfdcf && code < 0xfdf0) ||
    (code & 0xffff) === 0xffff ||
    (code & 0xffff) === 0xfffe ||
    code > 0x10ffff
  ) {
    return '\uFFFD';
  }
  return String.fromCodePoint(code);
}

// Marked keeps character references (`&eacute;`, `&#169;`) as written in text
// tokens; a reader sees the characters. CommonMark's forms: up to 7 decimal
// or 6 hex digits, or an HTML5 entity name with its semicolon. An unknown
// name stays as written (an own-property lookup, so `&constructor;` too).
function decodeReferences(text: string): string {
  return text.replace(
    /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([A-Za-z][A-Za-z0-9]{0,31}));/g,
    (match, dec?: string, hex?: string, name?: string) =>
      name
        ? decodeNamedCharacterReference(name) || match
        : numericReference(dec ? Number(dec) : parseInt(hex!, 16))
  );
}

// An escaped `&` (`\&#45;`) is a literal ampersand, so what follows is no
// character reference. Marked drops the backslash from destinations before
// we decode, which would lose that, so each escaped `&` (not `\\&`, an
// escaped backslash then a real `&`) is swapped for a stand-in first: a
// private-use character the text doesn't contain, chosen per call. Decoding
// then runs only on the text between stand-ins, so nothing it produces —
// `&#xE000;` included — can be taken for one, and each stand-in becomes `&`
// again (`\&` inside code, where escapes are literal).
interface Masked {
  text: string;
  /** The stand-in for an escaped `&`; empty when none was needed. */
  amp: string;
}

function maskEscapedAmpersands(text: string): Masked {
  const escaped = /(?<!\\)((?:\\\\)*)\\&/g;
  if (!escaped.test(text)) return { text, amp: '' };
  for (let code = 0xe000; code <= 0xf8ff; code++) {
    const amp = String.fromCharCode(code);
    if (!text.includes(amp)) {
      return { text: text.replace(escaped, `$1${amp}`), amp };
    }
  }
  // Every private-use character is in the text: leave it as written.
  return { text, amp: '' };
}

/** `text` with each stand-in `amp` read as `restore`, the rest by `read`. */
function unmask(
  text: string,
  amp: string,
  read: (part: string) => string,
  restore = '&'
): string {
  return amp ? text.split(amp).map(read).join(restore) : read(text);
}

// The text a reader sees in inline `tokens`: escapes and character
// references resolved, emphasis marks and inline HTML tags dropped,
// code-span contents kept literal, and a line break — hard (`  \n`) or an
// HTML `<br>` — read as a space: a label is one line, and `[Ann  \nLee](…)`
// and `[Ann<br>Lee](…)` name "Ann Lee", not "AnnLee".
const same = (part: string) => part;
const htmlBreak = /^<br\s*\/?>$/i;

/** `text` exactly as written: each stand-in back to the escaped `\&`. */
function literal(text: string, amp: string): string {
  return unmask(text, amp, same, '\\&');
}

function plainText(tokens: readonly Nested[], amp: string): string {
  return tokens
    .map((token) => {
      const text = token.text ?? '';
      if (token.type === 'html') return htmlBreak.test(text.trim()) ? ' ' : '';
      if (token.type === 'br') return ' ';
      if (token.type === 'codespan') return literal(text, amp);
      if (token.tokens) return plainText(token.tokens, amp);
      return token.type === 'text'
        ? unmask(text, amp, decodeReferences)
        : unmask(text, amp, same);
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
  const masked = maskEscapedAmpersands(text);
  const tokens = new Lexer().lex(masked.text);
  for (const link of linksIn(tokens as Nested[])) {
    // Marked resolves backslash escapes in a destination but keeps character
    // references as written; a Markdown renderer decodes them, so
    // `/people/u&#45;ann` is the link to `u-ann` here too — and, the escaped
    // `&` masked above, `/people/u\&#45;ann` stays `u&#45;ann`. An autolink
    // (`<https://…>`, or a bare URL) is the exception: it resolves neither
    // escapes nor references, so its destination and label stay as written.
    const autolink = !link.raw.startsWith('[');
    const href = autolink
      ? literal(link.href, masked.amp)
      : unmask(link.href, masked.amp, decodeReferences);
    const label = autolink
      ? literal(link.text, masked.amp)
      : plainText(link.tokens as Nested[], masked.amp);
    const match = matchReference(href, triggers);
    if (!match) continue;
    const key = `${match.kind}\u0000${match.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ ...match, label, href });
  }
  return found;
}
