import type { FieldResponse } from '@esheet/core';
import { DateTime } from 'luxon';
import type { Medication } from '../MedicationList';
import type { Allergy } from '../AllergyList';
import {
  getEncounterFieldId,
  getEncounterSectionFieldIds,
  validateEncounterDefinition,
} from './definition';
import type {
  EncounterAssessmentValue,
  EncounterCode,
  EncounterObservation,
  EncounterResponses,
  EncounterSectionDefinition,
  EncounterValidationIssue,
  EncounterVitalInputDraft,
  EncounterVitalReading,
  EncounterVitalsValue,
  EncounterVisitDefinition,
  EncounterVisitSnapshot,
} from './types';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function measurement(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function parseJson(answer: string | undefined): unknown {
  if (typeof answer !== 'string' || !answer.trim()) return undefined;
  try {
    return JSON.parse(answer) as unknown;
  } catch {
    return undefined;
  }
}

interface VitalMeta {
  key: Exclude<
    keyof EncounterVitalReading,
    'id' | 'recordedAt' | 'position' | 'site' | 'systolic' | 'diastolic'
  >;
  label: string;
  unit: string;
  code: string;
}

// Codes/units: https://hl7.org/fhir/R4/observation-vitalsigns.html
// Pain score: https://loinc.org/72514-3 (UCUM {score}).
const VITALS: VitalMeta[] = [
  { key: 'pulse', label: 'Pulse', unit: '/min', code: '8867-4' },
  {
    key: 'respiratoryRate',
    label: 'Respiratory rate',
    unit: '/min',
    code: '9279-1',
  },
  { key: 'temperature', label: 'Temperature', unit: 'Cel', code: '8310-5' },
  {
    key: 'oxygenSaturation',
    label: 'Oxygen saturation',
    unit: '%',
    code: '2708-6',
  },
  { key: 'height', label: 'Height', unit: 'cm', code: '8302-2' },
  { key: 'weight', label: 'Weight', unit: 'kg', code: '29463-7' },
  { key: 'pain', label: 'Pain score', unit: '{score}', code: '72514-3' },
];
const VITAL_KEYS = [
  'systolic',
  'diastolic',
  ...VITALS.map(({ key }) => key),
] as const;

function loinc(code: string, display: string): EncounterCode {
  return { system: 'http://loinc.org', code, display };
}

/** Safe UI decoder. Validation separately preserves and reports malformed original answers. */
export function parseEncounterVitals(answer?: string): EncounterVitalsValue {
  const parsed = parseJson(answer);
  if (!record(parsed) || !Array.isArray(parsed.readings))
    return { readings: [] };
  const readings = parsed.readings
    .filter(
      (reading): reading is Record<string, unknown> =>
        record(reading) && nonempty(reading.id)
    )
    .map((reading) => {
      const safe: EncounterVitalReading = { id: reading.id as string };
      for (const key of VITAL_KEYS) {
        if (typeof reading[key] === 'number' && Number.isFinite(reading[key]))
          safe[key] = reading[key];
      }
      for (const key of ['recordedAt', 'position', 'site'] as const) {
        if (typeof reading[key] === 'string') safe[key] = reading[key];
      }
      return safe;
    });
  const inputDrafts = Array.isArray(parsed.inputDrafts)
    ? parsed.inputDrafts.filter(
        (draft): draft is EncounterVitalInputDraft =>
          record(draft) &&
          nonempty(draft.readingId) &&
          nonempty(draft.text) &&
          VITAL_KEYS.includes(draft.key as EncounterVitalInputDraft['key'])
      )
    : undefined;
  // An unfinished edit supersedes any old measurement, including stale imported data.
  for (const draft of Array.isArray(parsed.inputDrafts)
    ? parsed.inputDrafts
    : []) {
    if (
      !record(draft) ||
      typeof draft.readingId !== 'string' ||
      !VITAL_KEYS.includes(draft.key as EncounterVitalInputDraft['key'])
    )
      continue;
    const reading = readings.find(({ id }) => id === draft.readingId);
    if (reading) delete reading[draft.key as EncounterVitalInputDraft['key']];
  }
  return inputDrafts ? { readings, inputDrafts } : { readings };
}

/** Measurement shape checks only; this does not infer diagnoses or normal findings. */
export function validateEncounterVitals(
  value: unknown,
  fieldId = '',
  sectionId = ''
): EncounterValidationIssue[] {
  const issues: EncounterValidationIssue[] = [];
  const add = (
    message: string,
    path?: string,
    readingId?: string,
    code: EncounterValidationIssue['code'] = 'invalid-value'
  ) => {
    issues.push({ sectionId, fieldId, code, message, path, readingId });
  };
  if (!record(value) || !Array.isArray(value.readings)) {
    add('Vitals must contain a readings array.', 'readings');
    return issues;
  }
  for (const key of Object.keys(value)) {
    if (!['readings', 'inputDrafts'].includes(key))
      add(`Unknown vitals property ${key}.`, key);
  }
  const readings = value.readings;
  const ids = new Set<string>();
  readings.forEach((reading: unknown, index: number) => {
    const path = `readings.${index}`;
    if (!record(reading) || !nonempty(reading.id)) {
      add('Each vital reading requires a nonempty id.', `${path}.id`);
      return;
    }
    const id = reading.id;
    if (ids.has(id)) add('Vital reading ids must be unique.', `${path}.id`, id);
    ids.add(id);
    const allowedKeys = new Set<string>([
      'id',
      'recordedAt',
      'position',
      'site',
      ...VITAL_KEYS,
    ]);
    for (const key of Object.keys(reading)) {
      if (!allowedKeys.has(key))
        add(`Unknown vital property ${key}.`, `${path}.${key}`, id);
    }
    if (!VITAL_KEYS.some((key) => reading[key] !== undefined)) {
      add('Record at least one measurement in a vital reading.', path, id);
    }
    for (const key of VITAL_KEYS) {
      if (reading[key] !== undefined && !measurement(reading[key])) {
        add(
          `${key} must be a finite nonnegative number.`,
          `${path}.${key}`,
          id,
          'invalid-number'
        );
      }
    }
    if (
      (reading.systolic !== undefined) !==
      (reading.diastolic !== undefined)
    ) {
      add(
        'Record both systolic and diastolic blood pressure, or leave both blank.',
        path,
        id,
        'incomplete-blood-pressure'
      );
    }
    if (
      measurement(reading.oxygenSaturation) &&
      reading.oxygenSaturation > 100
    ) {
      add(
        'Oxygen saturation must be between 0 and 100 percent.',
        `${path}.oxygenSaturation`,
        id,
        'invalid-number'
      );
    }
    if (measurement(reading.pain) && reading.pain > 10) {
      add(
        'Pain score must be between 0 and 10.',
        `${path}.pain`,
        id,
        'invalid-number'
      );
    }
    for (const key of ['recordedAt', 'position', 'site']) {
      if (reading[key] !== undefined && typeof reading[key] !== 'string') {
        add(`${key} must be a string.`, `${path}.${key}`, id);
      }
    }
    if (
      nonempty(reading.recordedAt) &&
      (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(reading.recordedAt) ||
        !DateTime.fromISO(reading.recordedAt, { setZone: true }).isValid)
    ) {
      add(
        'Recorded time must be a valid date and time.',
        `${path}.recordedAt`,
        id
      );
    }
  });
  if (value.inputDrafts !== undefined) {
    if (!Array.isArray(value.inputDrafts)) {
      add(
        'Unfinished vital inputs must be an inputDrafts array.',
        'inputDrafts'
      );
    } else {
      const draftKeys = new Set<string>();
      value.inputDrafts.forEach((draft: unknown, index: number) => {
        const path = `inputDrafts.${index}`;
        if (
          !record(draft) ||
          !nonempty(draft.readingId) ||
          !nonempty(draft.text) ||
          !VITAL_KEYS.includes(draft.key as EncounterVitalInputDraft['key'])
        ) {
          add(
            'Each unfinished input requires a reading id, numeric measurement key and nonempty text.',
            path,
            record(draft) && typeof draft.readingId === 'string'
              ? draft.readingId
              : undefined
          );
          add(
            'Finish or clear the malformed numeric input before saving.',
            path,
            record(draft) && typeof draft.readingId === 'string'
              ? draft.readingId
              : undefined,
            'invalid-number'
          );
          return;
        }
        const readingId = draft.readingId;
        if (!ids.has(readingId))
          add(
            'Unfinished input must reference an existing reading.',
            `${path}.readingId`,
            readingId
          );
        for (const key of Object.keys(draft)) {
          if (!['readingId', 'key', 'text'].includes(key))
            add(
              `Unknown unfinished input property ${key}.`,
              `${path}.${key}`,
              readingId
            );
        }
        const draftKey = JSON.stringify([readingId, draft.key]);
        if (draftKeys.has(draftKey))
          add(
            'Each measurement can have only one unfinished input.',
            path,
            readingId
          );
        draftKeys.add(draftKey);
        const readingIndex = readings.findIndex(
          (reading: unknown) => record(reading) && reading.id === readingId
        );
        add(
          `Finish or clear the ${draft.key} input before saving.`,
          `readings.${readingIndex}.${draft.key}`,
          readingId,
          'invalid-number'
        );
      });
    }
  }
  return issues;
}

function optionalStrings(
  value: Record<string, unknown>,
  keys: string[]
): boolean {
  return keys.every(
    (key) => value[key] === undefined || typeof value[key] === 'string'
  );
}

function validCode(value: unknown): boolean {
  return (
    value === undefined ||
    (record(value) &&
      nonempty(value.system) &&
      nonempty(value.code) &&
      optionalStrings(value, ['display']))
  );
}

function validMedication(value: unknown): value is Medication {
  return (
    record(value) &&
    nonempty(value.id) &&
    nonempty(value.name) &&
    [
      'unreconciled',
      'taking',
      'taking-noncompliant',
      'not-taking',
      'unknown',
    ].includes(value.status as string) &&
    optionalStrings(value, [
      'sig',
      'discontinuedDate',
      'note',
      'task',
      'strength',
      'doseForm',
      'quantity',
      'quantityUnit',
      'daysSupply',
      'route',
      'frequency',
      'refills',
      'startDate',
      'endDate',
      'indication',
      'pharmacyNotes',
    ]) &&
    (value.expired === undefined || typeof value.expired === 'boolean') &&
    (value.prn === undefined || typeof value.prn === 'boolean') &&
    (value.substitution === undefined ||
      ['0', '1'].includes(value.substitution as string)) &&
    validCode(value.code)
  );
}

function validAllergy(value: unknown): value is Allergy {
  return (
    record(value) &&
    nonempty(value.id) &&
    nonempty(value.allergen) &&
    optionalStrings(value, ['reaction', 'onsetDate', 'note']) &&
    (value.type === undefined ||
      ['drug', 'food', 'environmental', 'other'].includes(
        value.type as string
      )) &&
    (value.kind === undefined ||
      ['allergy', 'intolerance'].includes(value.kind as string)) &&
    (value.severity === undefined ||
      ['mild', 'moderate', 'severe'].includes(value.severity as string)) &&
    (value.inactive === undefined || typeof value.inactive === 'boolean') &&
    validCode(value.code)
  );
}

function duplicateIds(values: Record<string, unknown>[], key: string): boolean {
  return new Set(values.map((value) => value[key])).size !== values.length;
}

export function validateEncounterAssessment(
  value: unknown,
  fieldId = '',
  sectionId = ''
): EncounterValidationIssue[] {
  const issues: EncounterValidationIssue[] = [];
  const add = (message: string, path?: string) =>
    issues.push({
      sectionId,
      fieldId,
      code: 'invalid-value' as const,
      message,
      path,
    });
  if (
    !record(value) ||
    !Array.isArray(value.concerns) ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.orders)
  ) {
    add('Assessment must contain concerns, items and orders arrays.');
    return issues;
  }
  const concerns = new Map<string, Set<string>>();
  value.concerns.forEach((concern: unknown, index: number) => {
    const path = `concerns.${index}`;
    if (
      !record(concern) ||
      !nonempty(concern.concernId) ||
      !Array.isArray(concern.assertions) ||
      ![
        'active',
        'recurrence',
        'relapse',
        'inactive',
        'remission',
        'resolved',
      ].includes(concern.clinicalStatus as string)
    ) {
      add(
        'Each concern requires an id, clinical status and assertions array.',
        path
      );
      return;
    }
    if (concerns.has(concern.concernId))
      add('Concern ids must be unique.', `${path}.concernId`);
    const assertionIds = new Set<string>();
    concerns.set(concern.concernId, assertionIds);
    concern.assertions.forEach((assertion: unknown, assertionIndex: number) => {
      const assertionPath = `${path}.assertions.${assertionIndex}`;
      if (
        !record(assertion) ||
        !nonempty(assertion.id) ||
        !nonempty(assertion.text) ||
        typeof assertion.date !== 'string' ||
        ![
          'unconfirmed',
          'provisional',
          'differential',
          'confirmed',
          'refuted',
          'entered-in-error',
        ].includes(assertion.verificationStatus as string) ||
        !optionalStrings(assertion, ['note'])
      ) {
        add(
          'Each assertion requires an id, text, date and verification status.',
          assertionPath
        );
        return;
      }
      if (assertionIds.has(assertion.id))
        add(
          'Assertion ids must be unique within a concern.',
          `${assertionPath}.id`
        );
      assertionIds.add(assertion.id);
      if (
        assertion.coding !== undefined &&
        (!Array.isArray(assertion.coding) ||
          assertion.coding.some((coding) => !validCode(coding)))
      ) {
        add(
          'Assertion coding must contain system and code strings.',
          `${assertionPath}.coding`
        );
      }
    });
  });
  const itemIds = new Set<string>();
  value.items.forEach((item: unknown, index: number) => {
    const path = `items.${index}`;
    if (
      !record(item) ||
      !nonempty(item.concernId) ||
      !nonempty(item.assertionId) ||
      !optionalStrings(item, ['note'])
    ) {
      add('Assessment items require concern and assertion ids.', path);
      return;
    }
    if (itemIds.has(item.concernId))
      add('Each concern may be assessed once.', `${path}.concernId`);
    itemIds.add(item.concernId);
    if (!concerns.get(item.concernId)?.has(item.assertionId)) {
      add(
        'An assessment item must reference an existing concern and assertion.',
        path
      );
    }
  });
  const orderIds = new Set<string>();
  value.orders.forEach((order: unknown, index: number) => {
    const path = `orders.${index}`;
    if (
      !record(order) ||
      !nonempty(order.orderId) ||
      !nonempty(order.display) ||
      !['medication', 'lab', 'imaging', 'procedure', 'referral'].includes(
        order.type as string
      ) ||
      !optionalStrings(order, [
        'concernId',
        'detail',
        'timing',
        'indication',
        'notes',
        'bodySite',
        'referTo',
      ]) ||
      (order.priority !== undefined &&
        !['routine', 'urgent', 'stat'].includes(order.priority as string))
    ) {
      add(
        'Each order requires an id, display text and supported order type.',
        path
      );
      return;
    }
    if (orderIds.has(order.orderId))
      add('Order ids must be unique.', `${path}.orderId`);
    orderIds.add(order.orderId);
    if (
      order.concernId !== undefined &&
      !concerns.has(order.concernId as string)
    ) {
      add(
        'An order indication must reference an existing concern.',
        `${path}.concernId`
      );
    }
    if (
      order.code !== undefined &&
      (!record(order.code) ||
        !nonempty(order.code.fullid) ||
        !nonempty(order.code.codetype) ||
        !nonempty(order.code.fullcode))
    ) {
      add(
        'Order coding requires fullid, codetype and fullcode.',
        `${path}.code`
      );
    }
  });
  return issues;
}

