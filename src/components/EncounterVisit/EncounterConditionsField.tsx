import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { ProblemList, currentAssertion } from '../ProblemList';
import { Button } from '../Button';
import { useCodeLookupConfig } from '../CodeLookup/context';
import { validateEncounterConditions } from './model';
import type { EncounterConditionsValue } from './types';
import {
  InvalidClinicalAnswer,
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
  const label = definition.question ?? 'Conditions';
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
    onResponse({
      ...(form.getState().responses[field.definition.id] ??
        currentResponse.current),
      answer: JSON.stringify(update(currentValue.current)),
      _ai: false,
    });
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
          ...(codeLookup ? (['refine', 'revise'] as const) : []),
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
      {!readOnly && Lookup && codeLookup && (
        <div className="min-w-0 space-y-2">
          {editingConcern && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                {editing?.mode === 'refinement' ? 'Refine' : 'Revise'}{' '}
                {currentAssertion(editingConcern)?.text}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                onClick={() => setEditing(null)}
              >
                Cancel
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
            aria-label={editingConcern ? 'Recode condition' : 'Add condition'}
            placeholder={
              editingConcern
                ? 'Search replacement diagnosis…'
                : 'Search conditions…'
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
              commit((next) => {
                const assertion = {
                  id: globalThis.crypto.randomUUID(),
                  date: new Date().toISOString().slice(0, 10),
                  text: pick.label,
                  verificationStatus: 'unconfirmed' as const,
                  coding: [
                    {
                      system: pick.codetype,
                      code: pick.fullcode,
                      display: pick.label,
                      primary: true,
                    },
                  ],
                };
                if (editing) {
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
                }
                if (
                  next.concerns.some((concern) =>
                    matchingConditionCode(concern, pick)
                  )
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
              if (canEdit.current) setEditing(null);
            }}
          />
        </div>
      )}
      {!readOnly && !codeLookup && (
        <p className="text-muted-foreground text-sm">
          Coded condition search is unavailable.
        </p>
      )}
    </section>
  );
}
