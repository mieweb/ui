/**
 * MarkdownRenderer — renders markdown with React components for special fence blocks.
 */
import React, { Suspense, lazy, useEffect, useState } from 'react';

import { useMarkdown } from './useMarkdown';

// Block components are lazy-loaded so optional peer deps (papaparse, js-yaml, mermaid)
// aren't bundled unless actually rendered.
const CsvBlock = lazy(() => import('./CsvBlock').then((m) => ({ default: m.CsvBlock })));
const HtmlPreviewBlock = lazy(() =>
  import('./HtmlPreviewBlock').then((m) => ({ default: m.HtmlPreviewBlock })),
);
const MermaidBlock = lazy(() =>
  import('./MermaidBlock').then((m) => ({ default: m.MermaidBlock })),
);
const SurveyBlock = lazy(() => import('./SurveyBlock').then((m) => ({ default: m.SurveyBlock })));

const BlockFallback: React.FC = () => (
  <div className="flex items-center justify-center p-4 text-sm text-neutral-500">Loading…</div>
);

export interface MarkdownRendererProps {
  /** Raw markdown text */
  text: string;
  /** Cache key (e.g., message._id + revisionNumber) */
  cacheKey?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the message is still streaming (may have incomplete blocks) */
  streaming?: boolean;
}

// Matches <div data-block-type="X" data-block-id="Y" data-code="Z"></div>
const BLOCK_RE =
  /<div data-block-type="([^"]+)" data-block-id="([^"]+)" data-code="([^"]*)"[^>]*><\/div>/g;

interface HtmlSegment {
  html: string;
}
interface BlockSegment {
  type: string;
  id: string;
  code: string;
}
type Segment = HtmlSegment | BlockSegment;

function splitHtml(html: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const m of html.matchAll(BLOCK_RE)) {
    if (m.index > last) segments.push({ html: html.slice(last, m.index) });
    segments.push({ type: m[1], id: m[2], code: decodeURIComponent(m[3]) });
    last = m.index + m[0].length;
  }
  if (last < html.length) segments.push({ html: html.slice(last) });
  return segments;
}

function renderBlock(seg: BlockSegment): React.ReactNode {
  const wrap = (node: React.ReactNode) => (
    <Suspense key={seg.id} fallback={<BlockFallback />}>
      {node}
    </Suspense>
  );
  switch (seg.type) {
    case 'mermaid':
      return wrap(<MermaidBlock code={seg.code} id={seg.id} />);
    case 'csv':
      return wrap(<CsvBlock code={seg.code} id={seg.id} />);
    case 'survey':
      return wrap(<SurveyBlock code={seg.code} id={seg.id} />);
    case 'html-preview':
      return wrap(<HtmlPreviewBlock code={seg.code} id={seg.id} />);
    default:
      return null;
  }
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  text,
  cacheKey,
  className = '',
  streaming = false,
}) => {
  const { render, renderAsync } = useMarkdown();
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;

    // While streaming, append text length to the cache key so each delta
    // produces a fresh render rather than a stale hit on the messageId.
    const effectiveKey = streaming
      ? cacheKey
        ? `${cacheKey}::${text.length}`
        : undefined
      : cacheKey;

    async function doRender() {
      const rendered = await renderAsync(text, effectiveKey);
      if (!cancelled) setHtml(rendered);
    }

    if (streaming) {
      setHtml(render(text, effectiveKey));
    } else {
      void doRender();
    }

    return () => {
      cancelled = true;
    };
  }, [text, cacheKey, streaming, render, renderAsync]);

  const segments = splitHtml(html);
  const proseClass = `prose prose-sm dark:prose-invert max-w-none ${className}`.trim();

  return (
    <div className={proseClass}>
      {segments.map((seg, i) =>
        'html' in seg ? (
            <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
        ) : (
          renderBlock(seg)
        ),
      )}
    </div>
  );
};
