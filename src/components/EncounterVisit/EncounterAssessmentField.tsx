import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { Assessment } from '../Assessment';
import { currentAssertion, type ConditionConcern } from '../ProblemList';
import type { EncounterAssessmentValue } from './types';
import { validateEncounterAssessment } from './model';
import { useEncounterMessages } from './messages';
import {
  clinicalAnswerResponse,
  getExternalEncounterConditions,
  InvalidClinicalAnswer,
  matchingConditionCode,
  repairEncounterConcernReferences,
  useClinicalFormState,
  useEncounterAssertionDate,
} from './clinicalFieldAdapters';

function readAssessment(
  answer: string | undefined,
  externalConcerns: readonly ConditionConcern[]
): {
  value: EncounterAssessmentValue;
  error?: string;
} {
  if (!answer) return { value: { concerns: [], items: [], orders: [] } };
  try {
    const parsed: unknown = JSON.parse(answer);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error();
    if (
      validateEncounterAssessment(parsed, '', '', externalConcerns).length > 0
    )
      throw new Error();
    return { value: parsed as EncounterAssessmentValue };
  } catch {
    return {
      value: { concerns: [], items: [], orders: [] },
      error: 'unreadable',
    };
  }
}

function reorder<T>(
  values: T[],
  ids: string[],
  getId: (value: T) => string
): T[] {
  const byId = new Map(values.map((value) => [getId(value), value]));
  return [
    ...ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
    ...values.filter((value) => !ids.includes(getId(value))),
  ];
}

