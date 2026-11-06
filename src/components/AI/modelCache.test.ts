import { afterEach, describe, expect, it, vi } from 'vitest';
import { configuredAssetUrl, onnxRuntimeBase } from './modelCache';

const setAssets = (value: unknown) =>
  ((window as unknown as { __ozwellAssets?: unknown }).__ozwellAssets = value);

describe('onnxRuntimeBase', () => {
  afterEach(() => {
    setAssets(undefined);
    vi.restoreAllMocks();
  });

  it('uses jsDelivr unless the object form sets `ort`', () => {
    expect(onnxRuntimeBase()).toMatch(
      /^https:\/\/cdn\.jsdelivr\.net\/.*\/dist\/$/
    );
    setAssets('https://example.com/assets');
    expect(onnxRuntimeBase()).toMatch(/^https:\/\/cdn\.jsdelivr\.net\//);
  });

  it('resolves a same-origin path to an absolute URL ending in a slash', () => {
    setAssets({ ort: '/ort/' });
    expect(onnxRuntimeBase()).toBe(`${window.location.origin}/ort/`);
  });

  it('ignores non-http(s) URLs', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    setAssets({ ort: 'javascript:alert(1)', nemotron: 'data:text/plain,x' });
    expect(onnxRuntimeBase()).toMatch(/^https:\/\/cdn\.jsdelivr\.net\//);
    expect(configuredAssetUrl('nemotron')).toBeUndefined();
  });
});
