/* eslint-disable no-undef */
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

  useEffect(() => {
    if (!enabled) return;

    const container = root?.current ?? document;

    // Resolve target elements
    let elements: Element[] = [];
    if (ids && ids.length > 0) {
      elements = ids
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);
    } else if (selectors) {
      elements = Array.from(container.querySelectorAll(selectors));
    }

    // Filter to only elements that have an ID
    elements = elements.filter((el) => el.id);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
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
        root: root?.current ?? null,
        rootMargin,
        threshold,
      }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    const entries = visibleEntries.current;
    return () => {
      observer.disconnect();
      entries.clear();
    };
  }, [selectors, ids, rootMargin, threshold, root, enabled]);

  return { activeId };
}
