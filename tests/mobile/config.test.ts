import { execFileSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// These config tests run in the root suite on Linux without Xcode or Appium.
vi.mock('node:child_process', () => {
  const execFileSync = vi.fn();
  return { execFileSync, default: { execFileSync } };
});

beforeEach(() => {
  vi.resetModules();
  vi.mocked(execFileSync).mockReset();
  for (const name of Object.keys(process.env)) {
    if (name.startsWith('IOS_')) vi.stubEnv(name, undefined);
  }
  vi.stubEnv('APPIUM_URL', undefined);
  vi.stubEnv('STORYBOOK_URL', undefined);
  vi.stubEnv('IOS_REAL_DEVICE', '1');
  vi.stubEnv('IOS_UDID', 'test-device');
});

afterEach(() => vi.unstubAllEnvs());

describe('real-device Storybook URL', () => {
  it.each([
    'localhost',
    'localhost.',
    'story.localhost',
    'story.LOCALHOST.',
    '127.0.0.1',
    '127.0.0.2',
    '127.255.255.255',
    '127.1',
    '2130706433',
    '0x7f000002',
    '0.0.0.0',
    '0.0.0.1',
    '0.1.2.3',
    '0.255.255.255',
    '0',
    '0x00ffffff',
    '[::1]',
    '[0:0:0:0:0:0:0:1]',
    '[::]',
    '[0:0:0:0:0:0:0:0]',
    '[::ffff:127.0.0.2]',
    '[::ffff:7fff:ffff]',
    '[0:0:0:0:0:ffff:7f00:1]',
    '[::ffff:0.0.0.0]',
    '[::ffff:0.1.2.3]',
    '[::ffff:ff:ffff]',
  ])('rejects device-local host %s', async (host) => {
    vi.stubEnv('STORYBOOK_URL', `http://${host}:6006/`);
    await expect(import('./config.mjs')).rejects.toThrow(
      'Set STORYBOOK_URL to a URL reachable from the iPhone'
    );
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it.each([
    '192.168.1.10',
    '10.0.0.2',
    '1.0.0.0',
    'storybook.local',
    'localhost.example.com',
    '127.example.com',
    '0.example.com',
    '[fd00::2]',
    '[::ffff:192.168.1.10]',
    '[::ffff:1.0.0.0]',
  ])('allows a potentially reachable host %s', async (host) => {
    const url = `http://${host}:6006/catalog/`;
    vi.stubEnv('STORYBOOK_URL', url);
    const config = await import('./config.mjs');
    expect(config.baseUrl.href).toBe(new URL(url).href);
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it('rejects the default loopback URL for a real device', async () => {
    await expect(import('./config.mjs')).rejects.toThrow(
      'Set STORYBOOK_URL to a URL reachable from the iPhone'
    );
  });

  it('keeps local URLs available to simulator runs', async () => {
    vi.stubEnv('IOS_REAL_DEVICE', '0');
    vi.mocked(execFileSync).mockReturnValue(
      JSON.stringify({
        devices: {
          'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
            { udid: 'test-device', name: 'iPhone 17 Pro' },
          ],
        },
      })
    );
    const config = await import('./config.mjs');
    expect(config.baseUrl.hostname).toBe('127.0.0.1');
    expect(config.options.capabilities['appium:udid']).toBe('test-device');
    expect(execFileSync).toHaveBeenCalledOnce();
  });

  it('builds a story URL with supported density and the deployment path', async () => {
    vi.stubEnv('STORYBOOK_URL', 'https://storybook.example.com/catalog/');
    const { storyUrl } = await import('./config.mjs');
    const url = new URL(storyUrl('text-inputs-input--with-label'));
    expect(url.pathname).toBe('/catalog/iframe.html');
    expect(url.searchParams.get('id')).toBe('text-inputs-input--with-label');
    expect(url.searchParams.get('viewMode')).toBe('story');
    expect(url.searchParams.get('globals')).toBe(
      'brand:mieweb;theme:light;density:standard;locale:en'
    );
  });
});
