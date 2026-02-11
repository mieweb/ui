import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import fs from 'fs';

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
    const dataVisDir = path.resolve(process.cwd(), 'src/components/DataVis');
    const wcdatavisSrc = path.resolve(process.cwd(), 'node_modules/wcdatavis/src');
    const wcdatavisAvailable = fs.existsSync(wcdatavisSrc);

    config.resolve = config.resolve || {};
    const existingAliases = Array.isArray(config.resolve.alias)
      ? config.resolve.alias
      : Object.entries(config.resolve.alias || {}).map(([find, replacement]) => ({ find, replacement }));

    if (wcdatavisAvailable) {
      // Full wcdatavis integration — shim loads jQuery globals + plugins,
      // then re-exports wcdatavis classes for the DataVis component.
      const wcdatavisNodeModules = path.resolve(process.cwd(), 'node_modules/wcdatavis/node_modules');

      config.resolve.alias = [
        ...existingAliases,
        {
          find: /^wcdatavis$/,
          replacement: path.resolve(dataVisDir, 'wcdatavis-shim.js'),
        },
        {
          find: /^@mieweb\/wcdatavis$/,
          replacement: path.resolve(dataVisDir, 'wcdatavis-shim.js'),
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
    } else {
      // wcdatavis not installed (CI, fresh checkouts) — alias to lightweight
      // stubs so the Storybook build completes. DataVis stories will render
      // an error state instead of the live grid.
      config.resolve.alias = [
        ...existingAliases,
        { find: /^wcdatavis\/dist\/wcdatavis\.css/, replacement: path.resolve(dataVisDir, 'wcdatavis-stub.css') },
        { find: /^wcdatavis$/, replacement: path.resolve(dataVisDir, 'wcdatavis-stub.js') },
        { find: /^@mieweb\/wcdatavis$/, replacement: path.resolve(dataVisDir, 'wcdatavis-stub.js') },
      ];
    }

    return config;
  },
};

export default config;
