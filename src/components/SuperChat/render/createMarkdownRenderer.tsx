/**
 * SuperChat Markdown render composer.
 *
 * Composes a list of {@link SuperChatRenderPlugin}s into a single
 * {@link AIRenderTextContent} implementation that plugs into the AI module's
 * `renderTextContent` seam. Ships **Markdown core** (GFM) with `rehype-sanitize`
 * applied to untrusted model/agent output. Math / code / GenUI / NITRO / mermaid
 * are added by passing the corresponding opt-in plugins.
 *
 * The host owns the trust boundary: untrusted content is always sanitized via an
 * allow-list schema, extended by each plugin's `sanitizeSchema` so token
 * classNames (syntax highlighting) and KaTeX markup survive.
 */

import * as React from 'react';
import Markdown, {
  defaultUrlTransform,
  type Components,
  type Options,
} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { cn } from '../../../utils/cn';
import { TextRenderContext } from './renderContext';
import type {
  AIRenderTextContent,
  AITextRenderContext,
  SuperChatRenderPlugin,
} from '../types';

type PluggableList = NonNullable<Options['remarkPlugins']>;
type SanitizeSchema = Record<string, unknown>;

/**
 * Minimal mdast node shape we touch when splitting soft line breaks. Kept local
 * so the renderer stays free of extra `unist`/`mdast` util dependencies.
 */
interface MdastNode {
  type: string;
  value?: string;
  children?: MdastNode[];
}

/**
 * A self-contained `remark-breaks` equivalent: turns soft line breaks (single
 * `\n` inside a paragraph) into hard breaks so chat messages preserve the
 * newlines the author typed — the expected behavior for messaging UIs, where
 * Markdown's default "collapse single newlines to spaces" is surprising.
 *
 * Only `text` nodes are split, so fenced/inline code (which carry their value
 * on non-`text` nodes) and existing hard breaks are left untouched.
 */
function remarkPreserveLineBreaks() {
  const splitNode = (node: MdastNode): void => {
    if (!node.children) return;
    const next: MdastNode[] = [];
    for (const child of node.children) {
      if (child.type === 'text' && child.value && child.value.includes('\n')) {
        const segments = child.value.split('\n');
        segments.forEach((segment, i) => {
          if (i > 0) next.push({ type: 'break' });
          if (segment) next.push({ type: 'text', value: segment });
        });
      } else {
        splitNode(child);
        next.push(child);
      }
    }
    node.children = next;
  };
  return (tree: MdastNode) => splitNode(tree);
}

/**
 * A sanitize schema that, on top of the library default, lets syntax-highlight
 * token classes (`hljs-*`) and `language-*` survive on `code`/`pre`/`span`.
 */
function baseSanitizeSchema(): SanitizeSchema {
  const schema = JSON.parse(JSON.stringify(defaultSchema)) as SanitizeSchema;
  const attributes = (schema.attributes ?? {}) as Record<string, unknown[]>;

  const allowClass = (tag: string) => {
    const existing = (attributes[tag] ?? []) as unknown[];
    // Drop any prior restricted className rule, allow className broadly.
    const withoutClass = existing.filter(
      (a) => !(Array.isArray(a) && a[0] === 'className')
    );
    attributes[tag] = [...withoutClass, 'className'];
  };

  allowClass('code');
  allowClass('pre');
  allowClass('span');
  allowClass('div');

  schema.attributes = attributes;
  return schema;
}

