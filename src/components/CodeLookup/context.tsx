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

/** Resolved lookup wiring a component consumes (from prop or context). */
export interface CodeLookupProviderConfig {
  /** The injected CodeLookup component (worker-capable, from the app bundle). */
  component: CodeLookupComponent;
  /** Base URL the codify worker fetches `{locale}/manifest.json` + shards from. */
  indexUrl: string;
  /** Shard-set locale (default 'en'). */
  locale?: string;
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
  children: React.ReactNode;
}

export function CodeLookupProvider({
  component,
  indexUrl = '/codify',
  locale = 'en',
  children,
}: CodeLookupProviderProps): React.ReactElement {
  const value = React.useMemo<CodeLookupProviderConfig>(
    () => ({ component, indexUrl, locale }),
    [component, indexUrl, locale]
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
