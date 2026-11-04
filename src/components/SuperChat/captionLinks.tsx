import * as React from 'react';

/**
 * A parenthesised group, none of `excluded` inside, as a RegExp source.
 * Parentheses in an address count only in balanced pairs, as in
 * https://en.wikipedia.org/wiki/Function_(mathematics), so the one closing a
 * Markdown link or an aside ("(see https://x.dev)") stays out of it.
 */
export const parenGroup = (excluded = '') => String.raw`\([^()${excluded}]*\)`;

/**
 * What delimits an address rather than being part of it: an angle bracket
 * (`<https://…>`) or a backtick (an address set as code). `\x60` is the
 * backtick, which a raw template literal can't hold.
 */
const DELIMITERS = String.raw`<>\x60`;
/** One piece of a web address: a character, or a parenthesised group. */
const URL_PIECE = String.raw`[^\s()${DELIMITERS}]|${parenGroup(String.raw`\s${DELIMITERS}`)}`;
/** A bare address's last piece: not closing punctuation. */
const URL_END = String.raw`[^\s()${DELIMITERS}.,;:!?\]'"]|${parenGroup(String.raw`\s${DELIMITERS}`)}`;

/**
 * A Markdown link's optional title after its address (`"…"`, `'…'` or `(…)`,
 * as CommonMark allows). Matched so the link still is one; never shown, as the
 * caption's links have no tooltips.
 */
const LINK_TITLE = String.raw`(?:[ \t]+(?:"[^"\n]*"|'[^'\n]*'|\([^()\n]*\)))?[ \t]*`;

/**
 * A Markdown link (`[label](https://… "title")`), a Markdown autolink
 * (`<https://…>`, shown without its brackets) or a bare web address. Only
 * http(s), in any case (`HTTPS://` too): the caption is a message's raw text,
 * so nothing else becomes a link. A bare address stops before closing
 * punctuation ("see https://x.dev." keeps the full stop out).
 *
 * A label holds no `[`, so a label search ends at the next one. Otherwise
 * every unmatched `[` would search to the end of the line: 100,000 of them
 * (the composer's limit) took 6 s. In `[a [b](…)`, as in CommonMark, only
 * `b` is the link.
 */
const LINK = new RegExp(
  String.raw`\[([^[\]\n]+)\]\((https?:\/\/(?:${URL_PIECE})+)${LINK_TITLE}\)` +
    String.raw`|<(https?:\/\/[^\s<>]+)>` +
    String.raw`|(https?:\/\/(?:${URL_PIECE})*(?:${URL_END}))`,
  'gi'
);

/**
 * A media item's caption with its links tappable, as they are in the thread.
 * Inline only (the media view clamps the caption to two lines, which block
 * Markdown would break), so the rest stays as written. Text with no links
 * comes back as the same string.
 */
export function linkifyCaption(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, labelled, autolink, bare] = match;
    const at = match.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    const href = labelled ?? autolink ?? bare;
    parts.push(
      <a
        key={at}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        {label ?? href}
      </a>
    );
    last = at + whole.length;
  }
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
