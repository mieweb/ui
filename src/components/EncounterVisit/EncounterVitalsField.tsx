import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { Button } from '../Button';
import { Input } from '../Input';
import type {
  EncounterVitalNumericKey,
  EncounterVitalReading,
  EncounterVitalsValue,
} from './types';
import { validateEncounterVitals } from './model';

type NumericVital = EncounterVitalNumericKey;

const measurements: { key: NumericVital; label: string; unit: string }[] = [
  { key: 'pulse', label: 'Pulse', unit: 'bpm' },
  { key: 'respiratoryRate', label: 'Respiratory rate', unit: '/min' },
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'oxygenSaturation', label: 'Oxygen saturation', unit: '%' },
  { key: 'height', label: 'Height', unit: 'cm' },
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'pain', label: 'Pain', unit: '0–10' },
];

/** Preserve a malformed stored answer so it cannot be silently overwritten. */
function readVitals(answer?: string): {
  value: EncounterVitalsValue;
  error?: string;
} {
  if (!answer) return { value: { readings: [] } };
  try {
    const parsed: unknown = JSON.parse(answer);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error();
    const readings = (parsed as { readings?: unknown }).readings;
    if (!Array.isArray(readings)) throw new Error();
    const numericKeys = [
      'systolic',
      'diastolic',
      ...measurements.map(({ key }) => key),
    ];
    const ids = new Set<string>();
    for (const reading of readings) {
      if (!reading || typeof reading !== 'object' || Array.isArray(reading))
        throw new Error();
      if (typeof reading.id !== 'string' || !reading.id || ids.has(reading.id))
        throw new Error();
      ids.add(reading.id);
      for (const key of numericKeys) {
        if (
          reading[key] !== undefined &&
          (typeof reading[key] !== 'number' || !Number.isFinite(reading[key]))
        )
          throw new Error();
      }
      for (const key of ['recordedAt', 'position', 'site']) {
        if (reading[key] !== undefined && typeof reading[key] !== 'string')
          throw new Error();
      }
    }
    const inputDrafts = (parsed as { inputDrafts?: unknown }).inputDrafts;
    if (inputDrafts !== undefined) {
      if (!Array.isArray(inputDrafts)) throw new Error();
      const draftKeys = new Set<string>();
      for (const draft of inputDrafts) {
        if (
          !draft ||
          typeof draft !== 'object' ||
          Array.isArray(draft) ||
          typeof draft.readingId !== 'string' ||
          !ids.has(draft.readingId) ||
          !numericKeys.includes(draft.key) ||
          typeof draft.text !== 'string'
        )
          throw new Error();
        const draftKey = `${draft.readingId}:${draft.key}`;
        if (draftKeys.has(draftKey)) throw new Error();
        draftKeys.add(draftKey);
      }
    }
    return { value: parsed as EncounterVitalsValue };
  } catch {
    return {
      value: { readings: [] },
      error:
        'The saved vitals answer could not be read. The original answer is retained below; correct it through the visit data before editing.',
    };
  }
}

function newReadingId(): string {
  return globalThis.crypto.randomUUID();
}

