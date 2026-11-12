'use client';

import * as React from 'react';
import type { MdyDocumentDiagnostic, MdyDocumentField } from './documentMdy';
import { createMdyReportHtml } from './report';
import { useMessages } from '../../utils/messages';

export interface DocumentMdyViewProps {
  /** The document's portable MDY serialization. */
  source: string;
  /** The host engine's render pipeline, e.g. renderRichTextEsheetMdy. */
  render: (source: string) => Promise<{
    html?: string;
    fields: MdyDocumentField[];
    diagnostics: MdyDocumentDiagnostic[];
  }>;
  /** Translatable message keys for the host's wording. */
  regionLabel?: string;
  renderingMessage?: string;
  failureMessage?: string;
}

/** Flattened MDY is rendered through Templit, then sanitized for the report. */
export function DocumentMdyView({
  source,
  render,
  regionLabel = 'Document preview',
  renderingMessage = 'Rendering document…',
  failureMessage = 'Unable to render the document.',
}: DocumentMdyViewProps) {
  const m = useMessages();
  const [rendered, setRendered] = React.useState<{
    source: string;
    html: string;
    diagnostics: { message: string }[];
  } | null>(null);
  const [failure, setFailure] = React.useState<{
    source: string;
    message: string;
  } | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    void render(source)
      .then((result) => {
        if (cancelled) return;
        const html = createMdyReportHtml(result.html ?? '', result.fields);
        setRendered({ source, html, diagnostics: result.diagnostics });
        setFailure(null);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setFailure({
            source,
            message: error instanceof Error ? error.message : failureMessage,
          });
      });
    return () => {
      cancelled = true;
    };
  }, [source, render, failureMessage]);

  return (
    <section
      aria-label={m(regionLabel)}
      dir="auto"
      aria-busy={rendered?.source !== source && failure?.source !== source}
    >
      {failure?.source === source ? (
        <p role="alert">{m(failure.message)}</p>
      ) : rendered?.source !== source ? (
        <p role="status">{m(renderingMessage)}</p>
      ) : (
        <>
          {rendered.diagnostics.length > 0 && (
            <ul
              aria-label={m('Document diagnostics')}
              className="text-muted-foreground mb-3 text-sm"
            >
              {rendered.diagnostics.map((diagnostic, index) => (
                <li key={index}>{m(diagnostic.message)}</li>
              ))}
            </ul>
          )}
          <div
            // Legacy-shared chrome class; both hosts style it (see encounter-visit.css).
            className="encounter-mdy-view"
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        </>
      )}
    </section>
  );
}
