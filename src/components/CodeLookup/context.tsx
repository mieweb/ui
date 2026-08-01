'use client';

/**
 * CodeLookupProvider — supply an offline `CodeLookup` once so the clinical
 * components (allergies, medications, conditions, orders, assessment) default
 * to coded search without per-component wiring.
 *
 * `CodeLookup` ships a module Web Worker the library's tsup build can't bundle,
 * so it can't be imported here — the app injects the component (import it from
 * its own bundler, e.g. Vite/Next) and this context distributes it:
 *
 * ```tsx
 * import { CodeLookupProvider } from '@mieweb/ui';
 * import { CodeLookup } from '…/CodeLookup'; // app bundler resolves the worker
 *
 * <CodeLookupProvider component={CodeLookup} indexUrl="/codify">
 *   <App />
 * </CodeLookupProvider>
 * ```
 *
 * Components read the context as their default; an explicit `codeLookup` /
 * `renderCodeSearch` prop overrides it, and `codeLookup={false}` (or
 * `renderCodeSearch={false}`) opts a component out back to plain text.
 *
 * This module is intentionally worker-free (only a `import type` of
 * `CodeLookupProps`, which is erased at build) so it is safe to ship in the
 * main `@mieweb/ui` entry.
 */

import * as React from 'react';
import type { CodeLookupProps } from './CodeLookup';
import type { MemoryStorage } from './memoryBackend';

/**
 * The CodeLookup component the provider distributes to consumers.
 *
 * Typed as a bare function component (not `ComponentType`) so it stays
 * structurally assignable into the narrower per-domain lookup configs
 * (`MedicationLookupProps`, `OrderLookupProps`, …) — a `ComponentType` union
 * drags in `ComponentClass.defaultProps`, whose contravariance breaks that
 * assignment. `CodeLookup` is a function component, so this is exact.
 */
export type CodeLookupComponent = (
  props: CodeLookupProps
) => React.ReactElement | null;

/**
 * App-wide defaults for the CodeLookup memory picklist. Instances still opt
 * in per-use with the `memory` prop (its `context` is always per-instance);
 * these only fill in the identity/sync fields and the device's storage mode.
 */
export interface CodeLookupMemoryDefaults {
  /** Default user id for memory scoping (per-instance prop wins). */
  userId?: string;
  /** Default count-sync endpoint (per-instance prop wins). */
  serverUrl?: string;
  /**
   * Where picks are cached on this machine. `'local'` (IndexedDB) asserts a
   * per-user device secured by a browser login; the default `'session'` keeps
   * them in RAM for the tab, which is what a public kiosk wants.
   */
  storage?: MemoryStorage;
}

/** Resolved lookup wiring a component consumes (from prop or context). */
export interface CodeLookupProviderConfig {
  /** The injected CodeLookup component (worker-capable, from the app bundle). */
  component: CodeLookupComponent;
  /** Base URL the codify worker fetches `{locale}/manifest.json` + shards from. */
  indexUrl: string;
  /** Shard-set locale (default 'en'). */
  locale?: string;
  /**
   * Defaults for the memory picklist, or `false` to disable it everywhere
   * below this provider (a public kiosk build) — unlike other props, this
   * overrides a component's own `memory` opt-in.
   */
  memory?: false | CodeLookupMemoryDefaults;
}

const CodeLookupContext = React.createContext<CodeLookupProviderConfig | null>(
  null
);

export interface CodeLookupProviderProps {
  /** The CodeLookup component to distribute (import it in your app). */
  component: CodeLookupComponent;
  /** Where the codify index is served (default '/codify'). */
  indexUrl?: string;
  /** Shard-set locale (default 'en'). */
  locale?: string;
  /** Defaults for the memory picklist, or `false` to disable it everywhere. */
  memory?: false | CodeLookupMemoryDefaults;
  children: React.ReactNode;
}

export function CodeLookupProvider({
  component,
  indexUrl = '/codify',
  locale = 'en',
  memory,
  children,
}: CodeLookupProviderProps): React.ReactElement {
  const value = React.useMemo<CodeLookupProviderConfig>(
    () => ({ component, indexUrl, locale, memory }),
    [component, indexUrl, locale, memory]
  );
  return (
    <CodeLookupContext.Provider value={value}>
      {children}
    </CodeLookupContext.Provider>
  );
}

/**
 * The ambient CodeLookup config supplied by the nearest `CodeLookupProvider`,
 * or `null` when none is mounted (components then fall back to plain text).
 */
export function useCodeLookupConfig(): CodeLookupProviderConfig | null {
  return React.useContext(CodeLookupContext);
}
