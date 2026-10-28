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

// Visit documents and their in-process MCP bridge.
export * from './components/EncounterVisit';

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
export {
  EsheetNarrativeField,
  narrativeText,
  sanitizeNarrativeHtml,
  type EsheetNarrativeFieldProps,
} from './esheet-fields/EsheetNarrativeField';
export {
  applyNarrativeFinding,
  getNarrativeFindings,
  hasNarrativeFindingText,
  NARRATIVE_ATTRIBUTES,
  validNarrativeFindings,
  type NarrativeAttributeNames,
  type NarrativeCode,
  type NarrativeFinding,
} from './esheet-fields/narrativeFindings';

// Convenience: register every @mieweb/ui custom field type in one call
export {
  registerMieEsheetFields,
  type RegisterMieEsheetFieldsOptions,
} from './esheet-fields/registerAll';
