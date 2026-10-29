import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import {
  ProblemList,
  currentAssertion,
  type ConditionAssertion,
} from '../ProblemList';
import {
  ConditionEditor,
  type ConditionAssertionDraft,
  type ConditionEditorMode,
} from '../ConditionEditor';
import { validateEncounterConditions } from './model';
import { useEncounterMessages } from './messages';
import { useCodeLookupConfig } from '../CodeLookup/context';
import type { EncounterConditionsValue } from './types';
import {
  InvalidClinicalAnswer,
  clinicalAnswerResponse,
  reorderClinicalEntries,
  repairEncounterConcernReferences,
  useClinicalFormState,
  useEncounterAssertionDate,
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
  const codeLookup = useCodeLookupConfig();
  const assertionDate = useEncounterAssertionDate(field);
  const currentDate = React.useRef(assertionDate);
  currentDate.current = assertionDate;
  const state = useClinicalFormState(form);
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
  const [editor, setEditor] = React.useState<{
    mode: ConditionEditorMode;
    concernId?: string;
  } | null>(null);
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

  const saveAssertion = (
    concernId: string | undefined,
    draft: ConditionAssertionDraft
  ) => {
    if (!currentDate.current.valid) return;
    const assertion: ConditionAssertion = {
      ...draft,
      id: globalThis.crypto.randomUUID(),
      date: currentDate.current.date,
    };
    commit((next) => {
      if (!concernId)
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
      return {
        ...next,
        concerns: next.concerns.map((concern) =>
          concern.concernId === concernId
            ? {
                ...concern,
                assertions: [
                  ...concern.assertions,
                  { ...assertion, supersedes: currentAssertion(concern)?.id },
                ],
              }
            : concern
        ),
      };
    });
  };

  if (!value)
    return (
      <InvalidClinicalAnswer label="condition" answer={response?.answer} />
    );

  const editorConcern = editor?.concernId
    ? value.concerns.find(({ concernId }) => concernId === editor.concernId)
    : undefined;
  const addSearch =
    codeLookup && !readOnly ? (
      <codeLookup.component
        indexUrl={codeLookup.indexUrl}
        locale={codeLookup.locale}
        domains={['condition']}
        preferCodetypes={['ICD10']}
        bare
        clearOnSelect
        placeholder={m('Search conditions to add')}
        onSelect={(result) => {
          const coded = result.codetype.trim() && result.fullcode.trim();
          saveAssertion(undefined, {
            text: result.label,
            verificationStatus: 'unconfirmed',
            ...(coded
              ? {
                  coding: [
                    {
                      system: result.codetype,
                      code: result.fullcode,
                      display: result.label,
                      primary: true,
                    },
                  ],
                }
              : {}),
          });
        }}
        onFreeText={(text) =>
          saveAssertion(undefined, {
            text,
            verificationStatus: 'unconfirmed',
          })
        }
      />
    ) : undefined;
  return (
    <>
      <ProblemList
        concerns={value.concerns}
        readOnly={readOnly}
        actions={['observe', 'refine', 'revise', 'relate', 'resolve', 'remove']}
        onAction={(concern, action) => {
          if (action === 'remove') {
            setEditor(null);
            commit((next) => ({
              ...next,
              concerns: next.concerns.filter(
                (candidate) => candidate.concernId !== concern.concernId
              ),
            }));
            // Auto-repair assessment rows that referenced the deleted concern
            // so the visit never holds a dangling reference blocking Save.
            if (canEdit.current)
              repairEncounterConcernReferences(
                form.getState(),
                concern.concernId
              );
          } else if (action === 'resolve') {
            commit((next) => ({
              ...next,
              concerns: next.concerns.map((candidate) =>
                candidate.concernId === concern.concernId
                  ? { ...candidate, clinicalStatus: 'resolved' as const }
                  : candidate
              ),
            }));
          } else if (
            action === 'observe' ||
            action === 'refine' ||
            action === 'revise' ||
            action === 'relate'
          ) {
            setEditor({ mode: action, concernId: concern.concernId });
          }
        }}
        addSearch={addSearch}
        onAddProblem={
          addSearch
            ? undefined
            : (text) =>
                saveAssertion(undefined, {
                  text,
                  verificationStatus: 'unconfirmed',
                })
        }
        onAdd={() => setEditor({ mode: 'add' })}
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
      <ConditionEditor
        mode={editor?.mode ?? 'add'}
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        concern={editor?.mode === 'add' ? undefined : editorConcern}
        relatableConcerns={value.concerns.filter(
          ({ concernId }) => concernId !== editor?.concernId
        )}
        onSave={(draft) => {
          saveAssertion(
            editor?.mode === 'add' ? undefined : editor?.concernId,
            draft
          );
          setEditor(null);
        }}
        onRelate={(relationship) => {
          const target = editor?.concernId;
          if (target)
            commit((next) => ({
              ...next,
              concerns: next.concerns.map((concern) =>
                concern.concernId === target
                  ? {
                      ...concern,
                      relationships: [
                        ...(concern.relationships ?? []),
                        relationship,
                      ],
                    }
                  : concern
              ),
            }));
          setEditor(null);
        }}
        onAddObservation={(text) => {
          const target = editor?.concernId;
          if (target && currentDate.current.valid)
            commit((next) => ({
              ...next,
              concerns: next.concerns.map((concern) =>
                concern.concernId === target
                  ? {
                      ...concern,
                      observations: [
                        ...(concern.observations ?? []),
                        {
                          id: globalThis.crypto.randomUUID(),
                          date: currentDate.current.date,
                          text,
                        },
                      ],
                    }
                  : concern
              ),
            }));
          setEditor(null);
        }}
      />
    </>
  );
}
