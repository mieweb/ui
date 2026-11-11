'use client';

/**
 * Tracks which document image the annotate affordance should anchor to
 * (mieweb/ui#735): the image under the pointer, or the one beside the caret.
 * Caret adjacency is the keyboard path — Kerebron's image nodeview is not
 * keyboard-selectable (no `ProseMirror-selectednode` ever appears), but
 * arrowing through the text lands the caret next to the image's inline
 * wrapper, and the affordance button is the next focusable after the editor,
 * so Tab reaches it. Hover alone would fail keyboard users.
 *
 * DOM observation instead of editor APIs: the capture layer deliberately
 * stays outside ProseMirror (same boundary as the rest of CaptureDock, which
 * only talks to the editor through the `insertFiles`/`replaceImage` handle).
 */
import * as React from 'react';

const BUTTON = '[data-slot="annotate-image-button"]';

/** The image inside an inline caret-sibling (e.g. Kerebron's
 * `span.kb-image-wrapper`), or the sibling itself when it is the image. */
function imageIn(node: Node | null | undefined): HTMLImageElement | null {
  if (!(node instanceof HTMLElement)) return null;
  if (node instanceof HTMLImageElement) return node;
  return node.querySelector('img');
}

function caretAdjacentImage(host: HTMLElement): HTMLImageElement | null {
  const sel = document.getSelection();
  const anchor = sel?.anchorNode;
  if (!anchor || !host.contains(anchor)) return null;
  const candidates =
    anchor instanceof HTMLElement
      ? [
          anchor.childNodes[sel.anchorOffset],
          anchor.childNodes[sel.anchorOffset - 1],
        ]
      : [anchor.previousSibling, anchor.nextSibling];
  for (const candidate of candidates) {
    const img = imageIn(candidate);
    if (img) return img;
  }
  return null;
}

export function useAnnotateTarget(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean
): HTMLImageElement | null {
  const [hovered, setHovered] = React.useState<HTMLImageElement | null>(null);
  const [caret, setCaret] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const host = ref.current;
    if (!host || !enabled) {
      setHovered(null);
      setCaret(null);
      return;
    }

    const onOver = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el instanceof HTMLImageElement) setHovered(el);
      // Moving onto the annotate button must not dismiss it.
      else if (!el.closest?.(BUTTON)) setHovered(null);
    };
    const onLeave = () => setHovered(null);

    const onSelectionChange = () => {
      // Tabbing from the editor to the button collapses the editor's DOM
      // selection — keep the target alive while the button holds focus.
      if (document.activeElement?.closest?.(BUTTON)) return;
      setCaret(caretAdjacentImage(host));
    };

    // Drop a target whose image left the document (an annotation save
    // replaces the nodeview; deletions remove it).
    const prune = () => {
      setHovered((prev) => (prev?.isConnected ? prev : null));
      setCaret((prev) => (prev?.isConnected ? prev : null));
    };
    const observer = new MutationObserver(prune);
    observer.observe(host, { subtree: true, childList: true });

    host.addEventListener('mouseover', onOver);
    host.addEventListener('mouseleave', onLeave);
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      observer.disconnect();
      host.removeEventListener('mouseover', onOver);
      host.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [ref, enabled]);

  return hovered ?? caret;
}