export function parseEncounterAssessment(
  answer?: string
): EncounterAssessmentValue {
  const parsed = parseJson(answer);
  return validateEncounterAssessment(parsed).length === 0
    ? (parsed as EncounterAssessmentValue)
    : { concerns: [], items: [], orders: [] };
}

function validateCustom(
  section: EncounterSectionDefinition,
  answer: string,
  fieldId: string
): EncounterValidationIssue[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(answer) as unknown;
  } catch {
    return [
      {
        sectionId: section.id,
        fieldId,
        code: 'invalid-json',
        message: `${section.title} contains malformed JSON.`,
      },
    ];
  }
  if (section.kind === 'vitals')
    return validateEncounterVitals(parsed, fieldId, section.id);
  if (section.kind === 'assessment')
    return validateEncounterAssessment(parsed, fieldId, section.id);
  const key = section.kind === 'medications' ? 'medications' : 'allergies';
  const validItem =
    section.kind === 'medications' ? validMedication : validAllergy;
  const issues: EncounterValidationIssue[] = [];
  const add = (message: string, path?: string) =>
    issues.push({
      sectionId: section.id,
      fieldId,
      code: 'invalid-value' as const,
      message,
      path,
    });
  if (!record(parsed) || !Array.isArray(parsed[key])) {
    add(`${section.title} must contain a ${key} array.`, key);
    return issues;
  }
  const values = parsed[key] as unknown[];
  values.forEach((item, index) => {
    if (!validItem(item))
      add(
        `Invalid ${key === 'medications' ? 'medication' : 'allergy'} record.`,
        `${key}.${index}`
      );
  });
  if (values.every(record) && duplicateIds(values, 'id'))
    add(`${section.title} ids must be unique.`, key);
  if (section.kind === 'allergies') {
    if (
      parsed.noKnownAllergies !== undefined &&
      typeof parsed.noKnownAllergies !== 'boolean'
    ) {
      add(
        'No-known-allergies must be an explicit boolean.',
        'noKnownAllergies'
      );
    }
    if (parsed.noKnownAllergies === true && values.length > 0) {
      add(
        'Recorded allergies conflict with the no-known-allergies flag.',
        'noKnownAllergies'
      );
    }
  }
  return issues;
}

