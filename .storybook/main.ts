import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';

const storybookDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(storybookDir, '..');
const rootNodeModulesDir = path.join(workspaceRoot, 'node_modules');
const pnpmVirtualNodeModulesDir = path.join(rootNodeModulesDir, '.pnpm/node_modules');

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readDependencyNames(packageDirName: 'datavis' | 'wcdatavis'): string[] {
  const packageJsonPath = path.join(rootNodeModulesDir, packageDirName, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    dependencies?: Record<string, string>;
  };

  return Object.keys(packageJson.dependencies ?? {});
}

const datavisDependencyNames = Array.from(
  new Set([...readDependencyNames('datavis'), ...readDependencyNames('wcdatavis')]),
);

const missingRootDependencies = datavisDependencyNames.filter(
  (dependencyName) => !existsSync(path.join(rootNodeModulesDir, dependencyName)),
);

const datavisDependencyAliases = missingRootDependencies
  .filter((dependencyName) => existsSync(path.join(pnpmVirtualNodeModulesDir, dependencyName)))
  .map((dependencyName) => ({
    find: new RegExp(`^${escapeRegExp(dependencyName)}(\/.*)?$`),
    replacement: `${path.join(pnpmVirtualNodeModulesDir, dependencyName)}$1`,
  }));

const localUiAliases = [
  {
    find: /^@mieweb\/ui\/components\/(.+)$/,
    replacement: `${path.join(workspaceRoot, 'src/components')}/$1`,
  },
  {
    find: /^@mieweb\/ui\/styles\.css$/,
    replacement: path.join(workspaceRoot, 'src/styles/base.css'),
  },
  {
    find: /^@mieweb\/ui$/,
    replacement: path.join(workspaceRoot, 'src/index.ts'),
  },
] as const;

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
    config.resolve ??= {};
    config.resolve.alias = [
      ...(Array.isArray(config.resolve.alias)
        ? config.resolve.alias
        : config.resolve.alias
          ? [config.resolve.alias]
          : []),
      ...localUiAliases,
      ...datavisDependencyAliases,
    ];

    config.esbuild = {
      ...config.esbuild,
      jsx: 'automatic',
      jsxImportSource: 'react',
    };

    config.optimizeDeps ??= {};
    config.optimizeDeps.include = Array.from(
      new Set([
        ...(config.optimizeDeps.include ?? []),
        ...missingRootDependencies,
      ]),
    );
    config.optimizeDeps.esbuildOptions = {
      ...config.optimizeDeps.esbuildOptions,
      jsx: 'automatic',
      jsxImportSource: 'react',
    };

    return config;
  },
};

export default config;
