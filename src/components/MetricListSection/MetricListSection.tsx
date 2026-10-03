import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  cardClass,
  headingTextClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';
import type { MetricStatusLabels } from '../MetricStatusBadge/MetricStatusBadge';

export interface MetricDefinition {
  label: string;
  /** Unit chip, e.g. `hours` or `%`. */
  unit?: string;
  /** How the figure is (or will be) measured. */
  description: string;
  /** Leave unset until the figure is measured; the section then reads as a roadmap preview. */
  value?: string;
}

export interface MetricListSectionLabels {
  preview?: string;
}

export interface MetricListSectionProps extends Omit<
  SectionBaseProps,
  'align'
> {
  metrics: MetricDefinition[];
  /** Plain-language headline for the result. */
  takeaway?: string;
  /** Mark measured values as good news with a success rule. */
  positive?: boolean;
  /** Translated text for the derived live / maturing badge. */
  statusLabels?: MetricStatusLabels;
  labels?: MetricListSectionLabels;
}

/**
 * Metric definitions with or without values. Publishing the definitions before
 * the data lands is honest about what isn't measured yet; values drop in later
 * with no layout change, and the badge flips from "maturing" to "live".
 */
export const MetricListSection = React.forwardRef<
  HTMLElement,
  MetricListSectionProps
>(
  (
    {
      metrics,
      takeaway,
      positive,
      labels,
      tone = 'default',
      components,
      ...rest
    },
    ref
  ) => {
    const measured = metrics.some((m) => m.value);
    return (
      <SectionShell
        ref={ref}
        data-slot="metric-list-section"
        data-measured={measured || undefined}
        tone={tone}
        spacing="compact"
        status={measured ? 'live' : 'maturing'}
        components={components}
        {...rest}
      >
        {!measured && (
          <p className={cn('mt-3 text-xs font-medium', mutedTextClass(tone))}>
            {labels?.preview ?? 'Roadmap preview'}
          </p>
        )}
        {takeaway && (
          <p
            className={cn(
              'mt-6 max-w-3xl rounded-xl border p-4 text-sm leading-relaxed font-medium',
              tone === 'brand'
                ? 'border-white/20 bg-white/5'
                : 'border-success/30 bg-success/10 text-foreground'
            )}
          >
            {takeaway}
          </p>
        )}
        <ul
          className={cn(
            'mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
            !measured && 'border-border rounded-3xl border border-dashed p-4'
          )}
        >
          {metrics.map((metric) => (
            <li
              key={metric.label}
              className={cn(
                'rounded-xl p-5',
                cardClass(tone),
                positive && metric.value && 'border-s-success border-s-4'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h3
                  className={cn(
                    'min-w-0 text-sm font-semibold',
                    headingTextClass(tone)
                  )}
                >
                  {metric.label}
                </h3>
                {metric.unit && (
                  <span className="bg-primary-500/10 flex-none rounded-full px-2 py-0.5 text-xs font-medium">
                    {metric.unit}
                  </span>
                )}
              </div>
              {metric.value && (
                <p
                  className={cn(
                    'mt-3 text-3xl font-bold tracking-tight tabular-nums',
                    headingTextClass(tone)
                  )}
                >
                  {metric.value}
                </p>
              )}
              <p
                className={cn(
                  'mt-2 text-sm leading-relaxed',
                  mutedTextClass(tone)
                )}
              >
                {metric.description}
              </p>
            </li>
          ))}
        </ul>
      </SectionShell>
    );
  }
);
MetricListSection.displayName = 'MetricListSection';
