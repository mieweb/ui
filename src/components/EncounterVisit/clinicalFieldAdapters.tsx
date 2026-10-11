import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import type { AssessmentProps } from '../Assessment';
import type { CodifyDomain } from '../CodeLookup/CodeLookup';
import type { CodeLookupProviderConfig } from '../CodeLookup/context';
import { normalizeConditionCodingSystem } from '../ConditionEditor';
import { currentAssertion } from '../ProblemList';
import { validateEncounterConditions } from './model';

/** Coded capture shares the host's lookup without importing its worker. */
export function codedOrderSearch(
  config: CodeLookupProviderConfig
): Exclude<AssessmentProps['renderOrderSearch'], false | undefined> {
  const CodedOrderSearch: Exclude<
    AssessmentProps['renderOrderSearch'],
    false | undefined
  > = ({
    domains,
    preferDomains,
    preferCodetypes,
    billableOnly,
    placeholder,
    onPick,
  }) => {
    const Lookup = config.component;
    const allowedDomains = (domains ?? [
      'med',
      'lab',
      'procedure',
      'vaccine',
    ]) as CodifyDomain[];
    return (
      <Lookup
        indexUrl={config.indexUrl}
        locale={config.locale}
        domains={allowedDomains}
        preferDomains={preferDomains as CodifyDomain[] | undefined}
        preferCodetypes={preferCodetypes}
        billableOnly={billableOnly}
        bare
        clearOnSelect
        placeholder={placeholder}
        onSelect={(result) => {
          if (
            !result.fullid?.trim() ||
            !result.codetype?.trim() ||
            !result.fullcode?.trim() ||
            !result.label?.trim() ||
            !allowedDomains.includes(result.domain as CodifyDomain)
          )
            return;
          onPick({
            fullid: result.fullid,
            label: result.label,
            codetype: result.codetype,
            fullcode: result.fullcode,
          });
        }}
      />
    );
  };
  return CodedOrderSearch;
}

export const clinicalAssessmentClasses =
  'rounded-none border-0 bg-transparent shadow-none [&_.border-dashed]:rounded-none [&_.border-dashed]:border-0 [&_.border-dashed]:bg-transparent [&_.border-dashed]:p-0 [&_.min-w-64]:min-w-0 [&_[data-slot=assessment-problem]]:rounded-none [&_[data-slot=assessment-problem]]:border-0 [&_[data-slot=assessment-problem]]:px-0 [&_[data-slot=assessment-problem]>ul]:ms-0 [&_[data-slot=assessment-problem]>ul]:border-0 [&_[data-slot=assessment-problem]>ul]:ps-4 [&_button]:min-h-11 [&_button]:min-w-11 [&_input]:min-h-11 [&_select]:min-h-11 [&>[data-slot=card-content]]:p-0 [&>[data-slot=card-content]>section]:border-0 [&>[data-slot=card-content]>section]:bg-transparent [&>[data-slot=card-content]>section]:px-0';

export function InvalidClinicalAnswer({
  label,
  answer,
}: {
  label: string;
  answer?: string;
}): React.JSX.Element {
  return (
    <section aria-label={label}>
      <div
        role="alert"
        className="border-destructive text-destructive rounded-lg border p-3"
      >
        <p>
          The saved {label.toLowerCase()} answer could not be read. The original
          answer is retained below; correct it through the visit data before
          editing.
        </p>
        <pre className="mt-2 max-h-48 overflow-auto text-xs break-all whitespace-pre-wrap">
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

/** Canonical Conditions stay in their own native eSheet answers. */
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
