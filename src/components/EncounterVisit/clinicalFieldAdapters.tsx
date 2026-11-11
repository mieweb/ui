import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { normalizeConditionCodingSystem } from '../ConditionEditor';
import { currentAssertion } from '../ProblemList';
import { validateEncounterConditions } from './model';
import { isEncounterDate } from './date';
import { useEncounterMessages } from './messages';

export function InvalidClinicalAnswer({
  label,
  answer,
}: {
  label: string;
  answer?: string;
}): React.JSX.Element {
  const m = useEncounterMessages();
  return (
    <section aria-label={label}>
      <div
        role="alert"
        className="border-destructive text-destructive rounded-lg border p-3"
      >
        <p>
          {m(
            'The saved {label} answer could not be read. The original answer is retained below; correct it through the visit data before editing.',
            { label }
          )}
        </p>
        <pre
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable original data needs keyboard focus
          tabIndex={0}
          aria-label={m('Original {label} answer', { label })}
          className="mt-2 max-h-48 overflow-auto text-xs break-all whitespace-pre-wrap"
        >
          {answer}
        </pre>
      </div>
    </section>
  );
}

/** React to host-driven updates and the save-time form freeze. */
export function useClinicalFormState(form: FieldComponentProps['form']) {
  return React.useSyncExternalStore(
    form.subscribe,
    form.getState,
    form.getState
  );
}

export function reorderClinicalEntries<T>(
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

/**
 * Canonical Conditions stay in their own native eSheet answers.
 *
 * Only `encounterConditions` fields are indexed: a concern recorded inside an
 * assessment section is not referenceable from another assessment section.
 * Cross-referencing between multiple assessment sections is intentionally
 * unsupported in the editing UI — record shared concerns in a Conditions
 * section instead. (The canonical validator in model.ts still accepts such
 * references in imported data via `getEncounterConcerns`.)
 */
export function getExternalEncounterConditions(
  state: import('@esheet/core').FormState
): import('../ProblemList').ConditionConcern[] {
  const byId = new Map<string, import('../ProblemList').ConditionConcern>();
  for (const { definition } of Object.values(state.normalized.byId)) {
    if (String(definition.fieldType) !== 'encounterConditions') continue;
    const answer = state.responses[definition.id]?.answer;
    if (!answer) continue;
    try {
      const parsed: unknown = JSON.parse(answer);
      if (validateEncounterConditions(parsed).length > 0) continue;
      for (const concern of (
        parsed as import('./types').EncounterConditionsValue
      ).concerns) {
        if (!byId.has(concern.concernId)) byId.set(concern.concernId, concern);
      }
    } catch {
      // The source field retains and reports malformed Conditions data.
    }
  }
  return [...byId.values()];
}

/**
 * Deleting a concern (from Conditions or an assessment section) repairs the
 * answers that referenced it: assessment rows are removed with their linked
 * orders kept but unlinked, and plan orders are unlinked when the concern no
 * longer resolves anywhere in the visit. Without this, the dangling reference
 * turns the assessment into an uneditable raw-answer error or fails the plan
 * order's visit-level link check, blocking Save with no UI route to repair it.
 */
export function repairEncounterConcernReferences(
  state: import('@esheet/core').FormState,
  concernId: string
): void {
  // The canonical validator resolves plan links against every Conditions and
  // assessment answer, so plan orders stay linked while the id exists anywhere.
  let stillResolves = false;
  for (const { definition } of Object.values(state.normalized.byId)) {
    const fieldType = String(definition.fieldType);
    if (
      fieldType !== 'encounterConditions' &&
      fieldType !== 'encounterAssessment'
    )
      continue;
    const answer = state.responses[definition.id]?.answer;
    if (!answer) continue;
    try {
      const parsed: unknown = JSON.parse(answer);
      const concerns = (parsed as { concerns?: { concernId?: string }[] })
        ?.concerns;
      if (
        Array.isArray(concerns) &&
        concerns.some((concern) => concern?.concernId === concernId)
      ) {
        stillResolves = true;
        break;
      }
    } catch {
      // The source field retains and reports malformed data.
    }
  }
  for (const { definition } of Object.values(state.normalized.byId)) {
    const fieldType = String(definition.fieldType);
    if (fieldType === 'encounterPlan' && !stillResolves) {
      const response = state.responses[definition.id];
      if (!response?.answer) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(response.answer);
      } catch {
        continue; // The plan field retains and reports malformed data.
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        continue;
      const value = parsed as Partial<import('./types').EncounterPlanValue>;
      const orders = Array.isArray(value.orders) ? value.orders : [];
      if (!orders.some((order) => order?.concernId === concernId)) continue;
      state.setResponse(
        definition.id,
        clinicalAnswerResponse(
          response,
          JSON.stringify({
            ...value,
            orders: orders.map((order) =>
              order?.concernId === concernId
                ? { ...order, concernId: undefined }
                : order
            ),
          })
        )
      );
      continue;
    }
    if (fieldType !== 'encounterAssessment') continue;
    const response = state.responses[definition.id];
    if (!response?.answer) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.answer);
    } catch {
      continue; // The assessment field retains and reports malformed data.
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      continue;
    const value = parsed as Partial<import('./types').EncounterAssessmentValue>;
    const items = Array.isArray(value.items) ? value.items : [];
    const orders = Array.isArray(value.orders) ? value.orders : [];
    const concerns = Array.isArray(value.concerns) ? value.concerns : [];
    // A local concern with the same id takes precedence over Conditions, so
    // references to it stay valid after the Conditions entry is deleted.
    if (concerns.some((concern) => concern?.concernId === concernId)) continue;
    if (
      !items.some((item) => item?.concernId === concernId) &&
      !orders.some((order) => order?.concernId === concernId)
    )
      continue;
    state.setResponse(
      definition.id,
      clinicalAnswerResponse(
        response,
        JSON.stringify({
          ...value,
          items: items.filter((item) => item?.concernId !== concernId),
          orders: orders.map((order) =>
            order?.concernId === concernId
              ? { ...order, concernId: undefined }
              : order
          ),
        })
      )
    );
  }
}

