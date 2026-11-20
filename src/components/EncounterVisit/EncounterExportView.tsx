'use client';

import { DocumentExportView } from '../RichTextEsheet/DocumentExportView';

/** The shared MDY export surface with the encounter's wording (mieweb/ui#758). */
export function EncounterExportView({
  source,
  fileName,
}: {
  /** The visit's portable MDY serialization, shown verbatim. */
  source: string;
  /** Suggested name for the downloaded Markdown file. */
  fileName: string;
}) {
  return (
    <DocumentExportView
      source={source}
      fileName={fileName}
      regionLabel="Visit export"
      downloadLabel="Download visit"
    />
  );
}
