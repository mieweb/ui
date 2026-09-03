'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// =============================================================================
// Types
// =============================================================================

/** One line of provenance shown in the card. */
export interface TipSource {
  /** One-line label — statute name or source title. Truncated on render. */
  label: string;
  /** Source URL. Omit for a provenance line that isn't linkable. */
  url?: string;
  /** Secondary label shown at the end (publisher / host / year). */
  sub?: string;
}

export interface SourceTipProps {
  /** The claim this card explains — the card's heading. */
  heading: string;
  /** Free-text provenance, for facts no public URL can verify. */
  note?: string;
  /** Linked (or unlinked) one-line sources. */
  sources?: TipSource[];
  /** Eyebrow above the heading. Defaults to "Source". */
  eyebrow?: string;
  /** The visible trigger. */
  children: React.ReactNode;
  className?: string;
  /**
   * Underline the trigger with a dashed rule marking a hoverable claim.
   * Leave off in table cells, which signal hoverability by their own
   * treatment rather than by underlining every cell.
   */
  underline?: boolean;
}

const HIDE_GRACE_MS = 180;

// =============================================================================
// SourceTip
// =============================================================================

/**
 * A hover card answering "what backs this claim?" — an eyebrow + heading,
 * optional free-text provenance, and a list of one-line source links.
 * Suits stat tiles, table cells, and inline facts where a numbered footnote
 * would be overkill.
 *
 * The trigger and card are phrasing content (`span`/`a` only), so it is
 * valid inside `<p>` prose and table cells. The card portals to `body` with
 * fixed positioning, flipping and clamping to stay in the viewport. On
 * touch, a tap pins the card; Escape or an outside tap closes it. A pinned
 * card behaves as a non-modal dialog — focus moves into it so its source
 * links are keyboard-reachable, and returns to the trigger on close.
 *
 * @example
 * ```tsx
 * <SourceTip
 *   heading="OSHA recordable rate"
 *   sources={[{ label: 'BLS SOII 2023', url: 'https://www.bls.gov/iif/', sub: 'BLS' }]}
 *   underline
 * >
 *   2.4 per 100 FTE
 * </SourceTip>
 * ```
 */
