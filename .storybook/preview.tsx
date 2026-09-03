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
  styleTag.textContent = `
    :root, [data-theme="light"], [data-theme="dark"] {
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

  return (
    <>
      <Story />
      {githubUrl && (
        <div
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
  // Codify shards only exist for these locales; fall back to English for
  // preview-only locales (e.g. the RTL Arabic sample).
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

const preview: Preview = {
  initialGlobals: {
    brand: 'bluehive',
    theme: 'light',
    density: 'standard',
    locale: 'en',
    direction: 'auto',
    user: 'anonymous',
    device: 'public',
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
      description: 'Locale for locale-aware components (e.g. CodeLookup shards)',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: '🇺🇸', right: 'English' },
          { value: 'es', title: '🇪🇸', right: 'Español (sample)' },
          { value: 'ar', title: '🇸🇦', right: 'العربية (RTL sample)' },
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
    docs: { codePanel: true, canvas: { withToolbar: true } },
    layout: 'padded',
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          ['Components', ['Forms & Inputs', ['eSheet', '*']]],
          'Inputs & Controls',
          'Data Display',
          'Navigation',
          'Feedback & Overlays',
          'Layout & Structure',
          'Authentication & Permissions',
          'Commerce & Payments',
          'Media & Device',
          'Feature Modules',
          'Examples',
          'Forms',
          'Provider',
          'Provider Directory',
          'Messaging',
          'Directory',
          'Search',
          'Layout',
          '*',
          'Deprecated',
        ],
      },
    },
  },
  decorators: [withGitHubSource, withBrand, withCodeLookup],
};

export default preview;
