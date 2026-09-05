'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

/** How an item lives in the year. */
export type YearTimelineCadence = 'scheduled' | 'continuous' | 'event';

export type YearTimelineTone =
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral';

export interface YearTimelineItem {
  id: string;
  /** Row title. */
  label: string;
  /** Supporting copy under the title. */
  detail?: string;
  /**
   * Eyebrow above the title, e.g. "Jan–Feb" or "Year-round". Defaults to the
   * formatted month window for scheduled items.
   */
  period?: string;
  /** Months (1–12) the item occupies. Drives the bar span and the live marker. */
  months?: number[];
  /**
   * `scheduled` bars span `months`; `continuous` and `event` run full-width in
   * their own lanes. Defaults to `scheduled` when `months` is set, else
   * `continuous`.
   */
  cadence?: YearTimelineCadence;
  /** Bar colour family. Default cycles through the tones. */
  tone?: YearTimelineTone;
  /** Any two CSS colours for a custom bar gradient — overrides `tone`. */
  colors?: [string, string];
  /** Small icon before the eyebrow (Lucide, 13px). */
  icon?: React.ReactNode;
  /** Makes the row title a link. */
  href?: string;
}

export interface YearTimelineProps {
  items: YearTimelineItem[];
  /**
   * Which month (1–12) or date the playhead marks. Default: the viewer's
   * current month, resolved after mount. Pass `null` to hide the marker.
   */
  today?: Date | number | null;
  /** Column heading over the row labels. Default "Obligation". */
  labelHeading?: string;
  /** Twelve month tick labels. Default single letters. */
  monthLabels?: readonly string[];
  /** Twelve short month names used in period fallbacks and bar captions. */
  monthNames?: readonly string[];
  /** Lane headings by cadence. */
  groupLabels?: Partial<Record<YearTimelineCadence, string>>;
  /** Copy for the live marker and row badges. */
  labels?: { today?: string; now?: string; upNext?: string };
  /** Highlight the item happening now (or coming up next). Default true. */
  highlightCurrent?: boolean;
  /** Width of the label column. Default `300px`. */
  labelWidth?: string;
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

export const MONTH_LETTERS = [
  'J',
  'F',
  'M',
  'A',
  'M',
  'J',
  'J',
  'A',
  'S',
  'O',
  'N',
  'D',
] as const;
export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const TONES: YearTimelineTone[] = [
  'primary',
  'accent',
  'info',
  'success',
  'warning',
  'neutral',
];

const TONE_COLORS: Record<YearTimelineTone, [string, string]> = {
  primary: ['var(--mieweb-primary-600)', 'var(--mieweb-primary-400)'],
  accent: [
    'var(--mieweb-accent, var(--mieweb-primary-500))',
    'var(--mieweb-accent-light, var(--mieweb-primary-300))',
  ],
  success: [
    'var(--mieweb-success)',
    'color-mix(in srgb, var(--mieweb-success) 60%, #fff)',
  ],
  warning: [
    'var(--mieweb-warning)',
    'color-mix(in srgb, var(--mieweb-warning) 60%, #fff)',
  ],
  info: [
    'var(--mieweb-info, var(--mieweb-primary-400))',
    'color-mix(in srgb, var(--mieweb-info, var(--mieweb-primary-400)) 60%, #fff)',
  ],
  neutral: ['var(--mieweb-neutral-500)', 'var(--mieweb-neutral-400)'],
};

const GROUP_TEXT: Record<YearTimelineCadence, string> = {
  scheduled: 'text-primary-700 dark:text-primary-300',
  continuous: 'text-success',
  event: 'text-muted-foreground',
};

function cadenceOf(item: YearTimelineItem): YearTimelineCadence {
  return item.cadence ?? (item.months?.length ? 'scheduled' : 'continuous');
}

function windowOf(
  item: YearTimelineItem
): { start: number; end: number } | null {
  if (!item.months?.length) return null;
  return { start: Math.min(...item.months), end: Math.max(...item.months) };
}

function formatWindow(
  item: YearTimelineItem,
  names: readonly string[]
): string | null {
  const w = windowOf(item);
  if (!w) return null;
  return w.start === w.end
    ? names[w.start - 1]
    : `${names[w.start - 1]}–${names[w.end - 1]}`;
}

/** Item in `month`, else the next one coming up (wrapping the year). */
export function resolveCurrent(
  items: YearTimelineItem[],
  month: number
): { id: string; live: boolean } | null {
  const live = items.find((it) => it.months?.includes(month));
  if (live) return { id: live.id, live: true };
  let best: YearTimelineItem | null = null;
  let bestDelta = 99;
  for (const it of items) {
    if (!it.months?.length) continue;
    const delta = (Math.min(...it.months) - month + 12) % 12;
    if (delta > 0 && delta < bestDelta) {
      bestDelta = delta;
      best = it;
    }
  }
  return best ? { id: best.id, live: false } : null;
}

function toMonth(today: Date | number): number {
  return typeof today === 'number' ? today : today.getMonth() + 1;
}

// =============================================================================
// YearTimeline
// =============================================================================

/**
 * A year on one Gantt-style timeline: twelve month columns, rows grouped by
 * cadence (scheduled windows as gradient pill bars; continuous and
 * event-driven items in full-width lanes), month gridlines, and a live
 * playhead + "Today" pill marking the current month. The item happening now
 * (or up next) is highlighted. Ported from the Enterprise Health compliance
 * calendar; fits any recurring annual schedule — audits, filings, campaigns,
 * maintenance.
 *
 * Collapses to stacked rows without the month scale below `md`.
 */
export function YearTimeline({
  items,
  today,
  labelHeading = 'Obligation',
  monthLabels = MONTH_LETTERS,
  monthNames = MONTH_NAMES,
  groupLabels,
  labels,
  highlightCurrent = true,
  labelWidth = '300px',
  className,
}: YearTimelineProps) {
  // The viewer's clock is only known after mount (SSR-safe).
  const [mountedMonth, setMountedMonth] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (today === undefined) setMountedMonth(new Date().getMonth() + 1);
  }, [today]);

  const month =
    today === null ? null : today === undefined ? mountedMonth : toMonth(today);
  const current =
    month != null && highlightCurrent ? resolveCurrent(items, month) : null;
  const nowFraction = month != null ? (month - 0.5) / 12 : null;

  const groupTitle: Record<YearTimelineCadence, string> = {
    scheduled: groupLabels?.scheduled ?? 'On the calendar',
    continuous: groupLabels?.continuous ?? 'Runs all year',
    event: groupLabels?.event ?? 'As it happens',
  };
  const text = { today: 'Today', now: 'Now', upNext: 'Up next', ...labels };

  const groups = (['scheduled', 'continuous', 'event'] as const)
    .map((key) => ({
      key,
      items: items
        .filter((it) => cadenceOf(it) === key)
        .sort(
          (a, b) => (windowOf(a)?.start ?? 13) - (windowOf(b)?.start ?? 13)
        ),
    }))
    .filter((g) => g.items.length > 0);

  let toneIndex = 0;

  return (
    <div
      data-slot="year-timeline"
      style={
        {
          '--yt-label': labelWidth,
          '--yt-now': nowFraction ?? undefined,
        } as React.CSSProperties
      }
      className={cn(
        'border-border bg-card text-card-foreground relative overflow-hidden rounded-xl border shadow-md',
        // year ribbon
        'before:absolute before:inset-x-0 before:top-0 before:z-[4] before:h-1 before:content-[""]',
        'before:[background:linear-gradient(90deg,var(--mieweb-accent,var(--mieweb-primary-400))_0%,var(--mieweb-primary-500)_50%,var(--mieweb-success)_80%,var(--mieweb-accent,var(--mieweb-primary-400))_100%)]',
        className
      )}
    >
      {/* Head: label heading + month scale */}
      <div className="border-border bg-muted/50 hidden border-b md:grid md:grid-cols-[var(--yt-label)_1fr]">
        <div className="border-border flex items-end border-e px-5 pt-3 pb-2.5">
          <span className="text-muted-foreground text-[10px] font-bold tracking-[0.11em] uppercase">
            {labelHeading}
          </span>
        </div>
        <div className="relative grid grid-cols-12">
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className={cn(
                'text-muted-foreground pt-3 pb-2.5 text-center text-[11px] font-bold tracking-wide',
                i > 0 && 'border-border/60 border-s'
              )}
            >
              {m}
            </span>
          ))}
          {nowFraction != null && (
            <span
              data-slot="year-timeline-today"
              style={{ left: `calc(var(--yt-now) * 100%)` }}
              className="bg-primary-700 absolute top-1.5 z-[5] inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[0.09em] whitespace-nowrap text-white uppercase"
            >
              <i aria-hidden className="h-1.5 w-1.5 rounded-full bg-white" />
              {text.today}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative">
        {/* month gridlines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 end-0 z-0 hidden md:block"
          style={{
            left: 'var(--yt-label)',
            backgroundImage:
              'repeating-linear-gradient(90deg, var(--mieweb-border) 0, var(--mieweb-border) 1px, transparent 1px, transparent calc(100% / 12))',
            opacity: 0.5,
          }}
        />
        {nowFraction != null && (
          <span
            aria-hidden
            data-slot="year-timeline-playhead"
            style={{
              left: 'calc(var(--yt-label) + (100% - var(--yt-label)) * var(--yt-now))',
            }}
            className={cn(
              'pointer-events-none absolute inset-y-0 z-[3] hidden w-0.5 -translate-x-px md:block',
              '[background:linear-gradient(180deg,var(--mieweb-primary-700),color-mix(in_srgb,var(--mieweb-primary-700)_15%,transparent))]',
              'before:bg-primary-700 before:absolute before:top-0 before:left-1/2 before:h-2.5 before:w-2.5 before:-translate-x-1/2 before:rounded-full before:content-[""]'
            )}
          />
        )}

        {groups.map((g, gi) => (
          <div key={g.key} data-cadence={g.key}>
            <div
              className={cn(
                'bg-muted/30 relative z-[1] flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold tracking-[0.12em] uppercase',
                gi > 0 && 'border-border border-t',
                GROUP_TEXT[g.key]
              )}
            >
              {groupTitle[g.key]}
            </div>

            {g.items.map((it) => {
              const cadence = cadenceOf(it);
              const w = windowOf(it);
              const isCurrent = current?.id === it.id;
              const [c1, c2] =
                it.colors ??
                TONE_COLORS[it.tone ?? TONES[toneIndex++ % TONES.length]];
              const caption =
                cadence === 'scheduled' ? formatWindow(it, monthNames) : null;
              const period = it.period ?? caption ?? groupTitle[cadence];
              const Title = it.href ? 'a' : 'span';

              return (
                <div
                  key={it.id}
                  data-slot="year-timeline-row"
                  data-current={
                    isCurrent ? (current?.live ? 'now' : 'next') : undefined
                  }
                  className={cn(
                    'border-border/60 relative z-[1] grid border-t transition-colors md:grid-cols-[var(--yt-label)_1fr]',
                    'hover:bg-muted/40',
                    isCurrent && 'bg-primary-500/10 hover:bg-primary-500/10'
                  )}
                >
                  <div className="md:border-border/60 px-5 pt-4 pb-2 md:border-e md:pb-4">
                    <div
                      className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.09em] uppercase [&_svg]:h-3.5 [&_svg]:w-3.5"
                      style={{ color: c1 }}
                    >
                      {it.icon}
                      <span>{period}</span>
                      {isCurrent && (
                        <span className="bg-primary-700 ms-auto rounded-full px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-white">
                          {current?.live ? text.now : text.upNext}
                        </span>
                      )}
                    </div>
                    <Title
                      href={it.href}
                      className={cn(
                        'text-foreground block text-base font-semibold',
                        it.href && 'hover:underline'
                      )}
                    >
                      {it.label}
                    </Title>
                    {it.detail && (
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {it.detail}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-12 items-center px-5 pb-4 md:px-0 md:py-3.5">
                    <span
                      data-slot="year-timeline-bar"
                      data-cadence={cadence}
                      style={{
                        gridColumn:
                          cadence === 'scheduled' && w
                            ? `${w.start} / ${w.end + 1}`
                            : '1 / 13',
                        ...(cadence === 'scheduled'
                          ? {
                              background: `linear-gradient(90deg, ${c1}, ${c2})`,
                            }
                          : cadence === 'continuous'
                            ? {
                                background: `linear-gradient(90deg, color-mix(in srgb, ${c1} 22%, transparent), color-mix(in srgb, ${c2} 22%, transparent))`,
                                borderColor: `color-mix(in srgb, ${c1} 45%, transparent)`,
                              }
                            : {
                                background: `repeating-linear-gradient(45deg, color-mix(in srgb, ${c1} 30%, transparent) 0 6px, transparent 6px 12px)`,
                                borderColor: `color-mix(in srgb, ${c1} 60%, transparent)`,
                              }),
                      }}
                      className={cn(
                        'row-start-1 flex h-3.5 min-w-2.5 items-center justify-end rounded-full px-2 md:h-[22px]',
                        cadence === 'scheduled' && 'shadow-sm',
                        cadence === 'continuous' && 'border',
                        cadence === 'event' && 'border border-dashed'
                      )}
                    >
                      {caption && (
                        <span className="hidden text-[10px] font-bold tracking-wide text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.3)] md:inline">
                          {caption}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
