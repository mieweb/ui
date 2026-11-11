import { describe, expect, it } from 'vitest';
import {
  createEncounterFormDefinition,
  DEFAULT_ENCOUNTER_VISIT_DEFINITION,
  EXAMPLE_ENCOUNTER_VISIT_RESPONSES,
  getEncounterFieldId,
  getEncounterSectionFieldIds,
  validateEncounterDefinition,
} from './definition';
import type {
  EncounterNarrativeFinding,
  EncounterSectionDefinition,
  EncounterVisitDefinition,
} from './types';

const finding: EncounterNarrativeFinding = {
  id: 'finding',
  label: 'Selected finding',
  text: 'Explicitly selected finding.',
  code: { system: 'https://example.test/findings', code: 'explicit' },
};

function definition(
  section: EncounterSectionDefinition
): EncounterVisitDefinition {
  return { id: 'visit', title: 'Visit', sections: [section] };
}

function fieldsFor(section: EncounterSectionDefinition) {
  const field = createEncounterFormDefinition(definition(section)).pages[0]
    .fields?.[0];
  if (field?.fieldType !== 'section') throw new Error('Expected a section');
  return field.fields ?? [];
}

describe('encounter finding configuration', () => {
  it('passes section and text-observation suggestions through native source metadata', () => {
    const fields = fieldsFor({
      id: 'exam',
      title: 'Exam',
      kind: 'observations',
      narrative: true,
      findings: [finding],
      observations: [
        {
          id: 'back',
          label: 'Back',
          type: 'text',
          code: { system: 'https://example.test/observations', code: 'back' },
          findings: [{ ...finding, id: 'back-finding' }],
        },
      ],
    });
    expect(fields[0]).toMatchObject({
      id: getEncounterFieldId('exam'),
      fieldType: 'encounterNarrative',
      _sourceData: {
        encounterHideLabel: true,
        encounterFindings: [finding],
      },
    });
    expect(fields[1]).toMatchObject({
      id: getEncounterFieldId('exam', 'back'),
      fieldType: 'encounterNarrative',
      _sourceData: {
        code: { system: 'https://example.test/observations', code: 'back' },
        encounterFindings: [{ ...finding, id: 'back-finding' }],
      },
    });
  });

  it('allows finding IDs to repeat in separate independently captured fields', () => {
    expect(() =>
      validateEncounterDefinition(
        definition({
          id: 'exam',
          title: 'Exam',
          kind: 'observations',
          narrative: true,
          findings: [finding],
          observations: [
            { id: 'back', label: 'Back', findings: [finding] },
            { id: 'gait', label: 'Gait', findings: [finding] },
          ],
        })
      )
    ).not.toThrow();
  });

  it.each([
    { findings: [finding, finding], message: 'duplicate finding id' },
    {
      findings: [{ ...finding, id: '  ' }],
      message: 'findings require id, label and text',
    },
    {
      findings: [{ ...finding, label: '' }],
      message: 'findings require id, label and text',
    },
    {
      findings: [{ ...finding, text: '\n' }],
      message: 'findings require id, label and text',
    },
    { findings: 'not-an-array', message: 'findings must be an array' },
    {
      findings: [{ ...finding, code: { system: '', code: 'finding' } }],
      message: 'invalid finding code',
    },
    {
      findings: [{ ...finding, code: { system: 'test', code: '' } }],
      message: 'invalid finding code',
    },
    {
      findings: [
        { ...finding, code: { system: 'test', code: 'finding', display: 0 } },
      ],
      message: 'invalid finding code',
    },
  ])(
    'rejects invalid section suggestions: $message',
    ({ findings, message }) => {
      expect(() =>
        validateEncounterDefinition(
          definition({
            id: 'history',
            title: 'History',
            kind: 'narrative',
            findings,
          } as unknown as EncounterSectionDefinition)
        )
      ).toThrow(message);
    }
  );

  it('rejects duplicate observation finding IDs and invalid observation finding codes', () => {
    for (const findings of [
      [finding, finding],
      [{ ...finding, code: { system: 'test', code: '' } }],
    ]) {
      expect(() =>
        validateEncounterDefinition(
          definition({
            id: 'exam',
            title: 'Exam',
            kind: 'observations',
            observations: [{ id: 'back', label: 'Back', findings }],
          })
        )
      ).toThrow(/finding (id|code)/);
    }
  });

  it.each(['number', 'choice'] as const)(
    'rejects narrative findings attached to a %s observation',
    (type) => {
      expect(() =>
        validateEncounterDefinition(
          definition({
            id: 'exam',
            title: 'Exam',
            kind: 'observations',
            observations: [
              {
                id: 'measurement',
                label: 'Measurement',
                type,
                options: type === 'choice' ? ['A', 'B'] : undefined,
                findings: [finding],
              },
            ],
          })
        )
      ).toThrow('findings require a text observation');
    }
  );

  it.each([
    'observations',
    'vitals',
    'medications',
    'allergies',
    'conditions',
    'plan',
    'assessment',
  ] as const)(
    'rejects section findings without a narrative in %s sections',
    (kind) => {
      expect(() =>
        validateEncounterDefinition(
          definition({
            id: 'section',
            title: 'Section',
            kind,
            findings: [finding],
            observations:
              kind === 'observations'
                ? [{ id: 'back', label: 'Back' }]
                : undefined,
          })
        )
      ).toThrow('section findings require a narrative');
    }
  );

  it('provides short uncoded suggestion lists for every default narrative without selecting them', () => {
    const form = createEncounterFormDefinition(
      DEFAULT_ENCOUNTER_VISIT_DEFINITION
    );
    const narratives = form.pages[0].fields?.flatMap((section) =>
      section.fieldType === 'section'
        ? (section.fields ?? []).filter(
            (field) => String(field.fieldType) === 'encounterNarrative'
          )
        : []
    );
    expect(narratives?.length).toBeGreaterThan(15);
    for (const narrative of narratives ?? []) {
      const source = narrative._sourceData as
        | { encounterFindings?: EncounterNarrativeFinding[] }
        | undefined;
      const suggestions = source?.encounterFindings;
      expect(suggestions?.length).toBeGreaterThanOrEqual(1);
      expect(suggestions?.length).toBeLessThanOrEqual(3);
      expect(suggestions?.every((item) => item.code === undefined)).toBe(true);
      expect(narrative).not.toHaveProperty('answer');
      expect(narrative).not.toHaveProperty('selected');
    }
    expect(Object.keys(EXAMPLE_ENCOUNTER_VISIT_RESPONSES)).toEqual([
      getEncounterFieldId('hpi'),
    ]);
    expect(
      EXAMPLE_ENCOUNTER_VISIT_RESPONSES[getEncounterFieldId('hpi')].attributes
    ).toBeUndefined();
  });
});

