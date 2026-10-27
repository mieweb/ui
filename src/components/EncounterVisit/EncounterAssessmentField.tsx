import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { Assessment } from '../Assessment';
import { currentAssertion, type ConditionConcern } from '../ProblemList';
import { useCodeLookupConfig } from '../CodeLookup/context';
import type { EncounterAssessmentValue } from './types';
import { validateEncounterAssessment } from './model';
import { useEncounterMessages } from './messages';
import {
  codedOrderSearch,
  clinicalAnswerResponse,
  clinicalRequiresCoding,
  EncounterAssertionDateInput,
  useEncounterAssertionDate,
  getExternalEncounterConditions,
  matchingConditionCode,
  useClinicalFormState,
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
      error:
        'The saved assessment answer could not be read. The original answer is retained below; correct it through the visit data before editing.',
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
  const requireCoding = clinicalRequiresCoding(field);
  const assertionDate = useEncounterAssertionDate(field);
  const currentDate = React.useRef(assertionDate);
  currentDate.current = assertionDate;
  const codeLookup = useCodeLookupConfig();
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
  const canEdit = React.useRef(!readOnly);
  canEdit.current = !readOnly;
  const renderSearch = React.useMemo(
    () =>
      codeLookup || !requireCoding
        ? codedOrderSearch(codeLookup, requireCoding, m)
        : undefined,
    [codeLookup, requireCoding, m]
  );
  const definition = field.definition as { question?: string };
  const commit = (next: EncounterAssessmentValue) => {
    if (
      canEdit.current &&
      !form.getState().readOnly &&
      !form.getState().disposed
    )
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
      <section
        aria-label={definition.question ?? m('Assessment and plan')}
        className="space-y-3"
      >
        <div
          role="alert"
          className="border-destructive text-destructive rounded-lg border p-3"
        >
          <p>{m(error)}</p>
          <pre
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable original data needs keyboard focus
            tabIndex={0}
            aria-label={m('Original assessment answer')}
            className="mt-2 max-h-48 overflow-auto text-xs break-all whitespace-pre-wrap"
          >
            {response?.answer}
          </pre>
        </div>
      </section>
    );
  }
  return (
    <section className="space-y-2">
      <Assessment
        concerns={concerns}
        items={value.items}
        orders={value.orders}
        title={null}
        addFormStart={
          !readOnly && <EncounterAssertionDateInput {...assertionDate} />
        }
        aria-label={definition.question ?? m('Assessment and plan')}
        className="rounded-none border-0 bg-transparent shadow-none [&_.border-dashed]:rounded-none [&_.border-dashed]:border-0 [&_.border-dashed]:bg-transparent [&_.border-dashed]:p-0 [&_.min-w-64]:min-w-0 [&_[data-slot=assessment-problem]]:rounded-none [&_[data-slot=assessment-problem]]:border-0 [&_[data-slot=assessment-problem]]:px-0 [&_[data-slot=assessment-problem]>ul]:ms-0 [&_[data-slot=assessment-problem]>ul]:border-0 [&_[data-slot=assessment-problem]>ul]:ps-4 [&_button]:min-h-11 [&_button]:min-w-11 [&_input]:min-h-11 [&_select]:min-h-11 [&>[data-slot=card-content]]:p-0 [&>[data-slot=card-content]>section]:border-0 [&>[data-slot=card-content]>section]:bg-transparent [&>[data-slot=card-content]>section]:px-0"
        readOnly={readOnly}
        defaultAddMode="problem"
        addFormLabel="Add assessment or order"
        renderOrderSearch={renderSearch}
        onAddAssessment={
          (codeLookup || !requireCoding) && assertionDate.valid
            ? (pick) => {
                if (!currentDate.current.valid || (requireCoding && !pick.code))
                  return;
                const existingConcern = pick.code
                  ? concerns.find((concern) =>
                      matchingConditionCode(concern, pick.code!)
                    )
                  : undefined;
                const existingAssertion =
                  existingConcern && currentAssertion(existingConcern);
                if (existingConcern && existingAssertion) {
                  commit({
                    ...value,
                    items: [
                      ...value.items.filter(
                        (item) => item.concernId !== existingConcern.concernId
                      ),
                      {
                        concernId: existingConcern.concernId,
                        assertionId: existingAssertion.id,
                      },
                    ],
                  });
                  return;
                }
                const concernId = globalThis.crypto.randomUUID();
                const assertionId = globalThis.crypto.randomUUID();
                commit({
                  ...value,
                  concerns: [
                    ...value.concerns,
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
                  items: [...value.items, { concernId, assertionId }],
                });
              }
            : undefined
        }
        onRemoveAssessment={(item) =>
          commit({
            ...value,
            items: value.items.filter(
              (candidate) => candidate.concernId !== item.concernId
            ),
            orders: value.orders.map((order) =>
              order.concernId === item.concernId
                ? { ...order, concernId: undefined }
                : order
            ),
          })
        }
        onAddOrder={
          codeLookup || !requireCoding
            ? (item, order) => {
                if (requireCoding && !order.code) return;
                commit({
                  ...value,
                  orders: [
                    ...value.orders,
                    {
                      ...order,
                      orderId: globalThis.crypto.randomUUID(),
                      concernId: item?.concernId,
                    },
                  ],
                });
              }
            : undefined
        }
        onEditOrder={(order, changes) =>
          commit({
            ...value,
            orders: value.orders.map((candidate) =>
              candidate.orderId === order.orderId
                ? { ...candidate, ...changes }
                : candidate
            ),
          })
        }
        onRemoveOrder={(order) =>
          commit({
            ...value,
            orders: value.orders.filter(
              (candidate) => candidate.orderId !== order.orderId
            ),
          })
        }
        onLinkOrder={(order, concernId) =>
          commit({
            ...value,
            orders: value.orders.map((candidate) =>
              candidate.orderId === order.orderId
                ? { ...candidate, concernId }
                : candidate
            ),
          })
        }
        onReorderItems={(ids) =>
          commit({
            ...value,
            items: reorder(value.items, ids, (item) => item.concernId),
          })
        }
        onReorderOrders={(ids) =>
          commit({
            ...value,
            orders: reorder(value.orders, ids, (order) => order.orderId),
          })
        }
      />
    </section>
  );
}
