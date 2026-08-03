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
const MERMAID_DECLARATION_RE =
  /^\s*(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|block-beta|xychart-beta)\b/;
/** Any triple-backtick fence line (```lang or bare ```) that leaks into a
 * mermaid block from model output. */
const FENCE_LINE_RE = /^\s*```[\w-]*\s*$/;
/** Mermaid init directives / comments that must be preserved above the
 * declaration (e.g. `%%{init: {...}}%%`, `%% comment`). */
const MERMAID_DIRECTIVE_RE = /^\s*%%/;

/**
 * Normalize a mermaid source block. Model outputs occasionally include nested
 * code fences or leading prose; strip those but preserve mermaid init
 * directives and comment lines that legally precede the diagram declaration.
 */
export function normalizeMermaidSource(code: string): string {
  const lines = code.split(/\r?\n/);

  // Drop any nested code-fence lines (```lang / bare ```), regardless of language.
  const stripped = lines.filter((line) => !FENCE_LINE_RE.test(line));

  const declarationIdx = stripped.findIndex((line) =>
    MERMAID_DECLARATION_RE.test(line)
  );
  if (declarationIdx < 0) return stripped.join('\n').trim();

  // Preserve init directives / `%%` comment lines that appear above the
  // declaration; drop any other leading prose.
  const preamble: string[] = [];
  for (let i = 0; i < declarationIdx; i += 1) {
    const line = stripped[i];
    if (MERMAID_DIRECTIVE_RE.test(line)) preamble.push(line);
  }

  return [...preamble, ...stripped.slice(declarationIdx)].join('\n').trim();
}

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
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable fallback blocks need keyboard focus for horizontal scrolling
      tabIndex={0}
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

export async function renderMermaidWithRecovery(
  mermaid: typeof import('mermaid').default,
  id: string,
  source: string
) {
  const lines = source.split(/\r?\n/).map((line) => line.trimEnd());
  let lastError: unknown;

  // If a model adds prose after a valid diagram, progressively trim trailing
  // lines and render the first parseable candidate. `mermaid.render()` throws
  // when the source doesn't parse, so we rely on it directly and avoid an
  // extra `mermaid.parse()` on the success path.
  for (let end = lines.length; end >= 1; end -= 1) {
    const candidate = lines.slice(0, end).join('\n').trim();
    if (!candidate) continue;
    try {
      return await mermaid.render(id, candidate);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error(
    typeof lastError === 'string'
      ? lastError
      : `Failed to parse mermaid diagram: ${String(lastError)}`
  );
}

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
        flowchart: { useMaxWidth: false },
        themeVariables: { fontSize: '16px' },
      });
      return mermaid;
    });
  }
  return mermaidReady;
}

/** Read the current dark-mode state from the document root. */
function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  return (
    root.classList.contains('dark') ||
    root.getAttribute('data-theme') === 'dark'
  );
}

/**
 * Track dark mode reactively. Mermaid bakes theme colors into the rendered SVG,
 * so diagrams must re-render when the user toggles light/dark — a CSS swap is
 * not enough. Observes the `class`/`data-theme` attributes the theme sets on
 * the document root.
 */
function useIsDarkMode(): boolean {
  const [dark, setDark] = React.useState(isDarkMode);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const update = () => setDark(isDarkMode());
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return dark;
}

let mermaidSeq = 0;

function MermaidDiagram({ code }: { code: string }) {
  const { streaming } = useTextRenderContext();
  const dark = useIsDarkMode();
  const [svg, setSvg] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  // Lazy init so the id counter increments once per instance, not per render.
  const idRef = React.useRef<string | null>(null);
  if (idRef.current === null) {
    mermaidSeq += 1;
    idRef.current = `superchat-mermaid-${mermaidSeq}`;
  }
  const id = idRef.current;

  const source = React.useMemo(() => normalizeMermaidSource(code), [code]);

  React.useEffect(() => {
    // Don't try to render an incomplete diagram while the message streams.
    if (streaming || !source) return;
    let active = true;
    setSvg(null);
    setFailed(false);
    void loadMermaid(dark)
      .then((mermaid) => renderMermaidWithRecovery(mermaid, id, source))
      .then(({ svg: rendered }) => {
        if (active) setSvg(rendered);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [source, streaming, dark, id]);

  if (!source && !streaming) return <InertFallback raw={code} />;

  if (failed) return <InertFallback raw={code} />;

  if (streaming || svg === null) {
    return <PendingCard label="Rendering diagram…" />;
  }

  return (
    <div
      data-slot="superchat-mermaid"
      className="my-2 overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-none"
      // Wide diagrams scroll horizontally; keyboard users need focus to scroll
      // (axe: scrollable-region-focusable).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="region"
      aria-label="Diagram"
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
