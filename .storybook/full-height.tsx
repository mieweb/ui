import React from 'react';
import type { Decorator } from '@storybook/react-vite';

/**
 * Fills the Storybook canvas so page-level chat surfaces render like a real
 * app screen: the composer is anchored to the bottom of the viewport and the
 * thread scrolls above it (issue #504). `100dvh` tracks the *visible* viewport
 * on mobile, where the browser chrome collapses. Docs view keeps the previous
 * bounded height so inline examples in the autodocs page stay readable.
 *
 * Pair with `parameters: { layout: 'fullscreen' }` — the default padded
 * layout would add margins around the wrapper and cause a scrollbar.
 */
export const fullHeightChat: Decorator = (Story, context) => (
  <div
    style={{
      height: context.viewMode === 'docs' ? 600 : '100dvh',
      display: 'flex',
    }}
  >
    <Story />
  </div>
);
