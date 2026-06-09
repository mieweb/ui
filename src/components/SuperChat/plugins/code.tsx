/**
 * SuperChat code plugin (opt-in).
 *
 * Syntax-highlights fenced code blocks with `rehype-highlight` (emits `.hljs-*`
 * classes that map to `--mieweb-*` theme tokens for light/dark), and adds a copy
 * button. `shiki` is reserved as an upgrade path if highlight fidelity disappoints.
 */

import * as React from 'react';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '../../../utils/cn';
import type { SuperChatRenderPlugin } from '../types';

function CopyablePre({
  node: _node,
  ...props
}: React.ComponentProps<'pre'> & { node?: unknown }) {
  const ref = React.useRef<React.ComponentRef<'pre'>>(null);
  const [copied, setCopied] = React.useState(false);

  const onCopy = React.useCallback(() => {
    const text = ref.current?.innerText ?? '';
    if (!text) return;
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return (
    <div data-slot="superchat-code" className="group relative my-2">
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute top-2 right-2 rounded-md bg-neutral-700/80 px-2 py-1 text-xs text-neutral-100 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-600 focus-visible:opacity-100"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre
        {...props}
        ref={ref}
        className={cn(
          'overflow-x-auto rounded-lg bg-neutral-900 p-3 text-sm text-neutral-100 dark:bg-neutral-950',
          props.className
        )}
      />
    </div>
  );
}

/** Create the syntax-highlighting + copy-button render plugin. */
export function createCodePlugin(): SuperChatRenderPlugin {
  return {
    name: 'code',
    // `detect: false` + ignoreMissing keeps it predictable for streamed output.
    rehypePlugins: [[rehypeHighlight, { detect: false, ignoreMissing: true }]],
    components: {
      pre: CopyablePre as React.ComponentType<Record<string, unknown>>,
    },
    // `.hljs-*` token classes are already permitted by the base schema's
    // broadened `className` allow-list on code/pre/span.
    sanitizeSchema: {
      attributes: {
        code: ['className'],
        span: ['className'],
      },
    },
  };
}
