import type { Preview } from '@storybook/react';
import '../src/styles/base.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0a0a0a',
        },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.backgrounds?.value === '#0a0a0a';
      return (
        <div data-theme={isDark ? 'dark' : 'light'} className={isDark ? 'dark' : ''}>
          <div className="p-4 bg-background text-foreground min-h-screen">
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;
