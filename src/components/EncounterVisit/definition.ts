import type { FormDefinition } from '@esheet/core';
import type {
  EncounterCode,
  EncounterNarrativeFinding,
  EncounterObservationDefinition,
  EncounterResponses,
  EncounterSectionKind,
  EncounterSectionView,
} from './types';

/** Encode each identifier separately so punctuation cannot collide with delimiters. */
export function getEncounterFieldId(
  sectionId: string,
  observationId?: string
): string {
  const prefix = `encounter:${encodeURIComponent(sectionId)}`;
  return observationId === undefined
    ? `${prefix}:narrative`
    : `${prefix}:observation:${encodeURIComponent(observationId)}`;
}

export function getEncounterSectionFieldId(sectionId: string): string {
  return `encounter:${encodeURIComponent(sectionId)}:section`;
}

export function getEncounterSectionFieldIds(
  section: EncounterSectionView
): string[] {
  if (section.kind === 'narrative') return [getEncounterFieldId(section.id)];
  if (section.kind !== 'observations') {
    return [
      ...(section.narrative ? [getEncounterFieldId(section.id)] : []),
      getEncounterFieldId(section.id, 'value'),
    ];
  }
  return [
    ...(section.narrative ? [getEncounterFieldId(section.id)] : []),
    ...(section.observations ?? []).map((observation) =>
      getEncounterFieldId(section.id, observation.id)
    ),
  ];
}

/** Native field types registered by the encounter host, keyed back to section kinds. */
export const ENCOUNTER_KINDS_BY_FIELD_TYPE: Record<
  string,
  EncounterSectionKind
> = {
  encounterVitals: 'vitals',
  encounterMedications: 'medications',
  encounterAllergies: 'allergies',
  encounterConditions: 'conditions',
  encounterPlan: 'plan',
  encounterAssessment: 'assessment',
};

const SECTION_KINDS: EncounterSectionKind[] = [
  'narrative',
  'observations',
  'vitals',
  'medications',
  'allergies',
  'conditions',
  'plan',
  'assessment',
];

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function invalid(message: string): never {
  throw new Error(`Invalid encounter form: ${message}`);
}

