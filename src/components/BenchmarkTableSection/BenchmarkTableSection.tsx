import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  TemplateAnchor,
  accentTextClass,
  cardClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';
import type {
  MetricStatus,
  MetricStatusLabels,
} from '../MetricStatusBadge/MetricStatusBadge';

export type BenchmarkValue = number | string | null;

export interface BenchmarkColumn {
  /** Key into each row's `values`. */
  key: string;
  label: string;
  /** Number formatting, e.g. `{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }`. */
  format?: Intl.NumberFormatOptions;
  /** Draw a bar scaled to the column's largest value beside the number. */
  bar?: boolean;
  /** Tint the column \u2014 the figure readers should compare first. */
  emphasis?: boolean;
}

export interface BenchmarkRow {
  label: string;
  /** Second line under the label, e.g. a category. */
  sublabel?: string;
  href?: string;
  /** Numbers are formatted by the column; strings render as written; `null` shows a dash. */
  values: Record<string, BenchmarkValue>;
}

export interface BenchmarkTableSectionProps extends Omit<
  SectionBaseProps,
  'align'
> {
  columns: BenchmarkColumn[];
  rows: BenchmarkRow[];
  /** Header of the row-label column. */
  rowHeader: string;
  /** Visually hidden table caption; defaults to `title`. */
  caption?: string;
  /** Method note under the table. */
  footnote?: string;
  status?: MetricStatus;
  /** Translated text for the `status` badge. */
  statusLabels?: MetricStatusLabels;
  /** BCP 47 locale for number formatting. */
  locale?: string;
}

/**
 * A benchmark table: labelled rows, formatted numeric columns, optional inline
 * bars, and a sticky label column so wide tables scroll sideways on phones.
 */
export const BenchmarkTableSection = React.forwardRef<
  HTMLElement,
  BenchmarkTableSectionProps
>(
  (
    {
      columns,
      rows,
      rowHeader,
      caption,
      footnote,
      locale,
      tone = 'default',
      components,
      title,
      ...rest
    },
    ref
  ) => {
    const formatters = columns.map(
      (col) => new Intl.NumberFormat(locale, col.format)
    );
    const maxima = columns.map((col) =>
      col.bar
        ? Math.max(
            1,
            ...rows.map((r) => {
              const v = r.values[col.key];
              return typeof v === 'number' ? v : 0;
            })
          )
        : 1
    );
    const cellBase = 'px-4 py-3 tabular-nums';
    const stickyBg = tone === 'brand' ? 'bg-primary-900' : 'bg-card';
    return (
      <SectionShell
        ref={ref}
        data-slot="benchmark-table-section"
        tone={tone}
        title={title}
        components={components}
        {...rest}
      >
        <div
          className={cn('mt-10 overflow-x-auto rounded-2xl', cardClass(tone))}
        >
          <table className="divide-border min-w-full divide-y text-sm">
            {(caption ?? title) && (
              <caption className="sr-only">{caption ?? title}</caption>
            )}
            <thead>
              <tr>
                <th
                  scope="col"
                  className={cn(
                    'sticky start-0 z-10 px-4 py-3 text-start font-semibold',
                    stickyBg
                  )}
                >
                  {rowHeader}
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'px-4 py-3 font-semibold whitespace-nowrap',
                      col.bar ? 'text-start' : 'text-end',
                      col.emphasis && 'bg-primary-500/10'
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={cn(
                      'sticky start-0 z-10 px-4 py-3 text-start font-medium',
                      stickyBg
                    )}
                  >
                    {row.href ? (
                      <TemplateAnchor
                        href={row.href}
                        components={components}
                        className={cn(
                          'underline-offset-2 hover:underline',
                          accentTextClass(tone)
                        )}
                      >
                        {row.label}
                      </TemplateAnchor>
                    ) : (
                      row.label
                    )}
                    {row.sublabel && (
                      <span
                        className={cn(
                          'block text-xs font-normal',
                          mutedTextClass(tone)
                        )}
                      >
                        {row.sublabel}
                      </span>
                    )}
                  </th>
                  {columns.map((col, c) => {
                    const v = row.values[col.key];
                    const shown =
                      v == null
                        ? '\u2014'
                        : typeof v === 'number'
                          ? formatters[c].format(v)
                          : v;
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          cellBase,
                          col.bar ? 'text-start' : 'text-end whitespace-nowrap',
                          col.emphasis &&
                            cn(
                              'bg-primary-500/10 font-semibold',
                              accentTextClass(tone)
                            )
                        )}
                      >
                        {col.bar && typeof v === 'number' ? (
                          <span className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="bg-muted h-2 w-32 max-w-full flex-none overflow-hidden rounded-full"
                            >
                              <span
                                className="bg-primary-600 block h-full rounded-full"
                                style={{
                                  width: `${Math.round((v / maxima[c]) * 100)}%`,
                                }}
                              />
                            </span>
                            {shown}
                          </span>
                        ) : (
                          shown
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {footnote && (
          <p className={cn('mt-4 max-w-3xl text-sm', mutedTextClass(tone))}>
            {footnote}
          </p>
        )}
      </SectionShell>
    );
  }
);
BenchmarkTableSection.displayName = 'BenchmarkTableSection';
