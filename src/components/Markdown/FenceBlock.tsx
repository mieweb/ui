/**
 * FenceBlock — Base wrapper for code blocks with copy, raw view toggle, and errors.
 */
import { Check, ClipboardCopy, Code, Eye } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '../Button';

export interface FenceBlockProps {
  code: string;
  language?: string;
  supportsRawView?: boolean;
  error?: string;
  children: React.ReactNode;
  /** Extra buttons rendered in the header before the copy button */
  headerActions?: React.ReactNode;
}

type CopyState = 'idle' | 'copying' | 'success' | 'error';

export const FenceBlock: React.FC<FenceBlockProps> = ({
  code,
  language,
  supportsRawView = false,
  error,
  children,
  headerActions,
}) => {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [showRaw, setShowRaw] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const scheduleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopyState('idle'), 2000);
  }, []);

  const handleCopy = useCallback(async () => {
    if (copyState === 'copying') return;
    setCopyState('copying');
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('success');
      scheduleReset();
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopyState('success');
      } catch {
        setCopyState('error');
      }
      scheduleReset();
    }
  }, [code, copyState, scheduleReset]);

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-[#1a1d24]">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5 dark:border-white/[0.08]">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {(language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Text')}
        </span>
        <div className="flex items-center gap-1">
          {headerActions}
          {supportsRawView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw((v) => !v)}
              aria-label={showRaw ? 'Show rendered view' : 'Show raw code'}
              className="h-7 w-7 p-0"
            >
              {showRaw ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <Code className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            aria-label="Copy code"
            className="h-7 w-7 p-0"
          >
            {copyState === 'success' ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <ClipboardCopy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="p-3">
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
          <pre className="mt-2 overflow-x-auto text-xs whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
            <code>{code}</code>
          </pre>
        </div>
      ) : showRaw ? (
        <pre className="overflow-x-auto p-3 text-sm">
          <code>{code}</code>
        </pre>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </div>
  );
};