/** Shallow-merge a plugin's sanitize contribution into the running schema. */
function mergeSanitizeSchema(
  base: SanitizeSchema,
  extra?: SanitizeSchema
): SanitizeSchema {
  if (!extra) return base;
  const out: SanitizeSchema = { ...base };

  // tagNames: union
  if (Array.isArray(extra.tagNames)) {
    const a = (base.tagNames as string[] | undefined) ?? [];
    out.tagNames = Array.from(new Set([...a, ...(extra.tagNames as string[])]));
  }

  // attributes: per-tag concat
  if (extra.attributes && typeof extra.attributes === 'object') {
    const baseAttrs = {
      ...((base.attributes as Record<string, unknown[]>) ?? {}),
    };
    for (const [tag, attrs] of Object.entries(
      extra.attributes as Record<string, unknown[]>
    )) {
      baseAttrs[tag] = [...(baseAttrs[tag] ?? []), ...attrs];
    }
    out.attributes = baseAttrs;
  }

  // protocols: per-attribute union (e.g. allow `data:`/`blob:` image src)
  if (extra.protocols && typeof extra.protocols === 'object') {
    const baseProtocols = {
      ...((base.protocols as Record<string, string[]>) ?? {}),
    };
    for (const [attr, protocols] of Object.entries(
      extra.protocols as Record<string, string[]>
    )) {
      baseProtocols[attr] = Array.from(
        new Set([...(baseProtocols[attr] ?? []), ...protocols])
      );
    }
    out.protocols = baseProtocols;
  }

  // any other keys (clobber)
  for (const [k, v] of Object.entries(extra)) {
    if (k === 'tagNames' || k === 'attributes' || k === 'protocols') continue;
    out[k] = v;
  }
  return out;
}

/** Default node components, themed with `--mieweb-*` tokens via Tailwind. */
function baseComponents(): Components {
  return {
    a: ({ node: _node, children, ...props }) => (
      <a
        {...props}
        className={cn(
          'text-primary-700 hover:text-primary-800 dark:text-primary-300 underline underline-offset-2',
          props.className
        )}
        // External model output: open links safely.
        target={props.target ?? '_blank'}
        rel={props.rel ?? 'noopener noreferrer'}
      >
        {children}
      </a>
    ),
    pre: ({ node: _node, ...props }) => (
      <pre
        {...props}
        className={cn(
          'overflow-x-auto rounded-lg bg-neutral-900 p-3 text-sm text-neutral-100 dark:bg-neutral-950',
          props.className
        )}
      />
    ),
    code: ({ node: _node, ...props }) => {
      const isBlock =
        typeof props.className === 'string' &&
        props.className.includes('language-');
      return (
        <code
          {...props}
          className={cn(
            !isBlock &&
              'rounded bg-neutral-200 px-1 py-0.5 text-[0.85em] dark:bg-neutral-700',
            props.className
          )}
        />
      );
    },
    table: ({ node: _node, ...props }) => (
      <div className="my-2 overflow-x-auto">
        <table
          {...props}
          className={cn(
            'w-full border-collapse text-sm [&_td]:border [&_td]:border-neutral-200 [&_td]:px-2 [&_td]:py-1 dark:[&_td]:border-neutral-700 [&_th]:border [&_th]:border-neutral-200 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left dark:[&_th]:border-neutral-700',
            props.className
          )}
        />
      </div>
    ),
    // Tailwind's preflight resets list markers/padding; restore them explicitly
    // so bullets/numbers show without depending on the typography plugin.
    ul: ({ node: _node, ...props }) => (
      <ul {...props} className={cn('list-disc ps-5', props.className)} />
    ),
    ol: ({ node: _node, ...props }) => (
      <ol {...props} className={cn('list-decimal ps-5', props.className)} />
    ),
    li: ({ node: _node, ...props }) => (
      <li {...props} className={cn('ps-1', props.className)} />
    ),
    // Preflight also flattens headings to body size/weight; restore a sensible
    // hierarchy without depending on the typography plugin.
    h1: ({ node: _node, children, ...props }) => (
      <h1
        {...props}
        className={cn('mt-3 mb-1 text-xl font-semibold', props.className)}
      >
        {children}
      </h1>
    ),
    h2: ({ node: _node, children, ...props }) => (
      <h2
        {...props}
        className={cn('mt-3 mb-1 text-lg font-semibold', props.className)}
      >
        {children}
      </h2>
    ),
    h3: ({ node: _node, children, ...props }) => (
      <h3
        {...props}
        className={cn('mt-2 mb-1 text-base font-semibold', props.className)}
      >
        {children}
      </h3>
    ),
    h4: ({ node: _node, children, ...props }) => (
      <h4
        {...props}
        className={cn('mt-2 mb-1 text-sm font-semibold', props.className)}
      >
        {children}
      </h4>
    ),
    h5: ({ node: _node, children, ...props }) => (
      <h5
        {...props}
        className={cn('mt-2 mb-1 text-sm font-semibold', props.className)}
      >
        {children}
      </h5>
    ),
    h6: ({ node: _node, children, ...props }) => (
      <h6
        {...props}
        className={cn(
          'mt-2 mb-1 text-xs font-semibold tracking-wide uppercase',
          props.className
        )}
      >
        {children}
      </h6>
    ),
    hr: ({ node: _node, ...props }) => (
      <hr
        {...props}
        className={cn(
          'my-2 border-neutral-300 dark:border-neutral-600',
          props.className
        )}
      />
    ),
  };
}

