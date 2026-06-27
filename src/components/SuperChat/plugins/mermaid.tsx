/**
 * SuperChat Mermaid plugin (opt-in).
 *
 * Renders fenced ```mermaid blocks as diagrams via the lazily-loaded `mermaid`
 * library:
 *
 * ````md
 * ```mermaid
 * graph TD; A-->B; A-->C;
 * ```
 * ````
 *
 * `mermaid` is heavy, so it loads on first render (never in the SuperChat base
 * bundle). Rendering is gated on `streaming` — partial diagram source mid-stream
 * shows a pending card and only renders once the message settles. Diagrams are
 * rendered with mermaid's `securityLevel: 'strict'`, which sanitizes labels and
 * strips scripts; the resulting SVG is inserted directly (it bypasses
 * `rehype-sanitize`, so strict mode is the trust boundary here).
 */

import * as React from 'react';
import { useTextRenderContext } from '../render/renderContext';
import type { SuperChatRenderPlugin } from '../types';

const MERMAID_TAG = 'mermaid-diagram';

// ---------------------------------------------------------------------------
// rehype transformer: <pre><code class="language-mermaid">…</code></pre>
//   → <mermaid-diagram>{source text}</mermaid-diagram>
// The source rides as a text child (not a data-* attribute) to avoid hast
// property-name conversion surprises through sanitize + react-markdown.
// ---------------------------------------------------------------------------

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

function isMermaidPre(node: HastNode): boolean {
  if (node.tagName !== 'pre') return false;
  const code = node.children?.find((c) => c.tagName === 'code');
  const className = code?.properties?.className;
  const classes = Array.isArray(className) ? className : [className];
  return classes.some(
    (c) =>
      typeof c === 'string' && (c === 'language-mermaid' || c === 'mermaid')
  );
}

function rehypeMermaid() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (isMermaidPre(child)) {
          const code = child.children?.find((c) => c.tagName === 'code');
          const raw = code ? textOf(code) : '';
          return {
            type: 'element',
            tagName: MERMAID_TAG,
            properties: {},
            children: [{ type: 'text', value: raw }],
          } satisfies HastNode;
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}

// ---------------------------------------------------------------------------
// Pending / fallback chrome
// ---------------------------------------------------------------------------

function PendingCard({ label }: { label: string }) {
  return (
    <div
      data-slot="superchat-mermaid-pending"
      className="my-2 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300"
    >
      <span
        className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent"
        aria-hidden="true"
      />
      {label}
    </div>
  );
}

function InertFallback({ raw }: { raw: string }) {
  return (
    <pre
      data-slot="superchat-mermaid-fallback"
      className="my-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-sm text-neutral-100 dark:bg-neutral-950"
    >
      <code>{raw}</code>
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Diagram renderer
// ---------------------------------------------------------------------------

let mermaidReady: Promise<typeof import('mermaid').default> | null = null;
let mermaidTheme: 'dark' | 'default' | null = null;

/** Load + initialize mermaid once, shared across all diagrams. */
function loadMermaid(dark: boolean) {
  const theme: 'dark' | 'default' = dark ? 'dark' : 'default';
  if (!mermaidReady || mermaidTheme !== theme) {
    mermaidReady = (
      mermaidReady ?? import('mermaid').then(({ default: mermaid }) => mermaid)
    ).then((mermaid) => {
      mermaidTheme = theme;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme,
      });
      return mermaid;
    });
  }
  return mermaidReady;
}

let mermaidSeq = 0;

function MermaidDiagram({ code }: { code: string }) {
  const { streaming } = useTextRenderContext();
  const [svg, setSvg] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const idRef = React.useRef(`superchat-mermaid-${(mermaidSeq += 1)}`);

  const source = code.trim();

  React.useEffect(() => {
    // Don't try to render an incomplete diagram while the message streams.
    if (streaming || !source) return;
    let active = true;
    setSvg(null);
    setFailed(false);
    const dark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');
    void loadMermaid(dark)
      .then((mermaid) => mermaid.render(idRef.current, source))
      .then(({ svg: rendered }) => {
        if (active) setSvg(rendered);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [source, streaming]);

  if (!source && !streaming) return <InertFallback raw={code} />;

  if (failed) return <InertFallback raw={code} />;

  if (streaming || svg === null) {
    return <PendingCard label="Rendering diagram…" />;
  }

  return (
    <div
      data-slot="superchat-mermaid"
      className="my-2 overflow-x-auto"
      // mermaid renders with securityLevel: 'strict' (labels sanitized, scripts
      // stripped), so the SVG is safe to inject directly.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Create the Mermaid diagram render plugin. */
export function createMermaidPlugin(): SuperChatRenderPlugin {
  const MermaidComponent = (props: Record<string, unknown>) => {
    const raw = React.Children.toArray(props.children as React.ReactNode)
      .filter((c): c is string => typeof c === 'string')
      .join('');
    return <MermaidDiagram code={raw} />;
  };

  return {
    name: 'mermaid',
    rehypePlugins: [rehypeMermaid],
    components: {
      [MERMAID_TAG]: MermaidComponent,
    },
    sanitizeSchema: {
      tagNames: [MERMAID_TAG],
    },
  };
}
export { MERMAID_TAG };
