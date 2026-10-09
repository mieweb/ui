import * as React from 'react';
import { cn } from '../../utils/cn';
import { TemplateAnchor, TemplateImg } from '../../templates/Section';
import type { TemplateIconRegistry } from '../../templates/icons';
import type { TemplateComponents } from '../../templates/types';
import {
  Controls,
  DotNav,
  KeyboardHints,
  MobileNav,
  OutlineDialog,
  ProgressBar,
  SlideCounter,
} from './DeckChrome';
import { DeckProvider, type DeckContextValue } from './DeckContext';
import { defaultDeckLabels, type DeckLabels } from './labels';
import { slideRenderers } from './registry';
import { slideAnchor } from './SlideFrame';
import type {
  DeckImage,
  DeckLink,
  DeckMeta,
  Slide,
  SlideRendererProps,
} from './types';

export interface DeckProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  slides: Slide[];
  meta: DeckMeta;
  /** A way back to the site, since a full-screen deck hides the site's navigation. */
  home?: DeckLink & { logo?: DeckImage };
  /** Fires when the visible slide changes \u2014 wire analytics here. */
  onSlideChange?: (slide: Slide, index: number) => void;
  /**
   * Site renderers: a slide type's name overrides the built-in renderer, and
   * any other name serves `{ type: 'custom', component }` slides.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each renderer narrows its slide
  renderers?: Record<string, React.ComponentType<SlideRendererProps<any>>>;
  /** Components for `{ type: 'custom', component }` graphics, e.g. a map. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each graphic owns its props
  graphics?: Record<string, React.ComponentType<any>>;
  /** Site image and link components (e.g. `next/image`, `next/link`). */
  components?: TemplateComponents;
  /** Extra icon tokens for slide `icon` fields. */
  icons?: TemplateIconRegistry;
  labels?: DeckLabels;
  /** BCP 47 locale for number formatting. */
  locale?: string;
  /** Mirror the visible slide in `location.hash` so it can be linked. Default `true`. */
  syncHash?: boolean;
}

const typingTarget = (el: globalThis.EventTarget | null) =>
  el instanceof HTMLElement &&
  (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ||
    el.isContentEditable ||
    el.getAttribute('role') === 'tab');

