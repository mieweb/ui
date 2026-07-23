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
// pnpm exposes transitive (non-hoisted) dependencies under
// `<root>/node_modules/.pnpm/node_modules`. Resolve this against whichever layout
// actually exists: the standalone repo's own store first, then a monorepo root.
const pnpmVirtualNodeModulesCandidates = [
  path.join(rootNodeModulesDir, '.pnpm/node_modules'),
  path.join(monorepoRoot, 'node_modules/.pnpm/node_modules'),
];
const pnpmVirtualNodeModulesDir =
  pnpmVirtualNodeModulesCandidates.find((candidate) => existsSync(candidate)) ??
  pnpmVirtualNodeModulesCandidates[0];

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

// CJS-only transitive dependencies (via react-i18next → html-parse-stringify →
// void-elements) that live only in the pnpm virtual store. They must be aliased
// to a resolvable path and force-included so Vite pre-bundles them with proper
// CJS→ESM default-export interop; otherwise `void-elements` is served raw and
// throws "does not provide an export named 'default'".
//
// The shared `pnpmVirtualNodeModulesDir` is computed from `monorepoRoot`, which
// does not match this repo's layout; resolve against the workspace-local pnpm
// store instead.
const workspacePnpmVirtualNodeModulesDir = path.join(
  rootNodeModulesDir,
  '.pnpm/node_modules',
);

const pnpmVirtualCjsInteropDependencies = [
  'react-i18next',
  'html-parse-stringify',
  'void-elements',
] as const;

const pnpmVirtualCjsInteropAliases = pnpmVirtualCjsInteropDependencies
  .filter(
    (dependencyName) =>
      !existsSync(path.join(rootNodeModulesDir, dependencyName)) &&
      existsSync(path.join(workspacePnpmVirtualNodeModulesDir, dependencyName)),
  )
  .map((dependencyName) => ({
    find: new RegExp(`^${escapeRegExp(dependencyName)}(\/.*)?$`),
    replacement: `${path.join(workspacePnpmVirtualNodeModulesDir, dependencyName)}$1`,
  }));

const pnpmVirtualCjsInteropIncludes = pnpmVirtualCjsInteropDependencies.filter(
  (dependencyName) =>
    existsSync(path.join(rootNodeModulesDir, dependencyName)) ||
    existsSync(path.join(workspacePnpmVirtualNodeModulesDir, dependencyName)),
);

function getPackageRootName(dependencyName: string): string {
  if (dependencyName.startsWith('@')) {
    return dependencyName.split('/').slice(0, 2).join('/');
  }

  return dependencyName.split('/')[0] ?? dependencyName;
}

function isLocalNodeModuleDependency(dependencyName: string): boolean {
  const packageRootName = getPackageRootName(dependencyName);
  return (
    existsSync(path.join(rootNodeModulesDir, packageRootName, 'package.json')) ||
    existsSync(path.join(pnpmVirtualNodeModulesDir, packageRootName, 'package.json'))
  );
}

/**
 * For dependencies that are not hoisted into the root `node_modules` (common with
 * pnpm's strict linking for transitive deps of linked workspace packages), build a
 * Vite alias that points the bare specifier at the package's real location inside
 * `node_modules/.pnpm/node_modules`. Without this, Vite cannot resolve these deps and
 * `optimizeDeps.include` entries fail (and CJS-only deps break ESM interop at runtime).
 */
function buildVirtualStoreAliases(
  dependencyNames: readonly string[],
): { find: RegExp; replacement: string }[] {
  const packageRootNames = Array.from(
    new Set(dependencyNames.map(getPackageRootName)),
  );

  return packageRootNames
    .filter(
      (packageRootName) =>
        !existsSync(path.join(rootNodeModulesDir, packageRootName, 'package.json')) &&
        existsSync(path.join(pnpmVirtualNodeModulesDir, packageRootName, 'package.json')),
    )
    .map((packageRootName) => ({
      find: new RegExp(`^${escapeRegExp(packageRootName)}(\/.*)?$`),
      replacement: `${path.join(pnpmVirtualNodeModulesDir, packageRootName)}$1`,
    }));
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
  staticDirs: [
    './public',
    { from: '../node_modules/@kerebron/wasm/assets', to: '/kerebron-wasm' },
    // Serve the exported Loco translation pack so the Loco runtime can load it
    // in file (package) mode: Loco.init({ file: '/i18n/i18n-translations.json' })
    { from: '../src/i18n', to: '/i18n' },
  ],
  async viteFinal(config) {
    const optimizeDepNames = [
      ...datavisDependencyNames,
      ...datavisCjsInteropDependencies,
      ...datavisLegacySubpathDependencies,
      ...ychartDependencyNames,
    ];

    config.resolve ??= {};
    config.resolve.alias = [
      ...(Array.isArray(config.resolve.alias)
        ? config.resolve.alias
        : config.resolve.alias
          ? [config.resolve.alias]
          : []),
      ...localUiAliases,
      ...buildVirtualStoreAliases(optimizeDepNames),
      ...pnpmVirtualCjsInteropAliases,
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
        ...optimizeDepNames,
      ].filter(isLocalNodeModuleDependency)),
    );
    config.optimizeDeps.include = Array.from(
      new Set([
        ...(config.optimizeDeps.include ?? []),
        ...pnpmVirtualCjsInteropIncludes,
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
