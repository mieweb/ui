import * as React from 'react';
import type { RichTextEditorProps } from '../RichTextEditor';
import { TextAreaRichLegacy } from './TextAreaRichLegacy';

export interface TextAreaRichProps extends Omit<
  RichTextEditorProps,
  'chromeless' | 'blockMenu' | 'defaultToolbar'
> {
  /**
   * Initial toolbar visibility when `toolbar` is uncontrolled. TextAreaRich
   * is chromeless, so this defaults to `'hidden'`; the block gutter menu's
   * "Show toolbar" reveals it on demand.
   */
  defaultToolbar?: 'visible' | 'hidden';
}

type Surface = React.ForwardRefExoticComponent<
  TextAreaRichProps & React.RefAttributes<HTMLDivElement>
>;

/**
 * A textarea-like rich text surface: looks like the auto-growing `Textarea`
 * (bordered, single Input row tall, grows with content) but is a rich editor
 * underneath — toolbar hidden until requested, markdown block shortcuts
 * (`##` + space → heading…), the Notion-style block gutter menu, and
 * `.shortcut` macro expansion when `macros` is provided.
 *
 * The editing engine is Kerebron (ProseMirror) when the optional
 * `@kerebron/*` peers are installed; otherwise it degrades to the legacy
 * `RichTextEditor` engine. The value contract is identical either way:
 * `value`/`onChange` carry **HTML**, not plain text. Need plain text for
 * form posts or native bindings — use `Textarea`. Need the full always-on
 * document toolbar — use `RichEditor`.
 */
const TextAreaRich = React.forwardRef<HTMLDivElement, TextAreaRichProps>(
  (props, ref) => {
    // The Kerebron surface loads lazily so `@kerebron/*` stays an optional
    // peer of the main barrel. Until it lands (or when the peers are absent
    // and the chunk fails to resolve) the legacy engine renders — fully
    // functional, same props, same chrome.
    const [surface, setSurface] = React.useState<Surface | null>(null);
    React.useEffect(() => {
      let cancelled = false;
      import('./TextAreaRichKerebron')
        .then((module_) => {
          if (!cancelled) setSurface(() => module_.TextAreaRichKerebron);
        })
        .catch(() => {
          // Peers not installed — stay on the legacy engine.
        });
      return () => {
        cancelled = true;
      };
    }, []);

    const Component = surface ?? TextAreaRichLegacy;
    return <Component ref={ref} {...props} />;
  }
);

TextAreaRich.displayName = 'TextAreaRich';

export { TextAreaRich };
