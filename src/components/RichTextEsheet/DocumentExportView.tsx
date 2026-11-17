'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { Button } from '../Button';
import { useMessages } from '../../utils/messages';

export interface DocumentExportViewProps {
  /** The document's portable MDY serialization, shown verbatim. */
  source: string;
  /** Suggested name for the downloaded Markdown file. */
  fileName: string;
  /** Translatable message keys for the host's wording. */
  regionLabel?: string;
  downloadLabel?: string;
}

/** Export surface: the portable MDY document, downloadable as Markdown. */
export function DocumentExportView({
  source,
  fileName,
  regionLabel = 'Document export',
  downloadLabel = 'Download document',
}: DocumentExportViewProps) {
  const m = useMessages();
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([source], { type: 'text/markdown' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section aria-label={m(regionLabel)} className="min-w-0">
      <div className="mb-3 flex justify-end">
        <Button
          type="button"
          className="min-h-11"
          leftIcon={<Download size={16} aria-hidden="true" />}
          onClick={download}
        >
          {m(downloadLabel)}
        </Button>
      </div>
      {/* MDY is YAML/Markdown source; keep it left-to-right like code. */}
      <pre
        dir="ltr"
        className="border-input overflow-x-auto rounded-lg border p-3 text-sm break-words whitespace-pre-wrap"
      >
        {source}
      </pre>
    </section>
  );
}
