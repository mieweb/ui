import { buildArgsParam } from 'storybook/internal/router';

const projectGlobals = [
  'brand',
  'theme',
  'density',
  'locale',
  'direction',
  'user',
  'device',
];

export function serializeProjectGlobals(globals: Record<string, unknown>) {
  return buildArgsParam(
    {},
    Object.fromEntries(
      projectGlobals
        .filter((key) => key in globals)
        .map((key) => [key, globals[key]])
    )
  );
}

/** Only top-level, explicitly opened previews get the testing presentation. */
export function mobilePreviewMode() {
  if (typeof window === 'undefined' || window.self !== window.top) return null;
  const mode = new URLSearchParams(window.location.search).get('mobilePreview');
  return mode === 'sandbox' || mode === 'fullscreen' ? mode : null;
}

// Storybook parses the args/globals value as its own nested query string.
export function setStoryState(url: URL, args: string, globals: string) {
  for (const [key, value] of Object.entries({ args, globals })) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  return url;
}

/** A shared/direct link always has a usable return, without trusting referrer. */
export function storybookReturnUrl(href: string, storyId: string) {
  const current = new URL(href);
  const fallback = new URL('./', current);
  fallback.searchParams.set('path', `/story/${storyId}`);
  const returnTo = current.searchParams.get('returnTo');
  if (!returnTo) return fallback;
  try {
    const candidate = new URL(returnTo, current);
    const route = candidate.searchParams.get('path');
    if (
      candidate.origin === fallback.origin &&
      (candidate.pathname === fallback.pathname ||
        candidate.pathname === `${fallback.pathname}index.html`) &&
      /^\/(story|docs)\/[\w-]+$/.test(route ?? '')
    )
      return candidate;
  } catch {
    /* Fall back to this Storybook, never an external redirect. */
  }
  return fallback;
}

export function variantUrl(href: string, storyId: string) {
  const url = new URL(href);
  url.searchParams.set('id', storyId);
  // Args belong to a particular story; sibling stories have their own defaults.
  url.searchParams.delete('args');
  const back = storybookReturnUrl(href, storyId);
  back.searchParams.set('path', `/story/${storyId}`);
  back.searchParams.delete('args');
  url.searchParams.set('returnTo', `${back.pathname}${back.search}`);
  return url;
}
