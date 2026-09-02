'use client';

import * as React from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { buttonVariants } from '../Button';

// =============================================================================
// Types
// =============================================================================

/** One section the nav links to. The id must match a `section[id]` on the page. */
export interface SectionSpyItem {
  id: string;
  label: string;
}

/**
 * Funnel intent for the bar's single contextual CTA — drives its visual
 * weight so the in-page strip never out-shouts a page's primary CTA:
 * `explore` (quiet next step) → `evaluate` (sales-ready ask) → `commit`
 * (high-intent action).
 */
export type SectionSpyCtaTier = 'explore' | 'evaluate' | 'commit';

export interface SectionSpyCta {
  label: string;
  href: string;
  tier?: SectionSpyCtaTier;
}

export interface SectionSpyNavProps {
  /** Sections to link to, in page order. */
  items: SectionSpyItem[];
  /** Optional single page-specific next-step CTA at the end of the bar. */
  cta?: SectionSpyCta;
  /** Eyebrow before the links (default "On this page"). */
  label?: string;
  /**
   * Visual tone: `surface` sits on the page background; `brand` renders the
   * inverted primary band.
   */
  tone?: 'surface' | 'brand';
  /** IntersectionObserver root margin tuning for the scroll spy. */
  rootMargin?: string;
  /** Called with the section id when a nav link is clicked. */
  onItemClick?: (id: string) => void;
  /** Called when the CTA is clicked (e.g. for analytics). */
  onCtaClick?: (cta: SectionSpyCta) => void;
  className?: string;
}

// =============================================================================
// Internals
// =============================================================================

/** Directional glyph inferred from the destination. */
function CtaArrow({ href }: { href: string }) {
  const Icon = href.startsWith('#')
    ? ArrowDown
    : href.startsWith('/')
      ? ArrowRight
      : ArrowUpRight;
  return <Icon aria-hidden="true" className="h-3.5 w-3.5" />;
}

const CTA_TIER_VARIANT = {
  explore: 'ghost',
  evaluate: 'outline',
  commit: 'primary',
} as const;

// =============================================================================
// SectionSpyNav
// =============================================================================

/**
 * Sticky horizontal in-page wayfinding: jumps between a page's major
 * sections, highlights the one in view with a sliding underline, and can
 * carry a single page-specific next-step CTA. Pure anchor links, so it
 * still works if the scroll spy never runs.
 *
 * The horizontal complement to `TableOfContents` — use that for a sidebar
 * outline, this for a band under the page header. Section elements need
 * matching `id`s.
 *
 * @example
 * ```tsx
 * <SectionSpyNav
 *   items={[
 *     { id: 'overview', label: 'Overview' },
 *     { id: 'pricing', label: 'Pricing' },
 *   ]}
 *   cta={{ label: 'Book a demo', href: '/demo', tier: 'evaluate' }}
 * />
 * ```
 */
export function SectionSpyNav({
  items,
  cta,
  label = 'On this page',
  tone = 'surface',
  rootMargin = '-22% 0px -68% 0px',
  onItemClick,
  onCtaClick,
  className,
}: SectionSpyNavProps) {
  const ids = React.useMemo(() => items.map((it) => it.id), [items]);
  const { activeId } = useScrollSpy({ ids, rootMargin });
  const active = activeId ?? items[0]?.id ?? '';

  const railRef = React.useRef<HTMLDivElement>(null);
  const markRef = React.useRef<HTMLSpanElement>(null);

  // Find the active link by dataset rather than a CSS selector, so ids
  // never need escaping and CSS.escape availability doesn't matter.
  const findActiveLink = React.useCallback((): HTMLAnchorElement | null => {
    const links = railRef.current?.querySelectorAll<HTMLAnchorElement>('a');
    if (!links) return null;
    for (const link of links) {
      if (link.dataset.id === active) return link;
    }
    return null;
  }, [active]);

  // Slide the underline beneath the active link. offsetLeft/offsetWidth are
  // physical and measured against the rail, so the marker tracks the link
  // in both directions and while the rail is scrolled horizontally.
  const syncMarker = React.useCallback(() => {
    const link = findActiveLink();
    const mark = markRef.current;
    if (!link || !mark) return;
    mark.style.left = `${link.offsetLeft}px`;
    mark.style.width = `${link.offsetWidth}px`;
  }, [findActiveLink]);

  React.useEffect(() => {
    const link = findActiveLink();
    link?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
    syncMarker();
  }, [findActiveLink, syncMarker]);

  React.useEffect(() => {
    window.addEventListener('resize', syncMarker);
    return () => window.removeEventListener('resize', syncMarker);
  }, [syncMarker]);

  const brand = tone === 'brand';

  return (
    <nav
      className={cn(
        'sticky top-0 z-30 w-full',
        brand
          ? 'bg-primary-900 text-white'
          : 'border-border bg-card/95 border-b backdrop-blur',
        className
      )}
      aria-label={label}
    >
      <div className="flex items-center gap-4 px-4 py-0.5">
        <span
          className={cn(
            'shrink-0 text-[11px] font-semibold tracking-wide uppercase max-md:hidden',
            brand ? 'text-white/85' : 'text-muted-foreground'
          )}
          aria-hidden="true"
        >
          {label}
        </span>
        <div
          ref={railRef}
          className="relative flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((it) => {
            const isActive = active === it.id;
            return (
              <a
                key={it.id}
                href={`#${it.id}`}
                data-id={it.id}
                onClick={() => onItemClick?.(it.id)}
                className={cn(
                  'shrink-0 rounded px-2.5 py-2 text-sm whitespace-nowrap transition-colors',
                  brand
                    ? isActive
                      ? 'font-semibold text-white'
                      : 'text-white/85 hover:text-white'
                    : isActive
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'location' : undefined}
              >
                {it.label}
              </a>
            );
          })}
          <span
            ref={markRef}
            className={cn(
              'absolute bottom-0 h-0.5 rounded-full transition-[left,width] duration-300',
              brand ? 'bg-primary-400' : 'bg-primary-500'
            )}
            aria-hidden="true"
          />
        </div>
        {cta && (
          <a
            href={cta.href}
            onClick={() => onCtaClick?.(cta)}
            className={cn(
              buttonVariants({
                variant: CTA_TIER_VARIANT[cta.tier ?? 'explore'],
                size: 'sm',
              }),
              'shrink-0',
              brand &&
                (cta.tier ?? 'explore') !== 'commit' &&
                'text-white hover:bg-white/10 hover:text-white'
            )}
          >
            {cta.label}
            <CtaArrow href={cta.href} />
          </a>
        )}
      </div>
    </nav>
  );
}
