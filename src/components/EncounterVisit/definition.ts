import type { FieldDefinition, FormDefinition } from '@esheet/core';
import type {
  EncounterObservationDefinition,
  EncounterResponses,
  EncounterSectionDefinition,
  EncounterSectionKind,
  EncounterVisitDefinition,
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
  section: EncounterSectionDefinition
): string[] {
  if (section.kind === 'narrative') return [getEncounterFieldId(section.id)];
  if (section.kind !== 'observations') {
    return [getEncounterFieldId(section.id, 'value')];
  }
  return [
    ...(section.narrative ? [getEncounterFieldId(section.id)] : []),
    ...(section.observations ?? []).map((observation) =>
      getEncounterFieldId(section.id, observation.id)
    ),
  ];
}

const SECTION_KINDS: EncounterSectionKind[] = [
  'narrative',
  'observations',
  'vitals',
  'medications',
  'allergies',
  'assessment',
];

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function invalid(message: string): never {
  throw new Error(`Invalid encounter definition: ${message}`);
}

/** Reject ambiguous identifiers and invalid configuration before constructing an eSheet. */
export function validateEncounterDefinition(
  definition: EncounterVisitDefinition
): void {
  if (!definition || typeof definition !== 'object')
    invalid('expected an object');
  if (!nonempty(definition.id) || !nonempty(definition.title)) {
    invalid('id and title must be nonempty strings');
  }
  if (!Array.isArray(definition.sections) || definition.sections.length === 0) {
    invalid('at least one section is required');
  }
  const sectionIds = new Set<string>();
  for (const section of definition.sections) {
    if (!section || typeof section !== 'object')
      invalid('expected a section object');
    if (!nonempty(section.id) || !nonempty(section.title)) {
      invalid('each section requires an id and title');
    }
    if (sectionIds.has(section.id))
      invalid(`duplicate section id ${section.id}`);
    sectionIds.add(section.id);
    if (!SECTION_KINDS.includes(section.kind))
      invalid(`unknown section kind ${section.kind}`);
    if (!optionalString(section.description))
      invalid(`invalid description in ${section.id}`);
    if (
      section.required !== undefined &&
      typeof section.required !== 'boolean'
    ) {
      invalid(`required must be boolean in ${section.id}`);
    }
    if (
      section.narrative !== undefined &&
      typeof section.narrative !== 'boolean'
    ) {
      invalid(`narrative must be boolean in ${section.id}`);
    }
    if (
      section.observations !== undefined &&
      !Array.isArray(section.observations)
    ) {
      invalid(`observations must be an array in ${section.id}`);
    }
    if (section.kind !== 'observations' && section.observations?.length) {
      invalid(
        `only observations sections accept individual observations (${section.id})`
      );
    }
    if (
      section.kind === 'observations' &&
      !section.narrative &&
      !section.observations?.length
    ) {
      invalid(`observations section ${section.id} has no fields`);
    }
    const observationIds = new Set<string>();
    for (const observation of section.observations ?? []) {
      if (
        !observation ||
        typeof observation !== 'object' ||
        !nonempty(observation.id) ||
        !nonempty(observation.label)
      ) {
        invalid(`observations in ${section.id} require an id and label`);
      }
      if (observationIds.has(observation.id))
        invalid(`duplicate observation id ${observation.id} in ${section.id}`);
      observationIds.add(observation.id);
      if (
        observation.type !== undefined &&
        !['text', 'number', 'choice'].includes(observation.type)
      ) {
        invalid(`unknown observation type in ${section.id}.${observation.id}`);
      }
      if (!optionalString(observation.unit))
        invalid(`invalid unit in ${section.id}.${observation.id}`);
      if (
        observation.required !== undefined &&
        typeof observation.required !== 'boolean'
      ) {
        invalid(`required must be boolean in ${section.id}.${observation.id}`);
      }
      if (
        observation.code !== undefined &&
        (!observation.code ||
          typeof observation.code !== 'object' ||
          !nonempty(observation.code.system) ||
          !nonempty(observation.code.code) ||
          !optionalString(observation.code.display))
      ) {
        invalid(`invalid code in ${section.id}.${observation.id}`);
      }
      if (
        observation.options !== undefined &&
        (!Array.isArray(observation.options) ||
          observation.options.some((option) => !nonempty(option)) ||
          new Set(observation.options).size !== observation.options.length)
      ) {
        invalid(
          `options must be distinct nonempty strings in ${section.id}.${observation.id}`
        );
      }
      if (observation.type === 'choice' && !observation.options?.length) {
        invalid(
          `choice observation ${section.id}.${observation.id} requires options`
        );
      }
    }
  }
}

function observationField(
  sectionId: string,
  observation: EncounterObservationDefinition
): FieldDefinition {
  const base = {
    id: getEncounterFieldId(sectionId, observation.id),
    question: observation.label,
    required: observation.required,
    width: 'full' as const,
    _sourceData: observation,
  };
  if (observation.type === 'choice') {
    return {
      ...base,
      fieldType: 'dropdown',
      options: observation.options?.map((value) => ({
        id: encodeURIComponent(value),
        value,
        text: value,
      })),
    };
  }
  if (observation.type === 'number') {
    return {
      ...base,
      fieldType: 'text',
      inputType: 'number',
      unit: observation.unit,
      validators: [
        { type: 'number', message: 'Enter a finite nonnegative number.' },
      ],
    };
  }
  return { ...base, fieldType: 'longtext', unit: observation.unit };
}

