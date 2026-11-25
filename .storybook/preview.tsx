/// <reference types="vite/client" />
import type { Preview, Decorator } from '@storybook/react-vite';
import { useEffect, useMemo, useRef } from 'react';
import { addons } from 'storybook/preview-api';
import '../src/styles/base.css';
import '../src/styles/kerebron.css';
import './preview.css';
// eSheet styling is no longer imported here: @esheet/builder and
// @esheet/renderer both `import '@esheet/styles'`, whose built dist/index.js
// self-injects a single shared stylesheet (a #esheet-styles <style> tag) the
// first time either package loads.
import { bluehiveBrand } from '../src/brands/bluehive';
import { ccmeBrand } from '../src/brands/ccme';
import { defaultBrand } from '../src/brands/default';
import { enterpriseHealthBrand } from '../src/brands/enterprise-health';
import { miewebBrand } from '../src/brands/mieweb';
import { ozwellBrand } from '../src/brands/ozwell';
import { wagglelineBrand } from '../src/brands/waggleline';
import { webchartBrand } from '../src/brands/webchart';
import type { BrandConfig } from '../src/brands/types';
import { CodeLookup } from '../src/components/CodeLookup';
import {
  CodeLookupProvider,
  type CodeLookupComponent,
} from '../src/components/CodeLookup/context';
import { isRtlLocale } from '../src/hooks/useDirection';
import { CatalogDocsPage } from './CatalogDocsPage';
import { githubSourceUrl, repoRelativeStoryPath } from './github-source';
import { withMobilePreview } from './MobilePreview';
import { mobilePreviewMode } from './mobile-preview';
import { filterLocoTextnodes, postLocoTextnodes, type LocoTextnode } from './loco/live-sync';
import locoI18nPack from './loco/static/i18n-translations.json';

const postedLiveSyncSignatures = new Set<string>();
const locoScriptLoaders = new Map<string, Promise<void>>();

// The exported Loco pack is also served statically (see staticDirs in main.ts)
// so the Loco runtime can consume it in file mode. The runtime itself is
// vendored from the Loco repo (loco/static/loco.min.js) so package mode works
// fully offline — no Loco server required.
const LOCO_PACK_URL = '/i18n/i18n-translations.json';
const LOCO_RUNTIME_URL = '/i18n/loco.min.js';
// Same-origin dev proxy (.storybook/main.ts) that holds the Loco API key server-side.
const LOCO_PROXY_BASE = '/__loco';
const LOCO_LIVE_LANG_CACHE_KEY = 'mieweb:loco:languages';
const LOCO_LIVE_LANG_RELOAD_FLAG = 'mieweb:loco:languages:reloaded';
const LOCO_TOOLBAR_MODE_KEY = 'mieweb:loco:toolbar-mode';
const DEFAULT_LOCALE = 'en';
const locoPackLanguages: string[] = Array.isArray((locoI18nPack as { languages?: string[] }).languages)
  ? (locoI18nPack as { languages: string[] }).languages
  : [];
const locoPackLanguageNames =
  (locoI18nPack as { languageNames?: Record<string, string> }).languageNames || {};
const locoPackDirections =
  (locoI18nPack as { languageDirections?: Record<string, string> }).languageDirections || {};

const localeNameFallbacks: Record<string, string> = {
  en: 'English',
  fr: 'French',
  'zh-Hans': 'Chinese (Simplified)',
  'zh-Hant': 'Chinese (Traditional)',
};

type LocoLanguageInfo = {
  code: string;
  name?: string;
  dir?: 'ltr' | 'rtl';
};

type LocoMode = 'package' | 'live' | 'disable';

// Locale toolbar items are built once at load, but the preview iframe's URL can keep stale
// globals across our reloads (docs-only pages keep `globals=` empty). So every Loco reload
// records the mode it reloads into, and the next load uses that before the URL.
const LOCO_RELOAD_MODE_KEY = 'mieweb:loco:reload-mode';

function reloadPreviewInMode(mode: string) {
  window.sessionStorage.setItem(LOCO_RELOAD_MODE_KEY, mode);
  window.location.reload();
}

function getInitialLocoMode(): LocoMode {
  if (typeof window === 'undefined') return 'disable';
  const reloadedInto = window.sessionStorage.getItem(LOCO_RELOAD_MODE_KEY);
  window.sessionStorage.removeItem(LOCO_RELOAD_MODE_KEY);
  if (reloadedInto === 'live' || reloadedInto === 'package' || reloadedInto === 'disable') {
    return reloadedInto;
  }
  return getCurrentLocoModeFromUrl();
}

function getCurrentLocoModeFromUrl(): LocoMode {
  if (typeof window === 'undefined') return 'disable';
  try {
    const params = new URLSearchParams(window.location.search);
    const globalsParam = params.get('globals') || '';
    const entries = globalsParam.split(';');
    for (const pair of entries) {
      const [key, value] = pair.split(':');
      if (key === 'locoMode') {
        if (value === 'live' || value === 'package') return value;
        return 'disable';
      }
    }
  } catch {
    // Ignore parse errors.
  }
  return 'disable';
}

function parseCachedLiveLanguages(): LocoLanguageInfo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCO_LIVE_LANG_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => entry && typeof entry.code === 'string')
      .map((entry) => ({
        code: String(entry.code),
        name: typeof entry.name === 'string' ? entry.name : undefined,
        dir: entry.dir === 'rtl' ? 'rtl' : 'ltr',
      }));
  } catch {
    return [];
  }
}

function resolveLocaleTitle(code: string, explicitName?: string): string {
  if (explicitName?.trim()) return explicitName.trim();

  const normalized = code.trim();
  if (localeNameFallbacks[normalized]) {
    return localeNameFallbacks[normalized];
  }

  if (typeof Intl !== 'undefined' && 'DisplayNames' in Intl) {
    try {
      const formatter = new Intl.DisplayNames([DEFAULT_LOCALE], {
        type: 'language',
      });
      const label = formatter.of(normalized);
      if (label && label !== normalized) return label;
    } catch {
      // Ignore unsupported locale code formatting.
    }
  }

  return normalized;
}

