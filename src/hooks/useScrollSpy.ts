import { useEffect, useState, useRef, type RefObject } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseScrollSpyOptions {
  /** CSS selector for the elements to observe (e.g. 'h2, h3, h4') */
  selectors?: string;
  /** Explicit list of element IDs to observe (alternative to selectors) */
  ids?: string[];
  /** IntersectionObserver root margin (default: '0px 0px -60% 0px') */
  rootMargin?: string;
  /** IntersectionObserver threshold (default: 0) */
  threshold?: number | number[];
  /** Scroll container element ref. Defaults to document viewport. */
  root?: RefObject<HTMLElement | null>;
  /** Whether the hook is active (default: true) */
  enabled?: boolean;
}

export interface UseScrollSpyReturn {
  /** The ID of the currently active (in-view) element */
  activeId: string | null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Tracks which section is currently in the viewport using IntersectionObserver.
 * Pairs naturally with `TableOfContents` to highlight the active heading.
 *
 * @example
 * ```tsx
 * function DocsPage() {
 *   const { activeId } = useScrollSpy({ selectors: 'h2, h3' });
 *   return (
 *     <aside>
 *       <TableOfContents activeId={activeId} />
 *     </aside>
 *   );
 * }
 * ```
 */
export function useScrollSpy({
  selectors,
  ids,
  rootMargin = '0px 0px -60% 0px',
  threshold = 0,
  root,
  enabled = true,
}: UseScrollSpyOptions = {}): UseScrollSpyReturn {
  const [activeId, setActiveId] = useState<string | null>(null);
  const visibleEntries = useRef<Map<string, IntersectionObserverEntry>>(
    new Map()
  );

  // Track root.current so the effect re-runs when the ref attaches
  const rootEl = root?.current ?? null;

  useEffect(() => {
    if (!enabled) return;

    const container = rootEl ?? document;

    // Resolve target elements from the DOM
    function resolveElements(): Element[] {
      let els: Element[] = [];
      if (ids && ids.length > 0) {
        els = ids
          .map((id) => document.getElementById(id))
          .filter((el): el is HTMLElement => el !== null);
      } else if (selectors) {
        els = Array.from(container.querySelectorAll(selectors));
      }
      return els.filter((el) => el.id);
    }

    let intersectionObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    function startObserving(): boolean {
      const elements = resolveElements();
      if (elements.length === 0) return false;

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              visibleEntries.current.set(entry.target.id, entry);
            } else {
              visibleEntries.current.delete(entry.target.id);
            }
          }

          // Pick the topmost visible heading (by DOM order)
          if (visibleEntries.current.size > 0) {
            let topmost: string | null = null;
            let topmostTop = Infinity;

            for (const [id, entry] of visibleEntries.current) {
              const top = entry.boundingClientRect.top;
              if (top < topmostTop) {
                topmostTop = top;
                topmost = id;
              }
            }

            if (topmost) {
              setActiveId(topmost);
            }
          }
        },
        {
          root: rootEl,
          rootMargin,
          threshold,
        }
      );

      for (const el of elements) {
        intersectionObserver.observe(el);
      }

      // Elements found — stop watching for new DOM nodes
      mutationObserver?.disconnect();
      mutationObserver = null;
      return true;
    }

    // If target elements don't exist yet (e.g. headings mount after ToC),
    // watch for DOM changes and retry until they appear.
    if (!startObserving()) {
      const watchRoot = rootEl ?? document.body;
      mutationObserver = new MutationObserver(() => {
        startObserving();
      });
      mutationObserver.observe(watchRoot, { childList: true, subtree: true });
    }

    const entries = visibleEntries.current;
    return () => {
      mutationObserver?.disconnect();
      intersectionObserver?.disconnect();
      entries.clear();
    };
  }, [selectors, ids, rootMargin, threshold, rootEl, enabled]);

  return { activeId };
}