const CUSTOM_FIELD_TYPES = {
  vitals: 'encounterVitals',
  medications: 'medicationList',
  allergies: 'allergyList',
  assessment: 'encounterAssessment',
} as const;

/** All visit sections remain native eSheet sections with native FieldResponse values. */
export function createEncounterFormDefinition(
  definition: EncounterVisitDefinition
): FormDefinition {
  validateEncounterDefinition(definition);
  return {
    id: definition.id,
    title: definition.title,
    pages: [
      {
        id: `${definition.id}:visit`,
        title: definition.title,
        fields: definition.sections.map((section) => {
          const fields: FieldDefinition[] = [];
          if (section.description) {
            fields.push({
              id: `${getEncounterSectionFieldId(section.id)}:description`,
              fieldType: 'display',
              content: section.description,
              width: 'full',
            });
          }
          if (
            section.kind === 'narrative' ||
            (section.kind === 'observations' && section.narrative)
          ) {
            fields.push({
              id: getEncounterFieldId(section.id),
              fieldType: 'longtext',
              question:
                section.kind === 'narrative'
                  ? section.title
                  : `${section.title} narrative`,
              required:
                section.kind === 'narrative' ? section.required : undefined,
              width: 'full',
            });
          }
          if (section.kind === 'observations') {
            fields.push(
              ...(section.observations ?? []).map((observation) =>
                observationField(section.id, observation)
              )
            );
          } else if (section.kind !== 'narrative') {
            // eSheet deliberately keeps custom types outside its built-in TypeScript union.
            fields.push({
              id: getEncounterFieldId(section.id, 'value'),
              fieldType: CUSTOM_FIELD_TYPES[section.kind],
              question: section.title,
              required: section.required,
              width: 'full',
            } as unknown as FieldDefinition);
          }
          return {
            id: getEncounterSectionFieldId(section.id),
            fieldType: 'section' as const,
            title: section.title,
            sectionCollapse: 'expanded' as const,
            width: 'full' as const,
            fields,
          };
        }),
      },
    ],
  };
}

export const DEFAULT_ENCOUNTER_VISIT_DEFINITION: EncounterVisitDefinition = {
  id: 'anonymous-encounter',
  title: 'Encounter visit',
  sections: [
    { id: 'hpi', title: 'History of present illness', kind: 'narrative' },
    {
      id: 'history',
      title: 'Patient history',
      kind: 'observations',
      narrative: true,
      observations: [
        { id: 'medical', label: 'Medical history' },
        { id: 'surgical', label: 'Surgical history' },
        { id: 'family', label: 'Family history' },
        { id: 'social', label: 'Social history' },
      ],
    },
    {
      id: 'ros',
      title: 'Review of systems',
      kind: 'observations',
      narrative: true,
      observations: [
        { id: 'constitutional', label: 'Constitutional' },
        { id: 'cardiovascular', label: 'Cardiovascular' },
        { id: 'respiratory', label: 'Respiratory' },
        { id: 'musculoskeletal', label: 'Musculoskeletal' },
        { id: 'neurological', label: 'Neurological' },
      ],
    },
    {
      id: 'vitals',
      title: 'Vitals',
      description:
        'Record measured values. Add another reading for repeated measurements.',
      kind: 'vitals',
    },
    {
      id: 'exam',
      title: 'Physical examination',
      kind: 'observations',
      narrative: true,
      observations: [
        { id: 'general', label: 'General appearance' },
        { id: 'head-neck', label: 'Head and neck' },
        { id: 'cardiovascular', label: 'Cardiovascular' },
        { id: 'respiratory', label: 'Respiratory' },
        { id: 'abdomen', label: 'Abdomen' },
        { id: 'musculoskeletal', label: 'Musculoskeletal / back' },
        { id: 'neurological', label: 'Neurological' },
        { id: 'skin', label: 'Skin' },
      ],
    },
    { id: 'medications', title: 'Presenting medications', kind: 'medications' },
    { id: 'allergies', title: 'Allergies and intolerances', kind: 'allergies' },
    { id: 'assessment', title: 'Assessment and orders', kind: 'assessment' },
    { id: 'plan', title: 'Plan', kind: 'narrative' },
    {
      id: 'follow-up',
      title: 'Follow-up and appointments',
      kind: 'observations',
      narrative: true,
      observations: [
        { id: 'interval', label: 'Return interval' },
        { id: 'appointment', label: 'Appointment details' },
      ],
    },
  ],
};

/** Only the facts supplied for the anonymous example; no assumed exam or treatment. */
export const EXAMPLE_ENCOUNTER_VISIT_RESPONSES: EncounterResponses = {
  [getEncounterFieldId('hpi')]: {
    answer: '45-year-old male with pre-diabetes, back pain and hypertension.',
  },
};
