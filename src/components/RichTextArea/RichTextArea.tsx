import * as React from 'react';
import { cn } from '../../utils/cn';
import { RichTextEditor, type RichTextEditorProps } from '../RichTextEditor';

export interface RichTextAreaProps extends Omit<
  RichTextEditorProps,
  'chromeless' | 'blockMenu' | 'defaultToolbar'
> {
  /**
   * Initial toolbar visibility when `toolbar` is uncontrolled. RichTextArea
   * is chromeless, so this defaults to `'hidden'`; the block gutter menu's
   * "Show toolbar" reveals it on demand.
   */
  defaultToolbar?: 'visible' | 'hidden';
}

/**
 * A textarea-like rich text surface: looks like the auto-growing `Textarea`
 * (bordered, single Input row tall, grows with content) but is
 * `RichTextEditor` underneath — toolbar hidden until requested, markdown
 * block shortcuts (`##` + space → heading…), the Notion-style block gutter
 * menu, and `.shortcut` macro expansion when `macros` is provided.
 *
 * The value contract is `RichTextEditor`'s: `value`/`onChange` carry **HTML**,
 * not plain text. Need plain text for form posts or native bindings — use
 * `Textarea`. Need the full always-on toolbar — use `RichTextEditor`.
 */
const RichTextArea = React.forwardRef<HTMLDivElement, RichTextAreaProps>(
  (
    { className, markdownShortcuts = true, defaultToolbar = 'hidden', ...rest },
    ref
  ) => (
    <RichTextEditor
      ref={ref}
      chromeless
      blockMenu
      markdownShortcuts={markdownShortcuts}
      defaultToolbar={defaultToolbar}
      className={cn(
        // Textarea's chrome: border, radius, focus ring (on the wrapper via
        // focus-within since the editable sits inside it).
        'border-input rounded-lg border',
        'transition-colors duration-200',
        'focus-within:ring-ring focus-within:border-transparent focus-within:ring-2',
        className
      )}
      {...rest}
    />
  )
);

RichTextArea.displayName = 'RichTextArea';

export { RichTextArea };
