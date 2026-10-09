import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  TemplateAnchor,
  accentTextClass,
  cardClass,
  headingTextClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';
import type {
  MetricStatus,
  MetricStatusLabels,
} from '../MetricStatusBadge/MetricStatusBadge';

export interface RankedItem {
  label: string;
  /** Sets the bar length, relative to the list's largest value. */
  value: number;
  /** Text shown for the value; defaults to the locale-formatted number. */
  display?: string;
  href?: string;
  /** Small context to the side, e.g. `12 industries`. */
  note?: string;
}

export interface RankedList {
  title?: string;
  items: RankedItem[];
}

export interface RankedListSectionProps extends Omit<
  SectionBaseProps,
  'align'
> {
  /** One list, or several side by side (e.g. best- and worst-served). */
  lists: RankedList[];
  /** Prefix each item with its rank. */
  numbered?: boolean;
  /** `stacked` gives each item a card with the bar underneath; `inline` puts label, bar and value on one row. */
  layout?: 'stacked' | 'inline';
  bar?: 'primary' | 'accent' | 'success';
  status?: MetricStatus;
  /** Translated text for the `status` badge. */
  statusLabels?: MetricStatusLabels;
  /** BCP 47 locale for number formatting. */
  locale?: string;
}

const barClass = {
  primary: 'bg-primary-600',
  accent: 'bg-accent',
  success: 'bg-success',
} as const;

/** Ranked horizontal bars \u2014 top services, most-searched terms, best- and worst-served regions. */
export const RankedListSection = React.forwardRef<
  HTMLElement,
  RankedListSectionProps
>(
  (
    {
      lists,
      numbered,
      layout = 'stacked',
      bar = 'primary',
      locale,
      tone = 'default',
      components,
      ...rest
    },
    ref
  ) => {
    const format = new Intl.NumberFormat(locale);
    return (
      <SectionShell
        ref={ref}
        data-slot="ranked-list-section"
        tone={tone}
        components={components}
        {...rest}
      >
        <div
          className={cn(
            'mt-10 grid gap-6',
            lists.length > 1 && 'lg:grid-cols-2'
          )}
        >
          {lists.map((list, l) => {
            const max = Math.max(1, ...list.items.map((i) => i.value));
            return (
              <div
                key={list.title ?? l}
                className={cn(
                  layout === 'inline' && cn('rounded-2xl p-6', cardClass(tone))
                )}
              >
                {list.title && (
                  <h3
                    className={cn(
                      'mb-4 text-lg font-semibold',
                      headingTextClass(tone)
                    )}
                  >
                    {list.title}
                  </h3>
                )}
                <ol className="space-y-3">
                  {list.items.map((item, i) => {
                    const label = item.href ? (
                      <TemplateAnchor
                        href={item.href}
                        components={components}
                        className={cn(
                          'font-medium underline-offset-2 hover:underline',
                          accentTextClass(tone)
                        )}
                      >
                        {item.label}
                      </TemplateAnchor>
                    ) : (
                      <span
                        className={cn('font-medium', headingTextClass(tone))}
                      >
                        {item.label}
                      </span>
                    );
                    const track = (
                      <span
                        aria-hidden="true"
                        className={cn(
                          'block h-2 overflow-hidden rounded-full',
                          tone === 'brand' ? 'bg-white/10' : 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'block h-full rounded-full',
                            barClass[bar]
                          )}
                          style={{
                            width: `${Math.round((item.value / max) * 100)}%`,
                          }}
                        />
                      </span>
                    );
                    const rank = numbered && (
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          mutedTextClass(tone)
                        )}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    );
                    const value = item.display ?? format.format(item.value);
                    return layout === 'inline' ? (
                      <li
                        key={item.label}
                        className="flex items-center gap-3 text-sm"
                      >
                        {rank}
                        <span className="w-28 flex-none truncate sm:w-36">
                          {label}
                        </span>
                        <span className="flex-1">{track}</span>
                        <span className="w-20 flex-none text-end font-semibold tabular-nums">
                          {value}
                        </span>
                      </li>
                    ) : (
                      <li
                        key={item.label}
                        className={cn('rounded-xl p-4', cardClass(tone))}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-3">
                            {rank}
                            {label}
                          </span>
                          <span className={cn('text-xs', mutedTextClass(tone))}>
                            {item.note ?? value}
                            {item.note && (
                              <span className="sr-only">: {value}</span>
                            )}
                          </span>
                        </div>
                        <span className="mt-2 block">{track}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      </SectionShell>
    );
  }
);
RankedListSection.displayName = 'RankedListSection';
