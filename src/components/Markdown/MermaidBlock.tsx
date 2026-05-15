/**
 * MermaidBlock — Renders Mermaid diagrams.
 * Requires `mermaid` to be installed by the consumer (optional peer dependency).
 */
import React, { useCallback, useEffect, useState } from 'react';

import { FenceBlock } from './FenceBlock';

interface MermaidBlockProps {
  code: string;
  id: string;
}

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  parse: (text: string) => Promise<unknown>;
  render: (id: string, text: string) => Promise<{ svg: string }>;
};

let mermaidInstance: MermaidApi | null = null;
let mermaidReady: Promise<MermaidApi> | null = null;

async function getMermaid(): Promise<MermaidApi> {
  if (mermaidInstance) return mermaidInstance;
  if (!mermaidReady) {
    mermaidReady = import(/* @vite-ignore */ 'mermaid').then((mod) => {
      const m = (mod as { default: MermaidApi }).default;
      m.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        securityLevel: 'loose',
      });
      mermaidInstance = m;
      return m;
    });
  }
  return mermaidReady;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code, id }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const render = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mermaid = await getMermaid();
      await mermaid.parse(code);
      const { svg: rendered } = await mermaid.render(`mermaid-${id}`, code);
      setSvg(rendered);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to render diagram');
    } finally {
      setLoading(false);
    }
  }, [code, id]);

  useEffect(() => {
    void render();
  }, [render]);

  return (
    <FenceBlock code={code} language="mermaid" supportsRawView error={error || undefined}>
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div
          className="flex justify-center p-4"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </FenceBlock>
  );
};
