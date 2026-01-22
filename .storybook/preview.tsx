import type { Preview, Decorator } from '@storybook/react-vite';
import { useEffect, useMemo } from 'react';
import '../src/styles/base.css';
import './preview.css';
import { bluehiveBrand } from '../src/brands/bluehive';
import { defaultBrand } from '../src/brands/default';
import { enterpriseHealthBrand } from '../src/brands/enterprise-health';
import { miewebBrand } from '../src/brands/mieweb';
import { wagglelineBrand } from '../src/brands/waggleline';
import { webchartBrand } from '../src/brands/webchart';
import type { BrandConfig } from '../src/brands/types';

// Map of available brands
const brands: Record<string, BrandConfig> = {
  bluehive: bluehiveBrand,
  default: defaultBrand,
  'enterprise-health': enterpriseHealthBrand,
  mieweb: miewebBrand,
  waggleline: wagglelineBrand,
  webchart: webchartBrand,
};

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

// Brand switcher decorator
const withBrand: Decorator = (Story, context) => {
  const brandName = context.globals.brand || 'bluehive';
  const isDark = context.globals.theme === 'dark';
  const brand = brands[brandName] || brands.bluehive;

  useEffect(() => {
    applyBrandStyles(brand, isDark);

    // Update dark mode class
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = 'var(--mieweb-background)';
      document.body.style.color = 'var(--mieweb-foreground)';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = 'var(--mieweb-background)';
      document.body.style.color = 'var(--mieweb-foreground)';
    }
  }, [brand, isDark]);

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

  return (
    <>
      {fontLink && <link rel="stylesheet" href={fontLink} />}
      <div
        className={`min-h-[200px] transition-colors duration-200 ${isDark ? 'dark' : ''} ${isFullscreen ? '' : 'p-4'}`}
        style={{
          backgroundColor: 'var(--mieweb-background)',
          color: 'var(--mieweb-foreground)',
          fontFamily: 'var(--mieweb-font-sans)',
        }}
      >
        <Story />
      </div>
    </>
  );
};

const preview: Preview = {
  globalTypes: {
    brand: {
      name: 'Brand',
      description: 'Switch between brand themes',
      defaultValue: 'bluehive',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'bluehive', title: '🐝 BlueHive' },
          { value: 'default', title: '⚪ Default' },
          { value: 'enterprise-health', title: '🏥 Enterprise Health' },
          { value: 'mieweb', title: '🟢 MIE Web' },
          { value: 'waggleline', title: '🍯 Waggleline' },
          { value: 'webchart', title: '🟠 WebChart' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
    theme: {
      name: 'Theme',
      description: 'Color mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  parameters: {
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
          'Components',
          [
            'Alert',
            'Avatar',
            'Badge',
            'Breadcrumb',
            'Button',
            'Card',
            'Checkbox',
            'DateInput',
            'Dropdown',
            'Input',
            'Modal',
            'Pagination',
            'PhoneInput',
            'Progress',
            'QuickAction',
            'Radio',
            'SchedulePicker',
            'Select',
            'Skeleton',
            'Spinner',
            'Switch',
            'Table',
            'Tabs',
            'Text',
            'Textarea',
            'ThemeProvider',
            'Tooltip',
            'VisuallyHidden',
          ],
          'Hooks',
          'Examples',
        ],
      },
    },
  },
  decorators: [withBrand],
};

export default preview;
