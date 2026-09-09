'use client';

import * as React from 'react';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export type MegaMenuTone = 'primary' | 'accent' | 'neutral';

/** The right-column feature panel. */
export interface MegaMenuFeatured {
  /** Small caps label, e.g. "Whitepaper". */
  eyebrow: string;
  title: string;
  description?: string;
  ctaLabel: string;
  ctaHref: string;
  /** Icon tile above the title. Ignored when `media` is given. */
  icon?: React.ReactNode;
  /** Rich media in place of the icon tile — a `VideoCard variant="plate"`, an image. */
  media?: React.ReactNode;
  /** Panel colour. Default `primary`. */
  tone?: MegaMenuTone;
}

export interface MegaMenuItem {
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  /**
   * Feature panel to show while this item is hovered/focused. Falls back to
   * the menu-level `featured` when unset — this is what makes the right
   * column contextual instead of static.
   */
  featured?: MegaMenuFeatured;
  external?: boolean;
}

export interface MegaMenuGroup {
  label: string;
  /** Makes the group heading a link. */
  href?: string;
  items: MegaMenuItem[];
}

export interface MegaMenuConfig {
  /** Stable id — used by `MegaMenuBar` to track the open menu. */
  key: string;
  /** Trigger label. */
  label: string;
  /** Trigger destination. Omit for a pure toggle. */
  href?: string;
  /** Heading inside the panel, e.g. "Resources & insight". */
  heading?: string;
  /** Flat 2-column grid of items (icon + label + description). */
  items?: MegaMenuItem[];
  /** Grouped columns of compact items. Takes precedence over `items`. */
  groups?: MegaMenuGroup[];
  /** "Browse all …" footer link. */
  allLabel?: string;
  allHref?: string;
  /** Footer CTA button. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Default right-column feature panel. */
  featured?: MegaMenuFeatured;
}

export interface MegaMenuProps {
  menu: MegaMenuConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current pathname — marks the matching item/group with `aria-current`. */
  currentPath?: string;
  /** Trigger colours for light (on dark header) or dark (on light header) chrome. */
  variant?: 'light' | 'dark';
  /**
   * Override how the feature panel is chosen. Receives the hovered item (or
   * `null` when none) and the menu; return `undefined` to hide the column.
   * Default: `item?.featured ?? menu.featured`.
   */
  resolveFeatured?: (
    item: MegaMenuItem | null,
    menu: MegaMenuConfig
  ) => MegaMenuFeatured | undefined;
  /** Called after any in-panel navigation (close mobile drawers, etc.). */
  onNavigate?: () => void;
  /** Viewport width below which hover-open is disabled (touch/mobile). Default 900. */
  hoverMinWidth?: number;
  className?: string;
}

const OPEN_DELAY_MS = 70;
const CLOSE_DELAY_MS = 150;

function normalizePath(href: string): string {
  const path = href.split('#')[0].split('?')[0];
  return path.replace(/\/+$/, '') || '/';
}

// =============================================================================
// MegaMenu
// =============================================================================

/**
 * A hover/click mega-menu: trigger link + chevron toggle, a panel with a
 * heading, a 2-column item grid (or grouped columns), a footer with
 * "Browse all" + CTA, and a right-column feature panel that **follows the
 * hovered item** (`item.featured`) before falling back to the menu default.
 * Marks the current route with `aria-current`. Ported from the Enterprise
 * Health frontdoor nav.
 *
 * Controlled — pair with `MegaMenuBar` to keep one menu open at a time.
 */
