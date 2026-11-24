/**
 * SuperChat references plugin (opt-in).
 *
 * Draws the links a message's text holds to records — `[@Ann Lee](/people/u-ann)`,
 * `[TH-12: Fix login](/tickets/t-12)` — as {@link ReferenceChip}s, by the same
 * {@link ReferenceTrigger}s the editor inserted them with. Every other link
 * renders as usual. The text stays plain Markdown, so a renderer without the
 * plugin still shows a working link.
 */

import * as React from 'react';
import {
  ReferenceChip,
  type ReferenceChipProps,
} from '../../ReferenceChip/ReferenceChip';
import {
  matchReference,
  type Reference,
  type ReferenceTrigger,
} from '../../ReferenceChip/references';
import { MarkdownLink } from '../render/createMarkdownRenderer';
import type { SuperChatRenderPlugin } from '../types';

export interface ReferencesPluginOptions {
  /** The kinds of reference, as given to the editor. */
  triggers: ReferenceTrigger[];
  /**
   * Called when a chip is activated, instead of following its link — route
   * in a single-page app. Without it the chip is an ordinary same-tab link.
   */
  onOpen?: (reference: Reference) => void;
  /** Leading node for a chip, e.g. a person's avatar. */
  icon?: (reference: Reference) => React.ReactNode;
  /**
   * The chips' colour, as `Badge`. The tinted default reads on both a
   * neutral bubble and a coloured one. @default 'default'
   */
  variant?: ReferenceChipProps['variant'];
}

interface HastNode {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: { alt?: unknown; ariaHidden?: unknown };
  children?: HastNode[];
}

/** The first descendant of `node` (or `node` itself) that is a `tagName`. */
function findElement(node: HastNode, tagName: string): HastNode | undefined {
  if (node.tagName === tagName) return node;
  for (const child of node.children ?? []) {
    const found = findElement(child, tagName);
    if (found) return found;
  }
  return undefined;
}

/**
 * The plain text of a rendered link, its label — read as a screen reader
 * reads it. An image counts by its alt text: `[![@Ann Lee](/a.png)](/people/u-ann)`
 * is named "@Ann Lee", not left an empty chip. Anything hidden from
 * assistive tech is skipped, and a formula reads once, as its TeX source:
 * KaTeX renders `$x^2$` as MathML, that source and an aria-hidden visual
 * copy, and MathML's own text drops what its structure says (`x2`), so
 * `[Ticket $x^2$](…)` reads "Ticket x^2".
 */
function textOf(node: HastNode | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  const hidden = node.properties?.ariaHidden;
  if (hidden === true || hidden === 'true') return '';
  if (node.tagName === 'math') {
    const tex = findElement(node, 'annotation');
    if (tex) return textOf({ children: tex.children });
  }
  if (node.tagName === 'annotation') return '';
  // A hard line break reads as a space, as `referencesIn` reads it.
  if (node.tagName === 'br') return ' ';
  if (node.tagName === 'img') {
    const alt = node.properties?.alt;
    return typeof alt === 'string' ? alt : '';
  }
  // The converter follows each `<br>` with a newline text node; the break
  // already reads as a space, so that newline (and only it) is dropped.
  const children = node.children ?? [];
  return children
    .map((child, i) => {
      const text = textOf(child);
      return children[i - 1]?.tagName === 'br' && child.type === 'text'
        ? text.replace(/^\r?\n/, '')
        : text;
    })
    .join('');
}

/** Create the references (link → chip) render plugin. */
export function createReferencesPlugin({
  triggers,
  onOpen,
  icon,
  variant = 'default',
}: ReferencesPluginOptions): SuperChatRenderPlugin {
  function ReferenceLink(
    props: React.ComponentProps<'a'> & { node?: HastNode }
  ) {
    const href = typeof props.href === 'string' ? props.href : '';
    const match = href ? matchReference(href, triggers) : null;
    if (!match) return <MarkdownLink {...props} />;
    const reference: Reference = { ...match, label: textOf(props.node), href };
    return (
      <ReferenceChip
        kind={reference.kind}
        label={reference.label}
        href={href}
        icon={icon?.(reference)}
        variant={variant}
        onClick={
          onOpen
            ? (event) => {
                // A modified click keeps the browser's own link action
                // (new tab, new window, download).
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) {
                  return;
                }
                event.preventDefault();
                onOpen(reference);
              }
            : undefined
        }
      />
    );
  }
  return {
    name: 'references',
    components: {
      a: ReferenceLink as React.ComponentType<Record<string, unknown>>,
    },
  };
}
