import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

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
  viteFinal: async (config) => {
    // wcdatavis nested dependency root
    const wcdatavisNodeModules = path.resolve(process.cwd(), 'node_modules/wcdatavis/node_modules');

    // Use our shim that works around the broken Perspective export in wcdatavis index.js
    // and ensures Vite uses ESM exports instead of the "browser" field (window.MIE globals).
    // Only alias the EXACT bare specifier 'wcdatavis', not 'wcdatavis/src/...' sub-paths.
    config.resolve = config.resolve || {};
    const existingAliases = Array.isArray(config.resolve.alias)
      ? config.resolve.alias
      : Object.entries(config.resolve.alias || {}).map(([find, replacement]) => ({ find, replacement }));
    config.resolve.alias = [
      ...existingAliases,
      {
        find: /^wcdatavis$/,
        replacement: path.resolve(process.cwd(), 'src/components/DataVis/wcdatavis-shim.js'),
      },
      {
        find: /^@mieweb\/wcdatavis$/,
        replacement: path.resolve(process.cwd(), 'src/components/DataVis/wcdatavis-shim.js'),
      },
      // Resolve wcdatavis's jQuery plugins from its nested node_modules so they
      // extend the same jQuery instance the source files import
      { find: /^jquery-ui(.*)$/, replacement: path.join(wcdatavisNodeModules, 'jquery-ui$1') },
      { find: /^jquery-contextmenu$/, replacement: path.join(wcdatavisNodeModules, 'jquery-contextmenu') },
      { find: /^sumoselect$/, replacement: path.join(wcdatavisNodeModules, 'sumoselect') },
      { find: /^flatpickr$/, replacement: path.join(wcdatavisNodeModules, 'flatpickr') },
      { find: /^jquery$/, replacement: path.join(wcdatavisNodeModules, 'jquery') },
    ];

    // Pre-bundle wcdatavis and its jQuery plugins
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      'wcdatavis/src/source.js',
      'wcdatavis/src/computed_view.js',
      'wcdatavis/src/grid.js',
      'wcdatavis/src/graph.js',
      'wcdatavis/src/prefs.js',
    ];
    return config;
  },
};

export default config;
