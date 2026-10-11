import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
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
  const [editing, setEditing] = React.useState<{
    concernId: string;
    mode: 'refinement' | 'revision';
  } | null>(null);
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
                      changeType: editing.mode,
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
  return (
    <section aria-label={label} className="min-w-0 space-y-2">
      <ProblemList
        concerns={value.concerns}
        title={null}
        readOnly={readOnly}
        actions={[
          ...(assertionDate.valid && (codeLookup || !requireCoding)
            ? (['refine', 'revise'] as const)
            : []),
          'resolve',
          'move-up',
          'move-down',
        ]}
        className="rounded-none border-0 bg-transparent shadow-none [&_[data-slot=clinical-list-heading]]:border-0 [&_button]:min-h-11 [&_button]:min-w-11 [&>[data-slot=card-content]]:p-0"
        onAction={(concern, action) => {
          if (readOnly) return;
          if (action === 'resolve') {
            commit((next) => ({
              ...next,
              concerns: next.concerns.map((candidate) =>
                candidate.concernId === concern.concernId
                  ? { ...candidate, clinicalStatus: 'resolved' }
                  : candidate
              ),
            }));
          } else if (action === 'refine' || action === 'revise') {
            setEditing({
              concernId: concern.concernId,
              mode: action === 'refine' ? 'refinement' : 'revision',
            });
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
      {!readOnly && <EncounterAssertionDateInput {...assertionDate} />}
      {!readOnly && assertionDate.valid && Lookup && codeLookup && (
        <div className="min-w-0 space-y-2">
          {editingConcern && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                {editing?.mode === 'refinement' ? m('Refine') : m('Revise')}{' '}
                {currentAssertion(editingConcern)?.text}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                onClick={() => setEditing(null)}
              >
                {m('Cancel')}
              </Button>
            </div>
          )}
          <Lookup
            key={editing ? `${editing.concernId}:${editing.mode}` : 'add'}
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
      {!readOnly && assertionDate.valid && !requireCoding && (
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
            mode={
              editing?.mode === 'refinement'
                ? 'refine'
                : editing
                  ? 'revise'
                  : 'add'
            }
            open={manualEditing}
            onOpenChange={setManualEditing}
            concern={editingConcern}
            renderCodeSearch={false}
            onSave={(draft) => recordAssertion(draft)}
          />
        </>
      )}
      {!readOnly && requireCoding && !codeLookup && (
        <p className="text-muted-foreground text-sm">
          {m('Coded condition search is unavailable.')}
        </p>
      )}
    </section>
  );
}
