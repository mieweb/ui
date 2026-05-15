/**
 * CodeBlock — Renders a syntax-highlighted code fence using FenceBlock.
 *
 * Used by `MarkdownRenderer` for plain (non-special) fenced code blocks.
 * Highlighting is performed synchronously via the `highlightCode` helper from
 * `useMarkdown`; if the language was not pre-registered with highlight.js the
 * helper falls back to escaped raw text.
 */
import React, { useMemo } from 'react';

import { FenceBlock } from './FenceBlock';
import { highlightCode } from './useMarkdown';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const html = useMemo(() => highlightCode(code, language), [code, language]);

  return (
    <FenceBlock code={code} language={language}>
      <pre className="m-0 overflow-x-auto bg-transparent p-3 text-sm">
        <code
          className="hljs bg-transparent p-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </FenceBlock>
  );
};
