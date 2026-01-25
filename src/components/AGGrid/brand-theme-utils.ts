/**
 * AG Grid Brand Theme Utilities
 *
 * Utilities for applying brand themes to AG Grid components,
 * integrating with the mieweb-ui design system.
 */

import * as React from 'react';
import type { BrandConfig } from '../../brands/types';
import {
  miewebBrand,
  bluehiveBrand,
  wagglelineBrand,
  webchartBrand,
  enterpriseHealthBrand,
} from '../../brands';

// =============================================================================
// Brand Theme Types
// =============================================================================

export type AGGridBrandName =
  | 'mieweb'
  | 'bluehive'
  | 'waggleline'
  | 'webchart'
  | 'enterprise-health';

export interface AGGridBrandTheme {
  name: AGGridBrandName;
  config: BrandConfig;
  cssClass: string;
}

// =============================================================================
// Brand Theme Registry
// =============================================================================

export const agGridBrandThemes: Record<AGGridBrandName, AGGridBrandTheme> = {
  mieweb: {
    name: 'mieweb',
    config: miewebBrand,
    cssClass: 'ag-brand-mieweb',
  },
  bluehive: {
    name: 'bluehive',
    config: bluehiveBrand,
    cssClass: 'ag-brand-bluehive',
  },
  waggleline: {
    name: 'waggleline',
    config: wagglelineBrand,
    cssClass: 'ag-brand-waggleline',
  },
  webchart: {
    name: 'webchart',
    config: webchartBrand,
    cssClass: 'ag-brand-webchart',
  },
  'enterprise-health': {
    name: 'enterprise-health',
    config: enterpriseHealthBrand,
    cssClass: 'ag-brand-enterprise-health',
  },
};

// =============================================================================
// CSS Variable Generation
// =============================================================================

/**
 * Generate CSS custom properties for AG Grid from a brand configuration
 */
export function generateAGGridBrandCSS(
  brandConfig: BrandConfig
): Record<string, string> {
  const { colors, typography, borderRadius } = brandConfig;

  return {
    // Core colors
    '--ag-background-color': colors.light.background,
    '--ag-foreground-color': colors.light.foreground,
    '--ag-border-color': colors.light.border,

    // Primary colors
    '--ag-primary-color': colors.primary[600],
    '--ag-primary-hover': colors.primary[700],
    '--ag-primary-active': colors.primary[800],

    // Header
    '--ag-header-background-color': colors.light.muted,
    '--ag-header-foreground-color': colors.light.mutedForeground,

    // Rows
    '--ag-row-hover-color': colors.light.card,
    '--ag-selected-row-background-color': colors.primary[50],

    // Typography
    '--ag-font-family': typography.fontFamily.sans.join(', '),

    // Border radius
    '--ag-wrapper-border-radius': borderRadius.lg,
    '--ag-border-radius': borderRadius.md,

    // Focus and selection
    '--ag-range-selection-border-color': colors.primary[600],
    '--ag-input-focus-border-color': colors.primary[600],
    '--ag-checkbox-checked-color': colors.primary[600],
  };
}

/**
 * Generate dark mode CSS custom properties for AG Grid
 */
export function generateAGGridDarkBrandCSS(
  brandConfig: BrandConfig
): Record<string, string> {
  const { colors } = brandConfig;

  return {
    // Core colors
    '--ag-background-color': colors.dark.background,
    '--ag-foreground-color': colors.dark.foreground,
    '--ag-border-color': colors.dark.border,

    // Header
    '--ag-header-background-color': colors.dark.card,
    '--ag-header-foreground-color': colors.dark.mutedForeground,

    // Rows
    '--ag-row-hover-color': colors.dark.muted,
    '--ag-selected-row-background-color': `${colors.primary[600]}20`, // 20% opacity
  };
}

// =============================================================================
// Brand Theme Hook
// =============================================================================

export interface UseAGGridBrandThemeOptions {
  brand?: AGGridBrandName;
  customBrand?: BrandConfig;
  darkMode?: boolean;
}