type LocaleToolbarItem = { value: string; title: string; right: string };

// Flag/label overrides for well-known locales; listed first when the active source offers them.
const pinnedLocaleItems: LocaleToolbarItem[] = [
  { value: 'en', title: '🇺🇸', right: 'English' },
  { value: 'es', title: '🇪🇸', right: 'Español' },
  { value: 'ar', title: '🇸🇦', right: 'العربية (RTL)' },
];

// Live mode lists the server's languages and package mode the committed pack's; with Loco
// disabled (the default) there is nothing to translate, so only English is offered.
function buildLocaleToolbarItems(
  mode: 'package' | 'live' | 'disable'
): LocaleToolbarItem[] {
  if (mode === 'disable') {
    return pinnedLocaleItems.filter((item) => item.value === DEFAULT_LOCALE);
  }
  const liveLanguages = mode === 'live' ? parseCachedLiveLanguages() : [];
  const available = new Map<string, string | undefined>(
    liveLanguages.length > 0
      ? liveLanguages.map((lang) => [lang.code, lang.name])
      : locoPackLanguages.map((code) => [code, locoPackLanguageNames[code]])
  );
  available.set(DEFAULT_LOCALE, available.get(DEFAULT_LOCALE));

  const pinned = pinnedLocaleItems.filter((item) => available.has(item.value));
  const pinnedCodes = new Set(pinned.map((item) => item.value));
  const others = Array.from(available.entries())
    .filter(([value]) => value && !pinnedCodes.has(value))
    .map(([value, name]) => ({
      value,
      title: value,
      right: resolveLocaleTitle(value, name),
    }))
    .sort((a, b) => a.right.localeCompare(b.right));

  return [...pinned, ...others];
}

const localeToolbarItems = buildLocaleToolbarItems(getInitialLocoMode());

async function fetchLiveLocoLanguages(): Promise<LocoLanguageInfo[]> {
  const response = await fetch(`${LOCO_PROXY_BASE}/api/languages`);
  if (!response.ok) {
    throw new Error(`Loco languages fetch failed (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((entry) => entry && typeof entry.code === 'string')
    .map((entry) => ({
      code: String(entry.code),
      name: typeof entry.name === 'string' ? entry.name : undefined,
      dir: entry.dir === 'rtl' ? 'rtl' : 'ltr',
    }));
}

type LocoRuntime = {
  init?: (config: { file: string }) => Promise<unknown> | unknown;
  apply?: (lang: string) => Promise<unknown> | unknown;
  restore?: () => Promise<unknown> | unknown;
  languages?: () => Promise<unknown> | unknown;
  rescan?: () => Promise<unknown>;
  textnodes?: () => LocoTextnode[];
};

// The runtime drops apply() calls made while one is in flight, so every runtime
// operation (locale change or harvest scan) runs one at a time.
let locoQueue: Promise<void> = Promise.resolve();

function runLocoExclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = locoQueue.then(task);
  locoQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

// Skip locale changes that a newer request has superseded.
let locoLatestRequest = 0;
// The runtime keeps translations loaded after restore(), and its only scan, rescan(),
// re-applies them; so rescan() is read-only only until the first apply() in this page.
let locoTranslationsLoaded = false;

// Callers that await initialization first should reserve their request number up front,
// so a slow older request can't be queued after a newer one.
function queueLocoLocale(
  runtime: LocoRuntime,
  locale: string | null,
  request: number = ++locoLatestRequest
): Promise<void> {
  return runLocoExclusive(async () => {
    if (request !== locoLatestRequest) return;
    if (locale) {
      locoTranslationsLoaded = true;
      await Promise.resolve(runtime.apply?.(locale));
    } else {
      await Promise.resolve(runtime.restore?.());
    }
  }).catch((error) => {
    console.warn(`[loco] Unable to ${locale ? `apply "${locale}"` : 'restore English'}.`, error);
  });
}

// Reads the runtime's own phrases (same keys/contexts apply() uses). Only called while no
// translations are loaded, when rescan() doesn't write to the DOM; queued so it never reads
// a half-applied locale.
function scanLocoPhrases(runtime: LocoRuntime): Promise<LocoTextnode[]> {
  return runLocoExclusive(async () => {
    await runtime.rescan?.();
    return runtime.textnodes?.() ?? [];
  });
}

// Live mode harvests English, so after a translation was shown it reloads to get pristine
// English (and a runtime with no translations loaded) back. Guarded against reload loops.
const LOCO_LIVE_RESTORE_RELOAD_KEY = 'mieweb:loco:live-restore-reload';
function reloadForPristineEnglish(): boolean {
  const last = Number(window.sessionStorage.getItem(LOCO_LIVE_RESTORE_RELOAD_KEY) || 0);
  if (Date.now() - last < 5000) return false;
  window.sessionStorage.setItem(LOCO_LIVE_RESTORE_RELOAD_KEY, String(Date.now()));
  reloadPreviewInMode('live');
  return true;
}

const LOCO_SCAN_ROOT_SELECTOR = '[data-loco-scan-root="true"]';
// Storybook's own <body> children; anything else at the top level is a story portal.
const STORYBOOK_CHROME_SELECTOR =
  '[id^="storybook-"], [class^="sb-"], [class*=" sb-"], #loco-lang-widget, script, style, link, noscript, template';

// Menus, tooltips and dialogs portal into <body>, outside every decorator root.
function locoPortalRoots(): Element[] {
  return Array.from(document.body.children).filter(
    (element) => !element.matches(STORYBOOK_CHROME_SELECTOR)
  );
}

function isInLocoPortal(node: Node): boolean {
  if (node === document.body) return true;
  let top: Node | null = node;
  while (top && top.parentNode !== document.body) top = top.parentNode;
  return top instanceof Element && !top.matches(STORYBOOK_CHROME_SELECTOR);
}

// Autodocs renders many stories on one page; portals belong to the one last interacted with.
let locoActiveScanRoot: Element | null = null;
const trackLocoActiveScanRoot = (event: Event) => {
  const root = (event.target as Element | null)?.closest?.(LOCO_SCAN_ROOT_SELECTOR);
  if (root) locoActiveScanRoot = root;
};
const locoInteractionEvents = ['pointerdown', 'pointerover', 'focusin'] as const;
locoInteractionEvents.forEach((type) =>
  document.addEventListener(type, trackLocoActiveScanRoot, true)
);
import.meta.hot?.dispose(() => {
  locoInteractionEvents.forEach((type) =>
    document.removeEventListener(type, trackLocoActiveScanRoot, true)
  );
});

// Pack fetch failures (e.g. the proxy's 502) never settle the runtime's readiness promise.
const LOCO_READY_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: number | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => window.clearTimeout(timer));
}

// The runtime singleton holds one pack (committed or live) — switching modes reloads the iframe.
// Both modes use the vendored runtime in file mode: API mode would crawl document.body,
// post unfiltered text, and upload html2canvas screenshots.
let locoInitializedMode: 'package' | 'live' | null = null;
let locoInitPromise: Promise<LocoRuntime | null> | null = null;

async function ensureLocoRuntimeLoaded(
  scriptUrl: string
): Promise<LocoRuntime | null> {
  if (typeof window === 'undefined') return null;

  const runtime = (window as any).Loco as LocoRuntime | undefined;
  if (runtime?.init) return runtime;

  const scriptId = `loco-runtime-${scriptUrl}`;

  let loader = locoScriptLoaders.get(scriptId);
  if (!loader) {
    loader = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Loco runtime script.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Unable to load ${script.src}`));
      document.head.appendChild(script);
    }).catch((error) => {
      // Don't cache a failed load: drop it so the next attempt requests the script again.
      locoScriptLoaders.delete(scriptId);
      document.getElementById(scriptId)?.remove();
      throw error;
    });
    locoScriptLoaders.set(scriptId, loader);
  }

  await loader;
  return ((window as any).Loco as LocoRuntime | undefined) ?? null;
}

