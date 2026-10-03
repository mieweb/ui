import * as React from 'react';
import { cn } from '../../../utils/cn';
import { TemplateImg } from '../../../templates/Section';
import { useDeck, useTone } from '../DeckContext';
import {
  Card,
  DeckIcon,
  Eyebrow,
  IconChip,
  SlideHeader,
  SlideTitle,
  SourceLink,
  reveal,
} from '../primitives';
import { SlideFrame } from '../SlideFrame';
import { ACCENT_CYCLE, accent, toneOf } from '../tones';
import type {
  AdoptionCurveSlide,
  CycleSlide,
  DiagramSlide,
  RoadmapSlide,
  SlideRendererProps,
} from '../types';

// --- cycle ---------------------------------------------------------------------

export function CycleRenderer({
  slide,
  index,
}: SlideRendererProps<CycleSlide>) {
  const tone = toneOf(slide, 'deep');
  const n = slide.nodes.length;
  return (
    <SlideFrame slide={slide} index={index} tone="deep">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          {slide.eyebrow && <Eyebrow>{slide.eyebrow}</Eyebrow>}
          <SlideTitle>{slide.title}</SlideTitle>
          {slide.body && (
            <p
              {...reveal(2)}
              className={cn(
                'mie-deck-reveal mt-6 text-lg leading-relaxed',
                tone.muted
              )}
            >
              {slide.body}
            </p>
          )}
          {slide.talkingPoint && (
            <p className={cn('mt-6 italic', tone.muted)}>
              &ldquo;{slide.talkingPoint}&rdquo;
            </p>
          )}
        </div>
        <CycleWheel nodes={slide.nodes} n={n} />
      </div>
    </SlideFrame>
  );
}

