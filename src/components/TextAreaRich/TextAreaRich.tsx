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

// Warn once per session (dev builds only) that the legacy-engine TextAreaRich
// is deprecated. Bundlers replace `process.env.NODE_ENV` at build time, so
// this entire branch is dead-code-eliminated from production bundles.
let didWarnDeprecated = false;
function warnDeprecatedOnce() {
  if (process.env.NODE_ENV === 'production' || didWarnDeprecated) return;
  didWarnDeprecated = true;
  console.warn(
    '[@mieweb/ui] TextAreaRich (main bundle, legacy engine) is deprecated. Use the Kerebron-engined TextAreaRich from @mieweb/ui/kerebron.'
  );
}

/**
 * A textarea-like rich text surface: looks like the auto-growing `Textarea`
 * (bordered, single Input row tall, grows with content) but is a rich editor
 * underneath — toolbar hidden until requested, markdown block shortcuts
 * (`##` + space → heading…), the Notion-style block gutter menu, and
 * `.shortcut` macro expansion when `macros` is provided.
 *
 * @deprecated Use the Kerebron-engined `TextAreaRich` from
 * `@mieweb/ui/kerebron` instead — the same `TextAreaRichProps` contract on
 * the ProseMirror engine: install the `@kerebron/*` peers, import
 * `@mieweb/ui/kerebron.css`, and switch the import path. This legacy
 * `document.execCommand` surface will be removed in a future major release
 * (mieweb/ui#677).
 *
 * The value contract is identical either way: `value`/`onChange` carry
 * **HTML**, not plain text. Need plain text for form posts or native
 * bindings — use `Textarea`. Need the full always-on document toolbar —
 * use `RichEditor`.
 */
const TextAreaRich: Surface = React.forwardRef<
  HTMLDivElement,
  TextAreaRichProps
>((props, ref) => {
  warnDeprecatedOnce();
  return <TextAreaRichLegacy ref={ref} {...props} />;
});

TextAreaRich.displayName = 'TextAreaRich';

export { TextAreaRich };
