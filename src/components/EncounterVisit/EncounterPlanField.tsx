import * as React from 'react';
import type { FieldComponentProps, FormState } from '@esheet/core';
import {
  Assessment,
  type AssessmentItem,
  type AssessmentOrder,
} from '../Assessment';
import { currentAssertion, type ConditionConcern } from '../ProblemList';
import { useCodeLookupConfig } from '../CodeLookup/context';
import {
  validAssessmentItem,
  validateEncounterConditions,
  validateEncounterPlan,
} from './model';
import type { EncounterPlanValue } from './types';
import { useEncounterMessages } from './messages';
import {
  clinicalAssessmentClasses,
  clinicalAnswerResponse,
  clinicalRequiresCoding,
  codedOrderSearch,
  InvalidClinicalAnswer,
  reorderClinicalEntries,
  useClinicalFormState,
} from './clinicalFieldAdapters';

function readPlan(answer?: string): EncounterPlanValue | undefined {
  if (!answer) return { orders: [] };
  try {
    const parsed: unknown = JSON.parse(answer);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      !('orders' in parsed) ||
      !Array.isArray(parsed.orders)
    )
      return undefined;
    if (validateEncounterPlan(parsed).length > 0) return undefined;
    return parsed as EncounterPlanValue;
  } catch {
    return undefined;
  }
}

/** Project canonical sibling concerns; the plan answer persists only orders. */
function getPlanConcerns(state: FormState): {
  concerns: ConditionConcern[];
  items: AssessmentItem[];
} {
  const concerns = new Map<string, ConditionConcern>();
  const items = new Map<string, AssessmentItem>();
  const fields = Object.values(state.normalized.byId).sort(
    (a, b) =>
      Number(String(b.definition.fieldType) === 'encounterConditions') -
      Number(String(a.definition.fieldType) === 'encounterConditions')
  );
  for (const { definition } of fields) {
    const fieldType = String(definition.fieldType);
    if (
      fieldType !== 'encounterConditions' &&
      fieldType !== 'encounterAssessment'
    )
      continue;
    try {
      const answer = state.responses[definition.id]?.answer;
      if (!answer) continue;
      const parsed: unknown = JSON.parse(answer);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        continue;
      const assessment = parsed as {
        concerns?: ConditionConcern[];
        items?: AssessmentItem[];
        orders?: AssessmentOrder[];
      };
      if (
        validateEncounterConditions({ concerns: assessment.concerns }).length >
        0
      )
        continue;
      for (const concern of assessment.concerns ?? []) {
        if (concerns.has(concern.concernId)) continue;
        const assertion = currentAssertion(concern);
        concerns.set(concern.concernId, concern);
        if (assertion) {
          items.set(concern.concernId, {
            concernId: concern.concernId,
            assertionId: assertion.id,
          });
        }
      }
      for (const item of assessment.items ?? []) {
        if (!validAssessmentItem(item)) continue;
        if (
          concerns
            .get(item.concernId)
            ?.assertions.some(({ id }) => id === item.assertionId)
        )
          items.set(item.concernId, item);
      }
    } catch {
      // Invalid sibling data remains visible in its own field, never copied here.
    }
  }
  return { concerns: [...concerns.values()], items: [...items.values()] };
}

/** Native eSheet coded care orders, using the shared Assessment plan editor. */
export function EncounterPlanField({
  field,
  form,
  response,
  isPreview,
  isEnabled,
  isReadOnly,
  onResponse,
}: FieldComponentProps): React.JSX.Element {
  const value = React.useMemo(
    () => readPlan(response?.answer),
    [response?.answer]
  );
  const m = useEncounterMessages();
  const requireCoding = clinicalRequiresCoding(field);
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
  const { concerns, items } = React.useMemo(
    () => getPlanConcerns(state),
    [state]
  );
  const definition = field.definition as { question?: string };
  const label = definition.question ?? m('Plan');
  const commit = (update: (next: EncounterPlanValue) => EncounterPlanValue) => {
    if (
      !canEdit.current ||
      form.getState().readOnly ||
      form.getState().disposed ||
      !currentValue.current
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
  const renderSearch = React.useMemo(
    () =>
      codeLookup || !requireCoding
        ? codedOrderSearch(codeLookup, requireCoding, m)
        : undefined,
    [codeLookup, requireCoding, m]
  );

  if (!value)
    return <InvalidClinicalAnswer label={label} answer={response?.answer} />;

  return (
    <section aria-label={label} className="min-w-0 space-y-2">
      <Assessment
        concerns={concerns}
        items={items}
        orders={value.orders}
        title={null}
        className={clinicalAssessmentClasses}
        readOnly={readOnly}
        rowActions={codeLookup || !requireCoding ? ['add-order'] : []}
        addModes={['order']}
        addFormLabel="Add plan order"
        defaultAddMode="order"
        renderOrderSearch={renderSearch}
        onAddOrder={
          codeLookup || !requireCoding
            ? (item, order) => {
                if (requireCoding && !order.code) return;
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
                }));
              }
            : undefined
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
        onReorderOrders={(ids) =>
          commit((next) => ({
            ...next,
            orders: reorderClinicalEntries(
              next.orders,
              ids,
              ({ orderId }) => orderId
            ),
          }))
        }
      />
      {!readOnly && requireCoding && !codeLookup && (
        <p className="text-muted-foreground text-sm">
          {m('Coded order search is unavailable.')}
        </p>
      )}
    </section>
  );
}