// The runtime caches translations per language in IndexedDB, merged across pack sources,
// and prefers that cache on init — so a live pack could leak into package mode. Always load
// the selected pack fresh (both are cheap: a static file or the local dev proxy).
function clearLocoTranslationCache(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.deleteDatabase('loco');
      // A blocked delete still runs before any later open() of the same database.
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function ensureLocoInitialized(
  mode: 'package' | 'live',
): Promise<LocoRuntime | null> {
  // Runtime already initialized in a different mode — reload the preview iframe
  // so the singleton starts fresh in the requested mode.
  if (locoInitializedMode && locoInitializedMode !== mode) {
    reloadPreviewInMode(mode);
    return null;
  }

  if (locoInitPromise) return locoInitPromise;

  locoInitPromise = (async () => {
    const runtime = await ensureLocoRuntimeLoaded(LOCO_RUNTIME_URL);
    if (!runtime?.init) return runtime ?? null;

    const file = mode === 'package' ? LOCO_PACK_URL : `${LOCO_PROXY_BASE}/pack.json`;
    // Fail (and allow a retry on the next locale change) before init() can hang on a bad pack.
    const preflight = await fetch(file, { cache: 'no-store' });
    if (!preflight.ok) throw new Error(`Loco pack ${file} failed (${preflight.status})`);
    // The toolbar owns the locale; stop init() from auto-applying the runtime's remembered one.
    window.localStorage.removeItem('loco-lang');
    await clearLocoTranslationCache();
    await Promise.resolve(runtime.init({ file }));
    // languages() resolves once the pack is loaded — a readiness barrier before the first apply().
    if (runtime.languages) {
      await withTimeout(
        Promise.resolve(runtime.languages()),
        LOCO_READY_TIMEOUT_MS,
        `Loco pack ${file} did not load`
      );
    }

    locoInitializedMode = mode;
    return runtime;
  })();

  try {
    return await locoInitPromise;
  } catch (error) {
    locoInitPromise = null;
    throw error;
  }
}

// Map of available brands
const brands: Record<string, BrandConfig> = {
  bluehive: bluehiveBrand,
  ccme: ccmeBrand,
  default: defaultBrand,
  'enterprise-health': enterpriseHealthBrand,
  mieweb: miewebBrand,
  ozwell: ozwellBrand,
  waggleline: wagglelineBrand,
  webchart: webchartBrand,
};

// Loco language metadata can mark locales RTL that isRtlLocale() doesn't know (e.g. ps, dv).
function isLocoRtlLocale(globals: Record<string, unknown>, locale: string): boolean {
  if (globals?.locoMode === 'live') {
    return parseCachedLiveLanguages().some((lang) => lang.code === locale && lang.dir === 'rtl');
  }
  return globals?.locoMode === 'package' && locoPackDirections[locale] === 'rtl';
}

/*
 * Resolve the effective text direction from the direction/locale globals.
 * 'auto' derives it from the locale (rtl for ar/he/fa/ur, or as declared by Loco).
 */
function resolveGlobalDirection(
  globals: Record<string, unknown>
): 'ltr' | 'rtl' {
  const direction = (globals?.direction as string) || 'auto';
  if (direction === 'ltr' || direction === 'rtl') return direction;
  const locale = (globals?.locale as string) || 'en';
  return isRtlLocale(locale) || isLocoRtlLocale(globals, locale) ? 'rtl' : 'ltr';
}

// Apply text direction (RTL preview) and language at the document level so CSS logical
// properties, `rtl:` variants, screen readers and text shaping follow the toolbar.
function applyDocumentLocale(globals: Record<string, unknown>) {
  document.documentElement.setAttribute('dir', resolveGlobalDirection(globals));
  document.documentElement.setAttribute(
    'lang',
    (globals?.locale as string) || 'en'
  );
}

/*
 * Global theme listener — ensures data-theme and brand styles are applied
 * even on docs-only MDX pages (like Introduction) where no story decorator runs.
 */
function applyGlobalTheme(globals: Record<string, unknown>) {
  const brandName = (globals?.brand || 'bluehive') as string;
  const isDark = globals?.theme === 'dark';
  const isCondensed = globals?.density === 'condensed';
  const brand = brands[brandName] || brands.bluehive;
  const semanticColors = isDark ? brand.colors.dark : brand.colors.light;

  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }

  // Toggle condensed density class on body
  if (isCondensed) {
    document.body.classList.add('condensed');
  } else {
    document.body.classList.remove('condensed');
  }

  applyDocumentLocale(globals);

  document.body.style.backgroundColor = semanticColors.background;
  document.body.style.color = semanticColors.foreground;
  applyBrandStyles(brand, isDark);
}

