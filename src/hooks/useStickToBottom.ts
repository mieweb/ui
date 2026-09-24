import * as React from 'react';

/**
 * Options for {@link useStickToBottom}.
 */
export interface UseStickToBottomOptions {
  /**
   * Distance from the bottom (px) within which the user still counts as "at
   * the bottom" — small offsets from rounding or momentum scrolling shouldn't
   * break pinning.
   */
  threshold?: number;
  /**
   * Disable all behavior (listeners and observers detach). Useful when the
   * scroll container anchors somewhere other than the bottom (e.g. a
   * newest-first feed).
   */
  disabled?: boolean;
}

export interface UseStickToBottomReturn {
  /** Attach to the scrollable container. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Attach to the element wrapping the container's content. Its growth (e.g.
   * a streaming message) re-pins the scroll while the user is at the bottom.
   */
  contentRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the user is currently at (or within `threshold` of) the bottom. */
  isAtBottom: boolean;
  /** Scroll to the bottom and resume pinning. */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

function pinToBottom(el: HTMLElement) {
  el.scrollTop = el.scrollHeight;
}

/**
 * Keeps a scroll container pinned to its bottom edge while the user is there,
 * and — crucially — leaves the scroll position alone once they scroll up.
 *
 * Designed for chat threads with streaming responses:
 * - While the user is at the bottom, content growth (new tokens, new
 *   messages) and container resizes (on-screen keyboard, growing composer)
 *   keep the newest content in view via a `ResizeObserver` on both the
 *   content and the container.
 * - Once the user scrolls up, nothing moves until they return to the bottom
 *   themselves or the host calls `scrollToBottom` (e.g. a jump-to-bottom
 *   button, or an outgoing message from the local user).
 *
 * The hook only pins; *when* to force a scroll (own message sent, thread
 * switched) stays a host decision through `scrollToBottom`.
 *
 * @example
 * ```tsx
 * const { containerRef, contentRef, isAtBottom, scrollToBottom } =
 *   useStickToBottom();
 * return (
 *   <div className="relative min-h-0 flex-1">
 *     <div ref={containerRef} className="h-full overflow-y-auto">
 *       <div ref={contentRef}>{rows}</div>
 *     </div>
 *     {!isAtBottom && <JumpToBottom onClick={() => scrollToBottom('smooth')} />}
 *   </div>
 * );
 * ```
 */
export function useStickToBottom({
  threshold = 100,
  disabled = false,
}: UseStickToBottomOptions = {}): UseStickToBottomReturn {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  // Mirror of `isAtBottom` readable synchronously from observer callbacks
  // without re-subscribing them on every scroll.
  const pinnedRef = React.useRef(true);

  // Track the user's position: at (or near) the bottom means "pinned".
  React.useEffect(() => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      pinnedRef.current = atBottom;
      setIsAtBottom(atBottom);
    };

    handleScroll(); // initial position
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [threshold, disabled]);

  // While pinned, follow growth of the content (streaming tokens, appended
  // rows) and shrinking of the container (on-screen keyboard, composer
  // growing) so the newest content stays in view. While unpinned this
  // observer never touches the scroll position.
  React.useEffect(() => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el || typeof globalThis.ResizeObserver === 'undefined') return;

    const observer = new globalThis.ResizeObserver(() => {
      if (pinnedRef.current) pinToBottom(el);
    });
    observer.observe(el);
    const content = contentRef.current;
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, [disabled]);

  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      const el = containerRef.current;
      if (!el) return;
      // Pin immediately so a concurrent stream keeps following while a
      // smooth scroll animates down.
      pinnedRef.current = true;
      setIsAtBottom(true);
      if (typeof el.scrollTo === 'function') {
        el.scrollTo({ top: el.scrollHeight, behavior });
      } else {
        pinToBottom(el); // jsdom fallback
      }
    },
    []
  );

  return { containerRef, contentRef, isAtBottom, scrollToBottom };
}
