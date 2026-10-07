import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useUrlTab } from './useUrlTab';

const TABS = ['summary', 'history', 'files'] as const;

function setSearch(search: string) {
  window.history.replaceState(null, '', `/${search}`);
}

describe('useUrlTab', () => {
  beforeEach(() => setSearch(''));

  it('returns the default when the param is absent', () => {
    const { result } = renderHook(() => useUrlTab('tab', 'summary', TABS));
    expect(result.current[0]).toBe('summary');
  });

  it('reads an allowed value from the URL', () => {
    setSearch('?tab=history');
    const { result } = renderHook(() => useUrlTab('tab', 'summary', TABS));
    expect(result.current[0]).toBe('history');
  });

  it('ignores values that are not allowed', () => {
    setSearch('?tab=bogus');
    const { result } = renderHook(() => useUrlTab('tab', 'summary', TABS));
    expect(result.current[0]).toBe('summary');
  });

  it('writes with replaceState and keeps other params', () => {
    setSearch('?q=x');
    const length = window.history.length;
    const { result } = renderHook(() => useUrlTab('tab', 'summary', TABS));
    act(() => result.current[1]('files'));
    expect(result.current[0]).toBe('files');
    const params = new globalThis.URLSearchParams(window.location.search);
    expect(params.get('tab')).toBe('files');
    expect(params.get('q')).toBe('x');
    expect(window.history.length).toBe(length);
  });

  it('drops the param when set back to the default', () => {
    setSearch('?tab=history');
    const { result } = renderHook(() => useUrlTab('tab', 'summary', TABS));
    act(() => result.current[1]('summary'));
    expect(window.location.search).toBe('');
    expect(result.current[0]).toBe('summary');
  });

  it('follows popstate', () => {
    const { result } = renderHook(() => useUrlTab('tab', 'summary', TABS));
    act(() => {
      setSearch('?tab=files');
      window.dispatchEvent(new globalThis.PopStateEvent('popstate'));
    });
    expect(result.current[0]).toBe('files');
  });

  it('keeps hooks on the same param in sync', () => {
    const a = renderHook(() => useUrlTab('tab', 'summary', TABS));
    const b = renderHook(() => useUrlTab('tab', 'summary', TABS));
    act(() => a.result.current[1]('history'));
    expect(b.result.current[0]).toBe('history');
  });
});
