import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  TemplateAnchor,
  TemplateImg,
  accentTextClass,
  cardClass,
  headingTextClass,
  mutedTextClass,
} from '../../templates/Section';
import type {
  SectionBaseProps,
  TemplateImage,
  TemplateLink,
} from '../../templates/types';

export interface ResourceItem {
  title: string;
  href: string;
  excerpt?: string;
  image?: TemplateImage;
  /** Content type label, e.g. "Guide" or "Case study". */
  kind?: string;
  /** Free-text detail line the caller formats, e.g. "8 min read". */
  meta?: string;
  trackingId?: string;
}

export interface ResourceCardsSectionProps extends SectionBaseProps {
  items: ResourceItem[];
  columns?: 2 | 3 | 4;
  /** Link to the full index, shown under the cards. */
  viewAll?: TemplateLink;
}

const columnClass = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
} as const;

export const ResourceCardsSection = React.forwardRef<
  HTMLElement,
  ResourceCardsSectionProps
>(
  (
    {
      items,
      columns = 3,
      viewAll,
      tone = 'default',
      align = 'start',
      components,
      ...rest
    },
    ref
  ) => (
    <SectionShell
      ref={ref}
      data-slot="resource-cards-section"
      tone={tone}
      align={align}
      {...rest}
    >
      <ul
        className={cn('mt-12 grid gap-6 sm:grid-cols-2', columnClass[columns])}
      >
        {items.map((item) => (
          <li
            key={item.href}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-2xl',
              'focus-within:ring-ring focus-within:ring-2',
              cardClass(tone)
            )}
          >
            {item.image && (
              <TemplateImg
                {...item.image}
                components={components}
                className="aspect-video w-full object-cover"
              />
            )}
            <div className="flex flex-1 flex-col gap-2 p-6">
              {item.kind && (
                <p
                  className={cn(
                    'text-xs font-semibold tracking-wider uppercase',
                    accentTextClass(tone)
                  )}
                >
                  {item.kind}
                </p>
              )}
              <h3
                className={cn('text-lg font-semibold', headingTextClass(tone))}
              >
                {/* The ::after stretches the link over the whole card. */}
                <TemplateAnchor
                  href={item.href}
                  trackingId={item.trackingId}
                  components={components}
                  className="group-hover:underline after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {item.title}
                </TemplateAnchor>
              </h3>
              {item.excerpt && (
                <p className={cn('line-clamp-3', mutedTextClass(tone))}>
                  {item.excerpt}
                </p>
              )}
              {item.meta && (
                <p className={cn('mt-auto pt-2 text-sm', mutedTextClass(tone))}>
                  {item.meta}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {viewAll && (
        <p className={cn('mt-10', align === 'center' && 'text-center')}>
          <TemplateAnchor
            href={viewAll.href}
            trackingId={viewAll.trackingId}
            components={components}
            className={cn(
              'inline-flex items-center gap-1 font-semibold hover:underline',
              accentTextClass(tone)
            )}
          >
            {viewAll.label}
            <ArrowRight
              aria-hidden="true"
              className="size-4 rtl:-scale-x-100"
            />
          </TemplateAnchor>
        </p>
      )}
    </SectionShell>
  )
);
ResourceCardsSection.displayName = 'ResourceCardsSection';
