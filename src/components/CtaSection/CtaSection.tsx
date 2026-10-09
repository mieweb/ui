import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  CtaLinks,
  SectionHeading,
  containerClass,
  mutedTextClass,
  toneClass,
} from '../../templates/Section';
import type { SectionBaseProps, TemplateLink } from '../../templates/types';

export interface CtaSectionProps extends SectionBaseProps {
  title: string;
  primaryCta?: TemplateLink;
  secondaryCta?: TemplateLink;
  /** Small print under the buttons ("Setup takes about 10 minutes"). */
  note?: string;
  /** `band` fills the section with `tone`; `panel` floats a rounded card of `tone` on the page background. */
  layout?: 'band' | 'panel';
}

export const CtaSection = React.forwardRef<HTMLElement, CtaSectionProps>(
  (
    {
      eyebrow,
      title,
      description,
      primaryCta,
      secondaryCta,
      note,
      tone = 'brand',
      align = 'center',
      layout = 'band',
      components,
      className,
      ...rest
    },
    ref
  ) => {
    const titleId = React.useId();
    const body = (
      <>
        <SectionHeading
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
        {note && (
          <p
            className={cn(
              'mt-4 text-sm',
              mutedTextClass(tone),
              align === 'center' && 'text-center'
            )}
          >
            {note}
          </p>
        )}
      </>
    );
    return (
      <section
        ref={ref}
        data-slot="cta-section"
        data-tone={tone}
        aria-labelledby={titleId}
        className={cn(
          'py-16 sm:py-24',
          layout === 'band' ? toneClass(tone) : 'bg-background',
          className
        )}
        {...rest}
      >
        <div className={containerClass()}>
          {layout === 'panel' ? (
            <div
              className={cn(
                'rounded-3xl px-6 py-12 sm:px-12 sm:py-16',
                toneClass(tone),
                tone !== 'brand' && 'border-border border'
              )}
            >
              {body}
            </div>
          ) : (
            body
          )}
        </div>
      </section>
    );
  }
);
CtaSection.displayName = 'CtaSection';