/** Repeatable measurements stored together as one native eSheet JSON answer. */
export function EncounterVitalsField({
  field,
  response,
  isPreview,
  isEnabled,
  isReadOnly,
  onResponse,
}: FieldComponentProps): React.JSX.Element {
  const instanceId = React.useId();
  const parsed = React.useMemo(
    () => readVitals(response?.answer),
    [response?.answer]
  );
  const [drafts, setDrafts] = React.useState<
    Record<string, { text: string; baseline?: number }>
  >({});
  const readOnly =
    !(isPreview && isEnabled) || Boolean(isReadOnly) || Boolean(parsed.error);
  const definition = field.definition as { id: string; question?: string };
  const issues = validateEncounterVitals(parsed.value, definition.id);

  const commit = (value: EncounterVitalsValue) => {
    if (!readOnly) onResponse({ answer: JSON.stringify(value) });
  };
  const updateReading = (id: string, patch: Partial<EncounterVitalReading>) => {
    commit({
      ...parsed.value,
      readings: parsed.value.readings.map((reading) =>
        reading.id === id ? { ...reading, ...patch } : reading
      ),
    });
  };
  const updateNumber = (
    readingId: string,
    key: NumericVital,
    value: number | undefined,
    invalidText?: string
  ) => {
    const inputDrafts = (parsed.value.inputDrafts ?? []).filter(
      (draft) => draft.readingId !== readingId || draft.key !== key
    );
    if (invalidText !== undefined)
      inputDrafts.push({ readingId, key, text: invalidText });
    commit({
      ...parsed.value,
      inputDrafts: inputDrafts.length ? inputDrafts : undefined,
      readings: parsed.value.readings.map((reading) =>
        reading.id === readingId ? { ...reading, [key]: value } : reading
      ),
    });
  };

  const numberInput = (
    reading: EncounterVitalReading,
    key: NumericVital,
    label: string,
    unit: string
  ) => {
    const draftKey = `${reading.id}:${key}`;
    const inputId = `${instanceId}-${reading.id}-${key}`;
    const savedDraft = drafts[draftKey];
    const formatting =
      savedDraft && Object.is(savedDraft.baseline, reading[key])
        ? savedDraft.text
        : undefined;
    const persistedDraft = parsed.value.inputDrafts?.find(
      (draft) => draft.readingId === reading.id && draft.key === key
    );
    const isNumeric = (text: string) =>
      /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text.trim()) &&
      Number.isFinite(Number(text));
    const issue = issues.find(
      (entry) => entry.readingId === reading.id && entry.path?.endsWith(key)
    );
    return (
      <div key={key} className="relative min-w-0">
        <Input
          id={inputId}
          label={label}
          aria-describedby={`${inputId}-unit`}
          type="text"
          inputMode="decimal"
          className="min-h-11 pe-12"
          value={
            persistedDraft?.text ??
            formatting ??
            (reading[key] === undefined ? '' : String(reading[key]))
          }
          readOnly={readOnly}
          disabled={!isEnabled}
          error={persistedDraft ? 'Enter a finite number.' : issue?.message}
          onChange={(event) => {
            if (readOnly) return;
            const text = event.target.value;
            const numeric = isNumeric(text);
            setDrafts((current) => {
              const next = { ...current };
              delete next[draftKey];
              if (numeric) next[draftKey] = { text, baseline: Number(text) };
              return next;
            });
            if (text.trim() === '') {
              updateNumber(reading.id, key, undefined);
            } else if (numeric) {
              updateNumber(reading.id, key, Number(text));
            } else {
              updateNumber(reading.id, key, undefined, text);
            }
          }}
        />
        <p
          id={`${inputId}-unit`}
          className="text-muted-foreground pointer-events-none absolute end-3 top-[2.125rem] text-sm"
        >
          {unit}
        </p>
      </div>
    );
  };

  return (
    <section aria-label={definition.question ?? 'Vitals'} className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Leave unmeasured values blank.
      </p>
      {parsed.error && (
        <div
          role="alert"
          className="border-destructive text-destructive rounded-lg border p-3"
        >
          <p>{parsed.error}</p>
          <pre className="mt-2 max-h-48 overflow-auto text-xs break-all whitespace-pre-wrap">
            {response?.answer}
          </pre>
        </div>
      )}
      {!parsed.error && parsed.value.readings.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No measurements recorded.
        </p>
      )}
      {parsed.value.readings.map((reading, index) => {
        const readingIssues = issues.filter(
          (issue) => issue.readingId === reading.id
        );
        const bpIssue = readingIssues.find(
          (issue) => issue.code === 'incomplete-blood-pressure'
        );
        return (
          <fieldset key={reading.id} className="min-w-0 space-y-3">
            <legend className="sr-only">Measurement set {index + 1}</legend>
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold">Measurement set {index + 1}</h4>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 shrink-0"
                  aria-label={`Remove measurement set ${index + 1}`}
                  onClick={() =>
                    commit({
                      ...parsed.value,
                      readings: parsed.value.readings.filter(
                        (candidate) => candidate.id !== reading.id
                      ),
                      inputDrafts: parsed.value.inputDrafts?.filter(
                        (draft) => draft.readingId !== reading.id
                      ),
                    })
                  }
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              <fieldset
                className="col-span-2 min-w-0"
                aria-describedby={
                  bpIssue ? `${instanceId}-${reading.id}-bp-error` : undefined
                }
              >
                <legend className="sr-only">Blood pressure (mmHg)</legend>
                <div className="grid grid-cols-2 gap-3">
                  {numberInput(reading, 'systolic', 'Systolic', 'mmHg')}
                  {numberInput(reading, 'diastolic', 'Diastolic', 'mmHg')}
                </div>
                {bpIssue && (
                  <p
                    id={`${instanceId}-${reading.id}-bp-error`}
                    role="alert"
                    className="text-destructive mt-1 text-sm"
                  >
                    {bpIssue.message}
                  </p>
                )}
              </fieldset>
              {measurements.map(({ key, label, unit }) =>
                numberInput(reading, key, label, unit)
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <Input
                  label="Recorded at"
                  type={
                    !reading.recordedAt ||
                    (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(
                      reading.recordedAt
                    ) &&
                      !readingIssues.some((issue) =>
                        issue.path?.endsWith('.recordedAt')
                      ))
                      ? 'datetime-local'
                      : 'text'
                  }
                  className="min-h-11"
                  value={reading.recordedAt ?? ''}
                  readOnly={readOnly}
                  disabled={!isEnabled}
                  title="Optional; use the visit's local date and time."
                  error={
                    readingIssues.find((issue) =>
                      issue.path?.endsWith('.recordedAt')
                    )?.message
                  }
                  onChange={(event) => {
                    if (!readOnly)
                      updateReading(reading.id, {
                        recordedAt: event.target.value || undefined,
                      });
                  }}
                />
              </div>
              <Input
                label="Position"
                className="min-h-11"
                value={reading.position ?? ''}
                readOnly={readOnly}
                disabled={!isEnabled}
                placeholder="e.g. seated"
                onChange={(event) => {
                  if (!readOnly)
                    updateReading(reading.id, {
                      position: event.target.value || undefined,
                    });
                }}
              />
              <Input
                label="Measurement site"
                className="min-h-11"
                value={reading.site ?? ''}
                readOnly={readOnly}
                disabled={!isEnabled}
                placeholder="e.g. left arm"
                onChange={(event) => {
                  if (!readOnly)
                    updateReading(reading.id, {
                      site: event.target.value || undefined,
                    });
                }}
              />
            </div>
            {readingIssues
              .filter(
                (issue) =>
                  issue !== bpIssue &&
                  ![
                    'systolic',
                    'diastolic',
                    ...measurements.map(({ key }) => key),
                    'recordedAt',
                  ].some((key) => issue.path?.endsWith(`.${key}`))
              )
              .map((issue) => (
                <p
                  key={issue.message}
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {issue.message}
                </p>
              ))}
          </fieldset>
        );
      })}
      {!readOnly && (
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          onClick={() =>
            commit({
              ...parsed.value,
              readings: [...parsed.value.readings, { id: newReadingId() }],
            })
          }
        >
          Add measurement set
        </Button>
      )}
    </section>
  );
}
