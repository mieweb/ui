import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { Plus } from 'lucide-react';
import type { AssessmentProps } from '../Assessment';
import type { CodifyDomain } from '../CodeLookup/CodeLookup';
import type { CodeLookupProviderConfig } from '../CodeLookup/context';
import { normalizeConditionCodingSystem } from '../ConditionEditor';
import { currentAssertion } from '../ProblemList';
import { validateEncounterConditions } from './model';
import { isEncounterDate } from './date';
import { useEncounterMessages } from './messages';
import { Input } from '../Input';
import { Button } from '../Button';
import { DateInput } from '../DateInput';
import {
  dateToDisplayFormat,
  displayFormatToDateString,
} from '../../utils/date';

function FreeClinicalEntry({
  placeholder,
  translate,
  onFreeText,
}: {
  placeholder: string;
  translate: (message: string) => string;
  onFreeText?: (text: string) => void;
}) {
  const [text, setText] = React.useState('');
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <Input
        aria-label={translate('Clinical entry')}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <Button
        type="button"
        disabled={!text.trim()}
        onClick={() => {
          onFreeText?.(text.trim());
          setText('');
        }}
      >
        {translate('Add')}
      </Button>
    </div>
  );
}

/** Coded capture shares the host's lookup without importing its worker. */
export function codedOrderSearch(
  config: CodeLookupProviderConfig | null,
  requireCoding = true,
  translate: (message: string) => string = (message) => message
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
    onFreeText,
  }) => {
    if (!config)
      return (
        <FreeClinicalEntry
          placeholder={placeholder}
          translate={translate}
          onFreeText={onFreeText}
        />
      );
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
        onFreeText={requireCoding ? undefined : onFreeText}
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

/** Muted entry card that progressive-disclosure clinical fields expand into. */
export const clinicalEntryCardClasses =
  'bg-muted/40 min-w-0 space-y-3 rounded-lg p-3';

/** Ghost "+ Add …" affordance shown while a clinical entry card is collapsed. */
export function ClinicalAddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      leftIcon={<Plus aria-hidden="true" />}
      className="text-primary-800 hover:bg-primary-50 hover:text-primary-900 active:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-950 dark:hover:text-primary-200 min-h-11"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

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

/** The generated native definition carries the same default coding policy as validation. */
export function clinicalRequiresCoding(
  field: FieldComponentProps['field']
): boolean {
  return (
    (field.definition as { _sourceData?: { encounterRequireCoding?: boolean } })
      ._sourceData?.encounterRequireCoding ?? true
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

export function EncounterAssertionDateInput({
  date,
  setDate,
}: {
  date: string;
  setDate: (date: string) => void;
}) {
  const m = useEncounterMessages();
  const id = React.useId();
  const [display, setDisplay] = React.useState(() => dateToDisplayFormat(date));
  React.useEffect(() => {
    setDisplay((current) =>
      displayFormatToDateString(current) === date
        ? current
        : dateToDisplayFormat(date)
    );
  }, [date]);
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <label htmlFor={id} className="text-sm">
        {m('Assertion date')}
      </label>
      <DateInput
        id={id}
        value={display}
        onChange={(value) => {
          setDisplay(value);
          setDate(displayFormatToDateString(value));
        }}
        showCalendar
        width="fixed"
        className="min-h-11"
      />
      {!isEncounterDate(date) && (
        <span className="text-muted-foreground text-sm">
          {m('Enter the encounter date before adding or changing a diagnosis.')}
        </span>
      )}
    </div>
  );
}