/** Native eSheet adapter for the shared Assessment and plan editor. */
export function EncounterAssessmentField({
  field,
  form,
  response,
  isPreview,
  isEnabled,
  isReadOnly,
  onResponse,
}: FieldComponentProps): React.JSX.Element {
  const m = useEncounterMessages();
  const assertionDate = useEncounterAssertionDate(field);
  const currentDate = React.useRef(assertionDate);
  currentDate.current = assertionDate;
  const state = useClinicalFormState(form);
  const externalConcerns = React.useMemo(
    () => getExternalEncounterConditions(state),
    [state]
  );
  const { value, error } = React.useMemo(
    () => readAssessment(response?.answer, externalConcerns),
    [response?.answer, externalConcerns]
  );
  const concerns = React.useMemo(() => {
    const combined = new Map(
      externalConcerns.map((concern) => [concern.concernId, concern])
    );
    // Legacy locally recorded assertions take precedence, as in native export.
    for (const concern of value.concerns)
      combined.set(concern.concernId, concern);
    return [...combined.values()];
  }, [value.concerns, externalConcerns]);
  const readOnly =
    !(isPreview && isEnabled) ||
    Boolean(isReadOnly) ||
    Boolean(error) ||
    state.readOnly ||
    state.disposed;
  const currentResponse = React.useRef(response);
  currentResponse.current = response;
  const currentValue = React.useRef(value);
  currentValue.current = value;
  const canEdit = React.useRef(!readOnly);
  canEdit.current = !readOnly;
  const definition = field.definition as { question?: string };
  const commit = (
    update: (next: EncounterAssessmentValue) => EncounterAssessmentValue
  ) => {
    if (
      !canEdit.current ||
      form.getState().readOnly ||
      form.getState().disposed
    )
      return;
    // Advance the ref so a second commit in the same event (e.g. link +
    // reorder from one drop) builds on this update instead of the stale value.
    const next = update(currentValue.current);
    currentValue.current = next;
    onResponse(
      clinicalAnswerResponse(
        form.getState().responses[field.definition.id] ??
          currentResponse.current,
        JSON.stringify(next)
      )
    );
  };
  if (error) {
    return (
      <InvalidClinicalAnswer label="assessment" answer={response?.answer} />
    );
  }
  return (
    <section className="space-y-2">
      <Assessment
        concerns={concerns}
        items={value.items}
        orders={value.orders}
        aria-label={definition.question ?? m('Assessment and plan')}
        readOnly={readOnly}
        addFormLabel="Add assessment or order"
        // New diagnoses create dated assertions — without a valid host
        // encounter date the affordance is removed (order-only add row)
        // instead of silently discarding picks.
        onAddAssessment={
          !assertionDate.valid
            ? undefined
            : (pick) => {
                if (!currentDate.current.valid) return;
                const existingConcern = pick.code
                  ? concerns.find((concern) =>
                      matchingConditionCode(concern, pick.code!)
                    )
                  : undefined;
                const existingAssertion =
                  existingConcern && currentAssertion(existingConcern);
                if (existingConcern && existingAssertion) {
                  commit((next) => ({
                    ...next,
                    items: [
                      ...next.items.filter(
                        (item) => item.concernId !== existingConcern.concernId
                      ),
                      {
                        concernId: existingConcern.concernId,
                        assertionId: existingAssertion.id,
                      },
                    ],
                  }));
                  return;
                }
                const concernId = globalThis.crypto.randomUUID();
                const assertionId = globalThis.crypto.randomUUID();
                commit((next) => ({
                  ...next,
                  concerns: [
                    ...next.concerns,
                    {
                      concernId,
                      clinicalStatus: 'active',
                      source: 'manuallyAdded',
                      assertions: [
                        {
                          id: assertionId,
                          date: currentDate.current.date,
                          text: pick.label,
                          verificationStatus: 'unconfirmed',
                          coding: pick.code
                            ? [
                                {
                                  system: pick.code.codetype,
                                  code: pick.code.fullcode,
                                  display: pick.label,
                                },
                              ]
                            : undefined,
                        },
                      ],
                    },
                  ],
                  items: [...next.items, { concernId, assertionId }],
                }));
              }
        }
        onRemoveAssessment={(item) => {
          const wasLocal = currentValue.current.concerns.some(
            (concern) => concern.concernId === item.concernId
          );
          commit((next) => ({
            ...next,
            // Removing the row also drops its local concern record — nothing
            // else can reference it once the orders below are unlinked, and an
            // orphaned uncoded concern would block Save with no visible repair.
            concerns: next.concerns.filter(
              (concern) => concern.concernId !== item.concernId
            ),
            items: next.items.filter(
              (candidate) => candidate.concernId !== item.concernId
            ),
            orders: next.orders.map((order) =>
              order.concernId === item.concernId
                ? { ...order, concernId: undefined }
                : order
            ),
          }));
          // Dropping a local concern can strand references in other sections
          // (plan orders link by concernId); repair them so Save stays open.
          if (wasLocal && canEdit.current)
            repairEncounterConcernReferences(form.getState(), item.concernId);
        }}
        onAddOrder={(item, order) =>
          commit((next) => ({
            ...next,
            orders: [
              ...next.orders,
              {
                ...order,
                orderId: globalThis.crypto.randomUUID(),
                concernId: item?.concernId,
              },
            ],
          }))
        }
        onEditOrder={(order, changes) =>
          commit((next) => ({
            ...next,
            orders: next.orders.map((candidate) =>
              candidate.orderId === order.orderId
                ? { ...candidate, ...changes }
                : candidate
            ),
          }))
        }
        onRemoveOrder={(order) =>
          commit((next) => ({
            ...next,
            orders: next.orders.filter(
              (candidate) => candidate.orderId !== order.orderId
            ),
          }))
        }
        onLinkOrder={(order, concernId) =>
          commit((next) => ({
            ...next,
            orders: next.orders.map((candidate) =>
              candidate.orderId === order.orderId
                ? { ...candidate, concernId }
                : candidate
            ),
          }))
        }
        onReorderItems={(ids) =>
          commit((next) => ({
            ...next,
            items: reorder(next.items, ids, (item) => item.concernId),
          }))
        }
        onReorderOrders={(ids) =>
          commit((next) => ({
            ...next,
            orders: reorder(next.orders, ids, (order) => order.orderId),
          }))
        }
      />
      {!readOnly && !assertionDate.valid && (
        <p className="text-muted-foreground text-xs">
          {m(
            'No encounter date — new diagnoses are disabled; orders can still be added.'
          )}
        </p>
      )}
    </section>
  );
}