export interface CreateMarkdownRendererOptions {
  /** Opt-in rich plugins (code, math, genui, nitro, mermaid, …). */
  plugins?: SuperChatRenderPlugin[];
  /**
   * Disable sanitization. **Only** set this when the content is fully trusted
   * (e.g. authored by the host, never model output). Defaults to `false`.
   */
  trusted?: boolean;
}

/**
 * Build an {@link AIRenderTextContent} from a set of render plugins.
 *
 * @example
 * const render = createMarkdownRenderer({ plugins: [createCodePlugin(), createMathPlugin()] });
 * <AIChat renderTextContent={render} … />
 */
export function createMarkdownRenderer(
  options: CreateMarkdownRendererOptions = {}
): AIRenderTextContent {
  const { plugins = [], trusted = false } = options;

  const remarkPlugins: PluggableList = [
    remarkGfm,
    remarkPreserveLineBreaks,
    ...plugins.flatMap((p) => (p.remarkPlugins ?? []) as PluggableList),
  ];

  const pluginRehype: PluggableList = plugins.flatMap(
    (p) => (p.rehypePlugins ?? []) as PluggableList
  );

  const sanitizeSchema = plugins.reduce<SanitizeSchema>(
    (acc, p) => mergeSanitizeSchema(acc, p.sanitizeSchema),
    baseSanitizeSchema()
  );

  // Sanitize must run AFTER highlight/katex so their classNames are present to
  // be allow-listed, then stripped of anything not permitted.
  const rehypePlugins: PluggableList = trusted
    ? pluginRehype
    : [...pluginRehype, [rehypeSanitize, sanitizeSchema]];

  const components: Components = plugins.reduce<Components>(
    (acc, p) => ({ ...acc, ...(p.components as Components | undefined) }),
    baseComponents()
  );

  const MarkdownRenderer = (text: string, ctx: AITextRenderContext) => (
    <MarkdownContent
      key={ctx.messageId}
      text={text}
      messageId={ctx.messageId}
      streaming={ctx.streaming}
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins as Options['rehypePlugins']}
      components={components}
    />
  );

  return MarkdownRenderer;
}

/**
 * react-markdown's default `urlTransform` drops `data:`/`blob:` URLs, which
 * would strip pasted/attached images before sanitization runs. Permit those
 * two protocols for image `src` only (sanitization still gates the final
 * markup); everything else keeps react-markdown's safe defaults.
 */
const transformUrl: NonNullable<Options['urlTransform']> = (url, key, node) => {
  if (
    key === 'src' &&
    node.tagName === 'img' &&
    (/^data:image\//i.test(url) || /^blob:/i.test(url))
  ) {
    return url;
  }
  return defaultUrlTransform(url);
};

interface MarkdownContentProps {
  text: string;
  messageId: string;
  streaming: boolean;
  remarkPlugins: Options['remarkPlugins'];
  rehypePlugins: Options['rehypePlugins'];
  components: Components;
}

const MarkdownContent = React.memo(function MarkdownContent({
  text,
  messageId,
  streaming,
  remarkPlugins,
  rehypePlugins,
  components,
}: MarkdownContentProps) {
  return (
    <TextRenderContext.Provider value={{ messageId, streaming }}>
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        urlTransform={transformUrl}
        components={components}
      >
        {text}
      </Markdown>
    </TextRenderContext.Provider>
  );
});
