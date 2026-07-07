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
    const parsed = JSON.parse(answer) as MedicationListFieldValue;
    return { medications: parsed.medications ?? [] };
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
}: FieldComponentProps): React.JSX.Element {
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
 */
export function registerMedicationListFieldType(): void {
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
      component: MedicationListField,
    },
  });
}
