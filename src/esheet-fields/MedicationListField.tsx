/**
 * MedicationListField — eSheet custom field wrapper around
 * MedicationReconciliation.
 *
 * Thin adapter: all reconciliation UI/behavior lives in the standalone
 * `MedicationReconciliation` component (main bundle). This file only maps the
 * eSheet field contract (definition, response, preview/enabled state) onto it.
 *
 * Exposed via the `@mieweb/ui/esheet` entry point (NOT the main bundle) so
 * that @esheet/* stays an optional dependency.
 *
 * The field stores its state as JSON in `response.answer`:
 * `{ medications: Medication[] }`.
 *
 * @example
 * ```tsx
 * import { registerMedicationListFieldType } from '@mieweb/ui/esheet';
 *
 * registerMedicationListFieldType(); // before rendering EsheetBuilder/Renderer
 * ```
 */

import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { registerCustomFieldTypes } from '@esheet/fields';
import {
  MedicationReconciliation,
  type CodeLookupConfig,
  type Medication,
} from '../components/MedicationList';

// =============================================================================
// Response (de)serialization
// =============================================================================

export interface MedicationListFieldValue {
  medications: Medication[];
}

function parseValue(answer: string | undefined): MedicationListFieldValue {
  if (!answer) return { medications: [] };
  try {
    // shape-guarded: valid JSON like `null` or `[]` must degrade safely
    const parsed: unknown = JSON.parse(answer);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { medications: [] };
    }
    const { medications } = parsed as { medications?: unknown };
    return {
      medications: Array.isArray(medications)
        ? (medications as Medication[])
        : [],
    };
  } catch {
    return { medications: [] };
  }
}

// =============================================================================
// Field component
// =============================================================================

export function MedicationListField({
  field,
  response,
  isPreview,
  isEnabled,
  onResponse,
  codeLookup,
}: FieldComponentProps & {
  /** CodeLookup wiring — supplied via registerMedicationListFieldType() */
  codeLookup?: CodeLookupConfig;
}): React.JSX.Element {
  const definition = field.definition as {
    question?: string;
    medications?: Medication[];
    quickAddOptions?: string[];
  };

  // Response wins; otherwise seed from the field definition's medication list.
  const medications = React.useMemo(() => {
    if (response?.answer) return parseValue(response.answer).medications;
    return definition.medications ?? [];
  }, [response?.answer, definition.medications]);

  return (
    <MedicationReconciliation
      medications={medications}
      onChange={(next) =>
        onResponse({ answer: JSON.stringify({ medications: next }) })
      }
      title={definition.question ?? 'Presenting medications'}
      quickAddOptions={definition.quickAddOptions}
      codeLookup={codeLookup}
      readOnly={!(isPreview && isEnabled)}
    />
  );
}

// =============================================================================
// Registration
// =============================================================================

/**
 * Register the `medicationList` field type with eSheet.
 * Call once before rendering EsheetBuilder or EsheetRenderer.
 *
 * @param options.codeLookup — wire the offline RxNorm/FDB CodeLookup into the
 * medication editor (Correct / Add Medication):
 * ```tsx
 * import { CodeLookup } from '…/CodeLookup';
 * registerMedicationListFieldType({
 *   codeLookup: { component: CodeLookup, indexUrl: '/codify' },
 * });
 * ```
 */
export function registerMedicationListFieldType(options?: {
  codeLookup?: CodeLookupConfig;
}): void {
  const Field = (props: FieldComponentProps) => (
    <MedicationListField {...props} codeLookup={options?.codeLookup} />
  );
  registerCustomFieldTypes({
    medicationList: {
      label: 'Medication Reconciliation',
      category: 'rich',
      answerType: 'text',
      hasOptions: false,
      hasMatrix: false,
      defaultProps: {
        question: 'Presenting medications',
        quickAddOptions: [
          'aspirin 81 mg tablet',
          'atorvastatin 20 mg tablet',
          'metformin 500 mg tablet',
        ],
      },
      component: Field,
    },
  });
}
