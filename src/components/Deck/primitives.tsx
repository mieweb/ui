import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import { safeHref } from '../../templates/Section';
import { TemplateIcon } from '../../templates/icons';
import { useDeck, useTone } from './DeckContext';
import { accent as accentSpec } from './tones';
import type { AccentName, BulletItem, SourceRef } from './types';

/** Props for an element that fades up as its slide scrolls into view; `i` staggers it. */
export function reveal(i = 0): {
  className: string;
  style: React.CSSProperties;
} {
  return {
    className: 'mie-deck-reveal',
    style: { '--mie-reveal-i': i } as React.CSSProperties,
  };
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const tone = useTone();
  const r = reveal(0);
  return (
    <p
      className={cn(
        r.className,
        'mb-4 text-xs font-semibold tracking-[0.2em] uppercase',
        accentSpec('accent', tone.isLight).text,
        className
      )}
      style={r.style}
    >
      {children}
    </p>
  );
}

export function SlideTitle({
  children,
  className,
  size = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg' | 'xl';
}) {
  const tone = useTone();
  const r = reveal(1);
  return (
    <h2
      className={cn(
        r.className,
        'font-bold tracking-tight text-balance',
        tone.text,
        size === 'xl'
          ? 'text-5xl sm:text-6xl lg:text-7xl'
          : size === 'lg'
            ? 'text-4xl sm:text-5xl lg:text-6xl'
            : 'text-3xl sm:text-4xl lg:text-5xl',
        className
      )}
      style={r.style}
    >
      {children}
    </h2>
  );
}

export function Subtitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const tone = useTone();
  const r = reveal(2);
  return (
    <p
      className={cn(
        r.className,
        'mt-4 max-w-2xl text-base leading-relaxed text-pretty sm:text-lg',
        tone.muted,
        className
      )}
      style={r.style}
    >
      {children}
    </p>
  );
}

/** The heading block most slides open with. */
export function SlideHeader({
  eyebrow,
  title,
  subtitle,
  center,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={cn(center && 'mx-auto text-center')}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <SlideTitle>{title}</SlideTitle>
      {subtitle && (
        <Subtitle className={cn(center && 'mx-auto')}>{subtitle}</Subtitle>
      )}
    </div>
  );
}

/**
 * Splits a figure such as `$1.2M` into prefix, number and suffix by scanning
 * for the first digit run (a regex here is flagged for polynomial backtracking).
 */
function splitFigure(value: string): [string, string, string] | null {
  const start = value.search(/\d/);
  if (start === -1) return null;
  let end = start;
  while (end < value.length && /[\d,.]/.test(value[end])) end += 1;
  return [value.slice(0, start), value.slice(start, end), value.slice(end)];
}

/** Counts a figure such as `$1.2M` or `94%` up from zero when it scrolls into view. */
export function CountUp({
  value,
  duration = 1400,
}: {
  value: string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const match = splitFigure(value);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !match) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const [prefix, digits, suffix] = match;
    const target = parseFloat(digits.replace(/,/g, ''));
    if (Number.isNaN(target)) return;
    const decimals = digits.split('.')[1]?.length ?? 0;
    const grouped = digits.includes(',');
    const render = (n: number) => {
      let out = n.toFixed(decimals);
      if (grouped) {
        const [whole, frac] = out.split('.');
        out =
          whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
          (frac ? `.${frac}` : '');
      }
      el.textContent = `${prefix}${out}${suffix}`;
    };
    render(0);
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          render(target * (1 - Math.pow(1 - t, 3)));
          if (t < 1) frame = requestAnimationFrame(tick);
          else el.textContent = value;
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = value;
    };
    // `match` is derived from `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}

export function DeckIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const { icons } = useDeck();
  if (!name) return null;
  return <TemplateIcon name={name} icons={icons} className={className} />;
}

export function IconChip({
  icon,
  accent = 'accent',
}: {
  icon?: string;
  accent?: AccentName;
}) {
  const tone = useTone();
  if (!icon) return null;
  const a = accentSpec(accent, tone.isLight);
  return (
    <span
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-xl border',
        a.soft,
        a.border,
        a.text
      )}
    >
      <DeckIcon name={icon} />
    </span>
  );
}

export function Bullet({
  item,
  depth = 0,
}: {
  item: BulletItem | string;
  depth?: number;
}) {
  const tone = useTone();
  const a = accentSpec('accent', tone.isLight);
  const b = typeof item === 'string' ? { text: item } : item;
  return (
    <li className={cn('flex flex-col', depth > 0 && 'ms-5 sm:ms-7')}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={cn('mt-2 flex-none', a.text)}>
          {b.icon ? (
            <DeckIcon name={b.icon} className="size-[1.1em]" />
          ) : (
            <span
              className={cn(
                'block rounded-full',
                depth === 0
                  ? cn('size-1.5', a.fill)
                  : 'size-1 bg-current opacity-60'
              )}
            />
          )}
        </span>
        <span
          className={cn(
            'leading-snug',
            depth === 0
              ? cn('text-lg sm:text-xl', tone.text)
              : cn('text-base', tone.muted)
          )}
        >
          {b.lead && (
            <span className={cn('font-semibold', a.text)}>{b.lead} </span>
          )}
          {b.text}
        </span>
      </div>
      {b.children && b.children.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {b.children.map((child, i) => (
            <Bullet key={i} item={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SourceLink({
  source,
  className,
}: {
  source: SourceRef;
  className?: string;
}) {
  const tone = useTone();
  // Slide JSON is content data; an executable scheme renders as plain text.
  const href = safeHref(source.url);
  if (!href)
    return (
      <span className={cn('text-xs', tone.muted, className)}>
        {source.label}
      </span>
    );
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:opacity-100',
        tone.muted,
        className
      )}
    >
      {source.label}
      <ExternalLink aria-hidden="true" className="size-3" />
    </a>
  );
}

/** A figure with its label, used by covers, conclusions and callouts. */
export function HighlightFigure({
  value,
  label,
  size = 'md',
}: {
  value: string;
  label: string;
  size?: 'md' | 'lg';
}) {
  const tone = useTone();
  return (
    <div className="text-center">
      <div
        className={cn(
          'font-bold',
          accentSpec('accent', tone.isLight).text,
          size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
        )}
      >
        <CountUp value={value} />
      </div>
      <div className={cn('mt-1 text-xs tracking-wider uppercase', tone.muted)}>
        {label}
      </div>
    </div>
  );
}

export function Card({
  children,
  className,
  i,
}: {
  children: React.ReactNode;
  className?: string;
  /** Reveal stagger index. */
  i?: number;
}) {
  const tone = useTone();
  const r = reveal(i ?? 3);
  return (
    <div
      className={cn(
        r.className,
        'rounded-2xl border p-6',
        tone.card,
        tone.hairline,
        className
      )}
      style={r.style}
    >
      {children}
    </div>
  );
}
