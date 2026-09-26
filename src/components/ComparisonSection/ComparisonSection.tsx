import * as React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  cardClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';

export interface ComparisonRow {
  feature: string;
  /** One value per column: `true`/`false` render as included/not included, strings render as text. */
  values: (boolean | string)[];
}

export interface ComparisonSectionLabels {
  /** Header of the first column. */
  feature?: string;
  /** Screen-reader text for a `true` cell. */
  included?: string;
  /** Screen-reader text for a `false` cell. */
  notIncluded?: string;
}

export interface ComparisonSectionProps extends SectionBaseProps {
  /** Value column headers, e.g. `["Without BlueHive", "With BlueHive"]`. */
  columns: string[];
  rows: ComparisonRow[];
  /** Index into `columns` to emphasise — usually your product. */
  highlightColumn?: number;
  labels?: ComparisonSectionLabels;
}

const cellClass = 'px-3 py-3 sm:px-5 sm:py-4';

export const ComparisonSection = React.forwardRef<
  HTMLElement,
  ComparisonSectionProps
>(
  (
    {
      columns,
      rows,
      highlightColumn,
      labels,
      title,
      tone = 'default',
      align = 'center',
      ...rest
    },
    ref
  ) => {
    const renderValue = (value: boolean | string) =>
      typeof value === 'string' ? (
        value
      ) : value ? (
        <>
          <Check
            aria-hidden="true"
            className="text-success mx-auto size-5"
            strokeWidth={2.5}
          />
          <span className="sr-only">{labels?.included ?? 'Included'}</span>
        </>
      ) : (
        <>
          <X
            aria-hidden="true"
            className={cn('mx-auto size-5', mutedTextClass(tone))}
          />
          <span className="sr-only">
            {labels?.notIncluded ?? 'Not included'}
          </span>
        </>
      );
    return (
      <SectionShell
        ref={ref}
        data-slot="comparison-section"
        title={title}
        tone={tone}
        align={align}
        {...rest}
      >
        <div
          className={cn('mt-12 overflow-x-auto rounded-2xl', cardClass(tone))}
        >
          <table
            className={cn(
              'w-full border-collapse text-start',
              // Two value columns fit a phone; more scroll sideways.
              columns.length > 2 && 'min-w-[36rem]'
            )}
          >
            {title && <caption className="sr-only">{title}</caption>}
            <thead>
              <tr>
                <th
                  scope="col"
                  className={cn(cellClass, 'text-start text-sm font-semibold')}
                >
                  {labels?.feature ?? 'Feature'}
                </th>
                {columns.map((column, i) => (
                  <th
                    key={column}
                    scope="col"
                    className={cn(
                      cellClass,
                      'text-center text-sm font-semibold',
                      i === highlightColumn && 'bg-primary-800 text-white'
                    )}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.feature}
                  className={cn(
                    'border-t',
                    tone === 'brand' ? 'border-white/15' : 'border-border'
                  )}
                >
                  <th
                    scope="row"
                    className={cn(cellClass, 'text-start font-medium')}
                  >
                    {row.feature}
                  </th>
                  {row.values.map((value, i) => (
                    <td
                      key={i}
                      className={cn(
                        cellClass,
                        'text-center text-sm',
                        i === highlightColumn &&
                          'bg-primary-500/10 font-semibold'
                      )}
                    >
                      {renderValue(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionShell>
    );
  }
);
ComparisonSection.displayName = 'ComparisonSection';
