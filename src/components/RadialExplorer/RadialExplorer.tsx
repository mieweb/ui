'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

// =============================================================================
// Types
// =============================================================================

export interface RadialSpoke {
  id: string;
  /** Label under the tile. */
  label: string;
  /** Tile icon (Lucide, ~22px). */
  icon: React.ReactNode;
  /** Small caps tag above the detail heading. Defaults to `label`. */
  tag?: string;
  /** Detail heading. Defaults to `label`. */
  title?: string;
  description?: string;
  /** Detail media — a `VideoCard variant="plate"`, an image, a chart. */
  media?: React.ReactNode;
  /** Caption under the media, e.g. "AI Medical Assistant · 2:44". */
  caption?: string;
  /** Primary CTA in the detail panel. */
  cta?: { label: string; href: string };
  /** Secondary "Explore module →" link. */
  href?: string;
  hrefLabel?: string;
}

export interface RadialExplorerProps {
  spokes: RadialSpoke[];
  /** Centre node — a brand mark or product tile. */
  center: React.ReactNode;
  /** Small caps label over the whole explorer. */
  eyebrow?: string;
  /** Controlled active spoke. */
  activeId?: string | null;
  defaultActiveId?: string | null;
  onActiveChange?: (id: string | null) => void;
  /** Shown in the detail panel before any spoke is chosen. */
  welcome?: {
    tag?: string;
    title: string;
    description?: string;
    media?: React.ReactNode;
    cta?: { label: string; href: string };
  };
  /**
   * Auto-advance through the spokes until the visitor interacts. Default
   * 2200ms; pass 0 to disable. Skipped under `prefers-reduced-motion`.
   */
  attractMs?: number;
  /** Hint under the ring. Default "Hover a module to preview". */
  hint?: string;
  /** Orbit radius. Default `clamp(118px, 17vw, 188px)`. */
  radius?: string;
  /** Accessible name for the spoke group. Default "Modules". */
  groupLabel?: string;
  className?: string;
}

// =============================================================================
// RadialExplorer
// =============================================================================

/**
 * A radial product explorer: a centre mark with N icon tiles orbiting it, a
 * glowing tracer ray from the core to the active tile, tab dots, and a detail
 * panel beside the ring that shows the active spoke's media, copy and CTAs
 * (with a welcome state before any pick). Auto-advances gently until the
 * visitor engages. Below `lg` the ring becomes a chip grid above the panel.
 * Ported from the Enterprise Health hero HUD.
 *
 * @example
 * ```tsx
 * <RadialExplorer
 *   eyebrow="Explore the platform"
 *   center={<img src="/mark.svg" alt="" />}
 *   spokes={[{ id: 'ehr', label: 'Certified EHR', icon: <FileText />, description: '…',
 *     media: <VideoCard variant="plate" title="EHR tour" youtubeId="…" duration="2:44" />,
 *     cta: { label: 'Request a demo', href: '/demo/' }, href: '/platform/ehr/' }]}
 * />
 * ```
 */
