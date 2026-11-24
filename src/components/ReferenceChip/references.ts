import type * as React from 'react';

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
  /**
   * A pick goes on a line of its own, e.g. a ticket in a plan: text before it
   * stays on its line, and the caret goes to a new line after it. In a list
   * the new lines are new items. Default: the pick sits inline, in the sentence.
   */
  ownLine?: boolean;
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

// What renders as something other than a link: code (fenced or inline) and images.
const NOT_A_LINK =
  /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`|!\[[^\]]*\]\([^)]*\)/g;
const LINK = /\[((?:\\.|[^\]\\])*)\]\(([^)\s]+)\)/g;

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
  for (const [, rawLabel, href] of text
    .replace(NOT_A_LINK, ' ')
    .matchAll(LINK)) {
    const match = matchReference(href, triggers);
    if (!match) continue;
    const key = `${match.kind}\u0000${match.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ ...match, label: rawLabel.replace(/\\(.)/g, '$1'), href });
  }
  return found;
}
