import * as React from 'react';
import { CircleCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  CtaLinks,
  SectionHeading,
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

export interface SplitContentSectionProps extends Omit<
  SectionBaseProps,
  'align'
> {
  title: string;
  image: TemplateImage;
  /** Caption under the image. */
  caption?: string;
  /** Proof points rendered as a checked list under the description. */
  bullets?: string[];
  primaryCta?: TemplateLink;
  secondaryCta?: TemplateLink;
  /** Which side the image sits on at desktop widths (follows reading direction). */
  mediaPosition?: 'start' | 'end';
}

export const SplitContentSection = React.forwardRef<
  HTMLElement,
  SplitContentSectionProps
>(
  (
    {
      eyebrow,
      title,
      description,
      image,
      caption,
      bullets,
      primaryCta,
      secondaryCta,
      mediaPosition = 'end',
      tone = 'default',
      components,
      className,
      ...rest
    },
    ref
  ) => {
    const titleId = React.useId();
    return (
      <section
        ref={ref}
        data-slot="split-content-section"
        data-tone={tone}
        aria-labelledby={titleId}
        className={cn('py-16 sm:py-24', toneClass(tone), className)}
        {...rest}
      >
        <div
          className={cn(
            containerClass(),
            'grid items-center gap-12 lg:grid-cols-2'
          )}
        >
          <div>
            <SectionHeading
              eyebrow={eyebrow}
              title={title}
              description={description}
              tone={tone}
              titleId={titleId}
            />
            {bullets && bullets.length > 0 && (
              <ul className="mt-6 space-y-3">
                {bullets.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CircleCheck
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 size-5 shrink-0',
                        accentTextClass(tone)
                      )}
                    />
                    <span className={mutedTextClass(tone)}>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <CtaLinks
              primary={primaryCta}
              secondary={secondaryCta}
              tone={tone}
              components={components}
              className="mt-8"
            />
          </div>
          <figure className={cn(mediaPosition === 'start' && 'lg:order-first')}>
            <TemplateImg
              {...image}
              components={components}
              className="h-auto w-full rounded-2xl object-cover shadow-lg"
            />
            {caption && (
              <figcaption className={cn('mt-3 text-sm', mutedTextClass(tone))}>
                {caption}
              </figcaption>
            )}
          </figure>
        </div>
      </section>
    );
  }
);
SplitContentSection.displayName = 'SplitContentSection';
