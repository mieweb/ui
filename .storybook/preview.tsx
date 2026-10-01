/// <reference types="vite/client" />
import type { Preview, Decorator } from '@storybook/react-vite';
import { useEffect, useMemo } from 'react';
import { addons } from 'storybook/preview-api';
import '../src/styles/base.css';
import '../src/styles/kerebron.css';
import './preview.css';
// eSheet compiled CSS must load in a deterministic order: both files define
// identical plain utilities (e.g. .ms\:hidden) but only the builder file has
// the responsive display overrides (.ms\:lg\:flex etc.). If the renderer CSS
// loads after the builder CSS (which depends on story visit order when each
// story imports its own), the renderer's plain .ms\:hidden wins the cascade
// and the builder's side panels stay hidden at every viewport width.
import '../packages/esheet/packages/renderer/src/index.output.css';
import '../packages/esheet/packages/builder/src/index.output.css';
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
import { CodeLookupProvider } from '../src/components/CodeLookup/context';
import { isRtlLocale } from '../src/hooks/useDirection';
import { CatalogDocsPage } from './CatalogDocsPage';
import { collectLocoKeysFromElement, postLocoTextnodes } from '../src/utils/loco-live';
import locoI18nPack from '../src/i18n/i18n-translations.json';

const postedLiveSyncSignatures = new Set<string>();
const locoScriptLoaders = new Map<string, Promise<void>>();

// The exported Loco pack is also served statically (see staticDirs in main.ts)
// so the Loco runtime can consume it in file mode. The runtime itself is
// vendored from the Loco repo (public/loco.min.js) so package mode works
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

function getCurrentLocoModeFromUrl(): 'package' | 'live' | 'disable' {
  if (typeof window === 'undefined') return 'package';
  try {
    const params = new URLSearchParams(window.location.search);
    const globalsParam = params.get('globals') || '';
    const entries = globalsParam.split(';');
    for (const pair of entries) {
      const [key, value] = pair.split(':');
      if (key === 'locoMode') {
        if (value === 'live' || value === 'disable') return value;
        return 'package';
      }
    }
  } catch {
    // Ignore parse errors.
  }
  return 'package';
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

// Live mode lists the server's languages; package/disable list the committed pack's.
function buildLocaleToolbarItems(
  mode: 'package' | 'live' | 'disable'
): LocaleToolbarItem[] {
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

const localeToolbarItems = buildLocaleToolbarItems(getCurrentLocoModeFromUrl());

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
};

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
    });
    locoScriptLoaders.set(scriptId, loader);
  }

  await loader;
  return ((window as any).Loco as LocoRuntime | undefined) ?? null;
}