function selectedValue(response?: FieldResponse): string | undefined {
  return record(response?.selected) &&
    typeof response.selected.value === 'string'
    ? response.selected.value
    : undefined;
}

function responseHasContent(response: FieldResponse | undefined): boolean {
  return nonempty(response?.answer) || nonempty(selectedValue(response));
}

function customHasContent(
  section: EncounterSectionDefinition,
  answer?: string
): boolean {
  const parsed = parseJson(answer);
  if (!record(parsed)) return false;
  if (section.kind === 'vitals')
    return parseEncounterVitals(answer).readings.some((reading) =>
      VITAL_KEYS.some((key) => measurement(reading[key]))
    );
  if (section.kind === 'medications')
    return Array.isArray(parsed.medications) && parsed.medications.length > 0;
  if (section.kind === 'allergies')
    return (
      (Array.isArray(parsed.allergies) && parsed.allergies.length > 0) ||
      parsed.noKnownAllergies === true
    );
  return (
    (Array.isArray(parsed.items) && parsed.items.length > 0) ||
    (Array.isArray(parsed.orders) && parsed.orders.length > 0)
  );
}

/** Report required omissions and malformed values without changing recorded data. */
export function validateEncounterResponses(
  definition: EncounterVisitDefinition,
  responses: EncounterResponses
): EncounterValidationIssue[] {
  validateEncounterDefinition(definition);
  const issues: EncounterValidationIssue[] = [];
  const add = (
    sectionId: string,
    fieldId: string,
    code: EncounterValidationIssue['code'],
    message: string
  ) => issues.push({ sectionId, fieldId, code, message });
  for (const section of definition.sections) {
    const ids = getEncounterSectionFieldIds(section);
    for (const fieldId of ids) {
      const response = responses[fieldId];
      if (
        response !== undefined &&
        (!record(response) ||
          (response.answer !== undefined &&
            typeof response.answer !== 'string'))
      ) {
        add(
          section.id,
          fieldId,
          'invalid-response',
          'An eSheet response must be an object with a string answer.'
        );
      }
    }
    if (
      section.kind === 'narrative' ||
      (section.kind === 'observations' && section.narrative)
    ) {
      const fieldId = getEncounterFieldId(section.id);
      const response = responses[fieldId];
      if (response?.selected !== undefined)
        add(
          section.id,
          fieldId,
          'invalid-response',
          'Narrative fields store text in answer.'
        );
    }
    if (section.kind === 'observations') {
      for (const observation of section.observations ?? []) {
        const fieldId = getEncounterFieldId(section.id, observation.id);
        const response = responses[fieldId];
        const hasContent = responseHasContent(response);
        if (observation.required && !hasContent)
          add(
            section.id,
            fieldId,
            'required',
            `${observation.label} is required.`
          );
        if (observation.type === 'choice') {
          if (
            response?.selected !== undefined &&
            (!record(response.selected) ||
              typeof response.selected.id !== 'string' ||
              typeof response.selected.value !== 'string' ||
              !observation.options?.includes(response.selected.value) ||
              response.selected.id !==
                encodeURIComponent(response.selected.value))
          ) {
            add(
              section.id,
              fieldId,
              'invalid-choice',
              `${observation.label} must use a configured option.`
            );
          }
          if (nonempty(response?.answer))
            add(
              section.id,
              fieldId,
              'invalid-response',
              'Choice observations store the selected option in selected.'
            );
        } else {
          if (response?.selected !== undefined)
            add(
              section.id,
              fieldId,
              'invalid-response',
              'Text and numeric observations store their value in answer.'
            );
          if (
            observation.type === 'number' &&
            nonempty(response?.answer) &&
            !measurement(Number(response.answer.trim()))
          ) {
            add(
              section.id,
              fieldId,
              'invalid-number',
              `${observation.label} must be a finite nonnegative number.`
            );
          }
        }
      }
    } else if (section.kind !== 'narrative') {
      const fieldId = getEncounterFieldId(section.id, 'value');
      const response = responses[fieldId];
      if (response?.selected !== undefined)
        add(
          section.id,
          fieldId,
          'invalid-response',
          'Structured sections store serialized JSON in answer.'
        );
      if (nonempty(response?.answer))
        issues.push(...validateCustom(section, response.answer, fieldId));
    }
    if (section.required) {
      const hasContent =
        section.kind === 'narrative' || section.kind === 'observations'
          ? ids.some((id) => responseHasContent(responses[id]))
          : customHasContent(
              section,
              responses[getEncounterFieldId(section.id, 'value')]?.answer
            );
      if (!hasContent)
        add(
          section.id,
          ids[0],
          'required',
          `${section.title} requires at least one recorded answer.`
        );
    }
  }
  return issues;
}

