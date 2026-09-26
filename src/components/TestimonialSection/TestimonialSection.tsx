import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  TemplateImg,
  cardClass,
  headingTextClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';

export interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  /** Headshot URL; decorative, since the author is named beside it. */
  avatar?: string;
  /** Whole stars out of five. */
  rating?: 1 | 2 | 3 | 4 | 5;
}

export interface TestimonialSectionLabels {
  /** Screen-reader rating text; `{rating}` is replaced with the number. */
  rating?: string;
}

export interface TestimonialSectionProps extends SectionBaseProps {
  testimonials: TestimonialItem[];
  /** `featured` gives the first testimonial the whole section; `cards` lays them out in a grid. */
  variant?: 'cards' | 'featured';
  labels?: TestimonialSectionLabels;
}

export const TestimonialSection = React.forwardRef<
  HTMLElement,
  TestimonialSectionProps
>(
  (
    {
      testimonials,
      variant = 'cards',
      labels,
      tone = 'default',
      align = 'center',
      components,
      ...rest
    },
    ref
  ) => {
    const featured = variant === 'featured';
    const items = featured ? testimonials.slice(0, 1) : testimonials;
    return (
      <SectionShell
        ref={ref}
        data-slot="testimonial-section"
        tone={tone}
        align={align}
        width={featured ? 'narrow' : 'wide'}
        {...rest}
      >
        <ul
          className={cn(
            'mt-12 grid gap-6',
            !featured && 'md:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {items.map(({ rating, ...t }) => (
            <li key={`${t.author}-${t.quote.slice(0, 24)}`}>
              <figure
                className={cn(
                  'flex h-full flex-col gap-6',
                  featured
                    ? 'items-center text-center'
                    : cn('rounded-2xl p-6', cardClass(tone))
                )}
              >
                {rating && (
                  <p className="text-warning flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        aria-hidden="true"
                        className={cn(
                          'size-4',
                          i < rating ? 'fill-current' : 'opacity-30'
                        )}
                      />
                    ))}
                    <span className="sr-only">
                      {(labels?.rating ?? 'Rated {rating} out of 5').replace(
                        '{rating}',
                        String(rating)
                      )}
                    </span>
                  </p>
                )}
                <blockquote
                  className={cn(
                    'text-pretty',
                    featured
                      ? cn(
                          'text-2xl font-medium sm:text-3xl',
                          headingTextClass(tone)
                        )
                      : 'text-base'
                  )}
                >
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3">
                  {t.avatar && (
                    <TemplateImg
                      src={t.avatar}
                      alt=""
                      width={44}
                      height={44}
                      components={components}
                      className="size-11 rounded-full object-cover"
                    />
                  )}
                  <span className={cn(!featured && 'text-start')}>
                    <span className="block font-semibold">{t.author}</span>
                    {(t.role || t.company) && (
                      <span
                        className={cn('block text-sm', mutedTextClass(tone))}
                      >
                        {[t.role, t.company].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </SectionShell>
    );
  }
);
TestimonialSection.displayName = 'TestimonialSection';
