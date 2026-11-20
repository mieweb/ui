import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { MedicationReconciliation, type Medication } from '../MedicationList';
import { validateEncounterMedicationValue } from './model';
import {
  clinicalAnswerResponse,
  InvalidClinicalAnswer,
  useClinicalFormState,
} from './clinicalFieldAdapters';

interface MedicationValue {
  medications: Medication[];
}

function readValue(answer?: string): {
  value: MedicationValue;
  error?: string;
} {
  if (!answer) return { value: { medications: [] } };
  try {
    const value: unknown = JSON.parse(answer);
    if (validateEncounterMedicationValue(value).length) throw new Error();
    return { value: value as MedicationValue };
  } catch {
    return {
      value: { medications: [] },
      error:
        'The saved medication answer could not be read. The original answer is retained below; correct it through the visit data before editing.',
    };
  }
}

/** Native eSheet answer captured through the shared medication list. */
export function EncounterMedicationField({
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
  const commit = (medications: Medication[]) => {
    if (
      !canEdit.current ||
      form.getState().readOnly ||
      form.getState().disposed
    )
      return;
    // Advance the ref so a second commit in the same event builds on this
    // update instead of the stale render value.
    const next = { ...currentValue.current, medications };
    currentValue.current = next;
    onResponse(
      clinicalAnswerResponse(
        form.getState().responses[field.definition.id] ?? response,
        JSON.stringify(next)
      )
    );
  };
  if (error)
    return (
      <InvalidClinicalAnswer label="medication" answer={response?.answer} />
    );
  return (
    <MedicationReconciliation
      medications={value.medications}
      onChange={commit}
      inlineAddSearch
      readOnly={readOnly}
    />
  );
}