async function ensureLocoInitialized(
  mode: 'package' | 'live',
): Promise<LocoRuntime | null> {
  // Runtime already initialized in a different mode — reload the preview iframe
  // so the singleton starts fresh in the requested mode.
  if (locoInitializedMode && locoInitializedMode !== mode) {
    window.location.reload();
    return null;
  }

  if (locoInitPromise) return locoInitPromise;

  locoInitPromise = (async () => {
    const runtime = await ensureLocoRuntimeLoaded(LOCO_RUNTIME_URL);
    if (!runtime?.init) return runtime ?? null;

    const file = mode === 'package' ? LOCO_PACK_URL : `${LOCO_PROXY_BASE}/pack.json`;
    await Promise.resolve(runtime.init({ file }));
    // languages() resolves once the pack is loaded — a readiness barrier before the first apply().
    if (runtime.languages) {
      await Promise.resolve(runtime.languages()).catch(() => undefined);
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

/*
 * Resolve the effective text direction from the direction/locale globals.
 * 'auto' derives it from the locale (rtl for ar/he/fa/ur).
 */
function resolveGlobalDirection(
  globals: Record<string, unknown>
): 'ltr' | 'rtl' {
  const direction = (globals?.direction as string) || 'auto';
  if (direction === 'ltr' || direction === 'rtl') return direction;
  return isRtlLocale((globals?.locale as string) || 'en') ? 'rtl' : 'ltr';
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

  // Apply text direction (RTL preview) at the document level so CSS logical
  // properties and `rtl:` variants respond everywhere, including docs pages.
  document.documentElement.setAttribute('dir', resolveGlobalDirection(globals));
  // Keep the document language in sync with the locale global so screen
  // readers and locale-sensitive text shaping reflect the selected locale.
  document.documentElement.setAttribute(
    'lang',
    (globals?.locale as string) || 'en'
  );

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
  const srcIndex = fileName ? fileName.indexOf('/src/') : -1;

  const githubUrl = (() => {
    if (srcIndex < 0 || !fileName) return null;
    const relPath = fileName.slice(srcIndex + 1);
    const basename = relPath.split('/').pop() ?? '';
    // Only strip `.stories` when the basename is strictly `Name.stories.(ts|tsx|js|jsx)`
    // (no extra dot-segments before `.stories`). Otherwise link to the stories file itself.
    const stripped = /^[^.]+\.stories\.(tsx?|jsx?)$/.test(basename)
      ? relPath.replace(/\.stories(\.[^.]+)$/, '$1')
      : relPath;
    return `https://github.com/mieweb/ui/blob/main/${stripped}`;
  })();

  // Full-height stories (parameters.githubSourceFooter === false) fill the
  // canvas exactly; a trailing footer would only add a page scrollbar. The
  // link still renders in docs view, where examples are bounded.
  const showFooter = !(
    context.viewMode === 'story' &&
    context.parameters?.githubSourceFooter === false
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
  
  // Build font family string
  const fontFamily = brand.typography.fontFamily.sans
    .map((f) => (f.includes(' ') ? `"${f}"` : f))
    .join(', ');

  return (
    <>
      {fontLink && <link rel="stylesheet" href={fontLink} />}
      <div
        className={`min-h-[200px] transition-colors duration-200 ${isDark ? 'dark' : ''} ${isFullscreen ? '' : 'p-4'}`}
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
      component={CodeLookup}
      indexUrl="/codify"
      locale={lookupLocale}
      memory={{ userId, storage: trusted ? 'local' : 'session' }}
    >
      <Story />
    </CodeLookupProvider>
  );
};

const withLocoLiveSync: Decorator = (Story, context) => {
  const requestedMode = String(context.globals?.locoMode || 'package');
  const locoMode =
    requestedMode === 'live' && !isLiveSyncEnabled ? 'package' : requestedMode;
  const locale = String(context.globals?.locale || 'en');

  useEffect(() => {
    if (requestedMode === 'live' && !isLiveSyncEnabled) {
      console.warn(
        '[loco-live] Live sync is off: run the Storybook dev server with LOCO_API_KEY (and optionally LOCO_SERVER_URL) in .env.local.'
      );
    }
  }, [requestedMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const previousMode = window.sessionStorage.getItem(LOCO_TOOLBAR_MODE_KEY);
    if (previousMode && previousMode !== locoMode) {
      window.sessionStorage.setItem(LOCO_TOOLBAR_MODE_KEY, locoMode);
      window.location.reload();
      return;
    }
    window.sessionStorage.setItem(LOCO_TOOLBAR_MODE_KEY, locoMode);
  }, [locoMode]);

  useEffect(() => {
    if (locoMode !== 'live' || isLocoDisabled || typeof window === 'undefined') {
      return;
    }

    let cancelled = false;

    void (async () => {
      const languages = await fetchLiveLocoLanguages();
      if (cancelled || languages.length === 0) return;

      const stableLanguages = [...languages].sort((a, b) =>
        a.code.localeCompare(b.code)
      );
      const nextCodes = stableLanguages.map((item) => item.code);

      window.localStorage.setItem(
        LOCO_LIVE_LANG_CACHE_KEY,
        JSON.stringify(stableLanguages)
      );

      // Toolbar options are static at module load: reload once per distinct server language set.
      const languageSignature = nextCodes.join(',');
      const reloadedFor = window.sessionStorage.getItem(LOCO_LIVE_LANG_RELOAD_FLAG);
      const toolbarCodes = new Set(localeToolbarItems.map((item) => item.value));
      const toolbarIsStale = nextCodes.some((code) => !toolbarCodes.has(code));
      if (toolbarIsStale && reloadedFor !== languageSignature) {
        window.sessionStorage.setItem(LOCO_LIVE_LANG_RELOAD_FLAG, languageSignature);
        window.location.reload();
      }
    })().catch((error) => {
      console.warn('[loco-live] Unable to fetch live language list.', error);
    });

    return () => {
      cancelled = true;
    };
  }, [locoMode]);

  useEffect(() => {
    // Only harvest source-language text; translated DOM would register translations as new keys.
    if (locoMode !== 'live' || isLocoDisabled || locale !== DEFAULT_LOCALE) return;

    const root = document.querySelector('[data-loco-scan-root="true"]') as HTMLElement | null;
    if (!root) return;

    const keys = collectLocoKeysFromElement(root);
    if (keys.length === 0) return;

    const signature = `${context.id}:${keys
      .map((entry) => entry.key)
      .sort()
      .join('|')}`;
    if (postedLiveSyncSignatures.has(signature)) return;
    postedLiveSyncSignatures.add(signature);

    void postLocoTextnodes({
      serverUrl: LOCO_PROXY_BASE,
      keys,
      pageUrl: window.location.href,
    }).catch((error) => {
      postedLiveSyncSignatures.delete(signature);
      console.warn(
        '[loco-live-sync] Unable to post phrases to Loco. Check LOCO_SERVER_URL and LOCO_API_KEY.',
        error,
      );
    });
  }, [locoMode, locale, context.id]);

  useEffect(() => {
    let cancelled = false;

    // Disabled: undo any runtime translations and do nothing else.
    if (locoMode === 'disable' || isLocoDisabled) {
      const runtime = (window as any).Loco as LocoRuntime | undefined;
      if (runtime?.restore) {
        void Promise.resolve(runtime.restore()).catch(() => undefined);
      }
      return;
    }

    void (async () => {
      const mode = locoMode === 'live' ? 'live' : 'package';

      // In package mode only apply languages present in the exported pack;
      // English (the source language) means “show originals”.
      const shouldRestore =
        locale === 'en' || (mode === 'package' && !locoPackLanguages.includes(locale));

      // Nothing to undo yet — don't load the runtime just to restore originals.
      if (shouldRestore && !(window as any).Loco) return;

      const runtime = await ensureLocoInitialized(mode);
      if (!runtime || cancelled) return;

      if (shouldRestore) {
        if (runtime.restore) {
          await Promise.resolve(runtime.restore());
        }
        return;
      }

      if (runtime.apply) {
        await Promise.resolve(runtime.apply(locale));
      }
    })().catch((error) => {
      console.warn(`[loco] Unable to apply locale "${locale}" in ${locoMode} mode.`, error);
    });

    return () => {
      cancelled = true;
    };
  }, [locoMode, locale, context.id]);

  return (
    <div data-loco-scan-root="true">
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
    locoMode: 'package',
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
        'Use the Loco i18n package for preview, disable Loco, or (dev server with LOCO_API_KEY) sync discovered phrases to the Loco pending list.',
      toolbar: {
        icon: 'sync',
        items: [
          { value: 'package', title: '📦', right: 'Loco i18n' },
          ...(isLiveSyncEnabled
            ? [{ value: 'live', title: '🔄', right: 'Loco Sync Text' }]
            : []),
          { value: 'disable', title: '🚫', right: 'Disable' },
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
  decorators: [withGitHubSource, withBrand, withCodeLookup, withLocoLiveSync],
};

export default preview;
