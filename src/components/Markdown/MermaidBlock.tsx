/**
 * MermaidBlock — Renders Mermaid diagrams.
 * Requires `mermaid` to be installed by the consumer (optional peer dependency).
 */
import DOMPurify from 'dompurify';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
let mermaidTheme: 'dark' | 'default' = 'default';

function currentTheme(): 'dark' | 'default' {
  return document.documentElement.classList.contains('dark') ||
    document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'default';
}

async function getMermaid(): Promise<MermaidApi> {
  const theme = currentTheme();
  if (mermaidInstance) {
    if (theme !== mermaidTheme) {
      mermaidTheme = theme;
      mermaidInstance.initialize({
        startOnLoad: false,
        theme,
        securityLevel: 'strict',
      });
    }
    return mermaidInstance;
  }
  if (!mermaidReady) {
    mermaidReady = import(/* @vite-ignore */ 'mermaid').then((mod) => {
      const m = (mod as { default: MermaidApi }).default;
      mermaidTheme = currentTheme();
      m.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        securityLevel: 'strict',
      });
      mermaidInstance = m;
      return m;
    });
  }
  return mermaidReady;
}

function sanitiseSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    // Allow <style> so mermaid's embedded CSS applies, and <foreignObject>
    // so node label text renders (mermaid escapes its content in strict mode).
    ADD_TAGS: ['style', 'foreignObject'],
    ADD_ATTR: [
      'style',
      'class',
      'dominant-baseline',
      'text-anchor',
      'font-size',
      'font-family',
      'marker-end',
      'marker-start',
      'marker-mid',
      'stroke-dasharray',
      'stroke-width',
    ],
    FORBID_TAGS: ['script'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover'],
  }) as string;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code, id }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Derive an accessible label from the diagram's declared type (first keyword).
  const diagramLabel = useMemo(() => {
    const firstWord =
      code
        .trim()
        .split(/[\s\n]/)[0]
        ?.toLowerCase() ?? '';
    const typeMap: Record<string, string> = {
      graph: 'Flowchart',
      flowchart: 'Flowchart',
      sequencediagram: 'Sequence diagram',
      classdiagram: 'Class diagram',
      statediagram: 'State diagram',
      'statediagram-v2': 'State diagram',
      erdiagram: 'Entity relationship diagram',
      gantt: 'Gantt chart',
      pie: 'Pie chart',
      journey: 'User journey diagram',
      gitgraph: 'Git graph',
      mindmap: 'Mind map',
      timeline: 'Timeline',
      quadrantchart: 'Quadrant chart',
    };
    return `${typeMap[firstWord] ?? 'Mermaid'} diagram`;
  }, [code]);

  const render = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mermaid = await getMermaid();
      await mermaid.parse(code);
      const { svg: rendered } = await mermaid.render(`mermaid-${id}`, code);
      setSvg(sanitiseSvg(rendered));
    } catch (err) {
      setError((err as Error).message ?? 'Failed to render diagram');
    } finally {
      setLoading(false);
    }
  }, [code, id]);

  useEffect(() => {
    void render();
  }, [render]);

  // Re-render when the page theme changes (dark ↔ light)
  useEffect(() => {
    const observer = new MutationObserver(() => void render());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => observer.disconnect();
  }, [render]);

  return (
    <FenceBlock
      code={code}
      language="mermaid"
      supportsRawView
      error={error || undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="border-primary-500 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : (
        <div
          className="mermaid-svg flex justify-center p-4"
          role="img"
          aria-label={diagramLabel}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </FenceBlock>
  );
};
