/// <reference types="vite/client" />
import type { Preview, Decorator } from '@storybook/react-vite';
import { useEffect, useMemo } from 'react';
import { addons } from 'storybook/preview-api';
import '../src/styles/base.css';
import '../src/styles/kerebron.css';
import './preview.css';
import { bluehiveBrand } from '../src/brands/bluehive';
import { ccmeBrand } from '../src/brands/ccme';
import { defaultBrand } from '../src/brands/default';
import { enterpriseHealthBrand } from '../src/brands/enterprise-health';
import { miewebBrand } from '../src/brands/mieweb';
import { ozwellBrand } from '../src/brands/ozwell';
import { wagglelineBrand } from '../src/brands/waggleline';
import { webchartBrand } from '../src/brands/webchart';
import type { BrandConfig } from '../src/brands/types';

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
  if (globals.theme || globals.brand || globals.density) {
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

  useEffect(() => {
    // Delegate to shared applyGlobalTheme to keep a single source of truth
    applyGlobalTheme(context.globals);
  }, [brand, isDark, isCondensed, semanticColors]);

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

const preview: Preview = {
  initialGlobals: {
    brand: 'bluehive',
    theme: 'light',
    density: 'standard',
  },
  globalTypes: {
    brand: {
      name: 'Brand',
      description: 'Switch between brand themes',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'bluehive', title: '🐝 BlueHive' },
          { value: 'ccme', title: '🌿 ccMe' },
          { value: 'default', title: '⚪ Default' },
          { value: 'enterprise-health', title: '🏥 Enterprise Health' },
          { value: 'mieweb', title: '🟢 MIE Web' },
          { value: 'ozwell', title: '🤖 Ozwell' },
          { value: 'waggleline', title: '🍯 Waggleline' },
          { value: 'webchart', title: '🟠 WebChart' },
        ],
        dynamicTitle: true,
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
        dynamicTitle: true,
      },
    },
    density: {
      name: 'Density',
      description: 'UI density mode',
      toolbar: {
        icon: 'collapse',
        items: [
          { value: 'standard', title: 'Standard' },
          { value: 'condensed', title: 'Condensed' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    a11y: {
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
        ],
      },
    },
  },
  decorators: [withGitHubSource, withBrand],
};

export default preview;
