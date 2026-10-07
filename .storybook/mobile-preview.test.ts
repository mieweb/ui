import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StoryContext } from '@storybook/react-vite';
import { buildArgsParam } from 'storybook/internal/router';
import { UrlStore } from 'storybook/preview-api';
import { withMobilePreview } from './MobilePreview';
import {
  mobilePreviewMode,
  serializeProjectGlobals,
  setStoryState,
  storybookReturnUrl,
  variantUrl,
} from './mobile-preview';

const storyId = 'inputs-button--primary';
const previewPath = `/catalog/iframe.html?id=${storyId}&viewMode=story`;

function visit(path: string) {
  window.history.replaceState({}, '', path);
}

function parseStoryState(url: URL) {
  visit(`${url.pathname}${url.search}`);
  return new UrlStore().selectionSpecifier;
}

function renderPreview(overrides: Partial<StoryContext> = {}) {
  const context = {
    id: storyId,
    title: 'Inputs/Button',
    name: 'Primary',
    viewMode: 'story',
    parameters: {},
    initialArgs: {},
    args: {},
    globals: {},
    ...overrides,
  } as StoryContext;
  const Story = () =>
    createElement('article', { 'data-testid': 'demo' }, 'Demo');
  function Preview() {
    return withMobilePreview(Story, context);
  }
  return render(createElement(Preview));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  visit('/');
  delete document.documentElement.dataset.mobilePreview;
});

describe('Storybook URL state', () => {
  it('roundtrips changed args through the installed Storybook parser', () => {
    const initialArgs = { label: 'Default', disabled: true, removed: 'value' };
    const args = {
      label: 'Mobile example',
      disabled: false,
      removed: undefined,
      count: 0,
      nullable: null,
      when: new Date('2026-10-04T12:30:00.000Z'),
      color: '#1a2b3c',
      nested: { width: 320, tags: ['small', 'touch screen'] },
    };
    const url = setStoryState(
      new URL(previewPath, window.location.origin),
      buildArgsParam(initialArgs, args),
      ''
    );
    const parsed = parseStoryState(url);

    expect(parsed?.storySpecifier).toBe(storyId);
    expect(parsed?.args).toEqual(args);
    expect(parsed?.args?.when).toBeInstanceOf(Date);
  });

  it('preserves every project global and excludes addon-only globals', () => {
    const globals = {
      brand: 'enterprise-health',
      theme: 'dark',
      density: 'condensed',
      locale: 'ar',
      direction: 'rtl',
      user: 'alice',
      device: 'trusted',
    };
    const url = setStoryState(
      new URL(previewPath, window.location.origin),
      '',
      serializeProjectGlobals({ ...globals, viewport: { value: 'mobile1' } })
    );

    expect(parseStoryState(url)?.globals).toEqual(globals);
  });

  it('removes stale args and globals when they return to defaults', () => {
    const url = new URL(
      `${previewPath}&args=disabled:!true&globals=theme:dark`,
      window.location.origin
    );
    setStoryState(url, '', '');

    expect(url.searchParams.has('args')).toBe(false);
    expect(url.searchParams.has('globals')).toBe(false);
    expect(url.searchParams.get('id')).toBe(storyId);
  });
});

describe('return links', () => {
  it('returns direct links to the same Storybook deployment subpath', () => {
    const back = storybookReturnUrl(
      `https://example.test${previewPath}`,
      storyId
    );

    expect(back.href).toBe(
      `https://example.test/catalog/?path=%2Fstory%2F${storyId}`
    );
  });

  it.each(['/catalog/', '/catalog/index.html'])(
    'preserves valid same-deployment routes at %s',
    (pathname) => {
      const current = new URL(previewPath, 'https://example.test');
      current.searchParams.set(
        'returnTo',
        `${pathname}?path=/docs/inputs-button--docs&globals=theme:dark`
      );
      const back = storybookReturnUrl(current.href, storyId);

      expect(back.pathname).toBe(pathname);
      expect(back.searchParams.get('path')).toBe('/docs/inputs-button--docs');
      expect(back.searchParams.get('globals')).toBe('theme:dark');
    }
  );

  it.each([
    'https://evil.test/catalog/?path=/story/inputs-button--primary',
    '//evil.test/catalog/?path=/story/inputs-button--primary',
    'javascript:alert(1)',
    'data:text/html,hello',
    'https://example.test.evil.test/catalog/?path=/story/inputs-button--primary',
    '/other-app/?path=/story/inputs-button--primary',
    '/catalog/iframe.html?path=/story/inputs-button--primary',
    '/catalog/?path=/settings/about',
    '/catalog/?path=/story/../../settings',
    'http://[',
  ])('rejects unsafe or unrelated return target %s', (returnTo) => {
    const current = new URL(previewPath, 'https://example.test');
    current.searchParams.set('returnTo', returnTo);
    const back = storybookReturnUrl(current.href, storyId);

    expect(back.origin).toBe('https://example.test');
    expect(back.pathname).toBe('/catalog/');
    expect(back.searchParams.get('path')).toBe(`/story/${storyId}`);
  });
});