export function RadialExplorer({
  spokes,
  center,
  eyebrow,
  activeId: controlled,
  defaultActiveId = null,
  onActiveChange,
  welcome,
  attractMs = 2200,
  hint = 'Hover a module to preview',
  radius = 'clamp(118px, 17vw, 188px)',
  groupLabel = 'Modules',
  className,
}: RadialExplorerProps) {
  const reduced = usePrefersReducedMotion();
  const [inner, setInner] = React.useState<string | null>(defaultActiveId);
  const [engaged, setEngaged] = React.useState(false);
  const activeId = controlled !== undefined ? controlled : inner;
  const id = React.useId();

  const select = React.useCallback(
    (next: string | null) => {
      setEngaged(true);
      if (controlled === undefined) setInner(next);
      onActiveChange?.(next);
    },
    [controlled, onActiveChange]
  );

  // Attract loop until the visitor interacts.
  React.useEffect(() => {
    if (engaged || reduced || !attractMs || spokes.length === 0) return;
    let i = spokes.findIndex((s) => s.id === activeId);
    const t = window.setInterval(() => {
      i = (i + 1) % spokes.length;
      if (controlled === undefined) setInner(spokes[i].id);
      onActiveChange?.(spokes[i].id);
    }, attractMs);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engaged, reduced, attractMs, spokes.length, controlled]);

  const activeIndex = spokes.findIndex((s) => s.id === activeId);
  const active = activeIndex >= 0 ? spokes[activeIndex] : null;
  const step = 360 / Math.max(spokes.length, 1);
  const angle = (i: number) => `${i * step - 90}deg`;

  return (
    <section
      data-slot="radial-explorer"
      style={{ '--re-r': radius } as React.CSSProperties}
      className={cn(
        'grid gap-8 lg:grid-cols-[1.1fr_minmax(300px,380px)] lg:items-center',
        className
      )}
      aria-labelledby={eyebrow ? `${id}-eyebrow` : undefined}
    >
      <div className="flex flex-col items-center gap-5">
        {eyebrow && (
          <p
            id={`${id}-eyebrow`}
            className="text-primary-700 dark:text-primary-300 text-[11px] font-bold tracking-[0.18em] uppercase"
          >
            {eyebrow}
          </p>
        )}

        {/* Ring (lg+) */}
        <div
          role="group"
          aria-label={groupLabel}
          data-slot="radial-explorer-ring"
          className="relative hidden aspect-square w-[calc(var(--re-r)*2+120px)] place-items-center lg:grid"
        >
          <span
            aria-hidden
            data-slot="radial-explorer-core"
            className={cn(
              'absolute top-1/2 left-1/2 grid h-[100px] w-[100px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[24%] border border-white/15 text-white shadow-[0_14px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]',
              '[background:radial-gradient(90%_90%_at_24%_8%,color-mix(in_srgb,var(--mieweb-primary-400)_35%,transparent),transparent_60%),linear-gradient(145deg,var(--mieweb-primary-700)_0%,var(--mieweb-primary-900)_68%,var(--mieweb-primary-950)_100%)]',
              '[&>*]:h-[54px] [&>*]:w-[54px] [&>img]:object-contain'
            )}
          >
            {center}
          </span>

          {active && (
            <span
              aria-hidden
              data-slot="radial-explorer-ray"
              style={{
                width: 'var(--re-r)',
                transform: `translateY(-50%) rotate(${angle(activeIndex)})`,
              }}
              className={cn(
                'pointer-events-none absolute top-1/2 left-1/2 z-0 h-0.5 origin-left rounded-full transition-transform duration-500 [transition-timing-function:cubic-bezier(0.4,0.85,0.3,1)]',
                '[filter:drop-shadow(0_0_6px_color-mix(in_srgb,var(--mieweb-accent,var(--mieweb-primary-300))_55%,transparent))] [background:linear-gradient(90deg,transparent_4%,var(--mieweb-accent,var(--mieweb-primary-300))_94%)]',
                'after:absolute after:top-1/2 after:-right-[3px] after:h-[7px] after:w-[7px] after:-translate-y-1/2 after:rounded-full after:bg-[var(--mieweb-accent,var(--mieweb-primary-300))] after:shadow-[0_0_9px_2px_color-mix(in_srgb,var(--mieweb-accent,var(--mieweb-primary-300))_70%,transparent)] after:content-[""]'
              )}
            />
          )}

          {spokes.map((s, i) => {
            const on = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                data-slot="radial-explorer-spoke"
                data-active={on || undefined}
                style={{
                  transform: `translate(-50%,-50%) rotate(${angle(i)}) translate(var(--re-r)) rotate(calc(-1 * ${angle(i)}))`,
                }}
                onMouseEnter={() => select(s.id)}
                onFocus={() => select(s.id)}
                onClick={() => select(s.id)}
                className="group/spoke absolute top-1/2 left-1/2 grid w-24 justify-items-center gap-2 focus-visible:outline-none"
              >
                <SpokeTile icon={s.icon} active={on} />
                <span
                  className={cn(
                    'text-muted-foreground group-hover/spoke:text-primary-800 dark:group-hover/spoke:text-primary-200 text-[13px] font-semibold transition-colors',
                    on && 'text-primary-800 dark:text-primary-200'
                  )}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chip grid (< lg) */}
        <div
          role="group"
          aria-label={groupLabel}
          className="grid w-full grid-cols-3 gap-3 lg:hidden"
        >
          {spokes.map((s) => {
            const on = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                data-slot="radial-explorer-chip"
                onClick={() => select(s.id)}
                className="group/spoke grid justify-items-center gap-1.5 focus-visible:outline-none"
              >
                <SpokeTile icon={s.icon} active={on} size="sm" />
                <span
                  className={cn(
                    'text-muted-foreground text-center text-xs font-semibold',
                    on && 'text-primary-800 dark:text-primary-200'
                  )}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* dots + hint */}
        <div className="flex flex-col items-center gap-2">
          <div role="tablist" aria-label={groupLabel} className="flex gap-2">
            {spokes.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={s.label}
                onClick={() => select(s.id)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === activeIndex
                    ? 'w-6 bg-[var(--mieweb-accent,var(--mieweb-primary-400))]'
                    : 'bg-primary-300/60 hover:bg-primary-400 w-2'
                )}
              />
            ))}
          </div>
          {hint && (
            <p
              className={cn(
                'text-muted-foreground text-xs transition-opacity',
                engaged && 'opacity-0'
              )}
              aria-hidden={engaged}
            >
              {hint}
            </p>
          )}
        </div>
      </div>

      {/* Detail */}
      <div
        data-slot="radial-explorer-detail"
        aria-live={engaged ? 'polite' : 'off'}
        className="border-border bg-card text-card-foreground grid content-center gap-3.5 rounded-2xl border p-5 shadow-xl"
      >
        {active ? (
          <Detail
            key={active.id}
            tag={active.tag ?? active.label}
            title={active.title ?? active.label}
            description={active.description}
            media={active.media}
            caption={active.caption}
            cta={active.cta}
            href={active.href}
            hrefLabel={active.hrefLabel ?? 'Explore module'}
          />
        ) : welcome ? (
          <Detail
            key="welcome"
            tag={welcome.tag}
            title={welcome.title}
            description={welcome.description}
            media={welcome.media}
            cta={welcome.cta}
          />
        ) : null}
      </div>
    </section>
  );
}

// =============================================================================
// Pieces
// =============================================================================

function SpokeTile({
  icon,
  active,
  size = 'md',
}: {
  icon: React.ReactNode;
  active: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'mie-fx-sheen relative grid place-items-center rounded-[17px] border transition-[transform,border-color,color,box-shadow,background] duration-200',
        size === 'md'
          ? 'h-[60px] w-[60px] [&>svg]:h-[22px] [&>svg]:w-[22px]'
          : 'h-12 w-12 rounded-xl [&>svg]:h-5 [&>svg]:w-5',
        'border-border bg-primary-500/10 text-primary-700 dark:text-primary-300 shadow-md backdrop-blur-sm',
        'group-hover/spoke:-translate-y-0.5 group-hover/spoke:scale-[1.04] group-hover/spoke:border-transparent group-hover/spoke:text-white group-hover/spoke:shadow-xl',
        'group-hover/spoke:[background:linear-gradient(150deg,var(--mieweb-primary-700),var(--mieweb-primary-900))_padding-box,linear-gradient(135deg,var(--mieweb-accent,var(--mieweb-primary-300)),var(--mieweb-primary-200)_55%,var(--mieweb-accent,var(--mieweb-primary-300)))_border-box]',
        'group-focus-visible/spoke:outline-primary-500 group-focus-visible/spoke:outline group-focus-visible/spoke:outline-2 group-focus-visible/spoke:outline-offset-[3px]',
        active &&
          '-translate-y-0.5 scale-[1.04] border-transparent text-white shadow-xl [background:linear-gradient(150deg,var(--mieweb-primary-700),var(--mieweb-primary-900))_padding-box,linear-gradient(135deg,var(--mieweb-accent,var(--mieweb-primary-300)),var(--mieweb-primary-200)_55%,var(--mieweb-accent,var(--mieweb-primary-300)))_border-box]'
      )}
    >
      {icon}
    </span>
  );
}

