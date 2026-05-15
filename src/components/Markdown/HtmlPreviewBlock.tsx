/**
 * HtmlPreviewBlock — Sandboxed iframe preview for HTML code blocks.
 */
import { Code, Eye, Maximize2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '../Button';
import { FenceBlock } from './FenceBlock';

interface HtmlPreviewBlockProps {
  code: string;
  id: string;
}

function isFullDocument(html: string): boolean {
  return /<!DOCTYPE|<html/i.test(html);
}

function wrapFragment(html: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{margin:0;padding:8px;font-family:system-ui,sans-serif;font-size:14px}</style></head>
<body>${html}</body>
</html>`;
}

export const HtmlPreviewBlock: React.FC<HtmlPreviewBlockProps> = ({ code, id }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(200);

  const srcdoc = isFullDocument(code) ? code : wrapFragment(code);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'HTML_PREVIEW_RESIZE' && event.data?.id === id) {
        setIframeHeight(Math.min(Math.max(event.data.height, 200), 4000));
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id]);

  const handleCloseExpanded = useCallback(() => {
    setExpanded(false);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpanded(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [expanded]);

  return (
    <>
      <FenceBlock code={code} language="html" supportsRawView>
        <div className="relative">
          <div className="flex items-center gap-1 border-b border-neutral-200 px-3 py-1 dark:border-neutral-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview((v) => !v)}
              className="h-7 gap-1 px-2 text-xs"
            >
              {showPreview ? <Code className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showPreview ? 'Code' : 'Preview'}
            </Button>
            {showPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(true)}
                className="h-7 w-7 p-0"
                aria-label="Expand preview"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {showPreview ? (
            <iframe
              srcDoc={srcdoc}
              sandbox="allow-scripts allow-forms"
              referrerPolicy="no-referrer"
              className="w-full border-0"
              style={{ height: iframeHeight }}
              title="HTML Preview"
            />
          ) : (
            <pre className="overflow-x-auto p-3 text-sm">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </FenceBlock>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCloseExpanded}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="h-[90vh] w-[90vw] overflow-hidden rounded-lg bg-white shadow-xl dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
              <span className="text-sm font-medium">HTML Preview</span>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
                Close
              </Button>
            </div>
            <iframe
              srcDoc={srcdoc}
              sandbox="allow-scripts allow-forms"
              referrerPolicy="no-referrer"
              className="h-full w-full border-0"
              title="HTML Preview (expanded)"
            />
          </div>
        </div>
      )}
    </>
  );
};
