import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { MedicationReconciliation, type Medication } from '../MedicationList';
import { useCodeLookupConfig } from '../CodeLookup/context';
import { validateEncounterMedicationValue } from './model';
import { useClinicalFormState } from './clinicalFieldAdapters';

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

/** Native eSheet answer backed by the shared coded medication reconciliation. */
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
  const codeLookup = useCodeLookupConfig();
  const state = useClinicalFormState(form);
  const readOnly =
    !(isPreview && isEnabled) ||
    Boolean(isReadOnly) ||
    state.readOnly ||
    state.disposed ||
    Boolean(error);
  const canEdit = React.useRef(!readOnly);
  canEdit.current = !readOnly;
  const definition = field.definition as { question?: string };
  return (
    <section
      aria-label={definition.question ?? 'Presenting medications'}
      className="min-w-0 space-y-2"
    >
      {error ? (
        <div role="alert" className="text-destructive space-y-2 text-sm">
          <p>{error}</p>
          <pre className="max-h-48 overflow-auto text-xs break-all whitespace-pre-wrap">
            {response?.answer}
          </pre>
        </div>
      ) : (
        <>
          {!readOnly && !codeLookup && (
            <p className="text-muted-foreground text-sm">
              Connect a medication terminology catalog to add coded medications.
            </p>
          )}
          {value.medications.some((medication) => !medication.code) && (
            <p className="text-muted-foreground text-sm">
              Imported medications without a code are retained. Use Correct to
              select their catalog entries.
            </p>
          )}
          <MedicationReconciliation
            medications={value.medications}
            title={null}
            codeLookup={codeLookup ?? false}
            requireCode
            inlineAddSearch={Boolean(codeLookup)}
            readOnly={readOnly}
            className="rounded-none border-0 bg-transparent shadow-none [&_[data-slot=clinical-list-heading]]:border-0 [&_[data-slot=clinical-list-row]]:px-0 [&_button]:min-h-11 [&_input]:min-h-11 [&>[data-slot=card-content]]:p-0"
            onChange={(medications) => {
              if (
                !canEdit.current ||
                form.getState().readOnly ||
                form.getState().disposed
              )
                return;
              onResponse({
                ...response,
                answer: JSON.stringify({ ...value, medications }),
                _ai: false,
              });
            }}
          />
        </>
      )}
    </section>
  );
}