/** Normalize the systems accepted by the shared condition editor and native imports. */
function conditionSystemIdentity(system: string): string {
  const trimmed = system.trim();
  if (trimmed === 'http://hl7.org/fhir/sid/icd-10-cm') return 'ICD-10-CM';
  if (trimmed === 'http://snomed.info/sct') return 'SNOMED';
  return normalizeConditionCodingSystem(trimmed);
}

export function matchingConditionCode(
  concern: import('../ProblemList').ConditionConcern,
  picked: { codetype: string; fullcode: string }
): boolean {
  return Boolean(
    currentAssertion(concern)?.coding?.some(
      (coding) =>
        conditionSystemIdentity(coding.system) ===
          conditionSystemIdentity(picked.codetype) &&
        coding.code.trim().toUpperCase() ===
          picked.fullcode.trim().toUpperCase()
    )
  );
}

/** Replacing serialized clinical content must repair incompatible imported selection storage. */
export function clinicalAnswerResponse(
  response: FieldComponentProps['response'],
  answer: string
) {
  const next = { ...response, answer, _ai: false };
  delete next.selected;
  return next;
}

/** New assertions use a host date or an explicit entry, never the device clock. */
export function useEncounterAssertionDate(field: FieldComponentProps['field']) {
  const hostDate = (
    field.definition as { _sourceData?: { encounterDate?: string } }
  )._sourceData?.encounterDate;
  const [date, setDate] = React.useState(hostDate ?? '');
  React.useEffect(() => {
    setDate(hostDate ?? '');
  }, [hostDate]);
  return { date, setDate, valid: isEncounterDate(date) };
}