export function SourceTip({
  heading,
  note,
  sources,
  eyebrow = 'Source',
  children,
  className,
  underline = false,
}: SourceTipProps) {
  const [open, setOpen] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // True while close() restores focus to the trigger, so the trigger's
  // focus-show doesn't immediately reopen a card the user just dismissed.
  const suppressFocusShow = React.useRef(false);

  const { anchorRef, floatingRef, style } = useAnchoredPosition<
    HTMLSpanElement,
    HTMLSpanElement
  >({
    open,
    placement: 'top',
    offset: 10,
    viewportPadding: 8,
    allowFlip: true,
  });

  const clearHideTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const show = React.useCallback(() => {
    clearHideTimer();
    setOpen(true);
  }, []);

  const scheduleHide = React.useCallback(() => {
    if (pinned) return;
    clearHideTimer();
    timer.current = setTimeout(() => setOpen(false), HIDE_GRACE_MS);
  }, [pinned]);

  const close = React.useCallback(() => {
    clearHideTimer();
    setPinned(false);
    setOpen(false);
    // Return focus to the trigger if it was inside the card.
    if (floatingRef.current?.contains(document.activeElement)) {
      suppressFocusShow.current = true;
      anchorRef.current?.focus();
    }
  }, [anchorRef, floatingRef]);

  React.useEffect(() => () => clearHideTimer(), []);

  // A pinned card is a non-modal dialog: move focus into it so its links
  // are reachable by keyboard.
  React.useEffect(() => {
    if (pinned) floatingRef.current?.focus();
  }, [pinned, floatingRef]);

  useEscapeKey(close, open);

  // Pinned cards close on an outside tap; hover cards close on their own.
  React.useEffect(() => {
    if (!open || !pinned) return;
    const onPointer = (e: Event) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || floatingRef.current?.contains(t))
        return;
      close();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open, pinned, close, anchorRef, floatingRef]);

  // Touch has no hover: tap pins the card instead of falling through.
  const onTriggerClick = () => {
    const coarse =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none)').matches;
    if (!coarse) return;
    togglePin();
  };

  const togglePin = () => {
    if (pinned) close();
    else {
      setPinned(true);
      show();
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePin();
    }
  };

  // Focus lives on the dialog container once pinned, so Enter/Space there
  // (not on a link inside) must also unpin — the trigger no longer has focus.
  const onDialogKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      close();
    }
  };

  const onTriggerFocus = () => {
    if (suppressFocusShow.current) {
      suppressFocusShow.current = false;
      return;
    }
    show();
  };

  const onBlurCapture = (e: React.FocusEvent<HTMLSpanElement>) => {
    const next = e.relatedTarget as Node | null;
    if (
      next &&
      (anchorRef.current?.contains(next) || floatingRef.current?.contains(next))
    )
      return;
    scheduleHide();
  };

  const hasSources = Boolean(sources && sources.length > 0);

  return (
    <span
      ref={anchorRef}
      className={cn(
        'cursor-help',
        underline &&
          'decoration-primary-400/70 underline decoration-dashed underline-offset-4',
        className
      )}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={onTriggerFocus}
      onBlur={onBlurCapture}
      onClick={onTriggerClick}
      onKeyDown={onTriggerKeyDown}
      tabIndex={0}
      role="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`${heading} — show source`}
    >
      {children}
      {open &&
        createPortal(
          /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- keyboard dismissal on a focused non-modal dialog container is the WAI-ARIA pattern; links inside keep their own semantics */
          <span
            ref={floatingRef}
            role="dialog"
            aria-label={heading}
            tabIndex={-1}
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
            onBlurCapture={onBlurCapture}
            onKeyDown={onDialogKeyDown}
            className="focus-visible:ring-ring z-50 block w-80 rounded-lg outline-none focus-visible:ring-2"
            style={style}
          >
            <span className="border-border bg-card block overflow-hidden rounded-lg border text-start font-normal tracking-normal normal-case shadow-xl ring-1 ring-black/5 dark:ring-white/10">
              <span className="from-primary-700 to-primary-600 block bg-gradient-to-br px-3.5 py-2.5">
                <span className="text-primary-100/90 block text-[10px] font-bold tracking-wide uppercase">
                  {eyebrow}
                </span>
                <span className="mt-0.5 block text-sm leading-snug font-semibold text-white">
                  {heading}
                </span>
              </span>

              {(note || hasSources) && (
                <span className="block px-3.5 py-2.5">
                  {note && (
                    <span className="text-muted-foreground block text-[13px] leading-relaxed">
                      {note}
                    </span>
                  )}
                  {hasSources && (
                    <span
                      className={cn(
                        'block',
                        note &&
                          'border-border mt-2.5 border-t border-dashed pt-2.5'
                      )}
                    >
                      <span className="text-muted-foreground block text-[10px] font-bold tracking-wide uppercase">
                        {sources!.length === 1
                          ? 'Source'
                          : `${sources!.length} sources`}
                      </span>
                      <span className="block max-h-52 overflow-y-auto">
                        {sources!.map((s, i) => (
                          <span
                            key={`${s.label}-${i}`}
                            className="mt-1.5 flex items-center gap-2"
                          >
                            <span
                              aria-hidden="true"
                              className="bg-primary-400 h-1.5 w-1.5 shrink-0 rounded-full"
                            />
                            {s.url ? (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 min-w-0 flex-1 truncate text-xs font-semibold"
                              >
                                {s.label}
                              </a>
                            ) : (
                              <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                                {s.label}
                              </span>
                            )}
                            {s.sub && (
                              <span className="text-muted-foreground/70 shrink-0 text-[11px]">
                                {s.sub}
                              </span>
                            )}
                          </span>
                        ))}
                      </span>
                    </span>
                  )}
                </span>
              )}
            </span>
          </span>,
          document.body
        )}
    </span>
  );
}
