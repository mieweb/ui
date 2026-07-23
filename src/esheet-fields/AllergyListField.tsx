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
import { useCodeLookupConfig } from '../components/CodeLookup/context';

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
    // shape-guarded: valid JSON like `null` or `[]` must degrade safely
    const parsed: unknown = JSON.parse(answer);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { allergies: [] };
    }
    const { allergies, noKnownAllergies } = parsed as Partial<
      Record<keyof AllergyListFieldValue, unknown>
    >;
    return {
      allergies: Array.isArray(allergies) ? (allergies as Allergy[]) : [],
      noKnownAllergies:
        typeof noKnownAllergies === 'boolean' ? noKnownAllergies : undefined,
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
  codeLookup?: CodeLookupConfig | false;
}): React.JSX.Element {
  const definition = field.definition as {
    question?: string;
    allergies?: Allergy[];
  };

  // Default to the ambient provider; `false` forces plain text.
  const ambientCodeLookup = useCodeLookupConfig();
  const effectiveCodeLookup =
    codeLookup === false
      ? undefined
      : (codeLookup ?? ambientCodeLookup ?? undefined);

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
          noKnownAllergies:
            allergies.length > 0 ? undefined : value.noKnownAllergies,
        })
      }
      noKnownAllergies={value.noKnownAllergies}
      onNoKnownAllergiesChange={(nka) =>
        commit({ allergies: value.allergies, noKnownAllergies: nka })
      }
      title={definition.question ?? 'Allergies'}
      codeLookup={codeLookup}
      inlineAddSearch={Boolean(effectiveCodeLookup)}
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
  codeLookup?: CodeLookupConfig | false;
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
