import { describe, expect, it } from 'vitest';
import {
  createEncounterFormDefinition,
  DEFAULT_ENCOUNTER_VISIT_DEFINITION,
  EXAMPLE_ENCOUNTER_VISIT_RESPONSES,
  getEncounterFieldId,
  getEncounterSectionFieldIds,
  getEncounterSectionFieldId,
} from './definition';
import {
  createEncounterSnapshot,
  parseEncounterAssessment,
  parseEncounterVitals,
  validateEncounterAssessment,
  validateEncounterResponses,
  validateEncounterVitals,
} from './model';
import type {
  EncounterAssessmentValue,
  EncounterResponses,
  EncounterVisitDefinition,
} from './types';

const definition: EncounterVisitDefinition = {
  id: 'visit',
  title: 'Anonymous visit',
  sections: [
    { id: 'hpi', title: 'HPI', kind: 'narrative', required: true },
    {
      id: 'exam',
      title: 'Exam',
      kind: 'observations',
      narrative: true,
      observations: [
        { id: 'back', label: 'Back' },
        {
          id: 'pain',
          label: 'Pain score',
          type: 'number',
          unit: '/10',
          required: true,
        },
        {
          id: 'gait',
          label: 'Gait',
          type: 'choice',
          options: ['Normal', 'Antalgic'],
        },
      ],
    },
    { id: 'vitals', title: 'Vitals', kind: 'vitals' },
    { id: 'medications', title: 'Medications', kind: 'medications' },
    { id: 'allergies', title: 'Allergies', kind: 'allergies' },
    { id: 'assessment', title: 'Assessment', kind: 'assessment' },
  ],
};

const assessment: EncounterAssessmentValue = {
  concerns: [
    {
      concernId: 'back',
      clinicalStatus: 'active',
      assertions: [
        {
          id: 'back-today',
          date: '2026-10-10',
          text: 'Back pain',
          verificationStatus: 'unconfirmed',
          coding: [{ system: 'ICD-10-CM', code: 'M54.9' }],
        },
      ],
    },
  ],
  items: [
    { concernId: 'back', assertionId: 'back-today', note: 'Addressed today' },
  ],
  orders: [],
};

function custom(sectionId: string, value: unknown): EncounterResponses {
  return {
    [getEncounterFieldId(sectionId, 'value')]: {
      answer: JSON.stringify(value),
    },
  };
}

