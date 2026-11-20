'use client';

import { DocumentMdyView } from '../RichTextEsheet/DocumentMdyView';
import { renderEncounterMdy } from './mdy';

/** The shared MDY document preview with the encounter's wording (mieweb/ui#758). */
export function EncounterMdyView({ source }: { source: string }) {
  return (
    <DocumentMdyView
      source={source}
      render={renderEncounterMdy}
      regionLabel="Visit note preview"
      renderingMessage="Rendering visit…"
      failureMessage="Unable to render the visit document."
    />
  );
}
