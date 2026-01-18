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
