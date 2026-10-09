import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  cardClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';
import {
  MetricStatusBadge,
  type MetricStatus,
} from '../MetricStatusBadge/MetricStatusBadge';

export interface ReportLegendEntry {
  status: MetricStatus;
  /** What this label means in this report. */
  description: string;
  /** Override the badge text, e.g. for translation. */
  label?: string;
}

export interface ReportLegendProps extends SectionBaseProps {
  entries: ReportLegendEntry[];
}

/** The key to a report's provenance badges, set near the top so readers know how to weigh every figure. */
export const ReportLegend = React.forwardRef<HTMLElement, ReportLegendProps>(
  (
    {
      entries,
      title = 'How to read the data',
      tone = 'muted',
      components,
      ...rest
    },
    ref
  ) => (
    <SectionShell
      ref={ref}
      data-slot="report-legend"
      title={title}
      tone={tone}
      spacing="compact"
      components={components}
      {...rest}
    >
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <div
            key={entry.status}
            className={cn(
              'flex flex-col gap-2 rounded-xl p-4',
              cardClass(tone)
            )}
          >
            <dt>
              <MetricStatusBadge
                status={entry.status}
                label={entry.label}
                onDark={tone === 'brand'}
              />
            </dt>
            <dd className={cn('text-sm leading-snug', mutedTextClass(tone))}>
              {entry.description}
            </dd>
          </div>
        ))}
      </dl>
    </SectionShell>
  )
);
ReportLegend.displayName = 'ReportLegend';