describe('encounter definition', () => {
  it('keeps configurable fields inside native eSheet sections', () => {
    const form = createEncounterFormDefinition(definition);
    const sections = form.pages[0].fields;
    expect(sections).toHaveLength(definition.sections.length);
    expect(sections?.every((section) => section.fieldType === 'section')).toBe(
      true
    );
    const hpi = sections?.[0];
    expect(hpi).toMatchObject({
      id: getEncounterSectionFieldId('hpi'),
      fieldType: 'section',
      fields: [
        {
          id: getEncounterFieldId('hpi'),
          fieldType: 'longtext',
          width: 'full',
          required: true,
        },
      ],
    });
    const exam = sections?.[1];
    expect(
      exam?.fieldType === 'section' && exam.fields?.map((field) => field.id)
    ).toEqual(getEncounterSectionFieldIds(definition.sections[1]));
    expect(sections?.[2]).toMatchObject({
      fieldType: 'section',
      fields: [{ fieldType: 'encounterVitals' }],
    });
  });

  it('avoids collisions between identifiers, narrative, custom values and sections', () => {
    const ids = [
      getEncounterFieldId('a:b', 'c'),
      getEncounterFieldId('a', 'b:c'),
      getEncounterFieldId('a%3Ab', 'c'),
      getEncounterFieldId('a'),
      getEncounterFieldId('a', 'narrative'),
      getEncounterFieldId('a', 'value'),
      getEncounterSectionFieldId('a'),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    expect(getEncounterFieldId('a:b', 'c')).toBe(
      'encounter:a%3Ab:observation:c'
    );
  });

  it('rejects duplicate and invalid configuration instead of losing answers', () => {
    expect(() =>
      createEncounterFormDefinition({
        ...definition,
        sections: [definition.sections[0], definition.sections[0]],
      })
    ).toThrow('duplicate section');
    expect(() =>
      createEncounterFormDefinition({
        id: 'visit',
        title: 'Visit',
        sections: [
          {
            id: 'exam',
            title: 'Exam',
            kind: 'observations',
            observations: [
              { id: 'back', label: 'Back' },
              { id: 'back', label: 'Again' },
            ],
          },
        ],
      })
    ).toThrow('duplicate observation');
    expect(() =>
      createEncounterFormDefinition({
        id: 'visit',
        title: 'Visit',
        sections: [
          {
            id: 'exam',
            title: 'Exam',
            kind: 'observations',
            observations: [{ id: 'gait', label: 'Gait', type: 'choice' }],
          },
        ],
      })
    ).toThrow('requires options');
    expect(() =>
      createEncounterFormDefinition({
        id: 'visit',
        title: 'Visit',
        sections: [{ id: 'exam', title: 'Exam', kind: 'observations' }],
      })
    ).toThrow('no fields');
    expect(() =>
      createEncounterFormDefinition({ ...definition, sections: [] })
    ).toThrow('at least one section');
  });
});

describe('encounter observations and note', () => {
  it('exports a narrative once and each recorded body-system finding separately', () => {
    const responses: EncounterResponses = {
      [getEncounterFieldId('hpi')]: { answer: 'Back pain since yesterday.' },
      [getEncounterFieldId('exam')]: {
        answer: 'Focused examination documented.',
      },
      [getEncounterFieldId('exam', 'back')]: { answer: 'Lumbar tenderness.' },
      [getEncounterFieldId('exam', 'pain')]: { answer: '0' },
      [getEncounterFieldId('exam', 'gait')]: {
        selected: { id: 'Antalgic', value: 'Antalgic' },
      },
      legacy: { answer: 'Kept from an earlier definition' },
    };
    const snapshot = createEncounterSnapshot(definition, responses);
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.observations).toHaveLength(5);
    expect(
      snapshot.observations.find(
        (observation) => observation.label === 'Pain score'
      )
    ).toMatchObject({ value: 0, unit: '/10' });
    expect(
      snapshot.observations.filter(
        (observation) => observation.sectionId === 'hpi'
      )
    ).toHaveLength(1);
    expect(snapshot.note).toContain('Back: Lumbar tenderness.');
    expect(snapshot.note).toContain('Gait: Antalgic');
    expect(snapshot.responses.legacy.answer).toBe(
      'Kept from an earlier definition'
    );
    expect(snapshot.note).not.toContain('Legacy');
  });

  it('preserves multiple coordinated blood-pressure readings and measurement context', () => {
    const responses = custom('vitals', {
      readings: [
        {
          id: 'arrival',
          systolic: 145,
          diastolic: 92,
          pulse: 80,
          recordedAt: '2026-10-10T09:00:00Z',
          position: 'seated',
          site: 'left arm',
        },
        { id: 'repeat', systolic: 138, diastolic: 88, pulse: 76 },
      ],
    });
    const snapshot = createEncounterSnapshot(definition, responses);
    const pressures = snapshot.observations.filter(
      (observation) => observation.label === 'Blood pressure'
    );
    expect(pressures).toHaveLength(2);
    expect(pressures[0]).toMatchObject({
      value: '145/92',
      unit: 'mmHg',
      groupId: 'arrival',
      recordedAt: '2026-10-10T09:00:00Z',
      position: 'seated',
      site: 'left arm',
      components: [
        { label: 'Systolic', value: 145 },
        { label: 'Diastolic', value: 92 },
      ],
    });
    expect(
      snapshot.observations.find((observation) => observation.label === 'Pulse')
    ).toMatchObject({ groupId: 'arrival', value: 80 });
    expect(snapshot.note).toContain('Reading repeat');
    expect(
      snapshot.observations.some(
        (observation) => observation.label === 'Temperature'
      )
    ).toBe(false);
  });

  it('retains a partial blood pressure and reports why it is incomplete', () => {
    const snapshot = createEncounterSnapshot(
      definition,
      custom('vitals', { readings: [{ id: 'partial', systolic: 145 }] })
    );
    expect(snapshot.errors).toContainEqual(
      expect.objectContaining({
        code: 'incomplete-blood-pressure',
        readingId: 'partial',
        fieldId: getEncounterFieldId('vitals', 'value'),
      })
    );
    expect(
      snapshot.observations.find(
        (observation) => observation.label === 'Blood pressure'
      )
    ).toMatchObject({
      value: '145/?',
      components: [{ label: 'Systolic', value: 145 }],
    });
    expect(snapshot.note).toContain('145/? mmHg');
  });

  it('persists unfinished numeric input and never exports its previous saved value', () => {
    const value = {
      readings: [{ id: 'r', pulse: 80, systolic: 145, diastolic: 92 }],
      inputDrafts: [
        { readingId: 'r', key: 'pulse', text: '-' },
        { readingId: 'r', key: 'systolic', text: '1e' },
      ],
    };
    const responses = custom('vitals', value);
    const snapshot = createEncounterSnapshot(definition, responses);
    expect(snapshot.errors).toContainEqual(
      expect.objectContaining({
        code: 'invalid-number',
        readingId: 'r',
        path: 'readings.0.pulse',
      })
    );
    expect(snapshot.errors).toContainEqual(
      expect.objectContaining({
        code: 'invalid-number',
        readingId: 'r',
        path: 'readings.0.systolic',
      })
    );
    expect(
      snapshot.observations.some((observation) => observation.label === 'Pulse')
    ).toBe(false);
    expect(
      snapshot.observations.find(
        (observation) => observation.label === 'Blood pressure'
      )
    ).toMatchObject({
      value: '?/92',
      components: [{ label: 'Diastolic', value: 92 }],
    });
    expect(snapshot.responses).toEqual(responses);
    expect(snapshot.note).not.toContain('Pulse: 80');
    expect(parseEncounterVitals(JSON.stringify(value))).toEqual({
      readings: [{ id: 'r', diastolic: 92 }],
      inputDrafts: value.inputDrafts,
    });
    const corrected = createEncounterSnapshot(
      definition,
      custom('vitals', { readings: [{ id: 'r', pulse: 81 }] })
    );
    expect(corrected.errors.some((issue) => issue.sectionId === 'vitals')).toBe(
      false
    );
    expect(
      corrected.observations.find(
        (observation) => observation.label === 'Pulse'
      )?.value
    ).toBe(81);
  });

  it('distinguishes unrecorded allergies from explicit no known allergies', () => {
    const blank = createEncounterSnapshot(definition, {});
    expect(
      blank.observations.some(
        (observation) => observation.sectionId === 'allergies'
      )
    ).toBe(false);
    const explicit = createEncounterSnapshot(
      definition,
      custom('allergies', { allergies: [], noKnownAllergies: true })
    );
    expect(explicit.note).toContain('No known allergies (explicitly recorded)');
    const contradictory = validateEncounterResponses(
      definition,
      custom('allergies', {
        allergies: [{ id: 'a', allergen: 'Penicillin' }],
        noKnownAllergies: true,
      })
    );
    expect(contradictory).toContainEqual(
      expect.objectContaining({ sectionId: 'allergies', code: 'invalid-value' })
    );
  });

  it('exports existing medication, allergy and assessment records with their codes', () => {
    const snapshot = createEncounterSnapshot(definition, {
      ...custom('medications', {
        medications: [
          {
            id: 'med',
            name: 'Reported medication',
            status: 'unreconciled',
            code: { system: 'RxNORM', code: 'example' },
          },
        ],
      }),
      ...custom('allergies', {
        allergies: [
          { id: 'allergy', allergen: 'Penicillin', reaction: 'Rash' },
        ],
      }),
      ...custom('assessment', assessment),
    });
    expect(
      snapshot.observations.find(
        (observation) => observation.label === 'Medication'
      )
    ).toMatchObject({
      groupId: 'med',
      code: { system: 'RxNORM', code: 'example' },
    });
    expect(snapshot.note).toContain('Penicillin; Rash');
    expect(
      snapshot.observations.find(
        (observation) => observation.label === 'Assessment'
      )
    ).toMatchObject({
      groupId: 'back',
      code: { system: 'ICD-10-CM', code: 'M54.9' },
    });
    expect(snapshot.note).toContain('Verification: unconfirmed');
    expect(snapshot.note).not.toContain('medication order');
  });

  it('seeds only supplied anonymous facts and makes no clinical assumptions', () => {
    const snapshot = createEncounterSnapshot(
      DEFAULT_ENCOUNTER_VISIT_DEFINITION,
      EXAMPLE_ENCOUNTER_VISIT_RESPONSES
    );
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.observations).toHaveLength(1);
    expect(snapshot.note).toContain(
      '45-year-old male with pre-diabetes, back pain and hypertension.'
    );
    expect(snapshot.note).not.toMatch(/normal|lisinopril|No known allergies/);
    expect(
      createEncounterFormDefinition(DEFAULT_ENCOUNTER_VISIT_DEFINITION).pages[0]
        .fields
    ).toHaveLength(10);
  });
});

