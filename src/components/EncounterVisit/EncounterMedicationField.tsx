import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { Trash2 } from 'lucide-react';
import {
  doseFormToQuantityUnit,
  lookupToMedicationFields,
  parseSig,
  type Medication,
} from '../MedicationList';
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Label } from '../Label';
import { RadioGroup, Radio } from '../Radio';
import { DateRangePicker } from '../DateRangePicker';
import { useCodeLookupConfig } from '../CodeLookup/context';
import { validateEncounterMedicationValue } from './model';
import {
  clinicalAnswerResponse,
  clinicalRequiresCoding,
  ClinicalAddButton,
  clinicalEntryCardClasses,
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

/** 'YYYY-MM-DD' answer dates ↔ local calendar dates for the range picker. */
function parseAnswerDate(value?: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : null;
}

function toAnswerDate(date: Date | null): string | undefined {
  if (!date) return undefined;
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

interface MedicationCardProps {
  index: number;
  medication: Medication;
  readOnly: boolean;
  requireCoding: boolean;
  codeLookup: ReturnType<typeof useCodeLookupConfig>;
  onPatch: (patch: Partial<Medication>) => void;
  onRemove: () => void;
}

/** One medication's prescription fields, inline (vitals-set style). */
function MedicationCard({
  index,
  medication,
  readOnly,
  requireCoding,
  codeLookup,
  onPatch,
  onRemove,
}: MedicationCardProps): React.JSX.Element {
  const m = useEncounterMessages();
  const id = React.useId();
  const Lookup = codeLookup?.component;
  const text = (value: string) => value.trim() && value;
  return (
    <fieldset className={clinicalEntryCardClasses}>
      <legend className="sr-only">
        {m('Medication {number}', { number: index })}
      </legend>
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold">
          {m('Medication {number}', { number: index })}
        </h4>
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={m('Remove medication {number}', { number: index })}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      {!readOnly && Lookup && codeLookup ? (
        <div className="space-y-1.5">
          <Lookup
            indexUrl={codeLookup.indexUrl}
            locale={codeLookup.locale}
            domains={['med']}
            bare
            clearOnSelect={false}
            initialQuery={medication.name || undefined}
            initialSearch={false}
            aria-label={m('Medication')}
            placeholder={m('Search RxNorm / FDB — e.g. lisinopril')}
            onSelect={(pick) => {
              if (
                requireCoding &&
                (!pick.codetype.trim() || !pick.fullcode.trim())
              )
                return;
              // A pick also fills coding, strength, and dose form.
              onPatch(lookupToMedicationFields(pick));
            }}
            onFreeText={
              requireCoding
                ? undefined
                : (name) => {
                    if (name.trim()) onPatch({ name, code: undefined });
                  }
            }
          />
          <p className="text-muted-foreground text-xs">
            {medication.code
              ? m('Coded: {system} {code}', {
                  system: medication.code.system,
                  code: medication.code.code,
                })
              : medication.name
                ? m('Uncoded free text: "{name}" — pick a result to code it', {
                    name: medication.name,
                  })
                : requireCoding
                  ? m('Pick a catalog result to code the medication')
                  : m(
                      'Pick a result to code the medication, or press Enter for free text'
                    )}
          </p>
        </div>
      ) : (
        <Input
          label={m('Medication')}
          className="min-h-11"
          value={medication.name}
          readOnly={readOnly || requireCoding}
          onChange={(event) => {
            // The model requires a nonempty name — ignore emptying edits.
            if (event.target.value.trim())
              onPatch({ name: event.target.value, code: undefined });
          }}
        />
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label={m('Strength')}
          className="min-h-11"
          value={medication.strength ?? ''}
          readOnly={readOnly}
          onChange={(event) =>
            onPatch({ strength: text(event.target.value) || undefined })
          }
        />
        <Input
          label={m('Dose form')}
          className="min-h-11"
          value={medication.doseForm ?? ''}
          readOnly={readOnly}
          onChange={(event) =>
            // Quantity unit follows the dose form (tablet → tablet,
            // solution → milliliter, …)
            onPatch({
              doseForm: event.target.value || undefined,
              quantityUnit: doseFormToQuantityUnit(event.target.value),
            })
          }
        />
        <Input
          label={
            medication.quantityUnit
              ? `${m('Quantity')} (${medication.quantityUnit}s)`
              : m('Quantity')
          }
          className="min-h-11"
          inputMode="decimal"
          value={medication.quantity ?? ''}
          readOnly={readOnly}
          onChange={(event) =>
            onPatch({ quantity: text(event.target.value) || undefined })
          }
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label={m('Days supply')}
          className="min-h-11"
          inputMode="numeric"
          value={medication.daysSupply ?? ''}
          readOnly={readOnly}
          onChange={(event) =>
            onPatch({ daysSupply: text(event.target.value) || undefined })
          }
        />
        <Input
          label={m('Refills')}
          className="min-h-11"
          inputMode="numeric"
          value={medication.refills ?? ''}
          readOnly={readOnly}
          onChange={(event) =>
            onPatch({ refills: text(event.target.value) || undefined })
          }
        />
        {readOnly ? (
          <Input
            label={m('Start – end date')}
            className="min-h-11"
            value={[medication.startDate, medication.endDate]
              .filter(Boolean)
              .join(' – ')}
            readOnly
          />
        ) : (
          <div className="min-w-0 space-y-1.5">
            <span className="text-foreground block text-sm font-medium">
              {m('Start – end date')}
            </span>
            <DateRangePicker
              className="w-full [&_[data-slot=date-range-trigger]]:min-h-11 [&_[data-slot=date-range-trigger]]:w-full"
              variant="responsive"
              showPresets={false}
              placeholder={m('Start – end date')}
              value={{
                start: parseAnswerDate(medication.startDate),
                end: parseAnswerDate(medication.endDate),
              }}
              onChange={(range) =>
                onPatch({
                  startDate: toAnswerDate(range.start),
                  endDate: toAnswerDate(range.end),
                })
              }
            />
          </div>
        )}
      </div>
      <RadioGroup
        name={`${id}-substitution`}
        label={m('Substitution')}
        value={medication.substitution ?? '0'}
        onValueChange={(value) => {
          if (!readOnly) onPatch({ substitution: value as '0' | '1' });
        }}
        orientation="horizontal"
        size="sm"
        disabled={readOnly}
      >
        <Radio value="0" label={m('Substitution permitted')} />
        <Radio value="1" label={m('Dispense as written (DAW)')} />
      </RadioGroup>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-sig`}>{m('Sig (patient directions)')}</Label>
        <Textarea
          id={`${id}-sig`}
          rows={2}
          value={medication.sig ?? ''}
          readOnly={readOnly}
          onChange={(event) => {
            // Route / frequency / PRN are derived from the sig text.
            const sig = event.target.value;
            const { route, frequency, prn } = parseSig(sig);
            onPatch({ sig, route, frequency, prn: prn || undefined });
          }}
        />
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {medication.route || medication.frequency || medication.prn ? (
            <>
              {m('Derived:')}{' '}
              {[
                medication.route &&
                  m('route {route}', { route: medication.route }),
                medication.frequency && m(medication.frequency.toLowerCase()),
                medication.prn && m('PRN (as needed)'),
              ]
                .filter(Boolean)
                .join(' · ')}
            </>
          ) : (
            m('Route, frequency, and PRN are derived from the directions')
          )}
        </p>
      </div>
      <Input
        label={m('Indication')}
        className="min-h-11"
        value={medication.indication ?? ''}
        readOnly={readOnly}
        onChange={(event) =>
          onPatch({ indication: text(event.target.value) || undefined })
        }
      />
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-pharmacy-notes`}>{m('Pharmacy notes')}</Label>
        <Textarea
          id={`${id}-pharmacy-notes`}
          rows={2}
          value={medication.pharmacyNotes ?? ''}
          readOnly={readOnly}
          onChange={(event) =>
            onPatch({ pharmacyNotes: event.target.value || undefined })
          }
        />
      </div>
    </fieldset>
  );
}

/** Native eSheet answer captured through inline prescription cards. */
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
  // An unnamed new medication can't be committed (the model requires a
  // name), so it drafts locally until a pick / free text names it.
  const [draft, setDraft] = React.useState<Medication | null>(null);
  const readOnly =
    !(isPreview && isEnabled) ||
    Boolean(isReadOnly) ||
    state.readOnly ||
    state.disposed ||
    Boolean(error);
  const canEdit = React.useRef(!readOnly);
  canEdit.current = !readOnly;
  const definition = field.definition as { question?: string };
  const commit = (medications: Medication[]) => {
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
  };
  const patchMedication = (
    medication: Medication,
    patch: Partial<Medication>
  ) => {
    if (draft && medication.id === draft.id) {
      const next = { ...draft, ...patch };
      if (next.name.trim()) {
        // Named — promote the draft into the committed answer. The card
        // keeps its key (the id), so focus and lookup state survive.
        setDraft(null);
        commit([...value.medications, next]);
      } else setDraft(next);
    } else {
      commit(
        value.medications.map((candidate) =>
          candidate.id === medication.id
            ? { ...candidate, ...patch }
            : candidate
        )
      );
    }
  };
  const cards =
    !readOnly && draft ? [...value.medications, draft] : value.medications;
  return (
    <section
      aria-label={definition.question ?? m('Presenting medications')}
      className="min-w-0 space-y-3"
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
                  'Imported medications without a code are retained. Pick a catalog result to code them.'
                )}
              </p>
            )}
          {readOnly && value.medications.length === 0 && (
            <p className="text-muted-foreground text-sm">
              {m('No medications recorded.')}
            </p>
          )}
          {cards.map((medication, index) => (
            <MedicationCard
              key={medication.id}
              index={index + 1}
              medication={medication}
              readOnly={readOnly}
              requireCoding={requireCoding}
              codeLookup={codeLookup}
              onPatch={(patch) => patchMedication(medication, patch)}
              onRemove={() => {
                if (draft && medication.id === draft.id) setDraft(null);
                else
                  commit(
                    value.medications.filter(({ id }) => id !== medication.id)
                  );
              }}
            />
          ))}
          {!readOnly && !draft && (codeLookup || !requireCoding) && (
            <ClinicalAddButton
              label={
                cards.length > 0
                  ? m('Add another medication')
                  : m('Add medication')
              }
              onClick={() =>
                setDraft({
                  id: globalThis.crypto.randomUUID(),
                  name: '',
                  status: 'unreconciled',
                })
              }
            />
          )}
        </>
      )}
    </section>
  );
}
