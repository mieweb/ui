import type { Preview, Decorator } from '@storybook/react-vite';
import { useEffect, useMemo } from 'react';
import '../src/styles/base.css';
import { bluehiveBrand } from '../src/brands/bluehive';
import { defaultBrand } from '../src/brands/default';
import type { BrandConfig } from '../src/brands/types';

// Map of available brands
const brands: Record<string, BrandConfig> = {
  bluehive: bluehiveBrand,
  default: defaultBrand,
};

// Function to apply brand CSS variables to document
function applyBrandStyles(brand: BrandConfig, isDark: boolean) {
  const root = document.documentElement;
  const colors = brand.colors;
  const semanticColors = isDark ? colors.dark : colors.light;

  // Primary color scale
  root.style.setProperty('--mieweb-primary-50', colors.primary[50]);
  root.style.setProperty('--mieweb-primary-100', colors.primary[100]);
  root.style.setProperty('--mieweb-primary-200', colors.primary[200]);
  root.style.setProperty('--mieweb-primary-300', colors.primary[300]);
  root.style.setProperty('--mieweb-primary-400', colors.primary[400]);
  root.style.setProperty('--mieweb-primary-500', colors.primary[500]);
  root.style.setProperty('--mieweb-primary-600', colors.primary[600]);
  root.style.setProperty('--mieweb-primary-700', colors.primary[700]);
  root.style.setProperty('--mieweb-primary-800', colors.primary[800]);
  root.style.setProperty('--mieweb-primary-900', colors.primary[900]);
  root.style.setProperty('--mieweb-primary-950', colors.primary[950]);

  // Semantic colors
  root.style.setProperty('--mieweb-background', semanticColors.background);
  root.style.setProperty('--mieweb-foreground', semanticColors.foreground);
  root.style.setProperty('--mieweb-card', semanticColors.card);
  root.style.setProperty('--mieweb-card-foreground', semanticColors.cardForeground);
  root.style.setProperty('--mieweb-muted', semanticColors.muted);
  root.style.setProperty('--mieweb-muted-foreground', semanticColors.mutedForeground);
  root.style.setProperty('--mieweb-border', semanticColors.border);
  root.style.setProperty('--mieweb-input', semanticColors.input);
  root.style.setProperty('--mieweb-ring', semanticColors.ring);
  root.style.setProperty('--mieweb-destructive', semanticColors.destructive);
  root.style.setProperty('--mieweb-destructive-foreground', semanticColors.destructiveForeground);
  root.style.setProperty('--mieweb-success', semanticColors.success);
  root.style.setProperty('--mieweb-success-foreground', semanticColors.successForeground);
  root.style.setProperty('--mieweb-warning', semanticColors.warning);
  root.style.setProperty('--mieweb-warning-foreground', semanticColors.warningForeground);

  // Typography
  root.style.setProperty(
    '--mieweb-font-sans',
    brand.typography.fontFamily.sans.map((f) => (f.includes(' ') ? `"${f}"` : f)).join(', ')
  );
  if (brand.typography.fontFamily.mono) {
    root.style.setProperty(
      '--mieweb-font-mono',
      brand.typography.fontFamily.mono.map((f) => (f.includes(' ') ? `"${f}"` : f)).join(', ')
    );
  }

  // Border radius
  root.style.setProperty('--mieweb-radius-none', brand.borderRadius.none);
  root.style.setProperty('--mieweb-radius-sm', brand.borderRadius.sm);
  root.style.setProperty('--mieweb-radius-md', brand.borderRadius.md);
  root.style.setProperty('--mieweb-radius-lg', brand.borderRadius.lg);
  root.style.setProperty('--mieweb-radius-xl', brand.borderRadius.xl);
  root.style.setProperty('--mieweb-radius-2xl', brand.borderRadius['2xl']);
  root.style.setProperty('--mieweb-radius-full', brand.borderRadius.full);

  // Shadows
  root.style.setProperty('--mieweb-shadow-card', brand.boxShadow.card);
  root.style.setProperty('--mieweb-shadow-dropdown', brand.boxShadow.dropdown);
  root.style.setProperty('--mieweb-shadow-modal', brand.boxShadow.modal);
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
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
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

  return (
    <>
      {fontLink && <link rel="stylesheet" href={fontLink} />}
      <div
        className={`min-h-screen p-4 transition-colors duration-200 ${isDark ? 'dark' : ''}`}
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
  },
  decorators: [withBrand],
};

export default preview;
