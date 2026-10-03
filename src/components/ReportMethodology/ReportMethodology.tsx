import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  TemplateAnchor,
  accentTextClass,
  cardClass,
  headingTextClass,
  mutedTextClass,
  safeHref,
} from '../../templates/Section';
import type { SectionBaseProps, TemplateLink } from '../../templates/types';

export interface MethodologySource {
  label: string;
  description: string;
  /** Link to the dataset or document itself. */
  href?: string;
}

export interface MethodologyNote {
  title: string;
  body: string;
}

export interface ReportMethodologyLabels {
  citation?: string;
  sourceLink?: string;
}

export interface ReportMethodologyProps extends SectionBaseProps {
  sources: MethodologySource[];
  /** Suggested citation, shown selectable in a monospace block. */
  citation?: string;
  /** Short notes such as the publishing cadence or known limitations. */
  notes?: MethodologyNote[];
  /** A closing panel of links, e.g. the API or dataset downloads. */
  resources?: { title: string; description?: string; links: TemplateLink[] };
  labels?: ReportMethodologyLabels;
}

/** Sources, how to cite, and caveats — the section that makes a report's figures checkable. */
export const ReportMethodology = React.forwardRef<
  HTMLElement,
  ReportMethodologyProps
>(
  (
    {
      sources,
      citation,
      notes,
      resources,
      labels,
      tone = 'muted',
      components,
      ...rest
    },
    ref
  ) => {
    const card = cn('rounded-2xl p-6', cardClass(tone));
    const subheading = cn(
      'text-sm font-semibold tracking-wide uppercase',
      mutedTextClass(tone)
    );
    return (
      <SectionShell
        ref={ref}
        data-slot="report-methodology"
        tone={tone}
        components={components}
        {...rest}
      >
        <dl className="mt-10 grid gap-6 sm:grid-cols-2">
          {sources.map((source) => (
            <div key={source.label} className={card}>
              <dt className={cn('font-semibold', headingTextClass(tone))}>
                {source.label}
              </dt>
              <dd className={cn('mt-2 text-sm', mutedTextClass(tone))}>
                {source.description}
                {/* Source URLs are page data; executable schemes drop the link. */}
                {safeHref(source.href) && (
                  <>
                    {' '}
                    <a
                      href={safeHref(source.href)}
                      rel="noopener noreferrer"
                      className={cn(
                        'font-medium underline underline-offset-2',
                        accentTextClass(tone)
                      )}
                    >
                      {labels?.sourceLink ?? 'Source'}
                      <span className="sr-only">: {source.label}</span>
                    </a>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
        {citation && (
          <div className={cn(card, 'mt-10 border-dashed')}>
            <h3 className={subheading}>
              {labels?.citation ?? 'How to cite this report'}
            </h3>
            <p className="mt-3 font-mono text-sm break-words select-all">
              {citation}
            </p>
          </div>
        )}
        {notes?.map((note) => (
          <div key={note.title} className={cn(card, 'mt-6')}>
            <h3 className={subheading}>{note.title}</h3>
            <p className={cn('mt-3 max-w-3xl text-sm', mutedTextClass(tone))}>
              {note.body}
            </p>
          </div>
        ))}
        {resources && (
          <div className={cn(card, 'mt-6')}>
            <h3 className={subheading}>{resources.title}</h3>
            {resources.description && (
              <p className={cn('mt-3 max-w-3xl text-sm', mutedTextClass(tone))}>
                {resources.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {resources.links.map((link) => (
                <TemplateAnchor
                  key={link.href}
                  href={link.href}
                  trackingId={link.trackingId}
                  components={components}
                  className={cn(
                    'border-border hover:border-primary-600 inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium',
                    accentTextClass(tone)
                  )}
                >
                  {link.label}
                </TemplateAnchor>
              ))}
            </div>
          </div>
        )}
      </SectionShell>
    );
  }
);
ReportMethodology.displayName = 'ReportMethodology';