function exportVitals(
  section: EncounterSectionDefinition,
  answer?: string
): EncounterObservation[] {
  const fieldId = getEncounterFieldId(section.id, 'value');
  return parseEncounterVitals(answer).readings.flatMap((reading) => {
    const base = {
      sectionId: section.id,
      fieldId,
      groupId: reading.id,
      recordedAt: reading.recordedAt,
      position: reading.position,
      site: reading.site,
    };
    const observations: EncounterObservation[] = [];
    if (measurement(reading.systolic) || measurement(reading.diastolic)) {
      observations.push({
        ...base,
        label: 'Blood pressure',
        value: `${measurement(reading.systolic) ? reading.systolic : '?'}/${measurement(reading.diastolic) ? reading.diastolic : '?'}`,
        unit: 'mmHg',
        code: loinc('85354-9', 'Blood pressure panel'),
        components: [
          ...(measurement(reading.systolic)
            ? [
                {
                  label: 'Systolic',
                  value: reading.systolic,
                  unit: 'mmHg',
                  code: loinc('8480-6', 'Systolic blood pressure'),
                },
              ]
            : []),
          ...(measurement(reading.diastolic)
            ? [
                {
                  label: 'Diastolic',
                  value: reading.diastolic,
                  unit: 'mmHg',
                  code: loinc('8462-4', 'Diastolic blood pressure'),
                },
              ]
            : []),
        ],
      });
    }
    for (const vital of VITALS) {
      const value = reading[vital.key];
      if (
        measurement(value) &&
        (vital.key !== 'pain' || value <= 10) &&
        (vital.key !== 'oxygenSaturation' || value <= 100)
      )
        observations.push({
          ...base,
          label: vital.label,
          value,
          unit: vital.unit,
          code: loinc(vital.code, vital.label),
        });
    }
    return observations;
  });
}