export function useAGGridBrandTheme({
  brand = 'mieweb',
  customBrand,
  darkMode = false,
}: UseAGGridBrandThemeOptions = {}) {
  const brandConfig =
    customBrand || agGridBrandThemes[brand]?.config || miewebBrand;
  const cssClass = customBrand
    ? 'ag-brand-custom'
    : agGridBrandThemes[brand]?.cssClass || 'ag-brand-mieweb';

  const cssVariables = React.useMemo(() => {
    const lightVars = generateAGGridBrandCSS(brandConfig);
    const darkVars = darkMode ? generateAGGridDarkBrandCSS(brandConfig) : {};

    return { ...lightVars, ...darkVars };
  }, [brandConfig, darkMode]);

  return {
    brandConfig,
    cssClass,
    cssVariables,
    brandName: customBrand ? 'custom' : brand,
  };
}

// =============================================================================
// Style Injection Utility
// =============================================================================

/**
 * Inject brand-specific CSS variables into the document
 * Useful for dynamic brand switching
 */
export function injectAGGridBrandStyles(
  brandConfig: BrandConfig,
  className: string = 'ag-brand-custom'
) {
  const styleId = `ag-grid-brand-${className}`;

  // Remove existing style element if it exists
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Generate CSS rules
  const lightVars = generateAGGridBrandCSS(brandConfig);
  const darkVars = generateAGGridDarkBrandCSS(brandConfig);

  const lightCSS = Object.entries(lightVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  const darkCSS = Object.entries(darkVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  const css = `
.${className} {
${lightCSS}
}

.dark .${className},
:root.dark .${className},
[data-theme='dark'] .${className},
.${className}.dark {
${darkCSS}
}
  `.trim();

  // Create and inject new style element
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
}

// =============================================================================
// Column Definition Utilities
// =============================================================================

/**
 * Create brand-aware column definitions with enhanced styling
 */
export function createBrandAwareColumnDef(
  baseColDef: Record<string, unknown>,
  _brandConfig: BrandConfig
): Record<string, unknown> {
  return {
    ...baseColDef,
    headerClass: (params: unknown) => {
      const baseClass =
        typeof baseColDef.headerClass === 'function'
          ? (baseColDef.headerClass as (p: unknown) => string)(params)
          : (baseColDef.headerClass as string) || '';

      return `${baseClass} ag-header-cell-brand`.trim();
    },
    cellClass: (params: unknown) => {
      const baseClass =
        typeof baseColDef.cellClass === 'function'
          ? (baseColDef.cellClass as (p: unknown) => string)(params)
          : (baseColDef.cellClass as string) || '';

      return `${baseClass} ag-cell-brand`.trim();
    },
  };
}

/**
 * Apply brand theme to an array of column definitions
 */
export function applyBrandThemeToColumns(
  columnDefs: Record<string, unknown>[],
  brandConfig: BrandConfig
): Record<string, unknown>[] {
  return columnDefs.map((colDef) =>
    createBrandAwareColumnDef(colDef, brandConfig)
  );
}

// =============================================================================
// Responsive Column Utilities
// =============================================================================

export interface ResponsiveColumnOptions {
  priority: 'high' | 'medium' | 'low';
  minWidth?: number;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
}

/**
 * Create responsive column definitions
 */
export function createResponsiveColumn(
  baseColDef: Record<string, unknown>,
  options: ResponsiveColumnOptions
): Record<string, unknown> {
  const { priority, minWidth, hideOnMobile, hideOnTablet } = options;

  const headerClass = `ag-header-cell-priority-${priority}`;
  const cellClass = `ag-cell-priority-${priority}`;

  return {
    ...baseColDef,
    minWidth: minWidth || baseColDef.minWidth || 100,
    headerClass: [baseColDef.headerClass, headerClass]
      .filter(Boolean)
      .join(' '),
    cellClass: [baseColDef.cellClass, cellClass].filter(Boolean).join(' '),
    hide: hideOnMobile || hideOnTablet ? false : baseColDef.hide, // Let CSS handle responsive hiding
  };
}

// =============================================================================
// Default Grid Options
// =============================================================================

/**
 * Get brand-aware default grid options
 */
export function getBrandAwareGridOptions(brandConfig: BrandConfig) {
  return {
    animateRows: true,
    enableBrowserTooltips: true,
    rowHeight: 52,
    headerHeight: 48,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 100,
      flex: 1,
    },
    // Apply brand-specific styling
    getRowStyle: (params: { node: { selected: boolean } }) => {
      if (params.node.selected) {
        return {
          backgroundColor: `${brandConfig.colors.primary[600]}10`,
        };
      }
      return {};
    },
  };
}
