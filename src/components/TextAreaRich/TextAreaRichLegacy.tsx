import * as React from 'react';
import { cn } from '../../utils/cn';
import { RichTextEditor } from '../RichTextEditor';
import type { TextAreaRichProps } from './TextAreaRich';

/**
 * The original `RichTextEditor`-backed TextAreaRich surface: the engine
 * behind the deprecated main-bundle `TextAreaRich`. Since 0.12 the
 * Kerebron engine (`TextAreaRichKerebron`) powers both `TextAreaRich` from
 * `@mieweb/ui/kerebron` and the main bundle's `Textarea`; this surface
 * remains only for the deprecated export and as the jsdom test stand-in
 * (src/test/textAreaRichKerebronStub).
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
