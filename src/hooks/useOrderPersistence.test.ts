import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  localStorageOrderAdapter,
  mergeOrder,
  useOrderPersistence,
  type UseOrderPersistenceOptions,
} from './useOrderPersistence';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

function setup(ids: string[], options: Partial<UseOrderPersistenceOptions>) {
  const save = vi.fn();
  const view = renderHook(
    ({ ids: current }) =>
      useOrderPersistence(current, { load: () => null, save, ...options }),
    { initialProps: { ids } }
  );
  return { ...view, save };
}

describe('mergeOrder', () => {
  it('drops removed ids and appends new ones in given order', () => {
    expect(mergeOrder(['c', 'x', 'a', 'c'], ['a', 'b', 'c', 'd'])).toEqual([
      'c',
      'a',
      'b',
      'd',
    ]);
    expect(mergeOrder(null, ['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('useOrderPersistence', () => {
  it('applies a sync or async loaded order merged with ids', async () => {
    const { result } = setup(['a', 'b', 'c'], {
      load: async () => ['c', 'a'],
    });
    expect(result.current.order).toEqual(['a', 'b', 'c']);
    await act(async () => {});
    expect(result.current.order).toEqual(['c', 'a', 'b']);
  });

  it('updates optimistically and debounces saves', async () => {
    const { result, save } = setup(['a', 'b', 'c'], { debounceMs: 300 });
    await act(async () => {});
    act(() => result.current.setOrder(['b', 'a', 'c']));
    act(() => result.current.setOrder(['c', 'b', 'a']));
    expect(result.current.order).toEqual(['c', 'b', 'a']);
    act(() => vi.advanceTimersByTime(299));
    expect(save).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(['c', 'b', 'a']);
  });

  it('flushes a pending save on unmount', async () => {
    const { result, save, unmount } = setup(['a', 'b'], {});
    await act(async () => {});
    act(() => result.current.setOrder(['b', 'a']));
    unmount();
    expect(save).toHaveBeenCalledWith(['b', 'a']);
  });

  it('flushes a pending save on pagehide', async () => {
    const { result, save } = setup(['a', 'b'], {});
    await act(async () => {});
    act(() => result.current.setOrder(['b', 'a']));
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(save).toHaveBeenCalledWith(['b', 'a']);
  });

  it('starts the latest save on pagehide even while one is in flight', async () => {
    const save = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>(() => {}))
      .mockImplementation(() => undefined);
    const { result } = setup(['a', 'b', 'c'], { save, debounceMs: 10 });
    await act(async () => {});
    act(() => result.current.setOrder(['b', 'a', 'c']));
    act(() => vi.advanceTimersByTime(10));
    act(() => result.current.setOrder(['c', 'b', 'a']));
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(['c', 'b', 'a']);
  });

  it('keeps a change made while loading over the loaded order', async () => {
    let resolve: (v: string[]) => void = () => {};
    const { result } = setup(['a', 'b', 'c'], {
      load: () => new Promise<string[]>((r) => (resolve = r)),
    });
    act(() => result.current.setOrder(['b', 'c', 'a']));
    await act(async () => resolve(['c', 'b', 'a']));
    expect(result.current.order).toEqual(['b', 'c', 'a']);
  });

  it('merges new ids into a user order', async () => {
    const { result, rerender } = setup(['a', 'b'], {});
    await act(async () => {});
    act(() => result.current.setOrder(['b', 'a']));
    rerender({ ids: ['a', 'b', 'c'] });
    expect(result.current.order).toEqual(['b', 'a', 'c']);
  });

  it('runs one save at a time and saves the latest order next', async () => {
    let finish!: () => void;
    const save = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((r) => (finish = r)))
      .mockImplementation(() => undefined);
    const { result } = setup(['a', 'b', 'c'], { save, debounceMs: 10 });
    await act(async () => {});
    act(() => result.current.setOrder(['b', 'a', 'c']));
    act(() => vi.advanceTimersByTime(10));
    act(() => result.current.setOrder(['c', 'b', 'a']));
    act(() => vi.advanceTimersByTime(10));
    act(() => result.current.setOrder(['a', 'c', 'b']));
    act(() => vi.advanceTimersByTime(10));
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(['a', 'c', 'b']);
  });

  it('reports rejected saves to onError', async () => {
    const onError = vi.fn();
    const failure = new Error('offline');
    const { result } = setup(['a', 'b'], {
      save: () => Promise.reject(failure),
      onError,
    });
    act(() => result.current.setOrder(['b', 'a']));
    await act(async () => vi.advanceTimersByTime(500));
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it('re-saves the newest order when an older overlapped save settles last', async () => {
    let finishFirst!: () => void;
    const save = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((r) => (finishFirst = r)))
      .mockImplementation(() => undefined);
    const { result } = setup(['a', 'b', 'c'], { save, debounceMs: 10 });
    await act(async () => {});
    act(() => result.current.setOrder(['b', 'a', 'c']));
    act(() => vi.advanceTimersByTime(10));
    act(() => result.current.setOrder(['c', 'b', 'a']));
    await act(async () => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(save).toHaveBeenCalledTimes(2);
    // The stale first save settles after the forced one; the newest order
    // is written once more so completion order cannot leave it stale.
    await act(async () => finishFirst());
    expect(save).toHaveBeenCalledTimes(3);
    expect(save).toHaveBeenLastCalledWith(['c', 'b', 'a']);
  });
});

describe('localStorageOrderAdapter', () => {
  it('round-trips and ignores malformed data', () => {
    const adapter = localStorageOrderAdapter('order-test');
    expect(adapter.load()).toBeNull();
    adapter.save(['b', 'a']);
    expect(adapter.load()).toEqual(['b', 'a']);
    window.localStorage.setItem('order-test', '{oops');
    expect(adapter.load()).toBeNull();
    window.localStorage.setItem('order-test', '[1,2]');
    expect(adapter.load()).toBeNull();
  });
});
