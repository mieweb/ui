/**
 * SuperChat GenUI plugin (opt-in).
 *
 * Interactive widgets expressed as fenced ```genui JSON blocks:
 *
 * ````md
 * ```genui
 * { "widget": "math_block", "version": 2, "prefetch": "eager", "props": { "content": "a^2+b^2=c^2" } }
 * ```
 * ````
 *
 * Widgets are **host-registered, lazy, and schema-validated**. Unknown widgets
 * degrade to an inert code block. Prefetch is split into component (code) vs.
 * data, with `eager` / `visible` / `idle` policies; the **registry policy
 * overrides the wire hint**. Mount + data fetch are gated on `streaming` and a
 * complete/valid payload (a `MCPToolCall`-style pending card shows until then).
 */

import * as React from 'react';
import { useTextRenderContext } from '../render/renderContext';
import type {
  GenUIBlockPayload,
  GenUIPrefetchPolicy,
  GenUIRegistry,
  GenUIWidgetEntry,
  GenUIWidgetProps,
  StandardSchemaV1,
  SuperChatRenderPlugin,
} from '../types';

const GENUI_TAG = 'genui-widget';

// ---------------------------------------------------------------------------
// rehype transformer: <pre><code class="language-genui">…</code></pre>
//   → <genui-widget>{json text}</genui-widget>
// Running this before sanitize (and allow-listing the tag) keeps the pipeline
// free of `pre`/`code` component override conflicts with the code plugin. The
// payload rides as a text child (not a data-* attribute) to avoid hast property
// name conversion surprises through sanitize + react-markdown.
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

function isGenuiPre(node: HastNode): boolean {
  if (node.tagName !== 'pre') return false;
  const code = node.children?.find((c) => c.tagName === 'code');
  const className = code?.properties?.className;
  const classes = Array.isArray(className) ? className : [className];
  return classes.some(
    (c) => typeof c === 'string' && (c === 'language-genui' || c === 'genui')
  );
}

function rehypeGenui() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (isGenuiPre(child)) {
          const code = child.children?.find((c) => c.tagName === 'code');
          const raw = code ? textOf(code) : '';
          return {
            type: 'element',
            tagName: GENUI_TAG,
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
      data-slot="superchat-genui-pending"
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
      data-slot="superchat-genui-fallback"
      className="my-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-sm text-neutral-100 dark:bg-neutral-950"
    >
      <code>{raw}</code>
    </pre>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      data-slot="superchat-genui-error"
      role="alert"
      className="my-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300"
    >
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payload parsing + schema validation
// ---------------------------------------------------------------------------

function parsePayload(
  raw: string
): { ok: true; value: GenUIBlockPayload } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false };
  try {
    const value = JSON.parse(trimmed) as GenUIBlockPayload;
    if (!value || typeof value.widget !== 'string') return { ok: false };
    return { ok: true, value };
  } catch {
    // Incomplete JSON (still streaming) or malformed.
    return { ok: false };
  }
}

async function validate<T>(
  schema: StandardSchemaV1<T> | undefined,
  data: unknown
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  if (!schema) return { ok: true, value: data as T };
  const result = await schema['~standard'].validate(data);
  if ('issues' in result && result.issues) {
    return {
      ok: false,
      message: result.issues.map((i) => i.message).join('; ') || 'Invalid widget payload',
    };
  }
  return { ok: true, value: (result as { value: T }).value };
}

// ---------------------------------------------------------------------------
// Widget loader (code prefetch policy)
// ---------------------------------------------------------------------------

function usePrefetchTrigger(
  policy: GenUIPrefetchPolicy,
  ref: React.RefObject<HTMLElement | null>
): boolean {
  const [ready, setReady] = React.useState(policy === 'eager');

  React.useEffect(() => {
    if (ready) return;
    if (policy === 'idle') {
      const requestIdle = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void) => number;
          cancelIdleCallback?: (id: number) => void;
        }
      ).requestIdleCallback;
      const cancelIdle = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void) => number;
          cancelIdleCallback?: (id: number) => void;
        }
      ).cancelIdleCallback;
      let idleId: number | null = null;
      let timeoutId: number | null = null;
      if (requestIdle) {
        idleId = requestIdle(() => setReady(true));
      } else {
        timeoutId = window.setTimeout(() => setReady(true), 200);
      }
      return () => {
        if (idleId !== null && cancelIdle) cancelIdle(idleId);
        if (timeoutId !== null) window.clearTimeout(timeoutId);
      };
    }
    // 'visible'
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setReady(true);
        obs.disconnect();
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [policy, ready, ref]);

  return ready;
}

