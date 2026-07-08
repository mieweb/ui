/**
 * eSheet entry point — separate from the main bundle.
 *
 * Usage:
 *   npm install @esheet/builder @esheet/renderer
 *   import { EsheetBuilder, EsheetRenderer } from '@mieweb/ui/esheet';
 *
 * This keeps @esheet/* packages out of the default
 * install/bundle so consumers who don't need the form builder aren't burdened.
 */

// Core types
export { type FormDefinition } from '@esheet/core';

// Builder
export { EsheetBuilder, type EsheetBuilderProps } from '@esheet/builder';

// Renderer
export {
  EsheetRenderer,
  type EsheetRendererProps,
  type EsheetRendererHandle,
} from '@esheet/renderer';

// Custom field types backed by @mieweb/ui components
export {
  MedicationListField,
  registerMedicationListFieldType,
  type MedicationListFieldValue,
} from './esheet-fields/MedicationListField';
export {
  AllergyListField,
  registerAllergyListFieldType,
  type AllergyListFieldValue,
} from './esheet-fields/AllergyListField';

// Convenience: register every @mieweb/ui custom field type in one call
export {
  registerMieEsheetFields,
  type RegisterMieEsheetFieldsOptions,
} from './esheet-fields/registerAll';
