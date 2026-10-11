import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { MedicationReconciliation, type Medication } from '../MedicationList';
import { useCodeLookupConfig } from '../CodeLookup/context';
import { validateEncounterMedicationValue } from './model';
import {
  clinicalAnswerResponse,
  clinicalRequiresCoding,
  useClinicalFormState,
} from './clinicalFieldAdapters';
import { useEncounterMessages } from './messages';

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
  const m = useEncounterMessages();
  const requireCoding = clinicalRequiresCoding(field);
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
      aria-label={definition.question ?? m('Presenting medications')}
      className="min-w-0 space-y-2"
    >
      {error ? (
        <div role="alert" className="text-destructive space-y-2 text-sm">
          <p>{m(error)}</p>
          <pre
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable original data needs keyboard focus
            tabIndex={0}
            aria-label={m('Original medication answer')}
            className="max-h-48 overflow-auto text-xs break-all whitespace-pre-wrap"
          >
            {response?.answer}
          </pre>
        </div>
      ) : (
        <>
          {!readOnly && requireCoding && !codeLookup && (
            <p className="text-muted-foreground text-sm">
              {m(
                'Connect a medication terminology catalog to add coded medications.'
              )}
            </p>
          )}
          {requireCoding &&
            value.medications.some((medication) => !medication.code) && (
              <p className="text-muted-foreground text-sm">
                {m(
                  'Imported medications without a code are retained. Use Correct to select their catalog entries.'
                )}
              </p>
            )}
          <MedicationReconciliation
            medications={value.medications}
            title={null}
            codeLookup={codeLookup ?? false}
            requireCode={requireCoding}
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
              onResponse(
                clinicalAnswerResponse(
                  form.getState().responses[field.definition.id] ?? response,
                  JSON.stringify({ ...value, medications })
                )
              );
            }}
          />
        </>
      )}
    </section>
  );
}
