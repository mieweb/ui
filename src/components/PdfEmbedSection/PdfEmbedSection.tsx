import * as React from 'react';
import { Download, ExternalLink, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { buttonVariants } from '../Button/button-variants';
import {
  SectionShell,
  mutedTextClass,
  safeHref,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';

export interface PdfEmbedSectionLabels {
  download?: string;
  open?: string;
  /** Shown where the browser can't display PDFs inline. */
  fallback?: string;
}

export interface PdfEmbedSectionProps extends SectionBaseProps {
  title: string;
  /** Root-relative or absolute URL of the PDF. */
  src: string;
  /** Suggested filename for the download link. */
  downloadAs?: string;
  /** Viewer height ÷ width. US Letter portrait is ~1.29; 16:9 slides are 0.5625. */
  aspectRatio?: number;
  /** Callout above the viewer, e.g. "embedded videos only play in Acrobat". */
  notice?: string;
  labels?: PdfEmbedSectionLabels;
}

/**
 * An inline PDF viewer with download and open-in-new-tab links. Uses
 * `<object>`, whose fallback content (a link) shows where inline PDF isn't
 * supported, so it needs no client JavaScript.
 */
export const PdfEmbedSection = React.forwardRef<
  HTMLElement,
  PdfEmbedSectionProps
>(
  (
    {
      title,
      src,
      downloadAs,
      aspectRatio = 0.5625,
      notice,
      labels,
      tone = 'muted',
      align = 'center',
      components,
      ...rest
    },
    ref
  ) => {
    // `src` is page data; an executable scheme inerts the viewer and links.
    const pdfSrc = safeHref(src);
    const viewerSrc =
      pdfSrc && (pdfSrc.includes('#') ? pdfSrc : `${pdfSrc}#view=FitH`);
    const onBrand = tone === 'brand';
    return (
      <SectionShell
        ref={ref}
        data-slot="pdf-embed-section"
        title={title}
        tone={tone}
        align={align}
        components={components}
        {...rest}
      >
        {notice && (
          <p className="border-primary-500/30 bg-primary-500/10 mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-xl border px-4 py-3 text-start text-sm">
            <Info aria-hidden="true" className="mt-0.5 size-5 flex-none" />
            {notice}
          </p>
        )}
        {pdfSrc && (
          <>
            <div
              className="border-border bg-card relative mt-10 overflow-hidden rounded-2xl border shadow-lg"
              style={{ paddingTop: `${(aspectRatio * 100).toFixed(4)}%` }}
            >
              <object
                data={viewerSrc}
                type="application/pdf"
                aria-label={title}
                className="absolute inset-0 size-full"
              >
                <p
                  className={cn(
                    'flex size-full items-center justify-center p-6 text-center text-sm',
                    mutedTextClass('default')
                  )}
                >
                  <a href={pdfSrc} className="underline underline-offset-2">
                    {labels?.fallback ?? 'Open the PDF'}
                  </a>
                </p>
              </object>
            </div>
            <div
              className={cn(
                'mt-6 flex flex-wrap gap-3',
                align === 'center' && 'justify-center'
              )}
            >
              <a
                href={pdfSrc}
                download={downloadAs ?? true}
                className={cn(
                  buttonVariants({ variant: 'primary' }),
                  onBrand && 'text-primary-900 hover:bg-primary-50 bg-white'
                )}
              >
                <Download aria-hidden="true" className="size-4" />
                {labels?.download ?? 'Download PDF'}
              </a>
              <a
                href={pdfSrc}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  onBrand && 'border-white/70 text-white hover:bg-white/10'
                )}
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                {labels?.open ?? 'Open in new tab'}
              </a>
            </div>
          </>
        )}
      </SectionShell>
    );
  }
);
PdfEmbedSection.displayName = 'PdfEmbedSection';
