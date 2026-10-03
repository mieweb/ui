import * as React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  cardClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';
import type {
  MetricStatus,
  MetricStatusLabels,
} from '../MetricStatusBadge/MetricStatusBadge';

export interface StatItem {
  /** Numbers are locale-formatted; strings render as written. */
  value: number | string;
  prefix?: string;
  suffix?: string;
  label: string;
  description?: string;
  /** Decorative arrow. Say the direction in `label` too — the arrow is hidden from screen readers. */
  trend?: 'up' | 'down';
}

export interface StatsSectionProps extends SectionBaseProps {
  stats: StatItem[];
  /** `ruled` sets an accent rule beside each figure — a report's key-findings band. */
  variant?: 'plain' | 'cards' | 'ruled';
  /** BCP 47 locale for number formatting. */
  locale?: string;
  /** Provenance badge under the heading. */
  status?: MetricStatus;
  /** Translated text for the `status` badge. */
  statusLabels?: MetricStatusLabels;
}

const columnClass = [
  '',
  '',
  'lg:grid-cols-2',
  'lg:grid-cols-3',
  'lg:grid-cols-4',
] as const;

export const StatsSection = React.forwardRef<HTMLElement, StatsSectionProps>(
  (
    {
      stats,
      variant = 'plain',
      locale,
      tone = 'default',
      align = 'center',
      ...rest
    },
    ref
  ) => {
    const format = new Intl.NumberFormat(locale);
    return (
      <SectionShell
        ref={ref}
        data-slot="stats-section"
        tone={tone}
        align={align}
        {...rest}
      >
        <dl
          className={cn(
            'mt-12 grid gap-6 sm:grid-cols-2',
            columnClass[Math.min(stats.length, 4)]
          )}
        >
          {stats.map((stat) => {
            const Trend = stat.trend === 'down' ? TrendingDown : TrendingUp;
            const ruled = variant === 'ruled';
            const shown =
              typeof stat.value === 'number'
                ? format.format(stat.value)
                : stat.value;
            const long =
              `${stat.prefix ?? ''}${shown}${stat.suffix ?? ''}`.length > 6;
            return (
              <div
                key={stat.label}
                className={cn(
                  'flex flex-col-reverse gap-2',
                  align === 'center' && !ruled && 'items-center text-center',
                  variant === 'cards' && cn('rounded-2xl p-6', cardClass(tone)),
                  ruled && 'border-accent/70 border-s-2 ps-5'
                )}
              >
                <dt>
                  <span className="font-semibold">{stat.label}</span>
                  {stat.description && (
                    <span
                      className={cn('mt-1 block text-sm', mutedTextClass(tone))}
                    >
                      {stat.description}
                    </span>
                  )}
                </dt>
                <dd
                  className={cn(
                    'flex items-center gap-2 font-bold tracking-tight tabular-nums',
                    ruled && long
                      ? 'text-2xl sm:text-3xl'
                      : 'text-4xl sm:text-5xl',
                    tone === 'brand'
                      ? 'text-white'
                      : 'text-primary-800 dark:text-primary-300'
                  )}
                >
                  {stat.trend && (
                    <Trend aria-hidden="true" className="size-7 shrink-0" />
                  )}
                  {stat.prefix}
                  {shown}
                  {stat.suffix}
                </dd>
              </div>
            );
          })}
        </dl>
      </SectionShell>
    );
  }
);
StatsSection.displayName = 'StatsSection';
