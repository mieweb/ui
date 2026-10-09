import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  IconTile,
  SectionShell,
  TemplateAnchor,
  accentTextClass,
  cardClass,
  headingTextClass,
  mutedTextClass,
} from '../../templates/Section';
import type { TemplateIconRegistry } from '../../templates/icons';
import type { SectionBaseProps, TemplateLink } from '../../templates/types';

export interface FeatureItem {
  title: string;
  description: string;
  /** Icon token (see `templateIcons`) or a lettermark such as `"EHR"`. */
  icon?: string;
  /** Small label above the title. */
  tag?: string;
  link?: TemplateLink;
}

export interface FeatureGridSectionProps extends SectionBaseProps {
  features: FeatureItem[];
  columns?: 2 | 3 | 4;
  /** `cards` frames each item; `plain` sets them straight on the section. */
  variant?: 'cards' | 'plain';
  icons?: TemplateIconRegistry;
}

const columnClass = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
} as const;

export const FeatureGridSection = React.forwardRef<
  HTMLElement,
  FeatureGridSectionProps
>(
  (
    {
      features,
      columns = 3,
      variant = 'cards',
      icons,
      tone = 'default',
      align = 'start',
      components,
      ...rest
    },
    ref
  ) => (
    <SectionShell
      ref={ref}
      data-slot="feature-grid-section"
      tone={tone}
      align={align}
      {...rest}
    >
      <ul
        className={cn('mt-12 grid gap-6 sm:grid-cols-2', columnClass[columns])}
      >
        {features.map((feature) => (
          <li
            key={feature.title}
            className={cn(
              'flex flex-col gap-3',
              variant === 'cards' && cn('rounded-2xl p-6', cardClass(tone))
            )}
          >
            {feature.icon && (
              <IconTile name={feature.icon} icons={icons} tone={tone} />
            )}
            {feature.tag && (
              <p
                className={cn(
                  'text-xs font-semibold tracking-wider uppercase',
                  accentTextClass(tone)
                )}
              >
                {feature.tag}
              </p>
            )}
            <h3 className={cn('text-lg font-semibold', headingTextClass(tone))}>
              {feature.title}
            </h3>
            <p className={mutedTextClass(tone)}>{feature.description}</p>
            {feature.link && (
              <TemplateAnchor
                href={feature.link.href}
                trackingId={feature.link.trackingId}
                components={components}
                className={cn(
                  'mt-auto inline-flex items-center gap-1 font-semibold hover:underline',
                  accentTextClass(tone)
                )}
              >
                {feature.link.label}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 rtl:-scale-x-100"
                />
              </TemplateAnchor>
            )}
          </li>
        ))}
      </ul>
    </SectionShell>
  )
);
FeatureGridSection.displayName = 'FeatureGridSection';
