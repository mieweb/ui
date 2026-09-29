import * as React from 'react';
import { ChevronRight, CircleCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  CtaLinks,
  SectionHeading,
  TemplateAnchor,
  TemplateImg,
  accentTextClass,
  containerClass,
  mutedTextClass,
  toneClass,
} from '../../templates/Section';
import type {
  SectionBaseProps,
  TemplateImage,
  TemplateLink,
} from '../../templates/types';

export interface HeroSectionLabels {
  /** Accessible name of the breadcrumb `<nav>`. */
  breadcrumb?: string;
}

export interface HeroSectionProps extends Omit<SectionBaseProps, 'align'> {
  title: string;
  /** `split` puts copy beside `image`; `centered` stacks everything. */
  variant?: 'centered' | 'split';
  primaryCta?: TemplateLink;
  secondaryCta?: TemplateLink;
  /** Reassurance line under the calls to action ("No credit card required"). */
  ctaNote?: string;
  /** Short trust points rendered as a checked list. */
  highlights?: string[];
  image?: TemplateImage;
  /** Trail ending in the current page, which renders unlinked. */
  breadcrumbs?: TemplateLink[];
  /** A page has one `h1`; set `h2` when the page already renders its own. */
  headingLevel?: 'h1' | 'h2';
  labels?: HeroSectionLabels;
}

export const HeroSection = React.forwardRef<HTMLElement, HeroSectionProps>(
  (
    {
      eyebrow,
      title,
      description,
      variant = 'centered',
      tone = 'default',
      primaryCta,
      secondaryCta,
      ctaNote,
      highlights,
      image,
      breadcrumbs,
      headingLevel = 'h1',
      labels,
      components,
      className,
      ...rest
    },
    ref
  ) => {
    const titleId = React.useId();
    const split = variant === 'split' && !!image;
    const align = split ? 'start' : 'center';
    return (
      <section
        ref={ref}
        data-slot="hero-section"
        data-tone={tone}
        aria-labelledby={titleId}
        className={cn('py-16 sm:py-24 lg:py-28', toneClass(tone), className)}
        {...rest}
      >
        <div
          className={cn(
            containerClass(),
            split && 'grid items-center gap-12 lg:grid-cols-2'
          )}
        >
          <div className={cn(!split && 'flex flex-col items-center')}>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                aria-label={labels?.breadcrumb ?? 'Breadcrumb'}
                className="mb-6"
              >
                <ol
                  className={cn(
                    'flex flex-wrap items-center gap-1 text-sm',
                    mutedTextClass(tone),
                    !split && 'justify-center'
                  )}
                >
                  {breadcrumbs.map((crumb, i) => {
                    const last = i === breadcrumbs.length - 1;
                    return (
                      <li key={crumb.href} className="flex items-center gap-1">
                        {last ? (
                          <span aria-current="page">{crumb.label}</span>
                        ) : (
                          <>
                            <TemplateAnchor
                              href={crumb.href}
                              trackingId={crumb.trackingId}
                              components={components}
                              className="hover:underline focus-visible:underline"
                            >
                              {crumb.label}
                            </TemplateAnchor>
                            <ChevronRight
                              aria-hidden="true"
                              className="size-4 rtl:-scale-x-100"
                            />
                          </>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}
            <SectionHeading
              as={headingLevel}
              size="hero"
              eyebrow={eyebrow}
              title={title}
              description={description}
              align={align}
              tone={tone}
              titleId={titleId}
            />
            <CtaLinks
              primary={primaryCta}
              secondary={secondaryCta}
              tone={tone}
              align={align}
              components={components}
              className="mt-8"
            />
            {ctaNote && (
              <p className={cn('mt-4 text-sm', mutedTextClass(tone))}>
                {ctaNote}
              </p>
            )}
            {highlights && highlights.length > 0 && (
              <ul
                className={cn(
                  'mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium',
                  !split && 'justify-center'
                )}
              >
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CircleCheck
                      aria-hidden="true"
                      className={cn('size-4 shrink-0', accentTextClass(tone))}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {image && (
            <TemplateImg
              {...image}
              priority
              components={components}
              className={cn(
                'h-auto w-full rounded-2xl object-cover shadow-xl',
                !split && 'mx-auto mt-12 max-w-5xl'
              )}
            />
          )}
        </div>
      </section>
    );
  }
);
HeroSection.displayName = 'HeroSection';
