import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { AllergyManager, type Allergy } from '../AllergyList';
import { useCodeLookupConfig } from '../CodeLookup/context';
import { validateEncounterAllergyValue } from './model';
import { useClinicalFormState } from './clinicalFieldAdapters';

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

/** Coded AllergyManager with native eSheet JSON and explicit NKA capture. */
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
  const commit = (next: AllergyValue) => {
    if (
      !canEdit.current ||
      form.getState().readOnly ||
      form.getState().disposed
    )
      return;
    onResponse({
      ...response,
      answer: JSON.stringify(next),
      _ai: false,
    });
  };
  return (
    <section
      aria-label={definition.question ?? 'Allergies and intolerances'}
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
              Connect an allergen terminology catalog to add coded allergies.
            </p>
          )}
          {value.allergies.some((allergy) => !allergy.code) && (
            <p className="text-muted-foreground text-sm">
              Imported allergies without a code are retained. Use Correct to
              select their catalog entries.
            </p>
          )}
          <AllergyManager
            allergies={value.allergies}
            noKnownAllergies={value.noKnownAllergies}
            title={null}
            codeLookup={codeLookup ?? false}
            requireCode
            inlineAddSearch={Boolean(codeLookup)}
            readOnly={readOnly}
            className="rounded-none border-0 bg-transparent shadow-none [&_[data-slot=clinical-list-heading]]:border-0 [&_[data-slot=clinical-list-row]]:px-0 [&_button]:min-h-11 [&_input]:min-h-11 [&>[data-slot=card-content]]:p-0"
            onChange={(allergies) =>
              commit({
                ...value,
                allergies,
                noKnownAllergies:
                  allergies.length > 0 ? undefined : value.noKnownAllergies,
              })
            }
            onNoKnownAllergiesChange={(noKnownAllergies) =>
              commit({ ...value, noKnownAllergies })
            }
          />
        </>
      )}
    </section>
  );
}
