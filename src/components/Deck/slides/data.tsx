import * as React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { isRtl } from '../../../hooks/useDirection';
import { cn } from '../../../utils/cn';
import { useDeck, useTone } from '../DeckContext';
import { Graphic } from '../graphics';
import {
  Card,
  CountUp,
  DeckIcon,
  IconChip,
  SlideHeader,
  SourceLink,
  reveal,
} from '../primitives';
import { SlideFrame } from '../SlideFrame';
import { accent } from '../tones';
import type {
  BreakdownSlide,
  CardsSlide,
  ChartSlide,
  ComparisonTableSlide,
  FeatureHighlightSlide,
  ImpactTableSlide,
  MetricsSlide,
  RankedListSlide,
  SlideRendererProps,
  TabsSlide,
} from '../types';

const gridCols = (n: number) =>
  n >= 4
    ? 'sm:grid-cols-2 lg:grid-cols-4'
    : n === 3
      ? 'md:grid-cols-3'
      : 'md:grid-cols-2';

type Body<T> = Omit<T, 'type' | 'id' | 'navLabel' | 'tone' | 'section'>;

// --- metrics -----------------------------------------------------------------

function MetricsBody({ slide }: { slide: Body<MetricsSlide> }) {
  const tone = useTone();
  return (
    <>
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <div
        className={cn(
          'mt-10 grid grid-cols-1 gap-5',
          gridCols(slide.metrics.length)
        )}
      >
        {slide.metrics.map((m, i) => (
          <Card key={m.label} i={3 + i}>
            {m.icon && (
              <div className="mb-4">
                <IconChip icon={m.icon} accent={m.accent} />
              </div>
            )}
            <div
              className={cn(
                'text-4xl font-bold',
                accent(m.accent, tone.isLight).text
              )}
            >
              <CountUp value={m.value} />
            </div>
            <div className="mt-2 text-sm font-semibold">{m.label}</div>
            {m.description && (
              <div className={cn('mt-1 text-sm leading-snug', tone.muted)}>
                {m.description}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

export function MetricsRenderer({
  slide,
  index,
}: SlideRendererProps<MetricsSlide>) {
  return (
    <SlideFrame slide={slide} index={index} tone="brand">
      <MetricsBody slide={slide} />
    </SlideFrame>
  );
}

// --- chart -------------------------------------------------------------------

function ChartBody({ slide }: { slide: Body<ChartSlide> }) {
  const tone = useTone();
  return (
    <>
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <div {...reveal(3)} className="mie-deck-reveal mt-10">
        <Graphic graphic={slide.graphic} />
      </div>
      {slide.description && (
        <p className={cn('mt-6 max-w-3xl text-sm', tone.muted)}>
          {slide.description}
        </p>
      )}
      {slide.source && <SourceLink source={slide.source} className="mt-4" />}
    </>
  );
}

export function ChartRenderer({
  slide,
  index,
}: SlideRendererProps<ChartSlide>) {
  return (
    <SlideFrame slide={slide} index={index} tone="deep">
      <ChartBody slide={slide} />
    </SlideFrame>
  );
}

// --- feature highlight ---------------------------------------------------------

function FeatureHighlightBody({
  slide,
}: {
  slide: Body<FeatureHighlightSlide>;
}) {
  const tone = useTone();
  const a = accent('accent', tone.isLight);
  const hasGraphic = !!slide.graphic;
  return (
    <div
      className={cn(hasGraphic && 'grid items-center gap-10 lg:grid-cols-2')}
    >
      <div>
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} />
        <p
          {...reveal(2)}
          className={cn(
            'mie-deck-reveal mt-4 text-lg leading-relaxed',
            tone.muted
          )}
        >
          {slide.body}
        </p>
        {slide.stat && (
          <div {...reveal(3)} className="mie-deck-reveal mt-8">
            <div className={cn('text-5xl font-bold', a.text)}>
              <CountUp value={slide.stat.value} />
            </div>
            <div className={cn('mt-1 text-sm', tone.muted)}>
              {slide.stat.label}
            </div>
          </div>
        )}
        {slide.bullets && slide.bullets.length > 0 && (
          <ul {...reveal(4)} className="mie-deck-reveal mt-6 space-y-2">
            {slide.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn('mt-2 size-1.5 flex-none rounded-full', a.fill)}
                />
                {b}
              </li>
            ))}
          </ul>
        )}
        {slide.pullQuote && (
          <blockquote
            {...reveal(5)}
            className={cn(
              'mie-deck-reveal mt-8 border-s-2 ps-4 italic',
              a.border,
              tone.muted
            )}
          >
            {slide.pullQuote}
          </blockquote>
        )}
      </div>
      {hasGraphic && (
        <div {...reveal(3)} className="mie-deck-reveal flex flex-col gap-8">
          <Graphic graphic={slide.graphic!} />
          {slide.secondaryGraphic && (
            <Graphic graphic={slide.secondaryGraphic} />
          )}
        </div>
      )}
    </div>
  );
}

export function FeatureHighlightRenderer({
  slide,
  index,
}: SlideRendererProps<FeatureHighlightSlide>) {
  return (
    <SlideFrame slide={slide} index={index} tone="deep">
      <FeatureHighlightBody slide={slide} />
    </SlideFrame>
  );
}

// --- tables --------------------------------------------------------------------

function DeckTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  const tone = useTone();
  return (
    <div
      {...reveal(3)}
      className={cn(
        'mie-deck-reveal mt-10 overflow-x-auto rounded-2xl border',
        tone.hairline,
        tone.card
      )}
    >
      <table className="min-w-full text-start text-sm sm:text-base">
        <thead>
          <tr className={cn('border-b', tone.hairline)}>
            {headers.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={cn(
                  'px-5 py-3 font-semibold',
                  i === 0 ? 'text-start' : 'text-end',
                  tone.muted
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className={cn(r > 0 && 'border-t', tone.hairline)}>
              {row.map((cell, c) =>
                c === 0 ? (
                  <th
                    key={c}
                    scope="row"
                    className="px-5 py-3 text-start font-medium"
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={c} className="px-5 py-3 text-end tabular-nums">
                    {cell}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComparisonTableRenderer({
  slide,
  index,
}: SlideRendererProps<ComparisonTableSlide>) {
  const a = accent('accent', (slide.tone ?? 'deep') === 'light');
  const [metric, before, after, change] = slide.headers ?? [
    'Metric',
    'Before',
    'After',
    'Change',
  ];
  return (
    <SlideFrame slide={slide} index={index} tone="deep" width="lg">
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <DeckTable
        headers={[metric, before, after, change]}
        rows={slide.rows.map((r) => [
          r.label,
          <span key="b" className="opacity-70">
            {r.before}
          </span>,
          r.after,
          <span key="c" className={cn('font-semibold', a.text)}>
            {r.change}
          </span>,
        ])}
      />
    </SlideFrame>
  );
}

export function ImpactTableRenderer({
  slide,
  index,
}: SlideRendererProps<ImpactTableSlide>) {
  const [item, impact] = slide.headers ?? ['Investment', 'Impact'];
  return (
    <SlideFrame slide={slide} index={index} tone="deep" width="lg">
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <DeckTable
        headers={[item, impact]}
        rows={slide.rows.map((r) => [
          <span key="i">
            {r.item}
            {r.detail && (
              <span className="block text-sm font-normal opacity-70">
                {r.detail}
              </span>
            )}
          </span>,
          <span key="m" className="block text-start sm:text-end">
            {r.impact}
          </span>,
        ])}
      />
    </SlideFrame>
  );
}

// --- cards -------------------------------------------------------------------

function CardsBody({ slide }: { slide: Body<CardsSlide> }) {
  const tone = useTone();
  const a = accent('accent', tone.isLight);
  return (
    <>
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <div
        className={cn(
          'mt-10 grid grid-cols-1 gap-5',
          gridCols(slide.cards.length)
        )}
      >
        {slide.cards.map((card, i) => (
          <Card key={card.title} i={3 + i}>
            {card.icon && (
              <div className="mb-4">
                <IconChip icon={card.icon} />
              </div>
            )}
            <h3 className="text-lg font-semibold">{card.title}</h3>
            <p className={cn('mt-2 leading-relaxed', tone.muted)}>
              {card.body}
            </p>
            {card.stat && (
              <div className="mt-6">
                <div className={cn('text-3xl font-bold', a.text)}>
                  <CountUp value={card.stat} />
                </div>
                {card.statLabel && (
                  <div className={cn('text-sm', tone.muted)}>
                    {card.statLabel}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
      {slide.note && (
        <p className={cn('mt-8 text-sm italic', tone.muted)}>{slide.note}</p>
      )}
    </>
  );
}

export function CardsRenderer({
  slide,
  index,
}: SlideRendererProps<CardsSlide>) {
  return (
    <SlideFrame slide={slide} index={index} tone="brand">
      <CardsBody slide={slide} />
    </SlideFrame>
  );
}

// --- ranked list -----------------------------------------------------------------

function RankedListBody({ slide }: { slide: Body<RankedListSlide> }) {
  const tone = useTone();
  const { locale } = useDeck();
  const a = accent('accent', tone.isLight);
  const format = new Intl.NumberFormat(locale);
  const max = Math.max(1, ...slide.entries.map((e) => e.value));
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SlideHeader
          eyebrow={slide.eyebrow}
          title={slide.title}
          subtitle={slide.subtitle}
        />
        {slide.outOf && (
          <p className={cn('text-sm', tone.muted)}>{slide.outOf}</p>
        )}
      </div>
      <ol className="mt-8 flex flex-col gap-2">
        {slide.entries.map((e, i) => {
          const r = reveal(3 + i);
          return (
            <li
              key={e.label}
              className={cn(
                r.className,
                'grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border px-4 py-3',
                e.highlighted
                  ? cn(a.soft, a.border)
                  : cn(tone.card, tone.hairline)
              )}
              style={r.style}
            >
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  e.highlighted ? a.text : tone.muted
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{e.label}</span>
                {e.sublabel && (
                  <span className={cn('block truncate text-xs', tone.muted)}>
                    {e.sublabel}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-2 block h-1.5 overflow-hidden rounded-full',
                    tone.isLight ? 'bg-neutral-200' : 'bg-white/10'
                  )}
                >
                  <span
                    className={cn(
                      'block h-full rounded-full',
                      e.highlighted
                        ? a.fill
                        : tone.isLight
                          ? 'bg-neutral-400'
                          : 'bg-white/40'
                    )}
                    style={{ width: `${(e.value / max) * 100}%` }}
                  />
                </span>
              </span>
              <span className="text-end">
                <span className="block font-semibold tabular-nums">
                  {e.display ?? format.format(e.value)}
                </span>
                {e.secondary && (
                  <span className={cn('block text-xs', tone.muted)}>
                    {e.secondary}
                  </span>
                )}
                {e.change != null && e.change !== 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center text-xs font-semibold',
                      e.change > 0 ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {e.change > 0 ? (
                      <ArrowUp aria-hidden="true" className="size-3" />
                    ) : (
                      <ArrowDown aria-hidden="true" className="size-3" />
                    )}
                    <span className="sr-only">
                      {e.change > 0 ? '+' : '\u2212'}
                    </span>
                    {Math.abs(e.change)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {slide.source && <SourceLink source={slide.source} className="mt-4" />}
    </>
  );
}

export function RankedListRenderer({
  slide,
  index,
}: SlideRendererProps<RankedListSlide>) {
  return (
    <SlideFrame slide={slide} index={index} tone="deep" width="lg">
      <RankedListBody slide={slide} />
    </SlideFrame>
  );
}

// --- breakdown -----------------------------------------------------------------

export function BreakdownRenderer({
  slide,
  index,
}: SlideRendererProps<BreakdownSlide>) {
  return (
    <SlideFrame slide={slide} index={index} tone="deep">
      <BreakdownBody slide={slide} />
    </SlideFrame>
  );
}

function BreakdownBody({ slide }: { slide: BreakdownSlide }) {
  const tone = useTone();
  const a = accent('accent', tone.isLight);
  const total = slide.breakdown?.reduce((s, b) => s + b.count, 0) || 1;
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} />
        {slide.body && (
          <p
            {...reveal(2)}
            className={cn(
              'mie-deck-reveal mt-4 text-lg leading-relaxed',
              tone.muted
            )}
          >
            {slide.body}
          </p>
        )}
        {slide.callout && (
          <div
            {...reveal(3)}
            className={cn(
              'mie-deck-reveal mt-8 inline-flex items-baseline gap-3 rounded-2xl border px-5 py-3',
              a.soft,
              a.border
            )}
          >
            <span className={cn('text-4xl font-bold', a.text)}>
              <CountUp value={slide.callout.value} />
            </span>
            <span className="text-sm">{slide.callout.label}</span>
          </div>
        )}
        {slide.talkingPoint && (
          <p className={cn('mt-6 text-sm italic', tone.muted)}>
            &ldquo;{slide.talkingPoint}&rdquo;
          </p>
        )}
        {slide.pullQuote && (
          <blockquote
            className={cn(
              'mt-6 border-s-2 ps-4 text-lg font-semibold',
              a.border
            )}
          >
            {slide.pullQuote}
          </blockquote>
        )}
      </div>
      <div {...reveal(3)} className="mie-deck-reveal flex flex-col gap-8">
        {slide.series && <Graphic graphic={slide.series} />}
        {slide.breakdown && slide.breakdown.length > 0 && (
          <ul className="space-y-2">
            {slide.breakdown.map((b) => (
              <li key={b.label} className="flex items-center gap-3 text-sm">
                <span className="w-36 flex-none truncate">{b.label}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-2 flex-1 overflow-hidden rounded-full',
                    tone.isLight ? 'bg-neutral-200' : 'bg-white/10'
                  )}
                >
                  <span
                    className={cn('block h-full rounded-full', a.fill)}
                    style={{ width: `${(b.count / total) * 100}%` }}
                  />
                </span>
                <span className="w-10 flex-none text-end font-semibold tabular-nums">
                  {b.count}
                </span>
              </li>
            ))}
          </ul>
        )}
        {slide.entries && slide.entries.length > 0 && (
          <ul
            className={cn(
              'max-h-64 divide-y overflow-y-auto rounded-xl border',
              tone.hairline,
              tone.card
            )}
          >
            {slide.entries.map((e) => (
              <li
                key={`${e.title}-${e.date ?? ''}`}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-2 text-sm',
                  tone.hairline
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{e.title}</span>
                  {e.meta && (
                    <span className={cn('block truncate text-xs', tone.muted)}>
                      {e.meta}
                    </span>
                  )}
                </span>
                {e.date && (
                  <span
                    className={cn('flex-none text-xs tabular-nums', tone.muted)}
                  >
                    {e.date}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- tabs ----------------------------------------------------------------------

export function TabsRenderer({ slide, index }: SlideRendererProps<TabsSlide>) {
  const [active, setActive] = React.useState(0);
  const baseId = React.useId();
  const tabs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const current = slide.tabs[active]?.slide;
  const onKey = (e: React.KeyboardEvent) => {
    const n = slide.tabs.length;
    // Horizontal arrows follow the visual direction (invert under RTL).
    let key = e.key;
    if (isRtl(e.currentTarget)) {
      if (key === 'ArrowRight') key = 'ArrowLeft';
      else if (key === 'ArrowLeft') key = 'ArrowRight';
    }
    const next =
      key === 'ArrowRight'
        ? (active + 1) % n
        : key === 'ArrowLeft'
          ? (active - 1 + n) % n
          : key === 'Home'
            ? 0
            : key === 'End'
              ? n - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation();
    setActive(next);
    tabs.current[next]?.focus();
  };
  return (
    <SlideFrame slide={slide} index={index} tone="deep">
      <SlideHeader eyebrow={slide.eyebrow} title={slide.title} />
      <div
        role="tablist"
        aria-label={slide.title}
        className="mt-6 flex flex-wrap gap-2"
      >
        {slide.tabs.map((tab, i) => (
          <TabButton
            key={tab.label}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            id={`${baseId}-tab-${i}`}
            panelId={`${baseId}-panel`}
            selected={i === active}
            icon={tab.icon}
            onClick={() => setActive(i)}
            onKeyDown={onKey}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        className="mt-8"
      >
        {current?.type === 'metrics' && <MetricsBody slide={current} />}
        {current?.type === 'chart' && <ChartBody slide={current} />}
        {current?.type === 'feature-highlight' && (
          <FeatureHighlightBody slide={current} />
        )}
        {current?.type === 'cards' && <CardsBody slide={current} />}
        {current?.type === 'ranked-list' && <RankedListBody slide={current} />}
      </div>
    </SlideFrame>
  );
}

const TabButton = React.forwardRef<
  HTMLButtonElement,
  {
    id: string;
    panelId: string;
    selected: boolean;
    icon?: string;
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    children: React.ReactNode;
  }
>(({ id, panelId, selected, icon, onClick, onKeyDown, children }, ref) => {
  const tone = useTone();
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
        selected
          ? tone.isLight
            ? 'border-neutral-900 bg-neutral-900 text-white'
            : 'border-white bg-white text-neutral-900'
          : cn(
              tone.hairline,
              tone.muted,
              tone.isLight ? 'hover:bg-neutral-100' : 'hover:bg-white/10'
            )
      )}
    >
      {icon && <DeckIcon name={icon} className="size-4" />}
      {children}
    </button>
  );
});
TabButton.displayName = 'TabButton';