function safeDecode(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function validCode(code: unknown): code is EncounterCode {
  return (
    record(code) &&
    nonempty(code.system) &&
    nonempty(code.code) &&
    optionalString(code.display)
  );
}

function validateFindings(
  findings: unknown,
  location: string
): EncounterNarrativeFinding[] | undefined {
  if (findings === undefined) return undefined;
  if (!Array.isArray(findings))
    invalid(`findings must be an array in ${location}`);
  const ids = new Set<string>();
  for (const finding of findings as EncounterNarrativeFinding[]) {
    if (
      !record(finding) ||
      !nonempty(finding.id) ||
      !nonempty(finding.label) ||
      !nonempty(finding.text)
    )
      invalid(`findings require id, label and text in ${location}`);
    if (ids.has(finding.id))
      invalid(`duplicate finding id ${finding.id} in ${location}`);
    ids.add(finding.id);
    if (finding.code !== undefined && !validCode(finding.code))
      invalid(`invalid finding code in ${location}`);
  }
  return findings as EncounterNarrativeFinding[];
}

const OBSERVATION_FIELD_ID = /^encounter:[^:]+:observation:([^:]+)$/;

/**
 * Rebuild one observation definition from its native field. Native properties
 * are authoritative (mieweb/ui#772); `_sourceData` carries only metadata the
 * native schema cannot express (clinical code, common findings).
 */
function observationView(
  sectionId: string,
  field: Record<string, unknown>
): EncounterObservationDefinition {
  const source = record(field._sourceData) ? field._sourceData : {};
  const encoded =
    typeof field.id === 'string' ? OBSERVATION_FIELD_ID.exec(field.id) : null;
  const id = encoded ? safeDecode(encoded[1]) : undefined;
  if (!nonempty(id))
    invalid(
      `observation field ids use encounter:<section>:observation:<id> in ${sectionId}`
    );
  if (nonempty(source.id) && source.id !== id)
    invalid(`_sourceData.id conflicts with the field id in ${sectionId}.${id}`);
  const label = nonempty(field.question) ? field.question : undefined;
  if (!nonempty(label))
    invalid(`observations in ${sectionId} require an id and label`);
  const type =
    field.fieldType === 'dropdown'
      ? ('choice' as const)
      : field.inputType === 'number'
        ? ('number' as const)
        : undefined;
  let options: string[] | undefined;
  if (type === 'choice') {
    if (!Array.isArray(field.options) || field.options.length === 0)
      invalid(`choice observation ${sectionId}.${id} requires options`);
    options = (field.options as unknown[]).map((option) => {
      // model.ts validation and MCP writes rely on this option-id convention.
      if (
        !record(option) ||
        !nonempty(option.value) ||
        option.id !== encodeURIComponent(option.value)
      )
        invalid(
          `dropdown options use { id: encodeURIComponent(value), value } in ${sectionId}.${id}`
        );
      return option.value;
    });
    if (new Set(options).size !== options.length)
      invalid(
        `options must be distinct nonempty strings in ${sectionId}.${id}`
      );
  }
  const unit = nonempty(field.unit) ? field.unit : undefined;
  if (source.code !== undefined && !validCode(source.code))
    invalid(`invalid code in ${sectionId}.${id}`);
  const findings = validateFindings(
    source.encounterFindings,
    `${sectionId}.${id}`
  );
  if (findings?.length && type !== undefined)
    invalid(`findings require a text observation in ${sectionId}.${id}`);
  return {
    id,
    label,
    ...(type === undefined ? {} : { type }),
    ...(unit === undefined ? {} : { unit }),
    ...(source.code === undefined
      ? {}
      : { code: source.code as EncounterCode }),
    ...(options === undefined ? {} : { options }),
    ...(findings === undefined ? {} : { findings }),
    ...(field.required === true ? { required: true } : {}),
  };
}

const SECTION_FIELD_ID = /^encounter:([^:]+):section$/;

function sectionView(
  field: Record<string, unknown>,
  seen: Set<string>
): EncounterSectionView {
  const encoded =
    typeof field.id === 'string' ? SECTION_FIELD_ID.exec(field.id) : null;
  const id = encoded ? safeDecode(encoded[1]) : undefined;
  if (id === undefined)
    invalid(
      `section field ids use encounter:<id>:section (${String(field.id)})`
    );
  if (!nonempty(field.title)) invalid(`each section requires an id and title`);
  if (seen.has(id)) invalid(`duplicate section id ${id}`);
  seen.add(id);
  const title = field.title;
  const children = Array.isArray(field.fields)
    ? field.fields.filter(record)
    : [];
  let description: string | undefined;
  let narrativeField: Record<string, unknown> | undefined;
  let customField: Record<string, unknown> | undefined;
  let customKind: EncounterSectionKind | undefined;
  const observations: EncounterObservationDefinition[] = [];
  const observationIds = new Set<string>();
  for (const child of children) {
    const fieldType =
      typeof child.fieldType === 'string' ? child.fieldType : '';
    if (fieldType === 'display') {
      if (description === undefined && nonempty(child.content))
        description = child.content;
      continue;
    }
    if (child.id === getEncounterFieldId(id)) {
      narrativeField = child;
      continue;
    }
    const kind = ENCOUNTER_KINDS_BY_FIELD_TYPE[fieldType];
    if (kind !== undefined) {
      if (customField !== undefined)
        invalid(`multiple structured clinical fields in ${id}`);
      if (child.id !== getEncounterFieldId(id, 'value'))
        invalid(
          `structured clinical fields use encounter:<section>:observation:value (${id})`
        );
      customField = child;
      customKind = kind;
      continue;
    }
    const observation = observationView(id, child);
    if (observationIds.has(observation.id))
      invalid(`duplicate observation id ${observation.id} in ${id}`);
    observationIds.add(observation.id);
    observations.push(observation);
  }
  const source = record(field._sourceData) ? field._sourceData : {};
  if (
    source.encounterKind !== undefined &&
    !SECTION_KINDS.includes(source.encounterKind as EncounterSectionKind)
  )
    invalid(`unknown section kind ${String(source.encounterKind)} in ${id}`);
  // Forms saved before kind stamps existed (#762) infer their kind: a lone
  // narrative is a narrative section unless titled as a structured companion.
  const inferredKind: EncounterSectionKind = customKind
    ? customKind
    : observations.length ||
        (narrativeField !== undefined &&
          narrativeField.question === `${title} narrative`)
      ? 'observations'
      : 'narrative';
  const kind =
    (source.encounterKind as EncounterSectionKind | undefined) ?? inferredKind;
  if (customKind !== undefined && kind !== customKind)
    invalid(
      `section kind ${kind} conflicts with its ${customKind} field in ${id}`
    );
  if (kind === 'narrative' && narrativeField === undefined)
    invalid(`narrative section ${id} requires its narrative field`);
  if (kind === 'narrative' && (observations.length || customField))
    invalid(`narrative section ${id} accepts only its narrative field`);
  if (kind === 'observations' && customField !== undefined)
    invalid(`observations section ${id} accepts only individual observations`);
  if (kind === 'observations' && !observations.length && !narrativeField)
    invalid(`observations section ${id} has no fields`);
  if (kind !== 'observations' && observations.length)
    invalid(
      `only observations sections accept individual observations (${id})`
    );
  if (
    kind !== 'narrative' &&
    kind !== 'observations' &&
    customField === undefined
  )
    invalid(`${kind} section ${id} requires its structured clinical field`);
  const narrativeSource =
    narrativeField !== undefined && record(narrativeField._sourceData)
      ? narrativeField._sourceData
      : {};
  const customSource =
    customField !== undefined && record(customField._sourceData)
      ? customField._sourceData
      : {};
  const findings = validateFindings(narrativeSource.encounterFindings, id);
  const narrative = kind !== 'narrative' && narrativeField !== undefined;
  const required =
    kind === 'narrative'
      ? narrativeField?.required === true
      : kind === 'observations'
        ? source.encounterSectionRequired === true
        : customField?.required === true ||
          source.encounterSectionRequired === true;
  return {
    id,
    title,
    kind,
    ...(description === undefined ? {} : { description }),
    ...(kind === 'observations' && observations.length ? { observations } : {}),
    ...(findings === undefined ? {} : { findings }),
    ...(typeof customSource.encounterRequireCoding === 'boolean'
      ? { requireCoding: customSource.encounterRequireCoding }
      : {}),
    ...(narrative ? { narrative } : {}),
    ...(required ? { required } : {}),
  };
}

/**
 * Derive per-section encounter views from the native form — the single
 * structural source of truth (mieweb/ui#772). Views let clinical validation,
 * snapshot export and MCP tools keep reasoning in section terms without a
 * second schema. Throws when the form does not describe a valid encounter.
 */
export function getEncounterFormSections(
  form: FormDefinition
): EncounterSectionView[] {
  if (!record(form)) invalid('expected an object');
  if (!nonempty(form.id) || !nonempty(form.title))
    invalid('id and title must be nonempty strings');
  if (!Array.isArray(form.pages) || form.pages.length === 0)
    invalid('at least one page is required');
  const sections: EncounterSectionView[] = [];
  const seen = new Set<string>();
  for (const page of form.pages) {
    if (!record(page) || !Array.isArray(page.fields)) continue;
    for (const field of page.fields) {
      if (!record(field) || field.fieldType !== 'section')
        invalid('every top-level encounter field must be a section');
      sections.push(sectionView(field, seen));
    }
  }
  if (sections.length === 0) invalid('at least one section is required');
  return sections;
}

/** Reject forms that do not describe a valid encounter before constructing an eSheet. */
export function validateEncounterForm(form: FormDefinition): void {
  getEncounterFormSections(form);
}

/** Only the facts supplied for the anonymous example; no assumed exam or treatment. */
export const EXAMPLE_ENCOUNTER_VISIT_RESPONSES: EncounterResponses = {
  [getEncounterFieldId('hpi')]: {
    answer: '45-year-old male with pre-diabetes, back pain and hypertension.',
  },
};