/** Space must activate a focused button, not advance the deck. */
const spaceActivates = (el: globalThis.EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button');

/**
 * A full-viewport, scroll-snapping slide deck built from plain JSON slides:
 * keyboard, swipe, dot and outline navigation, deep links, fullscreen and
 * print. Each slide type has a built-in renderer; sites add their own through
 * `renderers` and `graphics`.
 */
export const Deck = React.forwardRef<HTMLDivElement, DeckProps>(
  (
    {
      slides,
      meta,
      home,
      onSlideChange,
      renderers,
      graphics,
      components,
      icons,
      labels: labelOverrides,
      locale,
      syncHash = true,
      className,
      ...rest
    },
    ref
  ) => {
    const rootRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const touchStart = React.useRef<number | null>(null);
    const [active, setActive] = React.useState(0);
    const [ready, setReady] = React.useState(false);
    const [outline, setOutline] = React.useState(false);
    const [fullscreen, setFullscreen] = React.useState(false);
    const [hintPulse, setHintPulse] = React.useState(0);
    const labels = React.useMemo(
      () => ({ ...defaultDeckLabels, ...labelOverrides }),
      [labelOverrides]
    );
    const total = slides.length;
    React.useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    const slideEl = React.useCallback(
      (i: number) =>
        scrollRef.current?.querySelector<HTMLElement>(
          `[data-slot="deck-slide"][data-index="${i}"]`
        ),
      []
    );

    const goTo = React.useCallback(
      (i: number) => {
        const clamped = Math.max(0, Math.min(i, total - 1));
        const reduce = window.matchMedia?.(
          '(prefers-reduced-motion: reduce)'
        ).matches;
        slideEl(clamped)?.scrollIntoView({
          behavior: reduce ? 'auto' : 'smooth',
        });
      },
      [slideEl, total]
    );

    // Track the visible slide; mark slides seen so their content reveals once.
    React.useEffect(() => {
      const root = scrollRef.current;
      if (!root) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            // A slide taller than twice the viewport never reaches ratio
            // 0.5; covering half the viewport also counts as visible.
            const rootHeight = root.clientHeight || window.innerHeight;
            if (
              entry.intersectionRatio < 0.5 &&
              entry.intersectionRect.height < rootHeight / 2
            )
              continue;
            const el = entry.target as HTMLElement;
            el.dataset.seen = '';
            setActive(Number(el.dataset.index));
          }
        },
        { root, threshold: [0.1, 0.25, 0.5] }
      );
      root
        .querySelectorAll('[data-slot="deck-slide"]')
        .forEach((el) => observer.observe(el));
      setReady(true);
      return () => observer.disconnect();
    }, [total]);

    // Open at the slide named in the URL hash.
    React.useEffect(() => {
      const raw = window.location.hash.slice(1);
      let hash = raw;
      try {
        hash = decodeURIComponent(raw);
      } catch {
        // Malformed percent-encoding: match against the raw hash.
      }
      if (!hash) return;
      const i = slides.findIndex((s, n) => slideAnchor(s, n) === hash);
      if (i > 0) requestAnimationFrame(() => slideEl(i)?.scrollIntoView());
      // Only on mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reportedSlide = React.useRef(-1);
    React.useEffect(() => {
      const slide = slides[active];
      if (!slide) return;
      if (syncHash && ready) {
        const hash = `#${slideAnchor(slide, active)}`;
        if (window.location.hash !== hash)
          window.history.replaceState(window.history.state, '', hash);
      }
      // The effect reruns when `ready` flips; report each slide once.
      if (reportedSlide.current !== active) {
        reportedSlide.current = active;
        onSlideChange?.(slide, active);
      }
      // Report changes of slide, not of callback identity.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, slides, syncHash, ready]);

    const toggleFullscreen = React.useCallback(() => {
      if (!document.fullscreenElement)
        rootRef.current?.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.().catch(() => {});
    }, []);

    React.useEffect(() => {
      const onChange = () => setFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', onChange);
      return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    React.useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (outline || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey)
          return;
        if (typingTarget(e.target)) return;
        const key = e.key;
        if (key === ' ' && spaceActivates(e.target)) return;
        if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(key)) {
          e.preventDefault();
          goTo(active + 1);
        } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(key)) {
          e.preventDefault();
          goTo(active - 1);
        } else if (key === 'Home') {
          e.preventDefault();
          goTo(0);
        } else if (key === 'End') {
          e.preventDefault();
          goTo(total - 1);
        } else if (/^[1-9]$/.test(key)) {
          goTo(Number(key) - 1);
        } else if (key.toLowerCase() === 'f') {
          toggleFullscreen();
        } else if (key === '?') {
          setHintPulse((p) => p + 1);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [active, goTo, outline, toggleFullscreen, total]);

    const onTouchEnd = (e: React.TouchEvent) => {
      if (touchStart.current === null) return;
      const delta = touchStart.current - e.changedTouches[0].clientY;
      touchStart.current = null;
      const el = slideEl(active);
      // A slide taller than the viewport scrolls natively instead.
      if (
        el &&
        scrollRef.current &&
        el.scrollHeight > scrollRef.current.clientHeight + 20
      )
        return;
      if (Math.abs(delta) > 120) goTo(active + (delta > 0 ? 1 : -1));
    };

    const context = React.useMemo<DeckContextValue>(
      () => ({
        slides,
        activeSlide: active,
        goTo,
        labels,
        components,
        icons,
        graphics,
        renderers,
        locale,
      }),
      [
        slides,
        active,
        goTo,
        labels,
        components,
        icons,
        graphics,
        renderers,
        locale,
      ]
    );

    const closeOutline = React.useCallback(() => setOutline(false), []);
    const progress = total > 1 ? (active / (total - 1)) * 100 : 0;

    return (
      <DeckProvider value={context}>
        <div
          ref={rootRef}
          role="region"
          aria-roledescription={labels.presentation}
          aria-label={meta.title}
          data-slot="deck"
          data-ready={ready || undefined}
          className={cn(
            'mie-deck relative h-dvh w-full overflow-hidden bg-neutral-950 text-white',
            className
          )}
          {...rest}
        >
          <h1 className="sr-only">
            {meta.title}
            {meta.period ? ` \u2014 ${meta.period}` : ''}
          </h1>
          {home && (
            <TemplateAnchor
              href={home.href}
              trackingId={home.trackingId}
              components={components}
              className="mie-deck-chrome absolute start-3 top-3 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 py-1.5 ps-2 pe-3 text-xs font-semibold text-white/80 backdrop-blur transition-colors hover:bg-white/10 hover:text-white print:hidden"
            >
              {home.logo && (
                <TemplateImg
                  {...home.logo}
                  alt=""
                  components={components}
                  className="size-[18px] object-contain"
                />
              )}
              {home.label}
            </TemplateAnchor>
          )}
          <ProgressBar progress={progress} />
          <DotNav slides={slides} active={active} goTo={goTo} labels={labels} />
          <SlideCounter
            active={active}
            total={total}
            section={slides[active]?.section}
          />
          <KeyboardHints pulse={hintPulse} labels={labels} />
          <Controls
            isFullscreen={fullscreen}
            onToggleFullscreen={toggleFullscreen}
            onOpenOutline={() => setOutline(true)}
            labels={labels}
          />
          <div
            ref={scrollRef}
            onTouchStart={(e) => {
              touchStart.current = e.touches[0].clientY;
            }}
            onTouchEnd={onTouchEnd}
            className="mie-deck-scroll size-full snap-y snap-mandatory overflow-y-auto"
          >
            {slides.map((slide, i) => {
              // Each renderer narrows its own slide; the type-keyed lookup can't express that.
              const Renderer = (
                slide.type === 'custom'
                  ? renderers?.[slide.component]
                  : (renderers?.[slide.type] ?? slideRenderers[slide.type])
              ) as React.ComponentType<SlideRendererProps> | undefined;
              return Renderer ? (
                <Renderer key={slideAnchor(slide, i)} slide={slide} index={i} />
              ) : null;
            })}
          </div>
          <MobileNav
            active={active}
            total={total}
            onPrev={() => goTo(active - 1)}
            onNext={() => goTo(active + 1)}
            onOpenOutline={() => setOutline(true)}
            labels={labels}
          />
          <OutlineDialog
            open={outline}
            onClose={closeOutline}
            slides={slides}
            active={active}
            goTo={goTo}
            labels={labels}
          />
        </div>
      </DeckProvider>
    );
  }
);
Deck.displayName = 'Deck';