function exportCustom(
  section: EncounterSectionDefinition,
  answer?: string
): EncounterObservation[] {
  if (section.kind === 'vitals') return exportVitals(section, answer);
  if (
    !nonempty(answer) ||
    validateCustom(section, answer, getEncounterFieldId(section.id, 'value'))
      .length > 0
  )
    return [];
  const parsed = parseJson(answer) as Record<string, unknown>;
  const base = {
    sectionId: section.id,
    fieldId: getEncounterFieldId(section.id, 'value'),
  };
  if (section.kind === 'medications') {
    return (parsed.medications as Medication[]).map((medication) => ({
      ...base,
      label: 'Medication',
      value: [
        medication.name,
        medication.sig,
        `Status: ${medication.status}`,
        medication.note,
      ]
        .filter(Boolean)
        .join('; '),
      code: medication.code,
      groupId: medication.id,
    }));
  }
  if (section.kind === 'allergies') {
    if (parsed.noKnownAllergies === true)
      return [
        {
          ...base,
          label: 'Allergies',
          value: 'No known allergies (explicitly recorded)',
        },
      ];
    return (parsed.allergies as Allergy[]).map((allergy) => ({
      ...base,
      label: allergy.kind === 'intolerance' ? 'Intolerance' : 'Allergy',
      value: [
        allergy.allergen,
        allergy.reaction,
        allergy.severity,
        allergy.inactive ? 'inactive' : undefined,
        allergy.note,
      ]
        .filter(Boolean)
        .join('; '),
      code: allergy.code,
      groupId: allergy.id,
    }));
  }
  const assessment = parsed as unknown as EncounterAssessmentValue;
  const observations: EncounterObservation[] = [];
  for (const item of assessment.items) {
    const assertion = assessment.concerns
      .find((concern) => concern.concernId === item.concernId)
      ?.assertions.find((assertion) => assertion.id === item.assertionId);
    if (assertion)
      observations.push({
        ...base,
        label: 'Assessment',
        value: [
          assertion.text,
          `Verification: ${assertion.verificationStatus}`,
          assertion.note,
          item.note,
        ]
          .filter(Boolean)
          .join('; '),
        groupId: item.concernId,
        code:
          assertion.coding?.find((coding) => coding.primary) ??
          assertion.coding?.[0],
      });
  }
  for (const order of assessment.orders) {
    observations.push({
      ...base,
      label: `${order.type} order`,
      value: [
        order.display,
        order.detail,
        order.priority,
        order.timing,
        order.indication,
        order.bodySite,
        order.referTo,
        order.notes,
      ]
        .filter(Boolean)
        .join('; '),
      groupId: order.concernId ?? order.orderId,
      code: order.code
        ? {
            system: order.code.codetype,
            code: order.code.fullcode,
            display: order.display,
          }
        : undefined,
    });
  }
  return observations;
}

