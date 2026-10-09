import * as React from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDeck, useTone } from './DeckContext';
import { reveal } from './primitives';
import { ACCENT_CYCLE, accent as accentSpec } from './tones';
import type {
  BarGraphic,
  DeckGraphic,
  HorizontalBarGraphic,
  KpiRowGraphic,
  MultiLineGraphic,
  SparkGraphic,
} from './types';

/** Screen-reader copy of a chart's numbers; the drawing itself is decorative. */
function ChartTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((h, i) =>
            h ? (
              <th key={i} scope="col">
                {h}
              </th>
            ) : (
              // The row-label corner cell has no caption of its own.
              <td key={i} />
            )
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) =>
              c === 0 ? (
                <th key={c} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={c}>{cell}</td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function useFormat() {
  const { locale } = useDeck();
  return React.useMemo(
    () => new Intl.NumberFormat(locale, { notation: 'compact' }),
    [locale]
  );
}

export function BarChart({ graphic }: { graphic: BarGraphic }) {
  const tone = useTone();
  const format = useFormat();
  const max = Math.max(1, ...graphic.bars.map((b) => b.value));
  const hi = accentSpec('accent', tone.isLight);
  return (
    <figure data-slot="deck-bar-chart" className="w-full">
      <div aria-hidden="true" className="flex h-56 items-end gap-2 sm:h-64">
        {graphic.bars.map((bar, i) => (
          <React.Fragment key={bar.label}>
            {graphic.marker?.atIndex === i && (
              <div className="relative h-full w-px flex-none border-s border-dashed border-current opacity-40">
                <span className="absolute start-1/2 -top-6 -translate-x-1/2 text-[0.65rem] font-semibold tracking-wide whitespace-nowrap uppercase opacity-100">
                  {graphic.marker.label}
                </span>
              </div>
            )}
            <div className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
              {/* Bars share one track height, so labels align regardless of value. */}
              <div className="w-full flex-1 pt-5">
                <div className="relative h-full">
                  <div
                    className={cn(
                      'mie-deck-grow absolute inset-x-0 bottom-0 rounded-t-md',
                      bar.highlight
                        ? hi.fill
                        : tone.isLight
                          ? 'bg-neutral-300'
                          : 'bg-white/25'
                    )}
                    style={
                      {
                        height: `${(bar.value / max) * 100}%`,
                        '--mie-reveal-i': i,
                      } as React.CSSProperties
                    }
                  >
                    <span
                      className={cn(
                        'absolute inset-x-0 bottom-full mb-1 text-center text-xs font-semibold tabular-nums',
                        tone.muted
                      )}
                    >
                      {format.format(bar.value)}
                    </span>
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  'w-full truncate text-center text-xs',
                  tone.muted
                )}
              >
                {bar.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
      {graphic.yAxisLabel && (
        <figcaption className={cn('mt-2 text-xs', tone.muted)}>
          {graphic.yAxisLabel}
        </figcaption>
      )}
      <ChartTable
        caption={graphic.yAxisLabel ?? 'Values'}
        headers={['', graphic.yAxisLabel ?? 'Value']}
        rows={graphic.bars.map((b) => [b.label, b.value])}
      />
    </figure>
  );
}

export function HorizontalBars({ graphic }: { graphic: HorizontalBarGraphic }) {
  const tone = useTone();
  const format = useFormat();
  const max = Math.max(1, ...graphic.bars.map((b) => b.value));
  const a = accentSpec('accent', tone.isLight);
  return (
    <ul data-slot="deck-horizontal-bars" className="w-full space-y-3">
      {graphic.bars.map((bar, i) => {
        const r = reveal(3 + i);
        return (
          <li key={bar.label} className={r.className} style={r.style}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="truncate">{bar.label}</span>
              <span className="font-semibold tabular-nums">
                {bar.display ?? format.format(bar.value)}
              </span>
            </div>
            <div
              aria-hidden="true"
              className={cn(
                'h-2 overflow-hidden rounded-full',
                tone.isLight ? 'bg-neutral-200' : 'bg-white/10'
              )}
            >
              <div
                className={cn('h-full rounded-full', a.fill)}
                style={{ width: `${(bar.value / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function KpiRow({ graphic }: { graphic: KpiRowGraphic }) {
  const tone = useTone();
  return (
    <dl
      data-slot="deck-kpi-row"
      className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4"
    >
      {graphic.kpis.map((kpi, i) => {
        const Trend =
          kpi.trend === 'up'
            ? TrendingUp
            : kpi.trend === 'down'
              ? TrendingDown
              : Minus;
        const r = reveal(3 + i);
        return (
          <div
            key={kpi.label}
            className={cn(
              r.className,
              'flex flex-col-reverse rounded-xl border p-4',
              tone.card,
              tone.hairline
            )}
            style={r.style}
          >
            <dt className={cn('text-xs', tone.muted)}>{kpi.label}</dt>
            <dd className="flex items-center gap-2 text-2xl font-bold tabular-nums">
              {kpi.value}
              {kpi.trend && (
                <Trend
                  aria-hidden="true"
                  className={cn(
                    'size-4',
                    kpi.trend === 'up'
                      ? 'text-success'
                      : kpi.trend === 'down'
                        ? 'text-destructive'
                        : tone.muted
                  )}
                />
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function points(
  values: number[],
  w: number,
  h: number,
  y: (v: number) => number
) {
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  return values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - y(v) * h).toFixed(1)}`)
    .join(' ');
}

export function Spark({ graphic }: { graphic: SparkGraphic }) {
  const tone = useTone();
  const a = accentSpec('accent', tone.isLight);
  const max = Math.max(1, ...graphic.values);
  const last = graphic.values[graphic.values.length - 1];
  return (
    <figure data-slot="deck-spark" className="w-full">
      <figcaption
        className={cn(
          'flex items-baseline justify-between text-sm',
          tone.muted
        )}
      >
        <span>{graphic.label}</span>
        <span className={cn('text-2xl font-bold tabular-nums', a.text)}>
          {last}
          {graphic.suffix}
        </span>
      </figcaption>
      <svg
        aria-hidden="true"
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
        className="mt-2 h-12 w-full overflow-visible"
      >
        <polyline
          points={points(graphic.values, 100, 30, (v) => v / max)}
          fill="none"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          className={a.svgStroke}
        />
      </svg>
      <ChartTable
        caption={graphic.label}
        headers={['#', graphic.label]}
        rows={graphic.values.map((v, i) => [i + 1, v])}
      />
    </figure>
  );
}

export function MultiLine({ graphic }: { graphic: MultiLineGraphic }) {
  const tone = useTone();
  const { labels } = useDeck();
  const format = useFormat();
  const [view, setView] = React.useState<'lines' | 'bars'>('lines');
  const all = graphic.series.flatMap((s) => s.values);
  const log = (graphic.scale ?? 'log') === 'log';
  const tx = (v: number) => (log ? Math.log10(Math.max(1, v)) : v);
  const lo = Math.min(...all.map(tx));
  const hi = Math.max(...all.map(tx));
  const y = (v: number) => (hi === lo ? 0.5 : (tx(v) - lo) / (hi - lo));
  const colours = graphic.series.map((_, i) =>
    accentSpec(ACCENT_CYCLE[i % ACCENT_CYCLE.length], tone.isLight)
  );
  const toggle = (active: boolean) =>
    cn(
      'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
      active
        ? tone.isLight
          ? 'bg-neutral-900 text-white'
          : 'bg-white text-neutral-900'
        : cn(tone.muted, 'hover:opacity-100')
    );
  return (
    <figure data-slot="deck-multi-line" className="w-full">
      <div
        role="group"
        aria-label={graphic.caption}
        className="mb-3 flex gap-1"
      >
        <button
          type="button"
          aria-pressed={view === 'lines'}
          className={toggle(view === 'lines')}
          onClick={() => setView('lines')}
        >
          {labels.lines}
        </button>
        <button
          type="button"
          aria-pressed={view === 'bars'}
          className={toggle(view === 'bars')}
          onClick={() => setView('bars')}
        >
          {labels.bars}
        </button>
      </div>
      {view === 'lines' ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
          className="h-56 w-full overflow-visible"
        >
          {graphic.series.map((s, i) => (
            <polyline
              key={s.label}
              points={points(s.values, 100, 50, y)}
              fill="none"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={colours[i].svgStroke}
            />
          ))}
        </svg>
      ) : (
        <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
          {graphic.series.map((s, i) => {
            const max = Math.max(1, ...s.values);
            return (
              <div key={s.label}>
                <p
                  className={cn('mb-1 text-xs font-semibold', colours[i].text)}
                >
                  {s.label}
                </p>
                <div className="flex h-20 items-end gap-1">
                  {s.values.map((v, j) => (
                    <div
                      key={j}
                      className={cn('flex-1 rounded-t-sm', colours[i].fill)}
                      style={{ height: `${(v / max) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div
        aria-hidden="true"
        className={cn('mt-2 flex justify-between text-xs', tone.muted)}
      >
        {graphic.xLabels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {graphic.series.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn('size-2.5 rounded-full', colours[i].fill)}
            />
            <span className="font-medium">{s.label}</span>
            {s.summary && <span className={tone.muted}>{s.summary}</span>}
          </li>
        ))}
      </ul>
      {graphic.caption && (
        <figcaption className={cn('mt-2 text-xs', tone.muted)}>
          {graphic.caption}
        </figcaption>
      )}
      <ChartTable
        caption={
          graphic.caption ?? graphic.series.map((s) => s.label).join(', ')
        }
        headers={['', ...graphic.series.map((s) => s.label)]}
        rows={graphic.xLabels.map((x, i) => [
          x,
          ...graphic.series.map((s) => format.format(s.values[i] ?? 0)),
        ])}
      />
    </figure>
  );
}

/** Renders any `DeckGraphic`; `custom` graphics come from `Deck`'s `graphics` map. */
export function Graphic({ graphic }: { graphic: DeckGraphic }) {
  const { graphics } = useDeck();
  switch (graphic.type) {
    case 'bar':
      return <BarChart graphic={graphic} />;
    case 'horizontal-bar':
      return <HorizontalBars graphic={graphic} />;
    case 'multi-line':
      return <MultiLine graphic={graphic} />;
    case 'kpi-row':
      return <KpiRow graphic={graphic} />;
    case 'spark':
      return <Spark graphic={graphic} />;
    case 'custom': {
      const Custom = graphics?.[graphic.component];
      return Custom ? <Custom {...graphic.props} /> : null;
    }
  }
}
