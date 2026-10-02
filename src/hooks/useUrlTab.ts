import { useCallback, useSyncExternalStore } from 'react';

// history.replaceState fires no event, so writers announce changes themselves.
const URL_PARAM_EVENT = 'mieweb:urlparamchange';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(URL_PARAM_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(URL_PARAM_EVENT, onChange);
  };
}

/**
 * Syncs one URL query parameter with a string value. `param: undefined`
 * disables the sync, so callers can toggle it without breaking hook order.
 * Not exported from the package; use {@link useUrlTab}.
 */
export function useUrlSearchParam(
  param: string | undefined,
  defaultValue: string,
  isAllowed: (value: string) => boolean
): [string, (value: string) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () =>
      param
        ? new globalThis.URLSearchParams(window.location.search).get(param)
        : null,
    () => null
  );
  const value = raw !== null && isAllowed(raw) ? raw : defaultValue;

  const setValue = useCallback(
    (next: string) => {
      if (!param || typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (next === defaultValue) url.searchParams.delete(param);
      else url.searchParams.set(param, next);
      window.history.replaceState(window.history.state, '', url);
      window.dispatchEvent(new Event(URL_PARAM_EVENT));
    },
    [param, defaultValue]
  );

  return [value, setValue];
}

/**
 * Keeps a tab (or any one-of-N view) selection in a URL query parameter so it
 * survives reloads and can be shared. Writes with `history.replaceState` (no
 * router, no history entry), drops the parameter when the value equals
 * `defaultValue`, follows back/forward via `popstate`, and ignores values not
 * in `allowed`. SSR-safe: renders `defaultValue` on the server and during
 * hydration.
 *
 * @example
 * ```tsx
 * const [tab, setTab] = useUrlTab('tab', 'summary', ['summary', 'history'] as const);
 * <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>…</Tabs>
 * ```
 */
export function useUrlTab<T extends string>(
  param: string,
  defaultValue: T,
  allowed: readonly T[]
): [T, (value: T) => void] {
  const [value, setValue] = useUrlSearchParam(param, defaultValue, (v) =>
    (allowed as readonly string[]).includes(v)
  );
  return [value as T, setValue as (value: T) => void];
}