describe('variant navigation', () => {
  it('clears story-specific args in both links while retaining globals and mode', () => {
    const globals = serializeProjectGlobals({
      brand: 'mieweb',
      theme: 'dark',
      locale: 'es',
    });
    const current = setStoryState(
      new URL(`${previewPath}&mobilePreview=sandbox`, window.location.origin),
      'disabled:!true',
      globals
    );
    current.searchParams.set(
      'returnTo',
      '/catalog/?path=/story/inputs-button--primary&args=disabled:!true&globals=theme:dark'
    );
    const next = variantUrl(current.href, 'inputs-button--secondary');
    const back = storybookReturnUrl(next.href, 'inputs-button--secondary');

    expect(next.pathname).toBe('/catalog/iframe.html');
    expect(next.searchParams.get('id')).toBe('inputs-button--secondary');
    expect(next.searchParams.get('mobilePreview')).toBe('sandbox');
    expect(next.searchParams.has('args')).toBe(false);
    expect(next.searchParams.get('globals')).toBe(globals);
    expect(back.searchParams.get('path')).toBe(
      '/story/inputs-button--secondary'
    );
    expect(back.searchParams.has('args')).toBe(false);
    expect(parseStoryState(next)?.globals).toEqual({
      brand: 'mieweb',
      theme: 'dark',
      locale: 'es',
    });
  });
});

describe('mobile presentation gating', () => {
  it('renders sibling navigation with live unmapped args and user globals in its return link', async () => {
    visit(`${previewPath}&mobilePreview=sandbox&args=label:Stale`);
    const fetchIndex = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: {
          [storyId]: {
            id: storyId,
            type: 'story',
            title: 'Inputs/Button',
            name: 'Primary',
          },
          secondary: {
            id: 'inputs-button--secondary',
            type: 'story',
            title: 'Inputs/Button',
            name: 'Secondary',
          },
          docs: {
            id: 'inputs-button--docs',
            type: 'docs',
            title: 'Inputs/Button',
            name: 'Docs',
          },
          other: {
            id: 'inputs-checkbox--default',
            type: 'story',
            title: 'Inputs/Checkbox',
            name: 'Checkbox',
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchIndex);
    renderPreview({
      initialArgs: { label: 'Initial', icon: 'large' },
      args: { label: 'Live label', icon: createElement('svg') },
      unmappedArgs: { label: 'Live label', icon: 'small' },
      globals: { theme: 'dark', locale: 'en' },
      userGlobals: { theme: 'light', locale: 'en' },
    });

    await screen.findByRole('option', { name: 'Secondary' });
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: 'Story variant' })).toHaveValue(
      storyId
    );
    expect(fetchIndex.mock.calls[0][0].href).toBe(
      `${window.location.origin}/catalog/index.json`
    );
    const href = screen
      .getByRole('link', { name: 'Storybook' })
      .getAttribute('href');
    const back = new URL(href!);
    expect(back.pathname).toBe('/catalog/');
    const parsed = parseStoryState(back);
    expect(parsed?.args).toEqual({ label: 'Live label', icon: 'small' });
    expect(parsed?.globals).toEqual({ theme: 'light', locale: 'en' });
  });

  it('keeps a return link and current variant usable when the index is unavailable', async () => {
    visit(`${previewPath}&mobilePreview=sandbox`);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    renderPreview();

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Variants unavailable'
    );
    expect(screen.getByRole('link', { name: 'Storybook' })).toHaveAttribute(
      'href'
    );
    expect(screen.getByRole('option', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByTestId('demo')).toBeInTheDocument();
  });

  it.each(['sandbox', 'fullscreen'])(
    'accepts an explicit top-level %s mode',
    (mode) => {
      visit(`${previewPath}&mobilePreview=${mode}`);
      expect(mobilePreviewMode()).toBe(mode);
    }
  );

  it.each(['', 'true', 'unknown', 'Sandbox'])(
    'leaves normal previews alone for mode %s',
    (mode) => {
      visit(`${previewPath}&mobilePreview=${mode}`);
      expect(mobilePreviewMode()).toBeNull();
      renderPreview();
      expect(screen.getByTestId('demo')).toBeInTheDocument();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(document.documentElement.dataset.mobilePreview).toBeUndefined();
    }
  );

  it('does not activate inside the manager iframe even with the query parameter', () => {
    visit(`${previewPath}&mobilePreview=sandbox`);
    vi.spyOn(window, 'self', 'get').mockReturnValue(
      {} as Window & typeof globalThis
    );

    expect(mobilePreviewMode()).toBeNull();
    renderPreview();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(document.documentElement.dataset.mobilePreview).toBeUndefined();
  });

  it.each([
    ['fullscreen', {}],
    ['sandbox', { mobilePreview: { mode: 'standalone' } }],
  ] as const)(
    'renders the component without navigation for %s and %j',
    (mode, parameters) => {
      visit(`${previewPath}&mobilePreview=${mode}`);
      const { unmount } = renderPreview({ parameters });

      expect(screen.getByTestId('demo')).toBeInTheDocument();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(document.documentElement.dataset.mobilePreview).toBe(mode);
      unmount();
      expect(document.documentElement.dataset.mobilePreview).toBeUndefined();
    }
  );

  it('does not wrap docs previews', () => {
    visit(`${previewPath}&mobilePreview=sandbox`);
    renderPreview({ viewMode: 'docs' });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(document.documentElement.dataset.mobilePreview).toBeUndefined();
  });
});
