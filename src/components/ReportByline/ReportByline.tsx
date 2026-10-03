import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  TemplateAnchor,
  TemplateImg,
  containerClass,
  headingTextClass,
  mutedTextClass,
  safeHref,
  toneClass,
} from '../../templates/Section';
import type {
  SectionBaseProps,
  TemplateImage,
  TemplateLink,
} from '../../templates/types';

export interface ReportAuthor {
  name: string;
  /** Job title or credentials. */
  role?: string;
  /** Author page; the name links here. */
  href?: string;
  avatar?: TemplateImage;
  /** External profiles, e.g. `{ label: 'LinkedIn', href }`. */
  profiles?: TemplateLink[];
}

export interface ReportBylineLabels {
  /** Visually hidden section heading. */
  heading?: string;
  by?: string;
  published?: string;
  updated?: string;
}

export interface ReportBylineProps extends Omit<
  SectionBaseProps,
  'title' | 'eyebrow' | 'description' | 'align'
> {
  authors: ReportAuthor[];
  /** Display date, formatted by the site. */
  published?: string;
  updated?: string;
  labels?: ReportBylineLabels;
}

/** Who wrote a report and when, with links to author pages and profiles. */
export const ReportByline = React.forwardRef<HTMLElement, ReportBylineProps>(
  (
    {
      authors,
      published,
      updated,
      labels,
      tone = 'default',
      components,
      className,
      ...rest
    },
    ref
  ) => {
    const headingId = React.useId();
    return (
      <section
        ref={ref}
        data-slot="report-byline"
        data-tone={tone}
        aria-labelledby={headingId}
        className={cn(
          'border-border border-t py-8',
          toneClass(tone),
          className
        )}
        {...rest}
      >
        <div className={containerClass()}>
          <h2 id={headingId} className="sr-only">
            {labels?.heading ?? 'About the author'}
          </h2>
          <ul className="flex flex-col gap-6">
            {authors.map((author) => (
              <li
                key={author.name}
                className="flex flex-wrap items-center gap-4"
              >
                {author.avatar && (
                  <TemplateImg
                    {...author.avatar}
                    width={author.avatar.width ?? 48}
                    height={author.avatar.height ?? 48}
                    components={components}
                    className="ring-border size-12 flex-none rounded-full object-cover ring-1"
                  />
                )}
                <div className="min-w-0">
                  <p className={cn('text-sm', mutedTextClass(tone))}>
                    {labels?.by ?? 'By'}{' '}
                    {author.href ? (
                      <TemplateAnchor
                        href={author.href}
                        components={components}
                        className={cn(
                          'font-semibold underline-offset-2 hover:underline',
                          headingTextClass(tone)
                        )}
                      >
                        {author.name}
                      </TemplateAnchor>
                    ) : (
                      <span
                        className={cn('font-semibold', headingTextClass(tone))}
                      >
                        {author.name}
                      </span>
                    )}
                    {author.role && <span> · {author.role}</span>}
                  </p>
                  {(published || updated) && (
                    <p className={cn('text-sm', mutedTextClass(tone))}>
                      {published &&
                        `${labels?.published ?? 'Published'} ${published}`}
                      {published && updated && ' · '}
                      {updated && `${labels?.updated ?? 'Updated'} ${updated}`}
                    </p>
                  )}
                </div>
                {author.profiles && author.profiles.length > 0 && (
                  <div className="ms-auto flex flex-wrap gap-2">
                    {author.profiles.map((profile) => {
                      // Profile URLs are page data; executable schemes are dropped.
                      const href = safeHref(profile.href);
                      if (!href) return null;
                      return (
                        <a
                          key={profile.href}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-track={profile.trackingId}
                          className="border-border hover:border-primary-600 hover:text-primary-800 dark:hover:text-primary-300 inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium"
                        >
                          <span className="sr-only">{author.name} on </span>
                          {profile.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }
);
ReportByline.displayName = 'ReportByline';
