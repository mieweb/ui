import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import type { StorybookConfig } from '@storybook/react-vite';
import type { Plugin } from 'vite';

const storybookDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(storybookDir, '..');
const monorepoRoot = path.resolve(workspaceRoot, '../..');
const rootNodeModulesDir = path.join(workspaceRoot, 'node_modules');
const pnpmVirtualNodeModulesDir = path.join(monorepoRoot, 'node_modules/.pnpm/node_modules');

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readDependencyNames(packageDirName: string): string[] {
  const packageJsonPath = path.join(rootNodeModulesDir, packageDirName, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return [];
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      dependencies?: Record<string, string>;
    };

    return Object.keys(packageJson.dependencies ?? {});
  } catch {
    return [];
  }
}

const datavisDependencyNames = Array.from(
  new Set(readDependencyNames('@mieweb/datavis')),
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

const esheetPackagesDir = path.join(workspaceRoot, 'packages/esheet/packages');
const esheetSourceAliases = ['core', 'fields', 'adapters', 'builder', 'renderer'].map(
  (pkg) => ({
    find: new RegExp(`^@esheet/${pkg}$`),
    replacement: path.join(esheetPackagesDir, pkg, 'src/index.ts'),
  }),
);

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

const datavisCjsInteropDependencies = [
  'underscore',
  'sprintf-js',
  'bignumber.js',
  'numeral',
  'moment',
  'json-formatter-js',
  'papaparse',
] as const;

const datavisLegacySubpathDependencies = [
  'core-js/es/string/replace-all',
] as const;

function getPackageRootName(dependencyName: string): string {
  if (dependencyName.startsWith('@')) {
    return dependencyName.split('/').slice(0, 2).join('/');
  }

  return dependencyName.split('/')[0] ?? dependencyName;
}

function isLocalNodeModuleDependency(dependencyName: string): boolean {
  return existsSync(path.join(rootNodeModulesDir, getPackageRootName(dependencyName), 'package.json'));
}

// --- YChart virtual:git-info plugin for Storybook ---
function ychartGitInfoPlugin(): Plugin {
  const virtualModuleId = 'virtual:git-info';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'ychart-git-info',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        let commitHash = 'storybook';
        let commitHashFull = 'storybook-dev';
        let repoUrl = 'https://github.com/mieweb/ychart';
        try {
          commitHash = execSync('git -C packages/ychart rev-parse --short HEAD').toString().trim();
          commitHashFull = execSync('git -C packages/ychart rev-parse HEAD').toString().trim();
        } catch { /* use defaults */ }
        return `export const commitHash = ${JSON.stringify(commitHash)};\nexport const commitHashFull = ${JSON.stringify(commitHashFull)};\nexport const repoUrl = ${JSON.stringify(repoUrl)};`;
      }
    },
  };
}

// YChart dependency names for optimizeDeps
const ychartDependencyNames = readDependencyNames('ychart');

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
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
      ...esheetSourceAliases,
    ];

    // Add ychart virtual:git-info plugin
    config.plugins ??= [];
    (config.plugins as Plugin[]).push(ychartGitInfoPlugin());

    // Define __YCHART_VERSION__ global for ychart
    config.define = {
      ...config.define,
      __YCHART_VERSION__: JSON.stringify(
        (() => {
          try {
            const pkg = JSON.parse(readFileSync(path.join(workspaceRoot, 'packages/ychart/package.json'), 'utf-8'));
            return pkg.version || '0.0.0';
          } catch { return '0.0.0-storybook'; }
        })()
      ),
    };

    config.esbuild = {
      ...config.esbuild,
      jsx: 'automatic',
      jsxImportSource: 'react',
    };

    config.optimizeDeps ??= {};
    config.optimizeDeps.force = true;
    config.optimizeDeps.include = Array.from(
      new Set([
        ...(config.optimizeDeps.include ?? []),
        ...datavisDependencyNames,
        ...datavisCjsInteropDependencies,
        ...datavisLegacySubpathDependencies,
        ...ychartDependencyNames,
      ].filter(isLocalNodeModuleDependency)),
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
