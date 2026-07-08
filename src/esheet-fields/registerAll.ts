/**
 * registerMieEsheetFields — one-call registration for every @mieweb/ui custom
 * eSheet field type (medication reconciliation + allergy list).
 *
 * The @esheet/* packages stay generic and free of medical dependencies; these
 * fields live in @mieweb/ui and opt in from the consumer side. This helper is
 * the "batteries included" entry point so an app can enable the full medical
 * field set with a single call instead of wiring each field type by hand.
 *
 * @example
 * ```tsx
 * import { registerMieEsheetFields } from '@mieweb/ui/esheet';
 * import { CodeLookup } from '…/CodeLookup';
 *
 * // once, before EsheetBuilder / EsheetRenderer mount
 * registerMieEsheetFields({
 *   codeLookup: { component: CodeLookup, indexUrl: '/codify' },
 * });
 * ```
 */

import type { CodeLookupConfig } from '../components/MedicationList';
import { registerMedicationListFieldType } from './MedicationListField';
import { registerAllergyListFieldType } from './AllergyListField';

export interface RegisterMieEsheetFieldsOptions {
  /**
   * Shared CodeLookup wiring applied to every field that supports offline
   * RxNorm/FDB coding (medication + allergy editors).
   */
  codeLookup?: CodeLookupConfig;
}

/**
 * Register all @mieweb/ui custom eSheet field types at once:
 * `medicationList` and `allergyList`.
 *
 * Call once before rendering EsheetBuilder or EsheetRenderer.
 */
export function registerMieEsheetFields(
  options?: RegisterMieEsheetFieldsOptions
): void {
  registerMedicationListFieldType({ codeLookup: options?.codeLookup });
  registerAllergyListFieldType({ codeLookup: options?.codeLookup });
}
