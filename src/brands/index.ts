/**
 * @mieweb/ui Brand System
 *
 * Export all brand-related types, utilities, and configurations.
 */

// Types and utilities
export type {
  BrandConfig,
  BrandColors,
  BrandTypography,
  BrandBorderRadius,
  BrandBoxShadow,
  ColorScale,
  SemanticColors,
} from './types';

export {
  generateBrandCSS,
  generateTailwindTheme,
  createBrandPreset,
} from './types';

// Brand configurations
export { bluehiveBrand } from './bluehive';
export { defaultBrand } from './default';
export { enterpriseHealthBrand } from './enterprise-health';
export { miewebBrand } from './mieweb';
export { webchartBrand } from './webchart';

// All brands for iteration
export const brands = {
  bluehive: () => import('./bluehive').then((m) => m.bluehiveBrand),
  default: () => import('./default').then((m) => m.defaultBrand),
  'enterprise-health': () =>
    import('./enterprise-health').then((m) => m.enterpriseHealthBrand),
  mieweb: () => import('./mieweb').then((m) => m.miewebBrand),
  webchart: () => import('./webchart').then((m) => m.webchartBrand),
} as const;
