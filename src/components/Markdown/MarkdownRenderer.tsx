/**
 * MarkdownRenderer — Renders markdown text with special block handling.
 *
 * Converts markdown to HTML via useMarkdown hook, then mounts React components
 * for special fence blocks (mermaid, csv, survey, html-preview) via portals.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CsvBlock } from './CsvBlock';
import { HtmlPreviewBlock } from './HtmlPreviewBlock';
import { MermaidBlock } from './MermaidBlock';
import { SurveyBlock } from './SurveyBlock';
import { useMarkdown } from './useMarkdown';

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

interface BlockPortal {
  id: string;
  type: string;
  code: string;
  container: Element;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  text,
  cacheKey,
  className = '',
  streaming = false,
}) => {
  const { render, renderAsync } = useMarkdown();
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');
  const [portals, setPortals] = useState<BlockPortal[]>([]);

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
      if (!cancelled) {
        setHtml(rendered);
      }
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

  useEffect(() => {
    if (!containerRef.current || !html) return;

    const blocks: BlockPortal[] = [];
    const placeholders = containerRef.current.querySelectorAll('[data-block-type]');

    for (const el of placeholders) {
      const type = el.getAttribute('data-block-type');
      const id = el.getAttribute('data-block-id');
      const encodedCode = el.getAttribute('data-code');

      if (!type || !id || !encodedCode) continue;
      // Skip regular code blocks — they're already rendered as HTML
      if (type === 'code') continue;

      const code = decodeURIComponent(encodedCode);
      blocks.push({ id, type, code, container: el });
    }

    setPortals(blocks);
  }, [html]);

  const renderPortal = useCallback((portal: BlockPortal) => {
    switch (portal.type) {
      case 'mermaid':
        return createPortal(
          <MermaidBlock code={portal.code} id={portal.id} />,
          portal.container,
          portal.id,
        );
      case 'csv':
        return createPortal(
          <CsvBlock code={portal.code} id={portal.id} />,
          portal.container,
          portal.id,
        );
      case 'survey':
        return createPortal(
          <SurveyBlock code={portal.code} id={portal.id} />,
          portal.container,
          portal.id,
        );
      case 'html-preview':
        return createPortal(
          <HtmlPreviewBlock code={portal.code} id={portal.id} />,
          portal.container,
          portal.id,
        );
      default:
        return null;
    }
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={`prose prose-sm dark:prose-invert max-w-none ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {portals.map(renderPortal)}
    </>
  );
};
