import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronUp,
  List,
  Maximize2,
  Minimize2,
  Printer,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { DeckLabels } from './labels';
import type { Slide } from './types';

type Labels = Required<DeckLabels>;

const chrome = 'mie-deck-chrome print:hidden';
const iconButton =
  'flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 backdrop-blur transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

export const slideLabel = (s: Slide) =>
  s.navLabel ?? ('title' in s ? s.title : undefined) ?? '';

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className={cn(
        chrome,
        'pointer-events-none absolute inset-x-0 top-0 z-40 h-[3px] bg-white/5'
      )}
    >
      <div
        className="bg-accent h-full transition-[width] duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function SlideCounter({
  active,
  total,
  section,
}: {
  active: number;
  total: number;
  section?: string;
}) {
  return (
    <div
      className={cn(
        chrome,
        'pointer-events-none absolute start-5 bottom-5 z-40 hidden select-none md:block'
      )}
    >
      <div className="text-sm font-semibold text-white/80 tabular-nums">
        {String(active + 1).padStart(2, '0')}
        <span className="text-white/70">
          {' '}
          / {String(total).padStart(2, '0')}
        </span>
      </div>
      {section && (
        <div className="text-accent mt-0.5 text-[0.7rem] tracking-[0.18em] uppercase">
          {section}
        </div>
      )}
    </div>
  );
}

export function DotNav({
  slides,
  active,
  goTo,
  labels,
}: {
  slides: Slide[];
  active: number;
  goTo: (i: number) => void;
  labels: Labels;
}) {
  return (
    <nav
      aria-label={labels.slideNavigation}
      className={cn(
        chrome,
        'absolute end-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 md:flex'
      )}
    >
      {slides.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => goTo(i)}
          aria-label={labels.goToSlide(i + 1, slideLabel(s))}
          aria-current={i === active ? 'true' : undefined}
          className="group relative flex size-4 items-center justify-center"
        >
          <span
            className={cn(
              'block rounded-full transition-all duration-300',
              i === active
                ? 'bg-accent size-2.5'
                : 'size-1.5 bg-white/30 group-hover:bg-white/60'
            )}
          />
          <span className="pointer-events-none absolute end-6 rounded-md border border-white/10 bg-neutral-900/95 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {slideLabel(s)}
          </span>
        </button>
      ))}
    </nav>
  );
}

export function Controls({
  isFullscreen,
  onToggleFullscreen,
  onOpenOutline,
  labels,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenOutline: () => void;
  labels: Labels;
}) {
  return (
    <div
      className={cn(
        chrome,
        'absolute end-5 bottom-5 z-40 hidden items-center gap-2 md:flex'
      )}
    >
      <button
        type="button"
        className={iconButton}
        onClick={onOpenOutline}
        aria-label={labels.openOutline}
      >
        <List aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        className={iconButton}
        onClick={() => window.print()}
        aria-label={labels.print}
      >
        <Printer aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        className={iconButton}
        onClick={onToggleFullscreen}
        aria-label={
          isFullscreen ? labels.exitFullscreen : labels.enterFullscreen
        }
      >
        {isFullscreen ? (
          <Minimize2 aria-hidden="true" className="size-4" />
        ) : (
          <Maximize2 aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-white/15 bg-white/5 px-1 py-0.5 text-[0.65rem] text-white/80">
      {children}
    </kbd>
  );
}

export function KeyboardHints({
  pulse,
  labels,
}: {
  pulse: number;
  labels: Labels;
}) {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [pulse]);
  return (
    <div
      aria-hidden="true"
      className={cn(
        chrome,
        'pointer-events-none absolute bottom-5 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-neutral-900/80 px-4 py-1.5 text-xs text-white/70 backdrop-blur transition-opacity duration-500 select-none md:flex',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <span className="flex items-center gap-1">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd> {labels.navigateHint}
      </span>
      <span className="text-white/20">·</span>
      <span>
        <Kbd>F</Kbd> {labels.fullscreenHint}
      </span>
      <span className="text-white/20">·</span>
      <span>
        <Kbd>?</Kbd> {labels.helpHint}
      </span>
    </div>
  );
}

export function MobileNav({
  active,
  total,
  onPrev,
  onNext,
  onOpenOutline,
  labels,
}: {
  active: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onOpenOutline: () => void;
  labels: Labels;
}) {
  const btn =
    'flex size-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 disabled:opacity-30';
  return (
    <div
      className={cn(
        chrome,
        'absolute inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-white/10 bg-neutral-950/90 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden'
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={onPrev}
        disabled={active === 0}
        aria-label={labels.previous}
      >
        <ChevronUp aria-hidden="true" className="size-5" />
      </button>
      <button
        type="button"
        onClick={onOpenOutline}
        className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white/80 tabular-nums"
        aria-label={labels.openOutline}
      >
        <List aria-hidden="true" className="text-accent size-4" />
        {active + 1} / {total}
      </button>
      <button
        type="button"
        className={btn}
        onClick={onNext}
        disabled={active === total - 1}
        aria-label={labels.next}
      >
        <ChevronDown aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}

/** Focus-trapped slide list. */
export function OutlineDialog({
  open,
  onClose,
  slides,
  active,
  goTo,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  slides: Slide[];
  active: number;
  goTo: (i: number) => void;
  labels: Labels;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? []
      );
    (focusables()[1] ?? focusables()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="mie-deck-chrome fixed inset-0 z-[80] flex flex-col bg-neutral-950/95 text-white backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 id={titleId} className="text-lg font-bold text-white">
          {labels.outline}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.closeOutline}
          className={iconButton}
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <ol className="flex-1 overflow-y-auto px-3 py-3">
        {slides.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => {
                goTo(i);
                onClose();
              }}
              aria-current={i === active ? 'true' : undefined}
              className={cn(
                'flex w-full items-baseline gap-3 rounded-lg px-4 py-3 text-start transition-colors',
                i === active ? 'bg-accent/15' : 'hover:bg-white/5'
              )}
            >
              <span className="text-accent text-sm font-semibold tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={i === active ? 'text-white' : 'text-white/75'}>
                {slideLabel(s)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>,
    document.body
  );
}
