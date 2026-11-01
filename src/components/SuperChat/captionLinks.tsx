import * as React from 'react';

/**
 * A Markdown link (`[label](https://…)`) or a bare web address. Only http(s):
 * the caption is a message's raw text, so nothing else becomes a link. A bare
 * address stops before closing punctuation ("see https://x.dev." keeps the
 * full stop out).
 */
const LINK =
  /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]*[^\s<.,;:!?)\]'"])/g;

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
    const [whole, label, labelled, bare] = match;
    const at = match.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    const href = labelled ?? bare;
    parts.push(
      <a
        key={at}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        {label ?? bare}
      </a>
    );
    last = at + whole.length;
  }
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
