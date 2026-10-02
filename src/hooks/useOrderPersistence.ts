'use client';

import * as React from 'react';

export interface OrderPersistenceAdapter {
  /** Previously saved order, or null when there is none */
  load: () => string[] | null | Promise<string[] | null>;
  save: (order: string[]) => void | Promise<void>;
}

export interface UseOrderPersistenceOptions extends OrderPersistenceAdapter {
  /** Delay before `save` runs; rapid changes collapse into one save. */
  debounceMs?: number;
  /** Called when `load` or `save` throws or rejects */
  onError?: (error: unknown) => void;
}

export interface UseOrderPersistenceReturn {
  /** Saved order merged with the current `ids` */
  order: string[];
  /** Update the order immediately and schedule a debounced save */
  setOrder: (order: string[]) => void;
}

/** Keep saved ids that still exist, then append new ids in their given order. */
export function mergeOrder(saved: string[] | null, ids: string[]): string[] {
  if (!saved) return ids;
  const known = new Set(ids);
  const kept = [...new Set(saved)].filter((id) => known.has(id));
  const keptSet = new Set(kept);
  return [...kept, ...ids.filter((id) => !keptSet.has(id))];
}

/**
 * Persist a user's item order (sections, widgets, list rows) through any
 * storage. Updates are optimistic, saves are debounced and a pending save is
 * flushed on unmount and on `pagehide` (navigation, refresh, tab close). On
 * `pagehide` only work `save` starts synchronously is guaranteed — use
 * localStorage or `navigator.sendBeacon` there; an async `fetch` may be cut
 * off. `load` runs once after mount, so server and first client render use
 * `ids` order.
 *
 * @example
 * ```tsx
 * const adapter = React.useMemo(() => localStorageOrderAdapter('clinic-sections'), []);
 * const { order, setOrder } = useOrderPersistence(sectionIds, adapter);
 * const drag = useDragReorder({ ids: order, onReorder: setOrder });
 * ```
 */
export function useOrderPersistence(
  ids: string[],
  { load, save, debounceMs = 500, onError }: UseOrderPersistenceOptions
): UseOrderPersistenceReturn {
  const [saved, setSaved] = React.useState<string[] | null>(null);
  const callbacks = React.useRef({ load, save, onError });
  callbacks.current = { load, save, onError };
  const pending = React.useRef<string[] | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const touched = React.useRef(false);
  const saving = React.useRef(false);

  // One save at a time; changes made meanwhile coalesce into the next save.
  // `force` skips the queue for page unloads, where a queued save never runs.
  const flush = React.useCallback(function flushPending(force = false) {
    clearTimeout(timer.current);
    const next = pending.current;
    if (!next || (saving.current && !force)) return;
    pending.current = null;
    saving.current = true;
    const { save: run, onError: fail } = callbacks.current;
    let result: void | Promise<void>;
    try {
      result = run(next);
    } catch (e) {
      result = Promise.reject(e);
    }
    void Promise.resolve(result)
      .catch((e: unknown) => fail?.(e))
      .finally(() => {
        saving.current = false;
        flushPending();
      });
  }, []);

  React.useEffect(() => {
    let active = true;
    const { load: read, onError: fail } = callbacks.current;
    Promise.resolve()
      .then(read)
      .then((value) => {
        // A change made while loading wins over the stored order
        if (active && value && !touched.current) setSaved(value);
      })
      .catch((e: unknown) => fail?.(e));
    return () => {
      active = false;
      flush();
    };
  }, [flush]);

  React.useEffect(() => {
    const onPageHide = () => flush(true);
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [flush]);

  const setOrder = React.useCallback(
    (next: string[]) => {
      touched.current = true;
      setSaved(next);
      pending.current = next;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, debounceMs);
    },
    [debounceMs, flush]
  );

  const order = React.useMemo(() => mergeOrder(saved, ids), [saved, ids]);
  return { order, setOrder };
}

/** `useOrderPersistence` adapter backed by `localStorage` (no-op on the server or when storage is blocked). */
export function localStorageOrderAdapter(key: string): OrderPersistenceAdapter {
  return {
    load: () => {
      try {
        if (typeof window === 'undefined') return null;
        const raw: unknown = JSON.parse(
          window.localStorage.getItem(key) ?? 'null'
        );
        return Array.isArray(raw) && raw.every((v) => typeof v === 'string')
          ? (raw as string[])
          : null;
      } catch {
        return null;
      }
    },
    save: (order) => {
      try {
        if (typeof window !== 'undefined')
          window.localStorage.setItem(key, JSON.stringify(order));
      } catch {
        // Quota exceeded or storage disabled: keep the in-memory order
      }
    },
  };
}
