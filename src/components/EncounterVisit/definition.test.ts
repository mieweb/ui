import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_ENCOUNTER_VISIT_RESPONSES,
  getEncounterFieldId,
  getEncounterFormSections,
  getEncounterSectionFieldIds,
  validateEncounterForm,
} from './definition';
import {
  DEFAULT_ENCOUNTER_VISIT_DEFINITION,
  encounterFormFromLegacy,
  validateEncounterDefinition,
  type EncounterSectionDefinition,
  type EncounterVisitDefinition,
} from './legacy';
import type { EncounterNarrativeFinding } from './types';

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
  const field = encounterFormFromLegacy(definition(section)).pages[0]
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
    const form = encounterFormFromLegacy(DEFAULT_ENCOUNTER_VISIT_DEFINITION);
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
      const unset = fieldsFor({ id: kind, title: kind, kind })[0];
      expect(unset).toMatchObject({
        id: getEncounterFieldId(kind, 'value'),
        fieldType,
      });
      // Unset stays unstamped so views round-trip; consumers default to true.
      expect(unset._sourceData).not.toHaveProperty('encounterRequireCoding');
      expect(
        fieldsFor({ id: kind, title: kind, kind, requireCoding: true })[0]
      ).toMatchObject({
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

  it('rejects a native form whose top-level fields are not sections', () => {
    const form = encounterFormFromLegacy(
      definition({ id: 'vitals', title: 'Vitals', kind: 'vitals' })
    );
    const section = form.pages[0].fields?.[0];
    const broken = {
      ...form,
      pages: [
        {
          ...form.pages[0],
          fields: section?.fieldType === 'section' ? section.fields : [],
        },
      ],
    } as typeof form;
    expect(() => validateEncounterForm(broken)).toThrow(
      'every top-level encounter field must be a section'
    );
  });

  it('rejects a nonboolean coding requirement before creating a form', () => {
    expect(() =>
      encounterFormFromLegacy(
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

describe('native form identity and option guards (mieweb/ui#774)', () => {
  const observationsForm = (
    mutate: (field: Record<string, unknown>) => Record<string, unknown>
  ) => {
    const form = encounterFormFromLegacy(
      definition({
        id: 'exam',
        title: 'Exam',
        kind: 'observations',
        observations: [
          {
            id: 'pulse',
            label: 'Pulse',
            type: 'choice',
            options: ['60', '80'],
          },
        ],
      })
    );
    const section = form.pages[0].fields?.[0] as { fields?: unknown[] };
    section.fields = [mutate(section.fields?.[0] as Record<string, unknown>)];
    return form;
  };

  it('rejects a stale _sourceData.id that conflicts with the native field id', () => {
    expect(() =>
      validateEncounterForm(
        observationsForm((field) => ({
          ...field,
          _sourceData: { id: 'old-pulse' },
        }))
      )
    ).toThrow('_sourceData.id conflicts with the field id in exam.pulse');
  });

  it('derives choices from the native options so host edits are honored', () => {
    const form = observationsForm((field) => ({
      ...field,
      options: [
        { id: encodeURIComponent('60'), value: '60', text: '60' },
        { id: encodeURIComponent('90'), value: '90', text: '90' },
      ],
    }));
    expect(getEncounterFormSections(form)[0].observations).toEqual([
      { id: 'pulse', label: 'Pulse', type: 'choice', options: ['60', '90'] },
    ]);
  });

  it('rejects dropdown options that break the encoded option-id convention', () => {
    expect(() =>
      validateEncounterForm(
        observationsForm((field) => ({
          ...field,
          options: [{ id: 'yes-option', value: 'Yes', text: 'Yes' }],
        }))
      )
    ).toThrow(
      'dropdown options use { id: encodeURIComponent(value), value } in exam.pulse'
    );
  });

  it('rejects structured clinical fields that do not use the canonical value id', () => {
    const form = encounterFormFromLegacy(
      definition({ id: 'vitals', title: 'Vitals', kind: 'vitals' })
    );
    const section = form.pages[0].fields?.[0] as {
      fields?: { id?: string }[];
    };
    section.fields = section.fields?.map((field) =>
      field.id === getEncounterFieldId('vitals', 'value')
        ? { ...field, id: 'pulse-readings' }
        : field
    );
    expect(() => validateEncounterForm(form)).toThrow(
      'structured clinical fields use encounter:<section>:observation:value (vitals)'
    );
  });
});
