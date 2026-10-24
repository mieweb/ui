import type { FieldDefinition, FormDefinition } from '@esheet/core';
import { isEncounterDate } from './date';
import type {
  EncounterObservationDefinition,
  EncounterNarrativeFinding,
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

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function invalid(message: string): never {
  throw new Error(`Invalid encounter definition: ${message}`);
}

function validateFindings(
  findings: EncounterNarrativeFinding[] | undefined,
  location: string
): void {
  if (findings === undefined) return;
  if (!Array.isArray(findings))
    invalid(`findings must be an array in ${location}`);
  const ids = new Set<string>();
  for (const finding of findings) {
    if (
      !finding ||
      typeof finding !== 'object' ||
      !nonempty(finding.id) ||
      !nonempty(finding.label) ||
      !nonempty(finding.text)
    )
      invalid(`findings require id, label and text in ${location}`);
    if (ids.has(finding.id))
      invalid(`duplicate finding id ${finding.id} in ${location}`);
    ids.add(finding.id);
    if (
      finding.code !== undefined &&
      (!finding.code ||
        typeof finding.code !== 'object' ||
        !nonempty(finding.code.system) ||
        !nonempty(finding.code.code) ||
        !optionalString(finding.code.display))
    )
      invalid(`invalid finding code in ${location}`);
  }
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
  if (
    definition.encounterDate !== undefined &&
    !isEncounterDate(definition.encounterDate)
  )
    invalid('encounterDate must be a valid YYYY-MM-DD date');
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
    if (
      section.requireCoding !== undefined &&
      typeof section.requireCoding !== 'boolean'
    )
      invalid(`requireCoding must be boolean in ${section.id}`);
    validateFindings(section.findings, section.id);
    if (
      section.findings?.length &&
      section.kind !== 'narrative' &&
      !section.narrative
    )
      invalid(`section findings require a narrative in ${section.id}`);
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
      validateFindings(observation.findings, `${section.id}.${observation.id}`);
      if (
        observation.findings?.length &&
        observation.type &&
        observation.type !== 'text'
      )
        invalid(
          `findings require a text observation in ${section.id}.${observation.id}`
        );
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
    _sourceData: { ...observation, encounterFindings: observation.findings },
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
  return {
    ...base,
    fieldType: 'encounterNarrative',
    unit: observation.unit,
  } as unknown as FieldDefinition;
}

const CUSTOM_FIELD_TYPES = {
  vitals: 'encounterVitals',
  medications: 'encounterMedications',
  allergies: 'encounterAllergies',
  conditions: 'encounterConditions',
  plan: 'encounterPlan',
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
          if (section.kind === 'narrative' || section.narrative) {
            fields.push({
              id: getEncounterFieldId(section.id),
              fieldType: 'encounterNarrative',
              question:
                section.kind === 'narrative'
                  ? section.title
                  : `${section.title} narrative`,
              required:
                section.kind === 'narrative' ? section.required : undefined,
              width: 'full',
              _sourceData: {
                encounterHideLabel: true,
                encounterFindings: section.findings,
              },
            } as unknown as FieldDefinition);
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
              _sourceData: {
                encounterRequireCoding: section.requireCoding ?? true,
                encounterDate: definition.encounterDate,
              },
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

/** Optional uncoded phrases; answers exist only after an explicit selection. */
export const DEFAULT_ENCOUNTER_VISIT_DEFINITION: EncounterVisitDefinition = {
  id: 'anonymous-encounter',
  title: 'Encounter visit',
  sections: [
    {
      id: 'hpi',
      title: 'History of present illness',
      kind: 'narrative',
      findings: [
        { id: 'no-fever', label: 'No fever', text: 'Denies fever.' },
        { id: 'no-trauma', label: 'No trauma', text: 'Denies recent trauma.' },
        {
          id: 'no-radiation',
          label: 'No radiation',
          text: 'Pain does not radiate.',
        },
      ],
    },
    {
      id: 'history',
      title: 'Patient history',
      kind: 'observations',
      narrative: true,
      findings: [
        {
          id: 'patient-source',
          label: 'Patient provided history',
          text: 'History provided by the patient.',
        },
        {
          id: 'records-reviewed',
          label: 'Records reviewed',
          text: 'History supplemented by available records.',
        },
      ],
      observations: [
        {
          id: 'medical',
          label: 'Medical history',
          findings: [
            {
              id: 'reviewed',
              label: 'History reviewed',
              text: 'Medical history reviewed.',
            },
            {
              id: 'no-additional-history',
              label: 'No additional history',
              text: 'No additional medical history reported.',
            },
          ],
        },
        {
          id: 'surgical',
          label: 'Surgical history',
          findings: [
            {
              id: 'no-surgeries',
              label: 'No prior surgery',
              text: 'No previous surgery reported.',
            },
            {
              id: 'reviewed',
              label: 'History reviewed',
              text: 'Surgical history reviewed.',
            },
          ],
        },
        {
          id: 'family',
          label: 'Family history',
          findings: [
            {
              id: 'unknown',
              label: 'History unknown',
              text: 'Family history unknown.',
            },
            {
              id: 'noncontributory',
              label: 'No pertinent history',
              text: 'No pertinent family history reported.',
            },
          ],
        },
        {
          id: 'social',
          label: 'Social history',
          findings: [
            {
              id: 'never-smoked',
              label: 'Never smoked',
              text: 'Never smoked.',
            },
            {
              id: 'no-alcohol',
              label: 'No alcohol use',
              text: 'Denies alcohol use.',
            },
            {
              id: 'no-recreational-drugs',
              label: 'No recreational drug use',
              text: 'Denies recreational drug use.',
            },
          ],
        },
      ],
    },
    {
      id: 'ros',
      title: 'Review of systems',
      kind: 'observations',
      narrative: true,
      findings: [
        {
          id: 'pertinent-hpi',
          label: 'Additional symptoms in HPI',
          text: 'Additional symptoms are documented in the history of present illness.',
        },
        {
          id: 'limited-review',
          label: 'Limited review',
          text: 'Review of systems limited by patient condition.',
        },
      ],
      observations: [
        {
          id: 'constitutional',
          label: 'Constitutional',
          findings: [
            {
              id: 'no-fever-chills',
              label: 'No fever or chills',
              text: 'Denies fever or chills.',
            },
          ],
        },
        {
          id: 'cardiovascular',
          label: 'Cardiovascular',
          findings: [
            {
              id: 'no-chest-pain',
              label: 'No chest pain',
              text: 'Denies chest pain.',
            },
          ],
        },
        {
          id: 'respiratory',
          label: 'Respiratory',
          findings: [
            {
              id: 'no-dyspnea',
              label: 'No dyspnea',
              text: 'Denies shortness of breath.',
            },
            { id: 'no-cough', label: 'No cough', text: 'Denies cough.' },
          ],
        },
        {
          id: 'musculoskeletal',
          label: 'Musculoskeletal',
          findings: [
            { id: 'back-pain', label: 'Back pain', text: 'Reports back pain.' },
            {
              id: 'no-joint-swelling',
              label: 'No joint swelling',
              text: 'Denies joint swelling.',
            },
          ],
        },
        {
          id: 'neurological',
          label: 'Neurological',
          findings: [
            {
              id: 'no-weakness',
              label: 'No weakness',
              text: 'Denies weakness.',
            },
            {
              id: 'no-numbness-tingling',
              label: 'No numbness / tingling',
              text: 'Denies numbness or tingling.',
            },
            {
              id: 'no-bowel-bladder-changes',
              label: 'No bowel / bladder changes',
              text: 'Denies bowel or bladder changes.',
            },
          ],
        },
      ],
    },
    {
      id: 'vitals',
      title: 'Vitals',
      kind: 'vitals',
    },
    {
      id: 'exam',
      title: 'Physical examination',
      kind: 'observations',
      narrative: true,
      findings: [
        {
          id: 'focused',
          label: 'Focused examination',
          text: 'Focused examination performed.',
        },
        {
          id: 'limited-by-pain',
          label: 'Limited by pain',
          text: 'Examination limited by pain.',
        },
      ],
      observations: [
        {
          id: 'general',
          label: 'General appearance',
          findings: [
            {
              id: 'no-distress',
              label: 'No acute distress',
              text: 'No acute distress.',
            },
            { id: 'alert', label: 'Alert', text: 'Alert and conversant.' },
          ],
        },
        {
          id: 'head-neck',
          label: 'Head and neck',
          findings: [
            {
              id: 'no-cervical-nodes',
              label: 'No cervical lymphadenopathy',
              text: 'No palpable cervical lymphadenopathy.',
            },
            {
              id: 'no-oral-lesions',
              label: 'No oral lesions',
              text: 'No visible oral lesions.',
            },
          ],
        },
        {
          id: 'cardiovascular',
          label: 'Cardiovascular',
          findings: [
            {
              id: 'regular',
              label: 'Regular rhythm',
              text: 'Regular rate and rhythm.',
            },
          ],
        },
        {
          id: 'respiratory',
          label: 'Respiratory',
          findings: [
            {
              id: 'clear',
              label: 'Clear lungs',
              text: 'Lungs clear to auscultation bilaterally.',
            },
            {
              id: 'nonlabored',
              label: 'Nonlabored',
              text: 'Breathing is nonlabored.',
            },
          ],
        },
        {
          id: 'abdomen',
          label: 'Abdomen',
          findings: [
            {
              id: 'soft',
              label: 'Soft / nontender',
              text: 'Abdomen soft and nontender.',
            },
          ],
        },
        {
          id: 'musculoskeletal',
          label: 'Musculoskeletal / back',
          findings: [
            {
              id: 'no-midline-tenderness',
              label: 'No midline tenderness',
              text: 'No midline spinal tenderness.',
            },
            {
              id: 'paraspinal-tenderness',
              label: 'Paraspinal tenderness',
              text: 'Paraspinal tenderness is present.',
            },
            {
              id: 'range-of-motion',
              label: 'Preserved range of motion',
              text: 'Spinal range of motion is preserved.',
            },
          ],
        },
        {
          id: 'neurological',
          label: 'Neurological',
          findings: [
            {
              id: 'symmetric-strength',
              label: 'Symmetric leg strength',
              text: 'Strength symmetric in both lower extremities.',
            },
            {
              id: 'light-touch',
              label: 'Intact light touch',
              text: 'Sensation intact to light touch in both lower extremities.',
            },
            {
              id: 'steady-gait',
              label: 'Steady gait',
              text: 'Gait is steady.',
            },
          ],
        },
        {
          id: 'skin',
          label: 'Skin',
          findings: [
            { id: 'warm-dry', label: 'Warm / dry', text: 'Skin warm and dry.' },
          ],
        },
      ],
    },
    {
      id: 'conditions',
      title: 'Conditions',
      kind: 'conditions',
      requireCoding: true,
    },
    {
      id: 'medications',
      title: 'Presenting medications',
      kind: 'medications',
      requireCoding: true,
    },
    {
      id: 'allergies',
      title: 'Allergies and intolerances',
      kind: 'allergies',
      requireCoding: true,
    },
    {
      id: 'assessment',
      title: 'Assessment and orders',
      kind: 'assessment',
      requireCoding: true,
    },
    {
      id: 'plan',
      title: 'Plan',
      kind: 'plan',
      narrative: true,
      requireCoding: true,
      findings: [
        {
          id: 'questions',
          label: 'Questions answered',
          text: 'Questions were answered.',
        },
        {
          id: 'understanding',
          label: 'Understanding confirmed',
          text: 'Patient verbalized understanding of the plan.',
        },
      ],
    },
    {
      id: 'follow-up',
      title: 'Follow-up and appointments',
      kind: 'observations',
      narrative: true,
      findings: [
        {
          id: 'arrangements-reviewed',
          label: 'Arrangements reviewed',
          text: 'Follow-up arrangements reviewed with the patient.',
        },
        {
          id: 'patient-to-schedule',
          label: 'Patient will schedule',
          text: 'Patient will contact the office to schedule follow-up.',
        },
      ],
      observations: [
        {
          id: 'interval',
          label: 'Return interval',
          findings: [
            { id: 'one-week', label: '1 week', text: '1 week' },
            { id: 'one-month', label: '1 month', text: '1 month' },
            { id: 'three-months', label: '3 months', text: '3 months' },
          ],
        },
        {
          id: 'appointment',
          label: 'Appointment details',
          findings: [
            {
              id: 'scheduled',
              label: 'Appointment scheduled',
              text: 'Appointment scheduled.',
            },
            {
              id: 'patient-to-schedule',
              label: 'Patient to schedule',
              text: 'Patient to schedule appointment.',
            },
            {
              id: 'scheduling-pending',
              label: 'Scheduling pending',
              text: 'Appointment scheduling pending.',
            },
          ],
        },
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