function Detail({
  tag,
  title,
  description,
  media,
  caption,
  cta,
  href,
  hrefLabel,
}: {
  tag?: string;
  title: string;
  description?: string;
  media?: React.ReactNode;
  caption?: string;
  cta?: { label: string; href: string };
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="grid gap-3.5 motion-safe:animate-[mie-fade-in_0.25s_ease-out]">
      {media && <div data-slot="radial-explorer-media">{media}</div>}
      {tag && (
        <span className="bg-primary-500/10 text-primary-800 dark:text-primary-200 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.14em] uppercase">
          {tag}
        </span>
      )}
      <h3 className="text-foreground text-2xl leading-tight font-semibold">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground text-[15px] leading-snug">
          {description}
        </p>
      )}
      {caption && <p className="text-muted-foreground text-sm">{caption}</p>}
      {(cta || href) && (
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {cta && (
            <a
              href={cta.href}
              className="mie-fx-sheen bg-primary-800 hover:bg-primary-900 inline-flex h-11 items-center gap-1.5 rounded-lg px-5 text-sm font-semibold text-white"
            >
              {cta.label}
              <ArrowRight size={16} aria-hidden />
            </a>
          )}
          {href && (
            <a
              href={href}
              className="text-primary-800 dark:text-primary-200 text-sm font-semibold underline-offset-4 hover:underline"
            >
              {hrefLabel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
