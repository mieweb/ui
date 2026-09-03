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
    // `navigator.clipboard` is undefined in non-secure contexts; guard the
    // optional-chained call (which would be `undefined`, not a promise) and
    // swallow rejection so copy stays best-effort and never breaks render.
    const copy = navigator.clipboard?.writeText(text);
    if (!copy) return;
    void copy.then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
      () => {
        /* clipboard write rejected (permissions / non-secure context) */
      }
    );
  }, []);

  return (
    <div data-slot="superchat-code" className="group relative my-2">
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute top-2 right-2 rounded-md border border-neutral-300 bg-white/80 px-2 py-1 text-xs text-neutral-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-neutral-100 focus-visible:opacity-100 dark:border-neutral-600 dark:bg-neutral-700/80 dark:text-neutral-100 dark:hover:bg-neutral-600"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre
        {...props}
        ref={ref}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable code blocks need keyboard focus for horizontal scrolling
        tabIndex={0}
        className={cn(
          // Background/text follow the theme so light mode matches the
          // atom-one-light hljs palette (dark background looked out of place).
          'overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-800 dark:border-transparent dark:bg-neutral-900 dark:text-neutral-100',
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
