import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { X } from 'lucide-react';
import { ProblemList, currentAssertion } from '../ProblemList';
import {
  ConditionEditor,
  type ConditionAssertionDraft,
} from '../ConditionEditor';
import { useEncounterMessages } from './messages';
import { Button } from '../Button';
import { useCodeLookupConfig } from '../CodeLookup/context';
import { validateEncounterConditions } from './model';
import type { EncounterConditionsValue } from './types';
import {
  InvalidClinicalAnswer,
  clinicalAnswerResponse,
  clinicalRequiresCoding,
  ClinicalAddButton,
  clinicalEntryCardClasses,
  EncounterAssertionDateInput,
  useEncounterAssertionDate,
  matchingConditionCode,
  reorderClinicalEntries,
  useClinicalFormState,
} from './clinicalFieldAdapters';

function readConditions(answer?: string): EncounterConditionsValue | undefined {
  if (!answer) return { concerns: [] };
  try {
    const parsed: unknown = JSON.parse(answer);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      !('concerns' in parsed) ||
      validateEncounterConditions(parsed).length > 0
    )
      return undefined;
    return parsed as EncounterConditionsValue;
  } catch {
    return undefined;
  }
}

/** Native eSheet adapter for the shared coded longitudinal ProblemList. */
export function EncounterConditionsField({
  field,
  form,
  response,
  isPreview,
  isEnabled,
  isReadOnly,
  onResponse,
}: FieldComponentProps): React.JSX.Element {
  const value = React.useMemo(
    () => readConditions(response?.answer),
    [response?.answer]
  );
  const m = useEncounterMessages();
  const requireCoding = clinicalRequiresCoding(field);
  const assertionDate = useEncounterAssertionDate(field);
  const currentDate = React.useRef(assertionDate);
  currentDate.current = assertionDate;
  const [adding, setAdding] = React.useState(false);
  const [manualEditing, setManualEditing] = React.useState(false);
  const state = useClinicalFormState(form);
  const codeLookup = useCodeLookupConfig();
  const readOnly =
    !(isPreview && isEnabled) ||
    Boolean(isReadOnly) ||
    state.readOnly ||
    state.disposed ||
    !value;
  const currentValue = React.useRef(value);
  const currentResponse = React.useRef(response);
  currentResponse.current = response;
  const canEdit = React.useRef(!readOnly);
  currentValue.current = value;
  canEdit.current = !readOnly;
  const [editing, setEditing] = React.useState<{ concernId: string } | null>(
    null
  );
  const definition = field.definition as { question?: string };
  const label = definition.question ?? m('Conditions');
  const commit = (
    update: (next: EncounterConditionsValue) => EncounterConditionsValue
  ) => {
    if (
      !canEdit.current ||
      form.getState().readOnly ||
      form.getState().disposed ||
      !currentValue.current
    )
      return;
    onResponse(
      clinicalAnswerResponse(
        form.getState().responses[field.definition.id] ??
          currentResponse.current,
        JSON.stringify(update(currentValue.current))
      )
    );
  };

  const recordAssertion = (
    draft: ConditionAssertionDraft,
    pick?: { codetype: string; fullcode: string }
  ) => {
    if (!currentDate.current.valid || (requireCoding && !draft.coding?.length))
      return;
    commit((next) => {
      const assertion = {
        ...draft,
        id: globalThis.crypto.randomUUID(),
        date: currentDate.current.date,
      };
      if (editing)
        return {
          ...next,
          concerns: next.concerns.map((concern) =>
            concern.concernId === editing.concernId
              ? {
                  ...concern,
                  assertions: [
                    ...concern.assertions,
                    {
                      ...assertion,
                      changeType: 'refinement' as const,
                      supersedes: currentAssertion(concern)?.id,
                    },
                  ],
                }
              : concern
          ),
        };
      if (
        pick &&
        next.concerns.some((concern) => matchingConditionCode(concern, pick))
      )
        return next;
      return {
        ...next,
        concerns: [
          ...next.concerns,
          {
            concernId: globalThis.crypto.randomUUID(),
            clinicalStatus: 'active',
            source: 'manuallyAdded',
            assertions: [assertion],
          },
        ],
      };
    });
    if (canEdit.current) {
      setEditing(null);
      setManualEditing(false);
    }
  };

  if (!value)
    return <InvalidClinicalAnswer label={label} answer={response?.answer} />;

  const editingConcern = editing
    ? value.concerns.find(({ concernId }) => concernId === editing.concernId)
    : undefined;
  const Lookup = codeLookup?.component;
  const problemList = (
    <ProblemList
      concerns={value.concerns}
      title={null}
      readOnly={readOnly}
      actions={[
        ...(assertionDate.valid && (codeLookup || !requireCoding)
          ? (['refine'] as const)
          : []),
        'remove',
      ]}
      inlineActions
      className="rounded-none border-0 bg-transparent shadow-none [&_[data-slot=clinical-list-heading]]:hidden [&_button]:min-h-11 [&_button]:min-w-11 [&>[data-slot=card-content]]:space-y-2 [&>[data-slot=card-content]]:p-0"
      onAction={(concern, action) => {
        if (readOnly) return;
        if (action === 'remove') {
          setEditing((current) =>
            current?.concernId === concern.concernId ? null : current
          );
          commit((next) => ({
            ...next,
            concerns: next.concerns.filter(
              (candidate) => candidate.concernId !== concern.concernId
            ),
          }));
        } else if (action === 'refine') {
          setEditing({ concernId: concern.concernId });
          if (!codeLookup) setManualEditing(true);
        }
      }}
      onReorder={(ids) =>
        commit((next) => ({
          ...next,
          concerns: reorderClinicalEntries(
            next.concerns,
            ids,
            ({ concernId }) => concernId
          ),
        }))
      }
    />
  );
  return (
    <section aria-label={label} className="min-w-0 space-y-2">
      {!readOnly && (adding || editingConcern || value.concerns.length > 0) && (
        <div className={clinicalEntryCardClasses}>
          <div className="flex items-center justify-between gap-2">
            <h4 className="min-w-0 font-semibold break-words">
              {editingConcern ? (
                <>
                  {m('Refine')} {currentAssertion(editingConcern)?.text}
                </>
              ) : (
                m('Add condition')
              )}
            </h4>
            {(editingConcern || value.concerns.length === 0) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={m('Cancel')}
                onClick={() => {
                  setEditing(null);
                  setAdding(false);
                  setManualEditing(false);
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <EncounterAssertionDateInput {...assertionDate} />
            {assertionDate.valid && Lookup && codeLookup && (
              <div className="min-w-0 flex-1 basis-56">
                <Lookup
                  key={editing ? editing.concernId : 'add'}
                  indexUrl={codeLookup.indexUrl}
                  locale={codeLookup.locale}
                  domains={['condition']}
                  preferCodetypes={['ICD10']}
                  bare
                  clearOnSelect
                  initialQuery={
                    editingConcern ? currentAssertion(editingConcern)?.text : ''
                  }
                  aria-label={
                    editingConcern ? m('Recode condition') : m('Add condition')
                  }
                  placeholder={
                    editingConcern
                      ? m('Search replacement diagnosis…')
                      : m('Search conditions…')
                  }
                  onSelect={(pick) => {
                    if (
                      !pick.fullid?.trim() ||
                      !pick.codetype?.trim() ||
                      !pick.fullcode?.trim() ||
                      !pick.label?.trim() ||
                      pick.domain !== 'condition'
                    )
                      return;
                    recordAssertion(
                      {
                        text: pick.label,
                        verificationStatus: 'unconfirmed',
                        coding: [
                          {
                            system: pick.codetype,
                            code: pick.fullcode,
                            display: pick.label,
                            primary: true,
                          },
                        ],
                      },
                      pick
                    );
                  }}
                />
              </div>
            )}
          </div>
          {assertionDate.valid && !requireCoding && (
            <>
              <Button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setManualEditing(true);
                }}
              >
                {m('Other…')}
              </Button>
              <ConditionEditor
                mode={editing ? 'refine' : 'add'}
                open={manualEditing}
                onOpenChange={setManualEditing}
                concern={editingConcern}
                renderCodeSearch={false}
                onSave={(draft) => recordAssertion(draft)}
              />
            </>
          )}
          {value.concerns.length > 0 && problemList}
        </div>
      )}
      {!readOnly &&
        !adding &&
        !editingConcern &&
        value.concerns.length === 0 &&
        (codeLookup || !requireCoding) && (
          <ClinicalAddButton
            label={m('Add condition')}
            onClick={() => setAdding(true)}
          />
        )}
      {!readOnly && requireCoding && !codeLookup && (
        <p className="text-muted-foreground text-sm">
          {m('Coded condition search is unavailable.')}
        </p>
      )}
      {readOnly && problemList}
    </section>
  );
}
