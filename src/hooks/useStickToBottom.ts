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
  /**
   * Scroll so `target`'s top aligns with the viewport top and enter “reading”
   * mode: content growing past the fold no longer auto-follows, so the reader
   * consumes the response at their own pace (the ChatGPT/Claude send UX).
   * Following resumes when they explicitly return to the bottom — a
   * jump-to-bottom click (`scrollToBottom`) or scrolling there by hand.
   */
  anchorToTurnStart: (target: HTMLElement, behavior?: ScrollBehavior) => void;
  /**
   * Scroll to the bottom only while actually following (at the bottom and not
   * in reading mode). Returns whether it scrolled — hosts use this to decide
   * between following an appended message and raising a “new messages” hint.
   */
  followIfPinned: (behavior?: ScrollBehavior) => boolean;
  /**
   * Hold the current position: enter reading mode without scrolling, so an
   * incoming stream fills below the fold instead of pushing the view up.
   * Call right after a streaming message appends (optionally after revealing
   * its first line with `followIfPinned`). Following resumes exactly as after
   * `anchorToTurnStart`: an explicit `scrollToBottom` or the reader returning
   * to the bottom by hand.
   */
  stopFollowing: () => void;
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
 * switched) stays a host decision through `scrollToBottom`,
 * `anchorToTurnStart` (ChatGPT-style: scroll a fresh turn to the viewport top
 * and pause following while the reader digests the reply), and
 * `followIfPinned` (follow an append only while actually at the bottom).
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
  // “Reading” mode (entered via `anchorToTurnStart`): the viewport sits at the
  // reserved space below a fresh turn — geometrically the bottom — but growth
  // must NOT follow. Cleared once the position genuinely leaves the bottom
  // (content outgrew the reserve or the user scrolled up), after which the
  // normal pin-at-bottom rules apply again.
  const readingRef = React.useRef(false);
  // In-flight anchor animation: a smooth `anchorToTurnStart` fires scroll
  // events that are neither the user's nor at the bottom — they must not end
  // reading mode or re-pin. Cleared on arrival at the target, or when the
  // distance to it grows (the user grabbed the scroll mid-animation).
  const anchorTargetRef = React.useRef<number | null>(null);
  const anchorDistanceRef = React.useRef(Infinity);

  // Hosts can re-attach the refs to new DOM nodes without remounting (e.g.
  // SuperChat swapping its plain thread for the virtualized one when the
  // conversation grows). Mirror the current nodes into state so the listener
  // and observer effects below re-bind whenever the target changes.
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null
  );
  const [contentEl, setContentEl] = React.useState<HTMLDivElement | null>(null);
  // Intentionally dep-less: ref mutations don't trigger renders, so this must
  // check after every render. The inequality guards make it settle immediately.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (containerRef.current !== containerEl)
      setContainerEl(containerRef.current);
    if (contentRef.current !== contentEl) setContentEl(contentRef.current);
  });

  // Track the user's position: at (or near) the bottom means "pinned".
  React.useEffect(() => {
    if (disabled) return;
    const el = containerEl;
    if (!el) return;

    const handleScroll = () => {
      const anchorTarget = anchorTargetRef.current;
      if (anchorTarget != null) {
        const distance = Math.abs(el.scrollTop - anchorTarget);
        if (distance < 2) {
          anchorTargetRef.current = null; // arrived — handle normally
        } else if (distance > anchorDistanceRef.current + 1) {
          anchorTargetRef.current = null; // user took over mid-animation
        } else {
          anchorDistanceRef.current = distance;
          return; // the animation's own events don't change pinning
        }
      }
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      if (!atBottom) readingRef.current = false;
      pinnedRef.current = atBottom && !readingRef.current;
      setIsAtBottom(atBottom);
    };

    // A freshly attached node starts at `scrollTop` 0 — re-assert carried-over
    // pinning (e.g. across SuperChat's plain ⇄ virtualized swap) instead of
    // letting the initial read demote a pinned reader to "scrolled up".
    if (pinnedRef.current) pinToBottom(el);
    handleScroll(); // initial position
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [containerEl, threshold, disabled]);

  // While pinned, follow growth of the content (streaming tokens, appended
  // rows) and shrinking of the container (on-screen keyboard, composer
  // growing) so the newest content stays in view. While unpinned this
  // observer never touches the scroll position.
  React.useEffect(() => {
    if (disabled) return;
    const el = containerEl;
    if (!el || typeof globalThis.ResizeObserver === 'undefined') return;

    const observer = new globalThis.ResizeObserver(() => {
      if (pinnedRef.current) {
        pinToBottom(el);
        return;
      }
      // Mid-anchor-animation the position is transient — judge nothing yet.
      if (anchorTargetRef.current != null) return;
      // Not following: growth can still silently carry the position away from
      // the bottom (no scroll event fires), so recompute the state here — it
      // drives the jump-to-bottom affordance and ends reading mode once the
      // response outgrows its reserved space.
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      if (!atBottom) readingRef.current = false;
      setIsAtBottom(atBottom);
    });
    observer.observe(el);
    if (contentEl) observer.observe(contentEl);
    return () => observer.disconnect();
  }, [containerEl, contentEl, threshold, disabled]);

  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      const el = containerRef.current;
      if (!el) return;
      // Pin immediately so a concurrent stream keeps following while a
      // smooth scroll animates down.
      readingRef.current = false;
      anchorTargetRef.current = null;
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

  const anchorToTurnStart = React.useCallback(
    (target: HTMLElement, behavior: ScrollBehavior = 'auto') => {
      const el = containerRef.current;
      if (!el) return;
      readingRef.current = true;
      pinnedRef.current = false;
      // Clamp to the reachable range so the “arrived” check always resolves.
      const top = Math.min(
        target.getBoundingClientRect().top -
          el.getBoundingClientRect().top +
          el.scrollTop,
        el.scrollHeight - el.clientHeight
      );
      anchorTargetRef.current = top;
      anchorDistanceRef.current = Infinity;
      if (typeof el.scrollTo === 'function') {
        el.scrollTo({ top, behavior });
      } else {
        el.scrollTop = top; // jsdom fallback
      }
    },
    []
  );

  const followIfPinned = React.useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      if (!pinnedRef.current) return false;
      scrollToBottom(behavior);
      return true;
    },
    [scrollToBottom]
  );

  const stopFollowing = React.useCallback(() => {
    readingRef.current = true;
    pinnedRef.current = false;
  }, []);

  return {
    containerRef,
    contentRef,
    isAtBottom,
    scrollToBottom,
    anchorToTurnStart,
    followIfPinned,
    stopFollowing,
  };
}

/**
 * Companion to {@link useStickToBottom}: fires `onEnded` when the newest
 * message finishes streaming while the reader is away from the bottom — the
 * end of the reply landed below the fold, so the jump-to-bottom button should
 * upgrade to its “new messages” hint. When the whole reply fit above the fold
 * (the reader is still at the bottom), `onEndedAtBottom` fires instead so the
 * host can exit the stream's hold and resume following (`scrollToBottom`).
 */
export function useStreamEndedBelowFold(
  newest: { id: string; status?: string } | undefined,
  isAtBottom: boolean,
  onEnded: () => void,
  onEndedAtBottom?: () => void
) {
  const streamingIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (newest?.status === 'streaming') {
      streamingIdRef.current = newest.id;
      return;
    }
    if (streamingIdRef.current && newest?.id === streamingIdRef.current) {
      streamingIdRef.current = null;
      if (!isAtBottom) onEnded();
      else onEndedAtBottom?.();
    }
  }, [newest, isAtBottom, onEnded, onEndedAtBottom]);
}
