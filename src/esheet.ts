/**
 * eSheet entry point — separate from the main bundle.
 *
 * Usage:
 *   npm install @esheet/builder @esheet/renderer
 *   import { EsheetBuilder, EsheetRenderer } from '@mieweb/ui/esheet';
 *
 * This keeps @esheet/* packages out of the default
 * install/bundle so consumers who don't need the form builder aren't burdened.
 *
 * Narrative fields and EncounterVisit's RichEdit mode ride the Kerebron
 * editor, so this entry also needs the `@kerebron/*` peers, `@mieweb/ui/kerebron.css`,
 * and the WASM assets documented in src/kerebron.ts.
 */

// Core types
export { type FormDefinition } from '@esheet/core';

// Visit documents and their in-process MCP bridge.
export * from './components/EncounterVisit';

// Guided rich text documents (letters, tickets) backed by an eSheet.
export * from './components/RichTextEsheet';

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
  registerEsheetNarrativeFieldType,
  sanitizeNarrativeHtml,
  type EsheetNarrativeFieldProps,
} from './esheet-fields/EsheetNarrativeField';
export {
  EsheetSectionContext,
  EsheetSectionField,
  registerEsheetSectionFieldType,
} from './esheet-fields/EsheetSectionField';
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