describe('encounter validation', () => {
  it('requires meaningful content, accepts measured zero and allows narrative-only observation sections', () => {
    const required: EncounterVisitDefinition = {
      id: 'v',
      title: 'V',
      sections: [
        {
          id: 'exam',
          title: 'Exam',
          kind: 'observations',
          narrative: true,
          required: true,
          observations: [{ id: 'finding', label: 'Finding' }],
        },
        { id: 'vitals', title: 'Vitals', kind: 'vitals', required: true },
      ],
    };
    expect(
      validateEncounterResponses(required, {
        [getEncounterFieldId('exam')]: { answer: '   ' },
        ...custom('vitals', { readings: [] }),
      }).filter((issue) => issue.code === 'required')
    ).toHaveLength(2);
    expect(
      validateEncounterResponses(required, {
        [getEncounterFieldId('exam')]: { answer: 'Narrative finding.' },
        ...custom('vitals', { readings: [{ id: 'r', pain: 0 }] }),
      })
    ).toEqual([]);
  });

  it.each(['NaN', 'Infinity', '-1', 'not a number'])(
    'rejects numeric answer %s',
    (answer) => {
      expect(
        validateEncounterResponses(definition, {
          [getEncounterFieldId('exam', 'pain')]: { answer },
        })
      ).toContainEqual(
        expect.objectContaining({
          fieldId: getEncounterFieldId('exam', 'pain'),
          code: 'invalid-number',
        })
      );
    }
  );

  it('rejects unconfigured choices and wrong native response representations', () => {
    const issues = validateEncounterResponses(definition, {
      [getEncounterFieldId('exam', 'gait')]: {
        selected: { id: 'Other', value: 'Other' },
      },
      [getEncounterFieldId('hpi')]: {
        selected: { id: 'n', value: 'Narrative' },
      },
      [getEncounterFieldId('exam', 'pain')]: { answer: 4 } as never,
    });
    expect(issues).toContainEqual(
      expect.objectContaining({ code: 'invalid-choice' })
    );
    expect(
      issues.filter((issue) => issue.code === 'invalid-response')
    ).toHaveLength(2);
  });

  it('rejects mismatched choice ids and excludes choices the eSheet would not render', () => {
    const fieldId = getEncounterFieldId('exam', 'gait');
    for (const selected of [
      { id: 'wrong-id', value: 'Normal' },
      { id: 'Other', value: 'Other' },
    ]) {
      const snapshot = createEncounterSnapshot(definition, {
        [fieldId]: { selected },
      });
      expect(snapshot.errors).toContainEqual(
        expect.objectContaining({ fieldId, code: 'invalid-choice' })
      );
      expect(
        snapshot.observations.some(
          (observation) => observation.fieldId === fieldId
        )
      ).toBe(false);
    }
  });

  it.each([
    '{broken',
    'null',
    '[]',
    '{"readings":null}',
    '{"readings":[null]}',
  ])('preserves malformed vitals answer %s and reports it', (answer) => {
    const fieldId = getEncounterFieldId('vitals', 'value');
    const snapshot = createEncounterSnapshot(definition, {
      [fieldId]: { answer },
    });
    expect(snapshot.errors.some((issue) => issue.fieldId === fieldId)).toBe(
      true
    );
    expect(snapshot.responses[fieldId].answer).toBe(answer);
    expect(snapshot.observations).toEqual([]);
    expect(parseEncounterVitals(answer)).toEqual({ readings: [] });
  });

  it('rejects malformed, duplicate, nonfinite, mistyped and out-of-scale vital data', () => {
    expect(
      validateEncounterVitals({
        readings: [
          { id: 'r', pulse: Infinity },
          {
            id: 'r',
            pulse: '80',
            oxygenSaturation: 101,
            pain: 11,
            systollic: 140,
          },
          { id: 'blank' },
        ],
      }).map((issue) => issue.code)
    ).toEqual(expect.arrayContaining(['invalid-number', 'invalid-value']));
    expect(
      validateEncounterVitals({ readings: [{ id: 'r', pulse: 0 }] })
    ).toEqual([]);
  });

  it('validates persisted draft shape, reading references and unique measurement keys', () => {
    const issues = validateEncounterVitals({
      readings: [{ id: 'r', pulse: 80 }],
      inputDrafts: [
        null,
        { readingId: 'r', key: 'unknown', text: '-' },
        { readingId: 'missing', key: 'pulse', text: '-' },
        { readingId: 'r', key: 'pulse', text: '-' },
        { readingId: 'r', key: 'pulse', text: '1e' },
      ],
    });
    expect(
      issues.filter((issue) => issue.code === 'invalid-number')
    ).toHaveLength(5);
    expect(
      issues.filter((issue) => issue.code === 'invalid-value')
    ).toHaveLength(4);
    expect(
      validateEncounterVitals({
        readings: [{ id: 'r', pulse: 80 }],
        inputDrafts: {},
      })
    ).toContainEqual(
      expect.objectContaining({ code: 'invalid-value', path: 'inputDrafts' })
    );
  });

  it('validates ISO recording timestamps strictly without changing timezone or local input', () => {
    for (const recordedAt of [
      '2026-02-30T09:00',
      '2026-13-01T09:00',
      '2026-10-10',
      'October 10, 2026 9am',
    ]) {
      expect(
        validateEncounterVitals({
          readings: [{ id: 'r', pulse: 80, recordedAt }],
        })
      ).toContainEqual(
        expect.objectContaining({
          code: 'invalid-value',
          path: 'readings.0.recordedAt',
        })
      );
    }
    for (const recordedAt of [
      '2026-10-10T09:00',
      '2026-10-10T09:00:00-04:00',
      '2026-10-10T13:00:00Z',
    ]) {
      const value = { readings: [{ id: 'r', pulse: 80, recordedAt }] };
      expect(validateEncounterVitals(value)).toEqual([]);
      expect(
        parseEncounterVitals(JSON.stringify(value)).readings[0].recordedAt
      ).toBe(recordedAt);
    }
  });

  it('rejects malformed list records and assessment links without crashing their decoders', () => {
    expect(
      validateEncounterResponses(
        definition,
        custom('medications', { medications: [null] })
      )
    ).toContainEqual(
      expect.objectContaining({
        code: 'invalid-value',
        sectionId: 'medications',
      })
    );
    expect(
      validateEncounterResponses(
        definition,
        custom('allergies', {
          allergies: [{ id: 'a', allergen: 'Food', severity: 'extreme' }],
        })
      )
    ).toContainEqual(
      expect.objectContaining({ code: 'invalid-value', sectionId: 'allergies' })
    );
    const broken = {
      ...assessment,
      items: [{ concernId: 'back', assertionId: 'missing' }],
    };
    expect(validateEncounterAssessment(broken)).toContainEqual(
      expect.objectContaining({ code: 'invalid-value', path: 'items.0' })
    );
    expect(parseEncounterAssessment(JSON.stringify(broken))).toEqual({
      concerns: [],
      items: [],
      orders: [],
    });
    expect(parseEncounterAssessment(JSON.stringify(assessment))).toEqual(
      assessment
    );
  });
});
