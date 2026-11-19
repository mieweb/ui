import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '@esheet/core';
import { DEFAULT_ENCOUNTER_FORM } from './defaultForm';
import {
  EXAMPLE_ENCOUNTER_VISIT_RESPONSES,
  getEncounterFieldId,
  getEncounterFormSections,
  getEncounterSectionFieldId,
  getEncounterSectionFieldIds,
  validateEncounterForm,
} from './definition';
import type { EncounterNarrativeFinding } from './types';

const vitalsOnlyForm = {
  id: 'visit',
  title: 'Visit',
  pages: [
    {
      id: 'visit:visit',
      title: 'Visit',
      fields: [
        {
          id: 'encounter:vitals:section',
          fieldType: 'section',
          title: 'Vitals',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'vitals',
          },
          fields: [
            {
              id: 'encounter:vitals:observation:value',
              fieldType: 'encounterVitals',
              question: 'Vitals',
              _sourceData: {},
              width: 'full',
            },
          ],
        },
      ],
    },
  ],
} as unknown as FormDefinition;

const choicePulseForm = {
  id: 'visit',
  title: 'Visit',
  pages: [
    {
      id: 'visit:visit',
      title: 'Visit',
      fields: [
        {
          id: 'encounter:exam:section',
          fieldType: 'section',
          title: 'Exam',
          sectionCollapse: 'expanded',
          width: 'full',
          _sourceData: {
            encounterKind: 'observations',
          },
          fields: [
            {
              id: 'encounter:exam:observation:pulse',
              question: 'Pulse',
              width: 'full',
              fieldType: 'dropdown',
              options: [
                {
                  id: '60',
                  value: '60',
                  text: '60',
                },
                {
                  id: '80',
                  value: '80',
                  text: '80',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
} as unknown as FormDefinition;

describe('encounter finding configuration', () => {
  it('provides short uncoded suggestion lists for every default narrative without selecting them', () => {
    const narratives = DEFAULT_ENCOUNTER_FORM.pages[0].fields?.flatMap(
      (section) =>
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
  it('preserves the existing plan narrative ID alongside the structured plan field', () => {
    expect(
      getEncounterSectionFieldIds({
        id: 'plan',
        title: 'Plan',
        kind: 'plan',
        narrative: true,
      })
    ).toEqual([
      getEncounterFieldId('plan'),
      getEncounterFieldId('plan', 'value'),
    ]);
    const plan = DEFAULT_ENCOUNTER_FORM.pages[0].fields?.find(
      (field) => field.id === getEncounterSectionFieldId('plan')
    );
    expect(
      plan?.fieldType === 'section' && plan.fields?.map((field) => field.id)
    ).toEqual([
      getEncounterFieldId('plan'),
      getEncounterFieldId('plan', 'value'),
    ]);
    const sections = getEncounterFormSections(DEFAULT_ENCOUNTER_FORM);
    expect(sections.find((section) => section.id === 'plan')).toMatchObject({
      kind: 'plan',
      narrative: true,
      requireCoding: true,
    });
    expect(
      sections.find((section) => section.id === 'conditions')
    ).toMatchObject({ kind: 'conditions', requireCoding: true });
  });

  it('rejects a native form whose top-level fields are not sections', () => {
    const section = vitalsOnlyForm.pages[0].fields?.[0];
    const broken = {
      ...vitalsOnlyForm,
      pages: [
        {
          ...vitalsOnlyForm.pages[0],
          fields: section?.fieldType === 'section' ? section.fields : [],
        },
      ],
    } as typeof vitalsOnlyForm;
    expect(() => validateEncounterForm(broken)).toThrow(
      'every top-level encounter field must be a section'
    );
  });
});

describe('native form identity and option guards (mieweb/ui#774)', () => {
  const observationsForm = (
    mutate: (field: Record<string, unknown>) => Record<string, unknown>
  ) => {
    const form = globalThis.structuredClone(choicePulseForm);
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

  it.each([
    ['another section', 'encounter:history:observation:pulse'],
    ['a noncanonical encoding', 'encounter:exam:observation:%70ulse'],
  ])('rejects an observation field id borrowed from %s', (_case, fieldId) => {
    expect(() =>
      validateEncounterForm(
        observationsForm((field) => ({ ...field, id: fieldId }))
      )
    ).toThrow('observation field ids use the canonical encoded id');
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

  it('rejects observation field types whose responses cannot be read', () => {
    expect(() =>
      validateEncounterForm(
        observationsForm((field) => ({ ...field, fieldType: 'radio' }))
      )
    ).toThrow(
      'observation fields use encounterNarrative, text or dropdown in exam.pulse'
    );
  });

  it('rejects a selection control in the narrative slot', () => {
    const form = globalThis.structuredClone(choicePulseForm);
    const section = form.pages[0].fields?.[0] as { fields?: unknown[] };
    section.fields = [
      {
        id: getEncounterFieldId('exam'),
        fieldType: 'dropdown',
        question: 'Exam narrative',
        options: [{ id: '60', value: '60', text: '60' }],
        width: 'full',
      },
    ];
    expect(() => validateEncounterForm(form)).toThrow(
      'the narrative field in exam must be an encounterNarrative'
    );
  });

  it('rejects duplicate field ids the saved document could not reopen with', () => {
    const form = globalThis.structuredClone(vitalsOnlyForm);
    const section = form.pages[0].fields?.[0] as { fields?: unknown[] };
    const description = {
      id: 'shared-note',
      fieldType: 'display',
      content: 'Capture vitals before the exam.',
      width: 'full',
    };
    section.fields = [
      description,
      { ...description },
      ...(section.fields ?? []),
    ];
    expect(() => validateEncounterForm(form)).toThrow(
      'duplicate field id shared-note in vitals'
    );
  });

  it('rejects structured clinical fields that do not use the canonical value id', () => {
    const form = globalThis.structuredClone(vitalsOnlyForm);
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
