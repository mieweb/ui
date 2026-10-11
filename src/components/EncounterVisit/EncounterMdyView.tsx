'use client';

import * as React from 'react';
import { renderEncounterMdy } from './mdy';
import { createEncounterReportHtml } from './report';

/** Flattened MDY is rendered through Templit, then sanitized for the report. */
export function EncounterMdyView({ source }: { source: string }) {
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
    void renderEncounterMdy(source)
      .then((result) => {
        if (cancelled) return;
        const html = createEncounterReportHtml(
          result.html ?? '',
          result.fields
        );
        setRendered({ source, html, diagnostics: result.diagnostics });
        setFailure(null);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setFailure({
            source,
            message:
              error instanceof Error
                ? error.message
                : 'Unable to render the visit document.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <section
      aria-label="Visit note preview"
      dir="auto"
      aria-busy={rendered?.source !== source && failure?.source !== source}
    >
      {failure?.source === source ? (
        <p role="alert">{failure.message}</p>
      ) : rendered?.source !== source ? (
        <p role="status">Rendering visit…</p>
      ) : (
        <>
          {rendered.diagnostics.length > 0 && (
            <ul
              aria-label="Document diagnostics"
              className="text-muted-foreground mb-3 text-sm"
            >
              {rendered.diagnostics.map((diagnostic, index) => (
                <li key={index}>{diagnostic.message}</li>
              ))}
            </ul>
          )}
          <div
            className="encounter-mdy-view"
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        </>
      )}
    </section>
  );
}
