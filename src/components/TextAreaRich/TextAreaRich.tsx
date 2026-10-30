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
 * This main-bundle export is backed by the legacy `RichTextEditor` engine so
 * it works with zero optional peers or extra CSS. A Kerebron (ProseMirror)
 * engine with the same props contract ships from `@mieweb/ui/kerebron` —
 * install the `@kerebron/*` peers, import `@mieweb/ui/kerebron.css`, and
 * switch the import path to upgrade deliberately. The value contract is
 * identical either way: `value`/`onChange` carry **HTML**, not plain text.
 * Need plain text for form posts or native bindings — use `Textarea`. Need
 * the full always-on document toolbar — use `RichEditor`.
 */
const TextAreaRich: Surface = TextAreaRichLegacy;

export { TextAreaRich };
