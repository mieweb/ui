import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { AllergyManager, type Allergy } from '../AllergyList';
import { validateEncounterAllergyValue } from './model';
import {
  clinicalAnswerResponse,
  InvalidClinicalAnswer,
  useClinicalFormState,
} from './clinicalFieldAdapters';

interface AllergyValue {
  allergies: Allergy[];
  noKnownAllergies?: boolean;
}

function readValue(answer?: string): {
  value: AllergyValue;
  error?: string;
} {
  if (!answer) return { value: { allergies: [] } };
  try {
    const value: unknown = JSON.parse(answer);
    if (validateEncounterAllergyValue(value).length) throw new Error();
    return { value: value as AllergyValue };
  } catch {
    return {
      value: { allergies: [] },
      error:
        'The saved allergy answer could not be read. The original answer is retained below; correct it through the visit data before editing.',
    };
  }
}

/** Native eSheet answer captured through the shared allergy list with NKA. */
export function EncounterAllergyField({
  field,
  form,
  response,
  isPreview,
  isEnabled,
  isReadOnly,
  onResponse,
}: FieldComponentProps): React.JSX.Element {
  const { value, error } = React.useMemo(
    () => readValue(response?.answer),
    [response?.answer]
  );
  const state = useClinicalFormState(form);
  const readOnly =
    !(isPreview && isEnabled) ||
    Boolean(isReadOnly) ||
    state.readOnly ||
    state.disposed ||
    Boolean(error);
  const canEdit = React.useRef(!readOnly);
  canEdit.current = !readOnly;
  const currentValue = React.useRef(value);
  currentValue.current = value;
  const commitValue = (update: (next: AllergyValue) => AllergyValue) => {
    if (
      !canEdit.current ||
      form.getState().readOnly ||
      form.getState().disposed
    )
      return;
    // Advance the ref so a second commit in the same event builds on this
    // update instead of the stale render value.
    const next = update(currentValue.current);
    currentValue.current = next;
    onResponse(
      clinicalAnswerResponse(
        form.getState().responses[field.definition.id] ?? response,
        JSON.stringify(next)
      )
    );
  };
  if (error)
    return <InvalidClinicalAnswer label="allergy" answer={response?.answer} />;
  return (
    <AllergyManager
      allergies={value.allergies}
      onChange={(allergies) =>
        commitValue((current) => ({
          ...current,
          allergies,
          // Any recorded allergy clears the no-known-allergies flag.
          noKnownAllergies:
            allergies.length > 0 ? undefined : current.noKnownAllergies,
        }))
      }
      noKnownAllergies={value.noKnownAllergies ?? false}
      onNoKnownAllergiesChange={(noKnownAllergies) =>
        commitValue((current) => ({
          ...current,
          noKnownAllergies:
            current.allergies.length > 0 ? undefined : noKnownAllergies,
        }))
      }
      inlineAddSearch
      readOnly={readOnly}
    />
  );
}