describe('structured encounter section definitions', () => {
  it.each([
    ['medications', 'encounterMedications'],
    ['allergies', 'encounterAllergies'],
    ['conditions', 'encounterConditions'],
    ['plan', 'encounterPlan'],
    ['assessment', 'encounterAssessment'],
  ] as const)(
    'maps %s to its healthcare component with coding required',
    (kind, fieldType) => {
      expect(fieldsFor({ id: kind, title: kind, kind })[0]).toMatchObject({
        id: getEncounterFieldId(kind, 'value'),
        fieldType,
        _sourceData: { encounterRequireCoding: true },
      });
      expect(
        fieldsFor({ id: kind, title: kind, kind, requireCoding: false })[0]
      ).toMatchObject({
        _sourceData: { encounterRequireCoding: false },
      });
    }
  );

  it('preserves the existing plan narrative ID alongside the new structured plan field', () => {
    const section: EncounterSectionDefinition = {
      id: 'plan',
      title: 'Plan',
      kind: 'plan',
      narrative: true,
      requireCoding: true,
      findings: [finding],
    };
    expect(getEncounterSectionFieldIds(section)).toEqual([
      getEncounterFieldId('plan'),
      getEncounterFieldId('plan', 'value'),
    ]);
    expect(fieldsFor(section)).toMatchObject([
      {
        id: getEncounterFieldId('plan'),
        fieldType: 'encounterNarrative',
        _sourceData: { encounterFindings: [finding] },
      },
      {
        id: getEncounterFieldId('plan', 'value'),
        fieldType: 'encounterPlan',
        _sourceData: { encounterRequireCoding: true },
      },
    ]);
    const defaultPlan = DEFAULT_ENCOUNTER_VISIT_DEFINITION.sections.find(
      (entry) => entry.id === 'plan'
    );
    expect(defaultPlan).toMatchObject({
      kind: 'plan',
      narrative: true,
      requireCoding: true,
    });
    expect(DEFAULT_ENCOUNTER_VISIT_DEFINITION.sections).toContainEqual({
      id: 'conditions',
      title: 'Conditions',
      kind: 'conditions',
      requireCoding: true,
    });
  });

  it('rejects a nonboolean coding requirement before creating a form', () => {
    expect(() =>
      createEncounterFormDefinition(
        definition({
          id: 'plan',
          title: 'Plan',
          kind: 'plan',
          requireCoding: 'yes',
        } as unknown as EncounterSectionDefinition)
      )
    ).toThrow('requireCoding must be boolean');
  });
});