/** Export documented narrative and individual observations while retaining the full eSheet response. */
export function createEncounterSnapshot(
  definition: EncounterVisitDefinition,
  responses: EncounterResponses
): EncounterVisitSnapshot {
  const errors = validateEncounterResponses(definition, responses);
  const observations: EncounterObservation[] = [];
  for (const section of definition.sections) {
    if (
      section.kind === 'narrative' ||
      (section.kind === 'observations' && section.narrative)
    ) {
      const fieldId = getEncounterFieldId(section.id);
      const answer = responses[fieldId]?.answer;
      if (nonempty(answer))
        observations.push({
          sectionId: section.id,
          fieldId,
          label:
            section.kind === 'narrative'
              ? section.title
              : `${section.title} narrative`,
          value: answer,
        });
    }
    if (section.kind === 'observations') {
      for (const observation of section.observations ?? []) {
        const fieldId = getEncounterFieldId(section.id, observation.id);
        const response = responses[fieldId];
        const raw =
          observation.type === 'choice'
            ? selectedValue(response)
            : response?.answer;
        if (!nonempty(raw)) continue;
        if (
          observation.type === 'choice' &&
          (!observation.options?.includes(raw) ||
            errors.some(
              (issue) =>
                issue.fieldId === fieldId && issue.code === 'invalid-choice'
            ))
        )
          continue;
        const value = observation.type === 'number' ? Number(raw) : raw;
        if (typeof value === 'number' && !measurement(value)) continue;
        observations.push({
          sectionId: section.id,
          fieldId,
          label: observation.label,
          value,
          unit: observation.unit,
          code: observation.code,
        });
      }
    } else if (section.kind !== 'narrative') {
      observations.push(
        ...exportCustom(
          section,
          responses[getEncounterFieldId(section.id, 'value')]?.answer
        )
      );
    }
  }
  const note = [
    definition.title,
    ...definition.sections.flatMap((section) => {
      const values = observations.filter(
        (observation) => observation.sectionId === section.id
      );
      if (values.length === 0) return [];
      return [
        `${section.title}\n${values
          .map((observation) => {
            const metadata = [
              observation.groupId &&
                `${section.kind === 'vitals' ? 'Reading' : 'Record'} ${observation.groupId}`,
              observation.recordedAt,
              observation.position,
              observation.site,
            ].filter(Boolean);
            const unit =
              observation.unit === 'Cel'
                ? '°C'
                : observation.unit === 'mm[Hg]'
                  ? 'mmHg'
                  : observation.unit === '{score}'
                    ? '/10'
                    : observation.unit;
            return `${observation.label}: ${observation.value}${unit ? ` ${unit}` : ''}${metadata.length ? ` (${metadata.join('; ')})` : ''}`;
          })
          .join('\n')}`,
      ];
    }),
  ].join('\n\n');
  // Keep host snapshot transformations detached from the live eSheet store.
  return globalThis.structuredClone({
    definition,
    responses,
    observations,
    note,
    errors,
  });
}
