import * as React from 'react';
import type { Decorator } from '@storybook/react-vite';
import { Alert, AlertTitle, AlertDescription } from '../Alert';

/**
 * Markdown deprecation notice shared by the AGGrid story docs pages.
 */
export const DEPRECATION_NOTICE =
  '> ⚠️ **Deprecated** — AGGrid is deprecated. Use **DataVis NITRO** (`@mieweb/ui/datavis`) for all tables. AGGrid will be removed in a future major release.';

/**
 * Storybook decorator that renders a warning banner above every AGGrid story.
 */
export const withDeprecationBanner: Decorator = (Story) => (
  <div className="space-y-4">
    <Alert variant="warning">
      <AlertTitle>Deprecated</AlertTitle>
      <AlertDescription>
        AGGrid is deprecated. Use DataVis NITRO (<code>@mieweb/ui/datavis</code>
        ) for all tables.
      </AlertDescription>
    </Alert>
    <Story />
  </div>
);
