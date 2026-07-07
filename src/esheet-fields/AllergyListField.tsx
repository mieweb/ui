/**
 * AllergyListField — eSheet custom field wrapper around AllergyManager.
 *
 * Thin adapter, same pattern as MedicationListField. State persists as JSON
 * in `response.answer`: `{ allergies: Allergy[], noKnownAllergies?: boolean }`.
 *
 * @example
 * ```tsx
 * import { registerAllergyListFieldType } from '@mieweb/ui/esheet';
 *
 * registerAllergyListFieldType({ codeLookup: { component: CodeLookup, indexUrl: '/codify' } });
 * ```
 */

import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { registerCustomFieldTypes } from '@esheet/fields';
import { AllergyManager, type Allergy } from '../components/AllergyList';
import type { CodeLookupConfig } from '../components/MedicationList';

// =============================================================================
// Response (de)serialization
// =============================================================================

export interface AllergyListFieldValue {
  allergies: Allergy[];
  noKnownAllergies?: boolean;
}

function parseValue(answer: string | undefined): AllergyListFieldValue {
  if (!answer) return { allergies: [] };
  try {
    const parsed = JSON.parse(answer) as AllergyListFieldValue;
    return {
      allergies: parsed.allergies ?? [],
      noKnownAllergies: parsed.noKnownAllergies,
    };
  } catch {
    return { allergies: [] };
  }
}

// =============================================================================
// Field component
// =============================================================================

export function AllergyListField({
  field,
  response,
  isPreview,
  isEnabled,
  onResponse,
  codeLookup,
}: FieldComponentProps & {
  /** CodeLookup wiring — supplied via registerAllergyListFieldType() */
  codeLookup?: CodeLookupConfig;
}): React.JSX.Element {
  const definition = field.definition as {
    question?: string;
    allergies?: Allergy[];
  };

  const value = React.useMemo(() => {
    if (response?.answer) return parseValue(response.answer);
    return { allergies: definition.allergies ?? [] };
  }, [response?.answer, definition.allergies]);

  const commit = (next: AllergyListFieldValue) => {
    onResponse({ answer: JSON.stringify(next) });
  };

  return (
    <AllergyManager
      allergies={value.allergies}
      onChange={(allergies) =>
        commit({
          allergies,
          // any recorded allergy clears NKA
          noKnownAllergies: allergies.length > 0 ? undefined : value.noKnownAllergies,
        })
      }
      noKnownAllergies={value.noKnownAllergies}
      onNoKnownAllergiesChange={(nka) =>
        commit({ allergies: value.allergies, noKnownAllergies: nka })
      }
      title={definition.question ?? 'Allergies'}
      codeLookup={codeLookup}
      inlineAddSearch={Boolean(codeLookup)}
      readOnly={!(isPreview && isEnabled)}
    />
  );
}

// =============================================================================
// Registration
// =============================================================================

/**
 * Register the `allergyList` field type with eSheet.
 * Call once before rendering EsheetBuilder or EsheetRenderer.
 */
export function registerAllergyListFieldType(options?: {
  codeLookup?: CodeLookupConfig;
}): void {
  const Field = (props: FieldComponentProps) => (
    <AllergyListField {...props} codeLookup={options?.codeLookup} />
  );
  registerCustomFieldTypes({
    allergyList: {
      label: 'Allergy List',
      category: 'rich',
      answerType: 'text',
      hasOptions: false,
      hasMatrix: false,
      defaultProps: {
        question: 'Allergies',
      },
      component: Field,
    },
  });
}