// Listen for globals changes at the channel level (fires for all pages, including docs-only MDX)
const handleGlobalsUpdated = ({ globals }: { globals: Record<string, unknown> }) => {
  applyGlobalTheme(globals);
};

const channel = addons.getChannel();
// Ensure we don't register duplicate listeners across HMR updates
channel.off('globalsUpdated', handleGlobalsUpdated);
channel.on('globalsUpdated', handleGlobalsUpdated);

// Clean up listener on HMR dispose
import.meta.hot?.dispose(() => {
  channel.off('globalsUpdated', handleGlobalsUpdated);
});

// Apply initial theme from URL params
try {
  const params = new URLSearchParams(window.location.search);
  const globalsParam = params.get('globals') || '';
  const globals: Record<string, string> = {};
  for (const pair of globalsParam.split(';')) {
    const [key, value] = pair.split(':');
    if (key && value) globals[key] = value;
  }
  if (
    globals.theme ||
    globals.brand ||
    globals.density ||
    globals.direction ||
    globals.locale
  ) {
    applyGlobalTheme(globals);
  }
} catch {
  // Ignore URL parsing errors
}

// Function to apply brand CSS variables to document
function applyBrandStyles(brand: BrandConfig, isDark: boolean) {
  const root = document.documentElement;
  const colors = brand.colors;
  const semanticColors = isDark ? colors.dark : colors.light;

  // Remove any existing brand style tag
  const existingStyle = document.getElementById('mieweb-brand-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create a style tag with high specificity to override base.css
  const styleTag = document.createElement('style');
  styleTag.id = 'mieweb-brand-styles';
  const accent = colors.accent
    ? `
      --mieweb-accent: ${colors.accent.DEFAULT} !important;
      --mieweb-accent-light: ${colors.accent.light ?? colors.accent.DEFAULT} !important;
      --mieweb-accent-dark: ${colors.accent.dark ?? colors.accent.DEFAULT} !important;`
    : `
      --mieweb-accent: initial !important;
      --mieweb-accent-light: initial !important;
      --mieweb-accent-dark: initial !important;`;
  styleTag.textContent = `
    :root, [data-theme="light"], [data-theme="dark"] {${accent}
      --mieweb-primary-50: ${colors.primary[50]} !important;
      --mieweb-primary-100: ${colors.primary[100]} !important;
      --mieweb-primary-200: ${colors.primary[200]} !important;
      --mieweb-primary-300: ${colors.primary[300]} !important;
      --mieweb-primary-400: ${colors.primary[400]} !important;
      --mieweb-primary-500: ${colors.primary[500]} !important;
      --mieweb-primary-600: ${colors.primary[600]} !important;
      --mieweb-primary-700: ${colors.primary[700]} !important;
      --mieweb-primary-800: ${colors.primary[800]} !important;
      --mieweb-primary-900: ${colors.primary[900]} !important;
      --mieweb-primary-950: ${colors.primary[950]} !important;
      --mieweb-background: ${semanticColors.background} !important;
      --mieweb-foreground: ${semanticColors.foreground} !important;
      --mieweb-card: ${semanticColors.card} !important;
      --mieweb-card-foreground: ${semanticColors.cardForeground} !important;
      --mieweb-muted: ${semanticColors.muted} !important;
      --mieweb-muted-foreground: ${semanticColors.mutedForeground} !important;
      --mieweb-border: ${semanticColors.border} !important;
      --mieweb-input: ${semanticColors.input} !important;
      --mieweb-ring: ${semanticColors.ring} !important;
      --mieweb-destructive: ${semanticColors.destructive} !important;
      --mieweb-destructive-foreground: ${semanticColors.destructiveForeground} !important;
      --mieweb-success: ${semanticColors.success} !important;
      --mieweb-success-foreground: ${semanticColors.successForeground} !important;
      --mieweb-warning: ${semanticColors.warning} !important;
      --mieweb-warning-foreground: ${semanticColors.warningForeground} !important;
      --mieweb-font-sans: ${brand.typography.fontFamily.sans.map((f) => (f.includes(' ') ? `"${f}"` : f)).join(', ')} !important;
      ${brand.typography.fontFamily.mono ? `--mieweb-font-mono: ${brand.typography.fontFamily.mono.map((f) => (f.includes(' ') ? `"${f}"` : f)).join(', ')} !important;` : ''}
      --mieweb-radius-none: ${brand.borderRadius.none} !important;
      --mieweb-radius-sm: ${brand.borderRadius.sm} !important;
      --mieweb-radius-md: ${brand.borderRadius.md} !important;
      --mieweb-radius-lg: ${brand.borderRadius.lg} !important;
      --mieweb-radius-xl: ${brand.borderRadius.xl} !important;
      --mieweb-radius-2xl: ${brand.borderRadius['2xl']} !important;
      --mieweb-radius-full: ${brand.borderRadius.full} !important;
      --mieweb-shadow-card: ${brand.boxShadow.card} !important;
      --mieweb-shadow-dropdown: ${brand.boxShadow.dropdown} !important;
      --mieweb-shadow-modal: ${brand.boxShadow.modal} !important;
    }
  `;
  document.head.appendChild(styleTag);
}

const isLocoDisabled = (import.meta.env.VITE_DISABLE_LOCO as string | undefined)?.trim() === 'true';
// Set by .storybook/main.ts: true only on the dev server with LOCO_API_KEY configured.
declare const __LOCO_LIVE_SYNC__: boolean;
const isLiveSyncEnabled = typeof __LOCO_LIVE_SYNC__ !== 'undefined' && __LOCO_LIVE_SYNC__;

// Appends a "View source on GitHub" link below each story, derived from the
// story file's absolute path on disk (context.parameters.fileName).
const withGitHubSource: Decorator = (Story, context) => {
  const rawFileName = context.parameters?.fileName as string | undefined;
  // Normalize Windows backslashes to forward slashes before any path operations
  const fileName = rawFileName ? rawFileName.replace(/\\/g, '/') : undefined;
  const relPath = fileName ? repoRelativeStoryPath(fileName) : null;

  const githubUrl = (() => {
    if (!relPath) return null;
    // Submodule stories have no sibling component file; link the story itself.
    if (!relPath.startsWith('src/')) return githubSourceUrl(relPath);
    const basename = relPath.split('/').pop() ?? '';
    // Only strip `.stories` when the basename is strictly `Name.stories.(ts|tsx|js|jsx)`
    // (no extra dot-segments before `.stories`). Otherwise link to the stories file itself.
    const stripped = /^[^.]+\.stories\.(tsx?|jsx?)$/.test(basename)
      ? relPath.replace(/\.stories(\.[^.]+)$/, '$1')
      : relPath;
    return githubSourceUrl(stripped);
  })();

  // Full-height stories (parameters.githubSourceFooter === false) fill the
  // canvas exactly; a trailing footer would only add a page scrollbar. The
  // link still renders in docs view, where examples are bounded.
  const showFooter = !(
    context.viewMode === 'story' &&
    (context.parameters?.githubSourceFooter === false || mobilePreviewMode())
  );

  return (
    <>
      <Story />
      {githubUrl && showFooter && (
        <div
          translate="no"
          style={{
            marginTop: '12px',
            fontSize: '11px',
            textAlign: 'right',
          }}
        >
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mieweb-muted-foreground, #636363)', textDecoration: 'none' }}>
            View source on GitHub ↗
          </a>
        </div>
      )}
    </>
  );
};

// Brand switcher decorator
const withBrand: Decorator = (Story, context) => {
  const brandName = context.globals.brand || 'bluehive';
  const isDark = context.globals.theme === 'dark';
  const brand = brands[brandName] || brands.bluehive;
  
  // Get the actual color values for this brand/mode
  const semanticColors = isDark ? brand.colors.dark : brand.colors.light;

  const isCondensed = context.globals.density === 'condensed';
  const direction = context.globals.direction as string | undefined;
  const locale = context.globals.locale as string | undefined;

  useEffect(() => {
    // Delegate to shared applyGlobalTheme to keep a single source of truth
    applyGlobalTheme(context.globals);
  }, [brand, isDark, isCondensed, semanticColors, direction, locale]);

  // Load Google Fonts for the brand
  const fontLink = useMemo(() => {
    const primaryFont = brand.typography.fontFamily.sans[0];
    if (
      primaryFont &&
      !['ui-sans-serif', 'system-ui', 'sans-serif'].includes(primaryFont)
    ) {
      const fontName = primaryFont.replace(' ', '+');
      return `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700&display=swap`;
    }
    return null;
  }, [brand]);

  // Check if the story has fullscreen layout
  const isFullscreen = context.parameters?.layout === 'fullscreen';
  const isMobilePreview = context.viewMode === 'story' && mobilePreviewMode();
  
  // Build font family string
  const fontFamily = brand.typography.fontFamily.sans
    .map((f) => (f.includes(' ') ? `"${f}"` : f))
    .join(', ');

  return (
    <>
      {fontLink && <link rel="stylesheet" href={fontLink} />}
      <div
        className={`${isMobilePreview ? '' : 'min-h-[200px]'} transition-colors duration-200 ${isDark ? 'dark' : ''} ${isFullscreen || isMobilePreview ? '' : 'p-4'}`}
        style={{
          backgroundColor: semanticColors.background,
          color: semanticColors.foreground,
          fontFamily: fontFamily,
        }}
      >
        <Story />
      </div>
    </>
  );
};

// Adapt the forward-ref component to the provider's element-returning contract.
const PreviewCodeLookup: CodeLookupComponent = (props) => <CodeLookup {...props} />;

// Provides an ambient CodeLookup so the healthcare components' default (no
// explicit `codeLookup` / `renderCodeSearch` prop) demonstrates offline coded
// search. Stories that inject their own config still win (explicit overrides
// context); pass `codeLookup={false}` in a story to demo the plain-text opt-out.
//
// The `user` / `device` toolbar globals drive the memory picklist's two gates,
// and double as the reference for how an app wires them: one decision at the
// mount point, not per component.
const withCodeLookup: Decorator = (Story, context) => {
  const locale = (context.globals.locale as string) || 'en';
  const userId = (context.globals.user as string) || 'anonymous';
  const trusted = context.globals.device === 'trusted';
  // Codify shards only exist for these locales; fall back to English otherwise.
  const lookupLocale = ['en', 'es'].includes(locale) ? locale : 'en';
  return (
    <CodeLookupProvider
      component={PreviewCodeLookup}
      indexUrl="/codify"
      locale={lookupLocale}
      memory={{ userId, storage: trusted ? 'local' : 'session' }}
    >
      <Story />
    </CodeLookupProvider>
  );
};

// Harvests source-language copy under `root` (plus owned portals) into Loco now and whenever
// it changes later (async data, interactions). Returns a stop function.
function startLocoHarvest(
  root: Element,
  pageId: string,
  ownsPortals: () => boolean
): () => void {
  let cancelled = false;
  let timer: number | undefined;

  // Reuse the runtime's own scanner so posted keys/contexts match what apply() looks up.
  const harvest = async () => {
    const runtime = await ensureLocoInitialized('live');
    if (!runtime?.rescan || !runtime.textnodes || cancelled) return;
    // A translation was shown: the page reloads to pristine English (see syncLocoLocale).
    if (locoTranslationsLoaded) return;
    const roots = [root, ...(ownsPortals() ? locoPortalRoots() : [])];
    const textnodes = await scanLocoPhrases(runtime);
    if (cancelled) return;

    const keys = filterLocoTextnodes(textnodes, roots);
    if (keys.length === 0) return;

    const signature = `${pageId}:${keys
      .map((entry) => `${entry.key}\u0000${entry.context}`)
      .sort()
      .join('|')}`;
    if (postedLiveSyncSignatures.has(signature)) return;
    postedLiveSyncSignatures.add(signature);

    await postLocoTextnodes({
      serverUrl: LOCO_PROXY_BASE,
      keys,
      // Origin, path and story id only: query args can carry story control values.
      pageUrl: `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(pageId)}`,
    }).catch((error) => {
      postedLiveSyncSignatures.delete(signature);
      console.warn(
        '[loco-live-sync] Unable to post phrases to Loco. Check LOCO_SERVER_URL and LOCO_API_KEY.',
        error,
      );
    });
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void harvest().catch((error) => console.warn('[loco-live-sync] Harvest failed.', error));
    }, 500);
  };
  schedule();
  const observer = new MutationObserver((records) => {
    const relevant = records.some(
      ({ target }) => root.contains(target) || (ownsPortals() && isInLocoPortal(target))
    );
    if (relevant) schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  return () => {
    cancelled = true;
    observer.disconnect();
    window.clearTimeout(timer);
  };
}

// The preview reloads when the Loco mode changes: the runtime singleton holds one pack.
function syncLocoToolbarMode(locoMode: string) {
  if (typeof window === 'undefined') return;
  const previousMode = window.sessionStorage.getItem(LOCO_TOOLBAR_MODE_KEY);
  window.sessionStorage.setItem(LOCO_TOOLBAR_MODE_KEY, locoMode);
  if (previousMode && previousMode !== locoMode) reloadPreviewInMode(locoMode);
}

// Caches the live server's languages and reloads once per new set: toolbar items are static.
function syncLiveLocoLanguages(isCancelled: () => boolean) {
  if (isLocoDisabled || typeof window === 'undefined') return;
  void (async () => {
    const languages = await fetchLiveLocoLanguages();
    if (isCancelled() || languages.length === 0) return;

    const stableLanguages = [...languages].sort((a, b) => a.code.localeCompare(b.code));
    const nextCodes = stableLanguages.map((item) => item.code);
    window.localStorage.setItem(LOCO_LIVE_LANG_CACHE_KEY, JSON.stringify(stableLanguages));

    const languageSignature = nextCodes.join(',');
    const reloadedFor = window.sessionStorage.getItem(LOCO_LIVE_LANG_RELOAD_FLAG);
    const toolbarSignature = localeToolbarItems
      .map((item) => item.value)
      .filter((code) => code !== DEFAULT_LOCALE || nextCodes.includes(DEFAULT_LOCALE))
      .sort()
      .join(',');
    if (toolbarSignature !== languageSignature && reloadedFor !== languageSignature) {
      window.sessionStorage.setItem(LOCO_LIVE_LANG_RELOAD_FLAG, languageSignature);
      reloadPreviewInMode('live');
    }
  })().catch((error) => {
    console.warn('[loco-live] Unable to fetch live language list.', error);
  });
}

function resolveLocoMode(globals: Record<string, unknown>): string {
  const requestedMode = String(globals?.locoMode || 'disable');
  return requestedMode === 'live' && !isLiveSyncEnabled ? 'package' : requestedMode;
}

// Applies (or undoes) the toolbar's Loco mode/locale on the current preview document.
async function syncLocoLocale(
  globals: Record<string, unknown>,
  isCancelled: () => boolean = () => false
): Promise<void> {
  const locoMode = resolveLocoMode(globals);
  const locale = String(globals?.locale || 'en');
  const request = ++locoLatestRequest;
  try {
    // Disabled: undo any runtime translations and do nothing else.
    if (locoMode === 'disable' || isLocoDisabled) {
      const runtime = (window as any).Loco as LocoRuntime | undefined;
      if (runtime) {
        // The runtime rewrites <html lang/dir> on apply/restore; the toolbar owns them.
        await queueLocoLocale(runtime, null, request);
        applyDocumentLocale(globals);
      }
      return;
    }

    const mode = locoMode === 'live' ? 'live' : 'package';
    // In package mode only apply languages present in the exported pack;
    // English (the source language) means “show originals”.
    const shouldRestore =
      locale === 'en' || (mode === 'package' && !locoPackLanguages.includes(locale));

    // Nothing to undo yet — don't load the runtime just to restore originals.
    if (shouldRestore && !(window as any).Loco) return;
    if (mode === 'live' && shouldRestore && locoTranslationsLoaded && reloadForPristineEnglish()) {
      return;
    }

    const runtime = await ensureLocoInitialized(mode);
    if (!runtime || isCancelled()) return;

    await queueLocoLocale(runtime, shouldRestore ? null : locale, request);
    if (!isCancelled()) applyDocumentLocale(globals);
  } catch (error) {
    console.warn(`[loco] Unable to apply locale "${locale}" in ${locoMode} mode.`, error);
  }
}

// Docs-only MDX pages (e.g. Introduction) render no story, so no decorator runs there;
// translate them from the channel instead.
let locoDocsGlobals: Record<string, unknown> = {};
// Only set once Storybook reports a rendered docs page without stories, so story pages
// never race their decorator with a second apply.
let locoDocsOnlyPage = false;
let locoDocsId = '';
let stopLocoDocsHarvest: (() => void) | null = null;

// Live mode harvests docs-only pages too, from the English source only.
function updateLocoDocsHarvest() {
  stopLocoDocsHarvest?.();
  stopLocoDocsHarvest = null;
  const docsRoot = document.getElementById('storybook-docs');
  const harvesting =
    locoDocsOnlyPage &&
    docsRoot &&
    !isLocoDisabled &&
    resolveLocoMode(locoDocsGlobals) === 'live' &&
    String(locoDocsGlobals.locale || DEFAULT_LOCALE) === DEFAULT_LOCALE;
  if (harvesting) stopLocoDocsHarvest = startLocoHarvest(docsRoot, locoDocsId, () => true);
}

// Bumped on every docs-page sync and on leaving the page, so superseded syncs stop.
let locoDocsGeneration = 0;

// Docs-only counterpart of the story decorator's mode, language and locale effects.
function syncLocoDocsOnlyPage() {
  const generation = ++locoDocsGeneration;
  const isStale = () => generation !== locoDocsGeneration;
  const locoMode = resolveLocoMode(locoDocsGlobals);
  syncLocoToolbarMode(locoMode);
  if (locoMode === 'live') syncLiveLocoLanguages(isStale);
  void syncLocoLocale(locoDocsGlobals, isStale);
  updateLocoDocsHarvest();
}

const syncLocoDocsPage = (id?: unknown) => {
  if (typeof id === 'string') locoDocsId = id;
  locoDocsOnlyPage = !document.querySelector(LOCO_SCAN_ROOT_SELECTOR);
  if (locoDocsOnlyPage) syncLocoDocsOnlyPage();
  else updateLocoDocsHarvest();
};
const leaveLocoDocsPage = () => {
  locoDocsOnlyPage = false;
  locoDocsGeneration++;
  updateLocoDocsHarvest();
};
const handleLocoGlobals = ({ globals }: { globals: Record<string, unknown> }) => {
  locoDocsGlobals = globals;
  if (locoDocsOnlyPage) syncLocoDocsOnlyPage();
};
try {
  const globalsParam = new URLSearchParams(window.location.search).get('globals') || '';
  locoDocsGlobals = Object.fromEntries(
    globalsParam
      .split(';')
      .map((pair) => pair.split(':'))
      .filter(([key, value]) => key && value)
  );
} catch {
  // Ignore URL parsing errors.
}
for (const event of ['setGlobals', 'globalsUpdated']) {
  channel.off(event, handleLocoGlobals);
  channel.on(event, handleLocoGlobals);
}
channel.off('docsRendered', syncLocoDocsPage);
channel.on('docsRendered', syncLocoDocsPage);
channel.off('storyRendered', leaveLocoDocsPage);
channel.on('storyRendered', leaveLocoDocsPage);
import.meta.hot?.dispose(() => {
  ['setGlobals', 'globalsUpdated'].forEach((event) => channel.off(event, handleLocoGlobals));
  channel.off('docsRendered', syncLocoDocsPage);
  channel.off('storyRendered', leaveLocoDocsPage);
});

const withLocoLiveSync: Decorator = (Story, context) => {
  const requestedMode = String(context.globals?.locoMode || 'disable');
  const locoMode = resolveLocoMode(context.globals);
  const locale = String(context.globals?.locale || 'en');
  const scanRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestedMode === 'live' && !isLiveSyncEnabled) {
      console.warn(
        '[loco-live] Live sync is off: run the Storybook dev server with LOCO_API_KEY (and optionally LOCO_SERVER_URL) in .env.local.'
      );
    }
  }, [requestedMode]);

  useEffect(() => syncLocoToolbarMode(locoMode), [locoMode]);

  useEffect(() => {
    if (locoMode !== 'live') return;
    let cancelled = false;
    syncLiveLocoLanguages(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [locoMode]);

  useEffect(() => {
    // Only harvest source-language text; translated DOM would register translations as new keys.
    if (locoMode !== 'live' || isLocoDisabled || locale !== DEFAULT_LOCALE) return;

    // Autodocs renders one decorator per story, so each harvests only its own root.
    const root = scanRootRef.current;
    if (!root) return;
    return startLocoHarvest(
      root,
      context.id,
      () => context.viewMode === 'story' || locoActiveScanRoot === root
    );
  }, [locoMode, locale, context.id, context.viewMode]);

  useEffect(() => {
    let cancelled = false;
    void syncLocoLocale(context.globals, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [locoMode, locale, context.id]);

  return (
    <div ref={scanRootRef} data-loco-scan-root="true">
      <Story />
    </div>
  );
};

const preview: Preview = {
  initialGlobals: {
    brand: 'bluehive',
    theme: 'light',
    density: 'standard',
    locale: 'en',
    direction: 'auto',
    user: 'anonymous',
    device: 'public',
    // Loco is opt-in: stories render untouched until a mode is picked from the toolbar.
    locoMode: 'disable',
  },
  // The bar stays one glyph wide but still shows the current value: `title` is
  // the emoji (or a per-item icon) and the wording moves to the dropdown's
  // `right` column.
  globalTypes: {
    brand: {
      name: 'Brand',
      description: 'Switch between brand themes',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'bluehive', title: '🐝', right: 'BlueHive' },
          { value: 'ccme', title: '🌿', right: 'ccMe' },
          { value: 'default', title: '⚪', right: 'Default' },
          { value: 'enterprise-health', title: '🏥', right: 'Enterprise Health' },
          { value: 'mieweb', title: '🟢', right: 'MIE Web' },
          { value: 'ozwell', title: '🤖', right: 'Ozwell' },
          { value: 'waggleline', title: '🍯', right: 'Waggleline' },
          { value: 'webchart', title: '🟠', right: 'WebChart' },
        ],
      },
    },
    theme: {
      name: 'Theme',
      description: 'Color mode',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: false,
      },
    },
    density: {
      name: 'Density',
      description: 'UI density mode',
      toolbar: {
        icon: 'collapse',
        items: [
          { value: 'standard', icon: 'grow', title: 'Standard' },
          { value: 'condensed', icon: 'collapse', title: 'Condensed' },
        ],
        dynamicTitle: false,
      },
    },
    locale: {
      name: 'Language',
      description:
        'Locale used by i18n integration stories and locale-aware components (e.g. CodeLookup shards)',
      toolbar: {
        icon: 'globe',
        items: localeToolbarItems,
        dynamicTitle: true,
      },
    },
    locoMode: {
      name: 'Loco i18n',
      description:
        'Use the Loco i18n package for preview, disable Loco, or (dev server with LOCO_API_KEY) sync discovered phrases to the Loco pending list. Live sync is for curated demo copy only: form fields and editable regions are skipped, and personal data must be marked translate="no".',
      toolbar: {
        icon: 'sync',
        items: [
          { value: 'disable', title: '🚫', right: 'Disable' },
          { value: 'package', title: '📦', right: 'Loco i18n' },
          ...(isLiveSyncEnabled
            ? [{ value: 'live', title: '🔄', right: 'Loco Sync Text' }]
            : []),
        ],
      },
    },
    direction: {
      name: 'Direction',
      description: 'Text direction (LTR/RTL preview)',
      toolbar: {
        icon: 'transfer',
        items: [
          { value: 'auto', title: '🔁', right: 'Auto (from language)' },
          { value: 'ltr', title: '➡️', right: 'LTR' },
          { value: 'rtl', title: '⬅️', right: 'RTL' },
        ],
      },
    },
    user: {
      name: 'Signed in as',
      description:
        'Simulated session identity. CodeLookup only remembers picked codes for a real user.',
      toolbar: {
        icon: 'user',
        items: [
          { value: 'anonymous', title: '🚫', right: 'Not signed in' },
          { value: 'alice', title: '👩‍⚕️', right: 'Dr. Alice' },
          { value: 'bob', title: '👨‍⚕️', right: 'Dr. Bob' },
          { value: 'nurse', title: '💉', right: 'Nurse Nia' },
          { value: 'reception', title: '🧑‍💼', right: 'Reception Rae' },
          { value: 'patient', title: '🤒', right: 'Patient Pat' },
        ],
      },
    },
    device: {
      name: 'Device',
      description:
        'Simulates the deployment’s device-trust decision (not an end-user setting): whether picked codes may be cached on this machine.',
      toolbar: {
        icon: 'lock',
        items: [
          {
            value: 'public',
            icon: 'unlock',
            title: 'Public kiosk — nothing stored',
          },
          {
            value: 'trusted',
            icon: 'lock',
            title: 'Trusted workstation — cached',
          },
        ],
        dynamicTitle: false,
      },
    },
  },
  parameters: {
    a11y: {
      test: 'error',
      config: {
        rules: [
          // These rules fire on every story because Storybook renders components
          // in an iframe without <main>, <h1>, or landmark regions. They are not
          // real-world issues — host applications provide these structural elements.
          { id: 'landmark-one-main', enabled: false },
          { id: 'page-has-heading-one', enabled: false },
          { id: 'region', enabled: false },
          // Components use <h3> (Card titles) correctly in context, but stories
          // render in isolation without parent <h1>/<h2> elements, causing false
          // positives. Host apps provide proper heading hierarchy.
          { id: 'heading-order', enabled: false },
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Show the story source in a "Code" panel tab (next to Controls). Note: for stories with a custom
    // `render`, Storybook shows the render snippet/args, not the full component source.
    // `canvas.withToolbar` gives every docs canvas (not just the primary story) the
    // zoom / "Open canvas in new tab" toolbar.
    // `page` renders the catalog metadata (status banner, Related, Install) declared on each Meta.
    docs: { codePanel: true, canvas: { withToolbar: true }, page: CatalogDocsPage },
    layout: 'padded',
    options: {
      // Sidebar order is Tier / Family / Component with each family's Overview
      // first. Grammar: a name followed by an array orders that name's children.
      // Storybook parses this literal statically, so it cannot import
      // taxonomy.json; scripts/catalog-check.mjs fails CI if the two drift.
      storySort: {
        method: 'alphabetical',
        order: [
          'Introduction',
          'AI Design Agents',
          'Branding',
          'Foundations',
          'Inputs',
          [
            'Actions',
            ['Overview', '*'],
            'Text inputs',
            ['Overview', '*'],
            'Choice inputs',
            ['Overview', '*'],
            'Date & time',
            ['Overview', '*'],
            'Composite forms',
            ['Overview', '*'],
          ],
          'Components',
          [
            'Data display',
            ['Overview', '*'],
            'Grids',
            ['Overview', '*'],
            'Feedback',
            ['Overview', '*'],
            'Loading',
            ['Overview', '*'],
            'Overlays',
            ['Overview', '*'],
            'Navigation',
            ['Overview', '*'],
            'Layout',
            ['Overview', '*'],
            'Record details',
            ['Overview', '*'],
            'Showcase',
            ['Overview', '*'],
          ],
          'Modules',
          [
            'Dashboards',
            ['Overview', '*'],
            'Views',
            ['Overview', '*'],
            'Media',
            ['Overview', '*'],
            'Editors',
            ['Overview', '*'],
            'Chat',
            ['Overview', '*'],
            'SuperChat',
            ['Overview', '*'],
            'Voice',
            ['Overview', '*'],
            'Files',
            ['Overview', '*'],
            'Presentations',
            ['Overview', '*'],
            'Records',
            ['Overview', '*'],
          ],
          'Templates',
          [
            'Pages',
            ['Overview', '*'],
            'Conversion',
            ['Overview', '*'],
            'Content',
            ['Overview', '*'],
            'Social proof',
            ['Overview', '*'],
            'Reports',
            ['Overview', '*'],
          ],
          'Healthcare',
          [
            'Clinical lists',
            ['Overview', '*'],
            'Encounter & orders',
            ['Overview', '*'],
          ],
          'BlueHive',
          [
            'Orders',
            ['Overview', '*'],
            'Employers',
            ['Overview', '*'],
            'Billing',
            ['Overview', '*'],
            'Providers',
            ['Overview', '*'],
            'Services',
            ['Overview', '*'],
            'Users & integrations',
            ['Overview', '*'],
            'Operations',
            ['Overview', '*'],
          ],
          'Deprecated',
        ],
      },
    },
  },
  decorators: [
    withGitHubSource,
    withBrand,
    withCodeLookup,
    withMobilePreview,
    withLocoLiveSync,
  ],
};

export default preview;
