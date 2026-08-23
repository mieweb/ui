'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Diamond, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// =============================================================================
// Types
// =============================================================================

/** Authoritative source link shown in the card footer. */
export interface GlossarySource {
  label: string;
  url: string;
}

/** Sibling term shown as a lateral "hop" chip. */
export interface GlossaryRelatedTerm {
  term: string;
  href?: string;
}

export interface GlossaryTooltipProps {
  /** Visible, in-flow trigger text (may be a plural or abbreviation match). */
  children: React.ReactNode;
  /** Canonical term name, shown as the card heading. */
  term: string;
  definition: string;
  /** Human-readable category label, shown as a badge in the header. */
  category?: string;
  /** Optional single key fact, shown with a diamond marker. */
  keyFact?: string;
  /** Optional authoritative source link, shown in the footer. */
  source?: GlossarySource;
  /** Optional sibling terms, shown as chips. */
  related?: GlossaryRelatedTerm[];
  /**
   * Full glossary page for the term. When set, the trigger is a real link —
   * desktop clicks navigate while hover previews; touch taps pin the card.
   */
  href?: string;
  /** Truncation limit for the in-card definition (default 190 chars). */
  maxDefinitionLength?: number;
  /** Dashed underline marking the term as hoverable (default true). */
  underline?: boolean;
  className?: string;
}

const HIDE_GRACE_MS = 180;

// =============================================================================
// GlossaryTooltip
// =============================================================================

/**
 * A rich "what does this term mean?" hover card: category badge, canonical
 * term, truncated definition, optional key fact, source link, and related
 * term chips. The provenance sibling is `SourceTip` ("what backs this
 * claim?") — the two share the same interaction grammar.
 *
 * Trigger and card are phrasing content (`span`/`a`/`button` only), so it is
 * valid inside `<p>` prose. The card portals to `body` with fixed
 * positioning, flipping and clamping to stay in the viewport. On touch, a
 * tap pins the card instead of navigating; Escape or an outside tap closes.
 *
 * @example
 * ```tsx
 * <GlossaryTooltip
 *   term="OSHA recordable"
 *   definition="A work-related injury or illness that meets OSHA reporting criteria…"
 *   category="Compliance"
 *   href="/glossary/osha-recordable"
 * >
 *   OSHA recordables
 * </GlossaryTooltip>
 * ```
 */
export function GlossaryTooltip({
  children,
  term,
  definition,
  category,
  keyFact,
  source,
  related,
  href,
  maxDefinitionLength = 190,
  underline = true,
  className,
}: GlossaryTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, []);

  React.useEffect(() => () => clearHideTimer(), []);

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

  const togglePin = React.useCallback(() => {
    if (pinned) close();
    else {
      setPinned(true);
      show();
    }
  }, [pinned, close, show]);

  // Desktop clicks on a linked term navigate; coarse pointers pin instead.
  const onTriggerClick = (e: React.MouseEvent) => {
    const coarse =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none)').matches;
    if (!coarse) return;
    if (href) e.preventDefault();
    togglePin();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (href) return; // links keep native Enter navigation
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePin();
    }
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

  const short =
    definition.length > maxDefinitionLength
      ? `${definition.slice(0, maxDefinitionLength - 1).trimEnd()}…`
      : definition;

  const triggerClasses = cn(
    'cursor-help',
    underline &&
      'decoration-primary-400/70 underline decoration-dashed underline-offset-4',
    className
  );

  const triggerProps = {
    onClick: onTriggerClick,
    className: cn(
      triggerClasses,
      href && 'text-primary-700 dark:text-primary-400 font-medium'
    ),
  };

  return (
    <span
      ref={anchorRef}
      className="relative inline"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={onBlurCapture}
    >
      {href ? (
        <a href={href} aria-expanded={open} {...triggerProps}>
          {children}
        </a>
      ) : (
        <span
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-label={`${term} — show definition`}
          onKeyDown={onTriggerKeyDown}
          {...triggerProps}
        >
          {children}
        </span>
      )}
      {open &&
        createPortal(
          <span
            ref={floatingRef}
            role="tooltip"
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
            className="z-50 block w-80"
            style={style}
          >
            <span className="border-border bg-card block overflow-hidden rounded-lg border text-start font-normal tracking-normal normal-case shadow-xl ring-1 ring-black/5 dark:ring-white/10">
              <span className="from-primary-700 to-primary-600 block bg-gradient-to-br px-3.5 py-2.5">
                <span className="flex items-start justify-between gap-2">
                  <span className="block min-w-0">
                    {category && (
                      <span className="mb-1 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                        {category}
                      </span>
                    )}
                    <span className="block text-sm leading-snug font-semibold text-white">
                      {term}
                    </span>
                  </span>
                  {pinned && (
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close definition"
                      className="shrink-0 rounded p-0.5 text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              </span>

              <span className="block px-3.5 py-2.5">
                <span className="text-muted-foreground block text-[13px] leading-relaxed">
                  {short}
                </span>
                {keyFact && (
                  <span className="mt-2 flex items-start gap-1.5">
                    <Diamond
                      aria-hidden="true"
                      className="text-primary-500 mt-0.5 h-3 w-3 shrink-0"
                    />
                    <span className="text-foreground min-w-0 text-xs leading-relaxed font-medium">
                      {keyFact}
                    </span>
                  </span>
                )}
              </span>

              {(source || (related && related.length > 0) || href) && (
                <span className="border-border bg-muted/50 block border-t px-3.5 py-2">
                  {related && related.length > 0 && (
                    <span className="mb-1.5 flex flex-wrap gap-1">
                      {related.map((r) =>
                        r.href ? (
                          <a
                            key={r.term}
                            href={r.href}
                            className="border-border bg-card text-foreground hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-400 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                          >
                            {r.term}
                          </a>
                        ) : (
                          <span
                            key={r.term}
                            className="border-border bg-card text-muted-foreground rounded-full border px-2 py-0.5 text-[11px] font-medium"
                          >
                            {r.term}
                          </span>
                        )
                      )}
                    </span>
                  )}
                  <span className="flex items-center justify-between gap-2">
                    {source ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-700 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 min-w-0 truncate text-[11px] font-semibold"
                      >
                        {source.label}
                      </a>
                    ) : (
                      <span />
                    )}
                    {href && (
                      <a
                        href={href}
                        className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium"
                      >
                        Full definition
                        <ArrowRight aria-hidden="true" className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                </span>
              )}
            </span>
          </span>,
          document.body
        )}
    </span>
  );
}
