import * as React from 'react';
import type { Decorator } from '@storybook/react-vite';
import { Alert, AlertTitle, AlertDescription } from '../Alert';

/**
 * Markdown deprecation notice shared by the legacy TextAreaRich story docs page.
 */
export const DEPRECATION_NOTICE =
  '> ⚠️ **Deprecated** — the legacy-engine `TextAreaRich` is deprecated. Use [TextAreaRich (Kerebron)](?path=/docs/editors-textarearich-kerebron--docs) from `@mieweb/ui/kerebron` — the same `TextAreaRichProps` contract on the ProseMirror engine; upgrading is an import-path change plus the `@kerebron/*` peers and `@mieweb/ui/kerebron.css`. The legacy surface will be removed in a future major release.';

/**
 * Storybook decorator that renders a warning banner above every legacy
 * TextAreaRich story.
 */
export const withDeprecationBanner: Decorator = (Story) => (
  <div className="space-y-4">
    <Alert variant="warning">
      <AlertTitle>Deprecated</AlertTitle>
      <AlertDescription>
        The legacy-engine TextAreaRich is deprecated. Use TextAreaRich from{' '}
        <code>@mieweb/ui/kerebron</code> instead.
      </AlertDescription>
    </Alert>
    <Story />
  </div>
);
