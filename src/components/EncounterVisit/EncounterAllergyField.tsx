import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { Trash2 } from 'lucide-react';
import {
  ALLERGY_TYPE_LABELS,
  type Allergy,
  type AllergyKind,
  type AllergySeverity,
  type AllergyType,
} from '../AllergyList';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Label } from '../Label';
import { RadioGroup, Radio } from '../Radio';
import { Select } from '../Select';
import { DateInput } from '../DateInput';
import { useCodeLookupConfig } from '../CodeLookup/context';
import { validateEncounterAllergyValue } from './model';
import {
  clinicalAnswerResponse,
  clinicalRequiresCoding,
  ClinicalAddButton,
  clinicalEntryCardClasses,
  useClinicalFormState,
} from './clinicalFieldAdapters';
import { useEncounterMessages } from './messages';

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

interface AllergyCardProps {
  index: number;
  allergy: Allergy;
  readOnly: boolean;
  requireCoding: boolean;
  codeLookup: ReturnType<typeof useCodeLookupConfig>;
  onPatch: (patch: Partial<Allergy>) => void;
  onRemove: () => void;
}

/** One allergy's fields, inline (vitals-set style). */
function AllergyCard({
  index,
  allergy,
  readOnly,
  requireCoding,
  codeLookup,
  onPatch,
  onRemove,
}: AllergyCardProps): React.JSX.Element {
  const m = useEncounterMessages();
  const id = React.useId();
  const Lookup = codeLookup?.component;
  // Required coding uses the host's SNOMED substance concepts for non-drug
  // allergens. The host must include those concepts in its condition shards.
  const isDrug = (allergy.type ?? 'drug') === 'drug';
  const text = (value: string) => value.trim() && value;
  return (
    <fieldset className={clinicalEntryCardClasses}>
      <legend className="sr-only">
        {m('Allergy {number}', { number: index })}
      </legend>
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold">
          {m('Allergy {number}', { number: index })}
        </h4>
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={m('Remove allergy {number}', { number: index })}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {readOnly ? (
          <Input
            label={m('Type')}
            className="min-h-11"
            value={m(ALLERGY_TYPE_LABELS[allergy.type ?? 'drug'])}
            readOnly
          />
        ) : (
          <Select
            label={m('Type')}
            className="[&_[data-slot=select-trigger]]:min-h-11"
            options={(Object.keys(ALLERGY_TYPE_LABELS) as AllergyType[]).map(
              (type) => ({ value: type, label: m(ALLERGY_TYPE_LABELS[type]) })
            )}
            value={allergy.type ?? 'drug'}
            onValueChange={(next) => {
              const type = next as AllergyType;
              // A drug code is wrong on a non-drug allergen.
              onPatch({
                type,
                ...(type !== (allergy.type ?? 'drug') && { code: undefined }),
              });
            }}
          />
        )}
        <div className="min-w-0 sm:col-span-2">
          {!readOnly && Lookup && codeLookup && (isDrug || requireCoding) ? (
            <div className="space-y-1.5">
              <span className="text-foreground block text-sm font-medium">
                {m('Allergen')}
              </span>
              <Lookup
                indexUrl={codeLookup.indexUrl}
                locale={codeLookup.locale}
                domains={isDrug ? ['med'] : ['condition']}
                searchCodetypes={isDrug ? undefined : ['SNOMED US']}
                bare
                clearOnSelect={false}
                initialQuery={allergy.allergen || undefined}
                initialSearch={false}
                aria-label={m('Allergen')}
                placeholder={
                  isDrug
                    ? m('Search drug allergens — e.g. penicillin')
                    : m('Search SNOMED allergen substances')
                }
                onSelect={(pick) => {
                  if (
                    requireCoding &&
                    (!pick.codetype.trim() || !pick.fullcode.trim())
                  )
                    return;
                  onPatch({
                    allergen: pick.label,
                    code: {
                      system: pick.codetype,
                      code: pick.fullcode,
                      display: pick.label,
                    },
                  });
                }}
                onFreeText={
                  requireCoding
                    ? undefined
                    : (allergen) => {
                        if (allergen.trim())
                          onPatch({ allergen, code: undefined });
                      }
                }
              />
              <p className="text-muted-foreground text-xs">
                {allergy.code
                  ? m('Coded: {system} {code}', {
                      system: allergy.code.system,
                      code: allergy.code.code,
                    })
                  : allergy.allergen
                    ? m(
                        'Uncoded free text: "{name}" — pick a result to code it',
                        { name: allergy.allergen }
                      )
                    : requireCoding
                      ? m('Pick a catalog result to code the allergen')
                      : m(
                          'Pick a result to code the allergen, or press Enter for free text'
                        )}
              </p>
            </div>
          ) : (
            <Input
              label={m('Allergen')}
              className="min-h-11"
              value={allergy.allergen}
              readOnly={readOnly || requireCoding}
              onChange={(event) => {
                // The model requires a nonempty allergen — ignore
                // emptying edits.
                if (event.target.value.trim())
                  onPatch({ allergen: event.target.value, code: undefined });
              }}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label={m('Reaction')}
          className="min-h-11"
          value={allergy.reaction ?? ''}
          readOnly={readOnly}
          onChange={(event) =>
            onPatch({ reaction: text(event.target.value) || undefined })
          }
        />
        <DateInput
          label={m('Onset date')}
          className="min-h-11"
          value={allergy.onsetDate ?? ''}
          onChange={(next) => {
            if (!readOnly) onPatch({ onsetDate: next || undefined });
          }}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RadioGroup
          name={`${id}-kind`}
          label={m('Mechanism')}
          description={m(
            'A true immune-mediated allergy, or a non-immune intolerance (e.g. GI upset)'
          )}
          value={allergy.kind ?? 'allergy'}
          onValueChange={(next) => {
            if (!readOnly) onPatch({ kind: next as AllergyKind });
          }}
          orientation="horizontal"
          size="sm"
          disabled={readOnly}
        >
          <Radio value="allergy" label={m('Allergy')} />
          <Radio value="intolerance" label={m('Intolerance')} />
        </RadioGroup>
        <RadioGroup
          name={`${id}-severity`}
          label={m('Severity')}
          value={allergy.severity ?? ''}
          onValueChange={(next) => {
            if (!readOnly)
              onPatch({ severity: (next || undefined) as AllergySeverity });
          }}
          orientation="horizontal"
          size="sm"
          disabled={readOnly}
        >
          <Radio value="mild" label={m('Mild')} />
          <Radio value="moderate" label={m('Moderate')} />
          <Radio value="severe" label={m('Severe')} />
        </RadioGroup>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-note`}>{m('Note')}</Label>
        <Textarea
          id={`${id}-note`}
          rows={2}
          value={allergy.note ?? ''}
          readOnly={readOnly}
          onChange={(event) =>
            onPatch({ note: event.target.value || undefined })
          }
        />
      </div>
    </fieldset>
  );
}

/** Native eSheet answer captured through inline allergy cards with NKA. */
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
  const m = useEncounterMessages();
  const requireCoding = clinicalRequiresCoding(field);
  const codeLookup = useCodeLookupConfig();
  const state = useClinicalFormState(form);
  // An unnamed new allergy can't be committed (the model requires an
  // allergen), so it drafts locally until a pick / free text names it.
  const [draft, setDraft] = React.useState<Allergy | null>(null);
  const readOnly =
    !(isPreview && isEnabled) ||
    Boolean(isReadOnly) ||
    state.readOnly ||
    state.disposed ||
    Boolean(error);
  const canEdit = React.useRef(!readOnly);
  canEdit.current = !readOnly;
  const definition = field.definition as { question?: string };
  const commitValue = (next: AllergyValue) => {
    if (
      !canEdit.current ||
      form.getState().readOnly ||
      form.getState().disposed
    )
      return;
    onResponse(
      clinicalAnswerResponse(
        form.getState().responses[field.definition.id] ?? response,
        JSON.stringify(next)
      )
    );
  };
  const commit = (allergies: Allergy[]) =>
    commitValue({
      ...value,
      allergies,
      // Any recorded allergy clears the no-known-allergies flag.
      noKnownAllergies:
        allergies.length > 0 ? undefined : value.noKnownAllergies,
    });
  const patchAllergy = (allergy: Allergy, patch: Partial<Allergy>) => {
    if (draft && allergy.id === draft.id) {
      const next = { ...draft, ...patch };
      if (next.allergen.trim()) {
        // Named — promote the draft into the committed answer. The card
        // keeps its key (the id), so focus and lookup state survive.
        setDraft(null);
        commit([...value.allergies, next]);
      } else setDraft(next);
    } else {
      commit(
        value.allergies.map((candidate) =>
          candidate.id === allergy.id ? { ...candidate, ...patch } : candidate
        )
      );
    }
  };
  const cards =
    !readOnly && draft ? [...value.allergies, draft] : value.allergies;
  return (
    <section
      aria-label={definition.question ?? m('Allergies and intolerances')}
      className="min-w-0 space-y-3"
    >
      {error ? (
        <div role="alert" className="text-destructive space-y-2 text-sm">
          <p>{m(error)}</p>
          <pre
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable original data needs keyboard focus
            tabIndex={0}
            aria-label={m('Original allergy answer')}
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
                'Connect an allergen terminology catalog to add coded allergies.'
              )}
            </p>
          )}
          {requireCoding &&
            value.allergies.some((allergy) => !allergy.code) && (
              <p className="text-muted-foreground text-sm">
                {m(
                  'Imported allergies without a code are retained. Pick a catalog result to code them.'
                )}
              </p>
            )}
          {readOnly && value.allergies.length === 0 && (
            <p className="text-muted-foreground text-sm">
              {value.noKnownAllergies
                ? m('No known allergies (NKA).')
                : m('No allergies recorded.')}
            </p>
          )}
          {cards.map((allergy, index) => (
            <AllergyCard
              key={allergy.id}
              index={index + 1}
              allergy={allergy}
              readOnly={readOnly}
              requireCoding={requireCoding}
              codeLookup={codeLookup}
              onPatch={(patch) => patchAllergy(allergy, patch)}
              onRemove={() => {
                if (draft && allergy.id === draft.id) setDraft(null);
                else
                  commit(value.allergies.filter(({ id }) => id !== allergy.id));
              }}
            />
          ))}
          {!readOnly && value.allergies.length === 0 && !draft && (
            <Checkbox
              label={m('No known allergies (NKA)')}
              checked={value.noKnownAllergies ?? false}
              onChange={(event) =>
                commitValue({
                  ...value,
                  noKnownAllergies: event.target.checked,
                })
              }
            />
          )}
          {!readOnly && !draft && (codeLookup || !requireCoding) && (
            <ClinicalAddButton
              label={cards.length > 0 ? m('Add another') : m('Add allergy')}
              onClick={() =>
                setDraft({
                  id: globalThis.crypto.randomUUID(),
                  allergen: '',
                  type: 'drug',
                })
              }
            />
          )}
        </>
      )}
    </section>
  );
}