export function MegaMenu({
  menu,
  open,
  onOpenChange,
  currentPath,
  variant = 'dark',
  resolveFeatured = (item, m) => item?.featured ?? m.featured,
  onNavigate,
  hoverMinWidth = 900,
  className,
}: MegaMenuProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement>(null);
  const openTimer = React.useRef<number | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  const [left, setLeft] = React.useState<number | undefined>();
  const [hovered, setHovered] = React.useState<MegaMenuItem | null>(null);
  const panelId = React.useId();

  const isHoverViewport = () =>
    typeof window !== 'undefined' && window.innerWidth >= hoverMinWidth;

  const clearTimers = React.useCallback(() => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    openTimer.current = closeTimer.current = null;
  }, []);

  const requestOpen = React.useCallback(() => {
    clearTimers();
    openTimer.current = window.setTimeout(
      () => onOpenChange(true),
      OPEN_DELAY_MS
    );
  }, [clearTimers, onOpenChange]);

  const requestClose = React.useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(
      () => onOpenChange(false),
      CLOSE_DELAY_MS
    );
  }, [clearTimers, onOpenChange]);

  // Clamp the panel inside the viewport (it's absolutely positioned under the trigger).
  const position = React.useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel || !isHoverViewport()) {
      setLeft(undefined);
      return;
    }
    const rect = root.getBoundingClientRect();
    const pad = 16;
    const vw = document.documentElement.clientWidth;
    const clamped = Math.min(
      Math.max(rect.left, pad),
      Math.max(pad, vw - pad - panel.offsetWidth)
    );
    setLeft(clamped - rect.left);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverMinWidth]);

  React.useEffect(() => {
    if (open) position();
    else setHovered(null);
  }, [open, position]);

  React.useEffect(() => {
    window.addEventListener('resize', position);
    return () => window.removeEventListener('resize', position);
  }, [position]);

  React.useEffect(() => clearTimers, [clearTimers]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      clearTimers();
      onOpenChange(false);
      triggerRef.current?.focus();
    }
  };

  const curPath = currentPath ? normalizePath(currentPath) : null;
  const isCurrent = (href: string) =>
    curPath !== null && normalizePath(href) === curPath;
  const featured = resolveFeatured(hovered, menu);

  const triggerClass = cn(
    'inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    variant === 'light'
      ? 'text-white/90 hover:bg-white/10 hover:text-white'
      : 'text-foreground/80 hover:bg-muted hover:text-foreground',
    open &&
      (variant === 'light'
        ? 'bg-white/10 text-white'
        : 'bg-muted text-foreground')
  );

  const navigate = () => {
    onOpenChange(false);
    onNavigate?.();
  };

  return (
    // Hover/focus delegation region only — the trigger, toggle and links inside are the interactive elements.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={rootRef}
      data-slot="mega-menu"
      data-state={open ? 'open' : 'closed'}
      className={cn('relative', className)}
      onMouseEnter={() => isHoverViewport() && requestOpen()}
      onMouseLeave={() => isHoverViewport() && requestClose()}
      onFocusCapture={() => {
        if (!isHoverViewport()) return;
        clearTimers();
        onOpenChange(true);
      }}
      onBlurCapture={(e) => {
        if (!isHoverViewport()) return;
        if (!rootRef.current?.contains(e.relatedTarget as Node | null))
          requestClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div className="flex items-center">
        {menu.href ? (
          <a
            ref={triggerRef as React.RefObject<HTMLAnchorElement>}
            href={menu.href}
            className={triggerClass}
            aria-haspopup="true"
            aria-expanded={open}
            aria-controls={panelId}
            aria-current={isCurrent(menu.href) ? 'page' : undefined}
            onClick={navigate}
          >
            {menu.label}
          </a>
        ) : (
          <button
            ref={triggerRef as React.RefObject<HTMLButtonElement>}
            type="button"
            className={triggerClass}
            aria-haspopup="true"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => {
              clearTimers();
              onOpenChange(!open);
            }}
          >
            {menu.label}
          </button>
        )}
        <button
          type="button"
          aria-label={`Toggle ${menu.label} menu`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            clearTimers();
            onOpenChange(!open);
          }}
          className={cn(
            '-ms-1 rounded-md p-1 transition-transform',
            variant === 'light'
              ? 'text-white/70 hover:text-white'
              : 'text-muted-foreground hover:text-foreground',
            open && 'rotate-180'
          )}
        >
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>

      <div
        id={panelId}
        ref={panelRef}
        role="region"
        aria-label={menu.label}
        data-slot="mega-menu-panel"
        style={{ left }}
        className={cn(
          'border-border bg-card text-card-foreground absolute top-full z-50 mt-3 origin-top-left rounded-2xl border shadow-xl',
          'transition-[opacity,transform] duration-200',
          open
            ? 'visible translate-y-0 opacity-100'
            : 'pointer-events-none invisible -translate-y-1 opacity-0',
          featured
            ? 'grid w-[min(880px,calc(100vw-2rem))] grid-cols-[1fr_280px]'
            : 'w-[min(600px,calc(100vw-2rem))]'
        )}
      >
        <div className="p-6">
          {menu.heading && (
            <p className="text-muted-foreground mb-4 text-[11px] font-bold tracking-[0.14em] uppercase">
              {menu.heading}
            </p>
          )}

          {menu.groups ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {menu.groups.map((g) => (
                <div key={g.label}>
                  {g.href ? (
                    <a
                      href={g.href}
                      aria-current={isCurrent(g.href) ? 'page' : undefined}
                      onClick={navigate}
                      className="text-foreground hover:text-primary-700 dark:hover:text-primary-300 mb-2 inline-flex items-center gap-1 text-sm font-semibold"
                    >
                      {g.label}
                      <ChevronRight size={14} aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="text-foreground mb-2 text-sm font-semibold">
                      {g.label}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {g.items.map((it) => (
                      <li key={it.href}>
                        <ItemLink
                          item={it}
                          compact
                          current={isCurrent(it.href)}
                          onHover={setHovered}
                          onNavigate={navigate}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-1 sm:grid-cols-2">
              {menu.items?.map((it) => (
                <ItemLink
                  key={it.href}
                  item={it}
                  current={isCurrent(it.href)}
                  onHover={setHovered}
                  onNavigate={navigate}
                />
              ))}
            </div>
          )}

          {(menu.allHref || menu.ctaHref) && (
            <div className="border-border mt-5 flex items-center justify-between gap-4 border-t pt-4">
              {menu.allHref ? (
                <a
                  href={menu.allHref}
                  onClick={navigate}
                  className="text-foreground hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center gap-1.5 text-sm font-semibold"
                >
                  {menu.allLabel ?? 'Browse all'}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              ) : (
                <span />
              )}
              {menu.ctaHref && (
                <a
                  href={menu.ctaHref}
                  onClick={navigate}
                  className="mie-fx-sheen bg-primary-800 hover:bg-primary-900 inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold text-white"
                >
                  {menu.ctaLabel ?? 'Get started'}
                </a>
              )}
            </div>
          )}
        </div>

        {featured && (
          <FeaturedPanel featured={featured} onNavigate={navigate} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Pieces
// =============================================================================

function ItemLink({
  item,
  compact,
  current,
  onHover,
  onNavigate,
}: {
  item: MegaMenuItem;
  compact?: boolean;
  current: boolean;
  onHover: (item: MegaMenuItem | null) => void;
  onNavigate: () => void;
}) {
  return (
    <a
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      aria-current={current ? 'page' : undefined}
      data-slot="mega-menu-item"
      onClick={onNavigate}
      onMouseEnter={() => onHover(item)}
      onFocus={() => onHover(item)}
      className={cn(
        'group flex items-start gap-3 rounded-xl text-start transition-colors',
        compact ? 'px-2 py-1.5' : 'p-3',
        'hover:bg-primary-500/10 focus-visible:bg-primary-500/10 focus-visible:outline-none',
        current && 'bg-primary-500/10'
      )}
    >
      {item.icon && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors',
            compact
              ? 'h-7 w-7 [&_svg]:h-4 [&_svg]:w-4'
              : 'h-10 w-10 [&_svg]:h-5 [&_svg]:w-5',
            'bg-muted text-foreground/70 group-hover:bg-primary-800 group-hover:text-white',
            current && 'bg-primary-800 text-white'
          )}
        >
          {item.icon}
        </span>
      )}
      <span className="min-w-0">
        <span
          className={cn(
            'text-foreground group-hover:text-primary-800 dark:group-hover:text-primary-200 block font-semibold',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          {item.label}
        </span>
        {!compact && item.description && (
          <span className="text-muted-foreground mt-0.5 block text-sm leading-snug">
            {item.description}
          </span>
        )}
      </span>
    </a>
  );
}

const TONE: Record<MegaMenuTone, string> = {
  primary: 'bg-gradient-to-br from-primary-800 to-primary-950 text-white',
  accent:
    'text-white [background:linear-gradient(160deg,color-mix(in_srgb,var(--mieweb-accent,var(--mieweb-primary-700))_70%,#000)_0%,var(--mieweb-primary-950)_100%)]',
  neutral: 'bg-muted text-foreground',
};

function FeaturedPanel({
  featured,
  onNavigate,
}: {
  featured: MegaMenuFeatured;
  onNavigate: () => void;
}) {
  const tone = featured.tone ?? 'primary';
  const onDark = tone !== 'neutral';
  // `key` re-mounts the aside so swapping between items replays the fade-in.
  return (
    <aside
      data-slot="mega-menu-featured"
      key={featured.title}
      className={cn(
        'flex flex-col rounded-e-2xl p-6 motion-safe:animate-[mie-fade-in_0.2s_ease-out]',
        TONE[tone]
      )}
    >
      <p
        className={cn(
          'text-[11px] font-bold tracking-[0.14em] uppercase',
          onDark ? 'text-white/70' : 'text-muted-foreground'
        )}
      >
        {featured.eyebrow}
      </p>
      <div className="mt-4">
        {featured.media ??
          (featured.icon && (
            <span
              className={cn(
                'inline-flex h-14 w-14 items-center justify-center rounded-xl [&_svg]:h-7 [&_svg]:w-7',
                onDark ? 'bg-white/15 text-white' : 'bg-card text-foreground'
              )}
            >
              {featured.icon}
            </span>
          ))}
      </div>
      <p className="mt-4 text-xl leading-tight font-semibold">
        {featured.title}
      </p>
      {featured.description && (
        <p
          className={cn(
            'mt-2 text-sm leading-snug',
            onDark ? 'text-white/80' : 'text-muted-foreground'
          )}
        >
          {featured.description}
        </p>
      )}
      <div className="mt-auto pt-5">
        <a
          href={featured.ctaHref}
          onClick={onNavigate}
          className={cn(
            'mie-fx-sheen inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-5 text-sm font-semibold transition-colors',
            onDark
              ? 'border-white/40 text-white hover:border-white hover:bg-white/10'
              : 'border-border text-foreground hover:border-primary-500 hover:text-primary-800'
          )}
        >
          {featured.ctaLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}

// =============================================================================
// MegaMenuBar — keeps one menu open at a time
// =============================================================================

export interface MegaMenuBarProps extends Pick<
  MegaMenuProps,
  'currentPath' | 'variant' | 'resolveFeatured' | 'onNavigate' | 'hoverMinWidth'
> {
  menus: MegaMenuConfig[];
  className?: string;
  'aria-label'?: string;
}

/** A row of `MegaMenu` triggers sharing one open-state so only one panel shows. */
export function MegaMenuBar({
  menus,
  className,
  'aria-label': ariaLabel = 'Main navigation',
  ...rest
}: MegaMenuBarProps) {
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  return (
    <nav
      data-slot="mega-menu-bar"
      aria-label={ariaLabel}
      className={cn('flex items-center gap-1', className)}
    >
      {menus.map((m) => (
        <MegaMenu
          key={m.key}
          menu={m}
          open={openKey === m.key}
          onOpenChange={(o) =>
            setOpenKey(o ? m.key : openKey === m.key ? null : openKey)
          }
          {...rest}
        />
      ))}
    </nav>
  );
}
