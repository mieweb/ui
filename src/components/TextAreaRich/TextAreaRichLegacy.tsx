import * as React from 'react';
import { cn } from '../../utils/cn';
import { RichTextEditor } from '../RichTextEditor';
import type { TextAreaRichProps } from './TextAreaRich';

/**
 * The original `RichTextEditor`-backed TextAreaRich surface. Kept as the
 * fallback engine while the Kerebron surface rolls out: `TextAreaRich`
 * renders this when the optional `@kerebron/*` peers are not installed, and
 * `Textarea` uses it directly (its plain-text resync writes `innerHTML`
 * into the editable region, which would corrupt a ProseMirror view).
 */
const TextAreaRichLegacy = React.forwardRef<HTMLDivElement, TextAreaRichProps>(
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

TextAreaRichLegacy.displayName = 'TextAreaRichLegacy';

export { TextAreaRichLegacy };