interface GenUIBlockProps {
  raw: string;
  registry: GenUIRegistry;
}

function GenUIBlock({ raw, registry }: GenUIBlockProps) {
  const { messageId, streaming } = useTextRenderContext();
  const placeholderRef = React.useRef<HTMLDivElement>(null);

  const parsed = React.useMemo(() => parsePayload(raw), [raw]);
  const entry: GenUIWidgetEntry | undefined = parsed.ok
    ? registry[parsed.value.widget]
    : undefined;

  // Registry policy overrides the wire hint; default to 'visible'.
  const policy: GenUIPrefetchPolicy =
    entry?.prefetch ?? (parsed.ok ? parsed.value.prefetch : undefined) ?? 'visible';

  const codeReady = usePrefetchTrigger(policy, placeholderRef);

  const [Loaded, setLoaded] =
    React.useState<React.ComponentType<GenUIWidgetProps> | null>(null);
  const [validated, setValidated] = React.useState<
    { ok: true; value: unknown } | { ok: false; message: string } | null
  >(null);

  // Component (code) prefetch — may run while streaming.
  React.useEffect(() => {
    if (!entry || !codeReady) return;
    let active = true;
    void entry
      .component()
      .then((m) => {
        if (active) setLoaded(() => m.default);
      })
      .catch(() => {
        if (active) setValidated({ ok: false, message: 'Failed to load widget' });
      });
    return () => {
      active = false;
    };
  }, [entry, codeReady]);

  // Data validation/prefetch — only once payload is complete AND not streaming.
  React.useEffect(() => {
    if (!entry || !parsed.ok || streaming) return;
    let active = true;
    const props = parsed.value.props;
    void (async () => {
      const result = await validate(entry.schema, props);
      if (!active) return;
      if (result.ok && entry.prefetchData) {
        try {
          await entry.prefetchData(result.value);
        } catch {
          /* non-fatal: data prefetch is best-effort */
        }
      }
      if (active) setValidated(result);
    })();
    return () => {
      active = false;
    };
  }, [entry, parsed, streaming]);

  // Unknown widget or unparseable-yet-complete payload → inert fallback.
  if (!parsed.ok) {
    if (streaming) {
      return (
        <div ref={placeholderRef}>
          <PendingCard label="Preparing widget…" />
        </div>
      );
    }
    return <InertFallback raw={raw} />;
  }

  if (parsed.ok && !entry) return <InertFallback raw={raw} />;

  // Still streaming or payload incomplete → pending card (keep ref mounted so
  // the visible/idle prefetch trigger can fire).
  if (streaming || !Loaded || !validated) {
    return (
      <div ref={placeholderRef}>
        <PendingCard label="Preparing widget…" />
      </div>
    );
  }

  if (!validated.ok) return <ErrorCard message={validated.message} />;

  const meta = {
    name: parsed.value.widget,
    version: parsed.value.version,
    messageId,
    streaming,
  };

  return <Loaded data={validated.value} meta={meta} />;
}

// ---------------------------------------------------------------------------
// Plugin factory
// ---------------------------------------------------------------------------

/** Create the GenUI render plugin from a host widget registry. */
export function createGenUIPlugin(
  registry: GenUIRegistry
): SuperChatRenderPlugin {
  const GenUIWidgetComponent = (props: Record<string, unknown>) => {
    const raw = React.Children.toArray(props.children as React.ReactNode)
      .filter((c): c is string => typeof c === 'string')
      .join('');
    return <GenUIBlock raw={raw} registry={registry} />;
  };

  return {
    name: 'genui',
    rehypePlugins: [rehypeGenui],
    components: {
      [GENUI_TAG]: GenUIWidgetComponent,
    },
    sanitizeSchema: {
      tagNames: [GENUI_TAG],
    },
  };
}

export { GENUI_TAG };
export type { GenUIRegistry, GenUIWidgetEntry, GenUIWidgetProps };
