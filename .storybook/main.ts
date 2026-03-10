import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-docs'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {},
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  staticDirs: ['./public'],
  async viteFinal(config) {
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      'jquery',
      'jquery-ui',
      'block-ui',
      'flatpickr',
      'jquery-contextmenu',
      'sumoselect',
      'wcdatavis/src/source.js',
      'wcdatavis/src/computed_view.js',
      'wcdatavis/src/grid.js',
    ];
    config.optimizeDeps.esbuildOptions = config.optimizeDeps.esbuildOptions || {};
    config.optimizeDeps.esbuildOptions.define = {
      ...config.optimizeDeps.esbuildOptions.define,
      // Some jQuery plugins reference the bare global `jQuery` — tell esbuild
      // to rewrite it to `window.jQuery` so it survives bundling.
      jQuery: 'window.jQuery',
    };
    return config;
  },
};

export default config;