function CycleWheel({ nodes, n }: { nodes: CycleSlide['nodes']; n: number }) {
  const tone = useTone();
  const a = accent('accent', tone.isLight);
  return (
    <ol
      {...reveal(3)}
      className="mie-deck-reveal relative mx-auto aspect-square w-64 sm:w-80 md:w-96"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="mie-deck-spin absolute inset-0 size-full"
      >
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          strokeWidth="2"
          className={tone.isLight ? 'stroke-neutral-200' : 'stroke-white/10'}
        />
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          strokeWidth="2"
          strokeDasharray="50 200"
          strokeLinecap="round"
          className={a.svgStroke}
        />
        {nodes.map((_, i) => (
          <polygon
            key={i}
            points="200,47 207,60 193,60"
            transform={`rotate(${(360 / n) * i + 180 / n} 200 200)`}
            className={a.svgFill}
            opacity={0.8}
          />
        ))}
      </svg>
      {nodes.map((node, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        return (
          <li
            key={node.label}
            className={cn(
              'absolute z-10 w-28 -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-center shadow-lg backdrop-blur sm:w-32',
              tone.hairline,
              tone.isLight ? 'bg-white' : 'bg-neutral-900/90'
            )}
            style={{
              left: `${50 + 37.5 * Math.cos(angle)}%`,
              top: `${50 + 37.5 * Math.sin(angle)}%`,
            }}
          >
            {node.icon && (
              <DeckIcon
                name={node.icon}
                className={cn('mx-auto mb-1 size-4', a.text)}
              />
            )}
            <p className="text-xs font-bold sm:text-sm">{node.label}</p>
            {node.metric && (
              <p className={cn('text-sm font-bold sm:text-lg', a.text)}>
                {node.metric}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// --- roadmap -------------------------------------------------------------------

export function RoadmapRenderer({
  slide,
  index,
}: SlideRendererProps<RoadmapSlide>) {
  const { labels } = useDeck();
  const tone = toneOf(slide, 'ink');
  const a = accent('accent', tone.isLight);
  const status = {
    now: labels.statusNow,
    next: labels.statusNext,
    later: labels.statusLater,
  };
  const statusTag = {
    now: cn(a.soft, a.border, a.text),
    next: cn(
      accent('primary', tone.isLight).soft,
      accent('primary', tone.isLight).border,
      accent('primary', tone.isLight).text
    ),
    later: cn(tone.hairline, tone.muted),
  };
  return (
    <SlideFrame slide={slide} index={index} tone="ink">
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <ol
        className={cn(
          'relative mt-10 flex flex-col gap-6 border-s ps-8',
          a.border
        )}
      >
        {slide.items.map((item, i) => {
          const r = reveal(3 + i);
          return (
            <li
              key={item.title}
              className={cn(r.className, 'relative')}
              style={r.style}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute -start-[2.35rem] top-1.5 flex size-4 items-center justify-center rounded-full border-2',
                  a.border,
                  tone.isLight ? 'bg-white' : 'bg-neutral-950'
                )}
              >
                <span className={cn('size-1.5 rounded-full', a.fill)} />
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {item.icon && (
                  <IconChip
                    icon={item.icon}
                    accent={item.status === 'later' ? 'primary' : 'accent'}
                  />
                )}
                <h3 className="text-lg font-semibold sm:text-xl">
                  {item.title}
                </h3>
                {item.status && (
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase',
                      statusTag[item.status]
                    )}
                  >
                    {status[item.status]}
                  </span>
                )}
              </div>
              {item.children && item.children.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5">
                  {item.children.map((child) => (
                    <li
                      key={child}
                      className={cn(
                        'flex items-center gap-2 text-sm',
                        tone.muted
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="size-1 rounded-full bg-current"
                      />
                      {child}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </SlideFrame>
  );
}

// --- adoption curve --------------------------------------------------------------

const BASE = 50;
const PEAK = 6;
const SIGMA = 15;
const gaussY = (x: number) =>
  BASE - (BASE - PEAK) * Math.exp(-((x - 50) ** 2) / (2 * SIGMA * SIGMA));

export function AdoptionCurveRenderer({
  slide,
  index,
}: SlideRendererProps<AdoptionCurveSlide>) {
  const tone = toneOf(slide, 'ink');
  const clipId = React.useId();
  const pts: string[] = [];
  for (let x = 0; x <= 100; x += 1.5) pts.push(`${x},${gaussY(x).toFixed(2)}`);
  const area = `M 0,${BASE} L ${pts.join(' L ')} L 100,${BASE} Z`;
  const values = slide.segments.map((s) => parseFloat(s.pct) || 0);
  const sum = values.reduce((x, y) => x + y, 0) || 1;
  const widths = values.map((v) => (v / sum) * 100);
  const bands = slide.segments.map((s, i) => ({
    ...s,
    x0: widths.slice(0, i).reduce((x, y) => x + y, 0),
    w: widths[i],
    spec: accent(
      s.accent ?? ACCENT_CYCLE[i % ACCENT_CYCLE.length],
      tone.isLight
    ),
  }));
  const hi = accent('accent', tone.isLight);
  return (
    <SlideFrame slide={slide} index={index} tone="ink" width="lg">
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <div {...reveal(3)} className="mie-deck-reveal relative mt-8 pb-10">
        {slide.annotations?.map((note) => (
          <span
            key={note.text}
            className={cn(
              'absolute z-20 w-40 max-w-[42vw] -translate-x-1/2 rounded-lg border px-3 py-1.5 text-center text-xs leading-snug font-semibold',
              note.emphasis
                ? cn(hi.soft, hi.border, hi.text)
                : cn(tone.hairline, tone.card)
            )}
            style={{
              left: `${note.atPct}%`,
              [note.side === 'bottom' ? 'bottom' : 'top']: 0,
            }}
          >
            {note.text}
          </span>
        ))}
        <div className="h-[clamp(180px,30vh,300px)] w-full">
          <svg
            viewBox="0 0 100 56"
            preserveAspectRatio="none"
            className="size-full overflow-visible"
            role="img"
            aria-label={slide.segments
              .map((s) => `${s.label} ${s.pct}`)
              .join(', ')}
          >
            <defs>
              <clipPath id={clipId}>
                <path d={area} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              {bands.map((b) => (
                <rect
                  key={b.label}
                  x={b.x0}
                  y={0}
                  width={b.w}
                  height={BASE}
                  className={b.spec.svgFill}
                  opacity={0.8}
                />
              ))}
            </g>
            <path
              d={`M ${pts.join(' L ')}`}
              fill="none"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className={tone.isLight ? 'stroke-neutral-900' : 'stroke-white'}
            />
            <line
              x1={0}
              y1={BASE}
              x2={100}
              y2={BASE}
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
              className={
                tone.isLight ? 'stroke-neutral-400' : 'stroke-white/25'
              }
            />
          </svg>
        </div>
        <div aria-hidden="true" className="mt-2 flex w-full">
          {bands.map((b) => (
            <div
              key={b.label}
              className="min-w-0 px-1 text-center"
              style={{ flexBasis: `${b.w}%` }}
            >
              <div
                className={cn('text-sm font-bold sm:text-base', b.spec.text)}
              >
                {b.pct}
              </div>
              <div
                className={cn(
                  'truncate text-[0.7rem] tracking-wide uppercase sm:text-xs',
                  tone.muted
                )}
              >
                {b.label}
              </div>
            </div>
          ))}
        </div>
        {slide.marker && (
          <div
            className="absolute bottom-0 z-20 -translate-x-1/2 text-center"
            style={{ left: `${slide.marker.atPct}%` }}
          >
            <div
              aria-hidden="true"
              className={cn('mx-auto h-4 w-px', hi.fill)}
            />
            <span
              className={cn(
                'mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase',
                hi.soft,
                hi.border,
                hi.text
              )}
            >
              {slide.marker.label}
            </span>
          </div>
        )}
      </div>
      {slide.source && <SourceLink source={slide.source} className="mt-4" />}
    </SlideFrame>
  );
}

// --- architecture diagram ----------------------------------------------------------

export function DiagramRenderer({
  slide,
  index,
}: SlideRendererProps<DiagramSlide>) {
  const { components } = useDeck();
  const tone = toneOf(slide, 'deep');
  const center = new Map(slide.nodes.map((n) => [n.id, n]));
  const left = slide.callouts?.filter((c) => c.side === 'left') ?? [];
  const right = slide.callouts?.filter((c) => c.side === 'right') ?? [];
  const cols =
    left.length && right.length
      ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)_minmax(0,1fr)]'
      : right.length
        ? 'lg:grid-cols-[minmax(0,2.7fr)_minmax(0,1.25fr)]'
        : left.length
          ? 'lg:grid-cols-[minmax(0,1.25fr)_minmax(0,2.7fr)]'
          : '';
  const stageBg = tone.isLight ? 'bg-white' : 'bg-neutral-900';
  return (
    <SlideFrame slide={slide} index={index} tone="deep">
      <SlideHeader
        eyebrow={slide.eyebrow}
        title={slide.title}
        subtitle={slide.subtitle}
      />
      <div className={cn('mt-8', cols && cn('grid items-center gap-6', cols))}>
        {left.length > 0 && <Callouts callouts={left} end />}
        <div
          {...reveal(3)}
          className="mie-deck-reveal relative mx-auto h-[clamp(260px,40vh,440px)] w-full max-w-3xl"
        >
          {slide.boundaries?.map((b) => {
            const xs = b.nodes.map((id) => center.get(id)?.x ?? 50);
            const ys = b.nodes.map((id) => center.get(id)?.y ?? 50);
            const l = Math.min(...xs) - 13;
            const t = Math.min(...ys) - 17;
            const spec = accent(b.accent ?? 'primary', tone.isLight);
            return (
              <div
                key={b.label}
                className={cn(
                  'absolute rounded-2xl border border-dashed',
                  tone.hairline
                )}
                style={{
                  left: `${l}%`,
                  top: `${t}%`,
                  width: `${Math.max(...xs) + 13 - l}%`,
                  height: `${Math.max(...ys) + 17 - t}%`,
                }}
              >
                <span
                  className={cn(
                    'absolute start-4 -top-3 rounded-full border px-2.5 py-0.5 text-[0.6rem] font-semibold tracking-wide uppercase',
                    stageBg,
                    spec.border,
                    spec.text
                  )}
                >
                  {b.label}
                </span>
              </div>
            );
          })}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full"
          >
            {slide.edges.map((e) => {
              const a = center.get(e.from);
              const b = center.get(e.to);
              if (!a || !b) return null;
              return (
                <line
                  key={`${e.from}-${e.to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  strokeWidth={1.2}
                  strokeDasharray={e.dashed ? '4 3' : undefined}
                  vectorEffect="non-scaling-stroke"
                  className={
                    e.accent
                      ? accent(e.accent, tone.isLight).svgStroke
                      : tone.isLight
                        ? 'stroke-neutral-400'
                        : 'stroke-white/30'
                  }
                />
              );
            })}
          </svg>
          {slide.edges.map((e, i) => {
            const a = center.get(e.from);
            const b = center.get(e.to);
            if (!a || !b || !e.flow) return null;
            return (
              <span
                key={`flow-${e.from}-${e.to}`}
                aria-hidden="true"
                className={cn(
                  'mie-deck-flow absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full',
                  accent(e.accent ?? 'accent', tone.isLight).fill
                )}
                style={
                  {
                    '--mie-from-x': `${a.x}%`,
                    '--mie-from-y': `${a.y}%`,
                    '--mie-to-x': `${b.x}%`,
                    '--mie-to-y': `${b.y}%`,
                    animationDelay: `${i * 0.5}s`,
                  } as React.CSSProperties
                }
              />
            );
          })}
          {slide.edges.map((e) => {
            const a = center.get(e.from);
            const b = center.get(e.to);
            if (!a || !b || !e.label) return null;
            const at = e.labelAt ?? 0.5;
            return (
              <span
                key={`label-${e.from}-${e.to}`}
                className={cn(
                  'absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[0.6rem] font-medium whitespace-nowrap',
                  stageBg,
                  tone.hairline,
                  tone.muted
                )}
                style={{
                  left: `${a.x + (b.x - a.x) * at}%`,
                  top: `${a.y + (b.y - a.y) * at}%`,
                }}
              >
                {e.label}
              </span>
            );
          })}
          {slide.nodes.map((node) => {
            const spec = accent(node.accent ?? 'primary', tone.isLight);
            return (
              <div
                key={node.id}
                className="absolute z-[5] -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  width: `${node.w ?? 20}%`,
                }}
              >
                <div
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center shadow-lg',
                    stageBg,
                    spec.border
                  )}
                >
                  {node.image ? (
                    <TemplateImg
                      {...node.image}
                      components={components}
                      className="h-7 w-auto object-contain sm:h-9"
                    />
                  ) : (
                    node.icon && (
                      <DeckIcon
                        name={node.icon}
                        className={cn('size-5 sm:size-6', spec.text)}
                      />
                    )
                  )}
                  <span className="text-[0.62rem] leading-tight font-semibold sm:text-xs">
                    {node.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {right.length > 0 && <Callouts callouts={right} />}
      </div>
    </SlideFrame>
  );
}

function Callouts({
  callouts,
  end,
}: {
  callouts: NonNullable<DiagramSlide['callouts']>;
  end?: boolean;
}) {
  const tone = useTone();
  const a = accent('accent', tone.isLight);
  return (
    <div className={cn('flex flex-col gap-4', end && 'lg:text-end')}>
      {callouts.map((c, i) => (
        <Card key={c.text} i={4 + i} className="p-4">
          {c.lead && (
            <div className={cn('text-sm font-bold', a.text)}>{c.lead}</div>
          )}
          <p className={cn('mt-1 text-sm leading-snug', tone.muted)}>
            {c.text}
          </p>
        </Card>
      ))}
    </div>
  );
}
