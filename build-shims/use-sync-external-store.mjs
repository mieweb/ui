// ESM replacement for `use-sync-external-store` and its `/shim` entry.
//
// React 18+ (this library peers on React 19) ships `useSyncExternalStore`
// natively, so the upstream CJS package only matters for React 16/17. Bundling
// its CJS build into our ESM output leaves a lazy `require('react')` that throws
// "Dynamic require of react is not supported" in pure-ESM consumers. Re-export
// the native hook instead. The esbuild plugin in tsup.config.ts redirects
// `use-sync-external-store`/`/shim` imports here.
import { useSyncExternalStore } from 'react';

export { useSyncExternalStore };
export default { useSyncExternalStore };
