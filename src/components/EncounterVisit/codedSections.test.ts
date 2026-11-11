import { describe, expect, it } from 'vitest';
import { createEncounterSnapshot, validateEncounterResponses } from './model';
import { getEncounterFieldId } from './definition';
import {
  createEncounterVisitTools,
  executeEncounterVisitToolCall,
} from './mcp';
import { parseEncounterMdy, renderEncounterMdy } from './mdy';
import { getEncounterNarrativeFindings } from './narrativeFindings';
import type { EncounterResponses, EncounterVisitDefinition } from './types';

const definition: EncounterVisitDefinition = {
  id: 'coded-visit',
  title: 'Coded visit',
  sections: [
    {
      id: 'hpi',
      title: 'HPI',
      kind: 'narrative',
      findings: [{ id: 'no-fever', label: 'No fever', text: 'Denies fever.' }],
    },
    {
      id: 'exam',
      title: 'Exam',
      kind: 'observations',
      observations: [
        {
          id: 'general',
          label: 'General',
          findings: [
            { id: 'alert', label: 'Alert', text: 'Alert and conversant.' },
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
      title: 'Medications',
      kind: 'medications',
      requireCoding: true,
    },
    {
      id: 'allergies',
      title: 'Allergies',
      kind: 'allergies',
      requireCoding: true,
    },
    {
      id: 'assessment',
      title: 'Assessment',
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
      ],
    },
  ],
};
const condition = {
  concernId: 'condition-1',
  clinicalStatus: 'active',
  assertions: [
    {
      id: 'assertion-1',
      date: '2026-10-10',
      text: 'Hypertension',
      verificationStatus: 'unconfirmed',
      coding: [{ system: 'ICD-10-CM', code: 'I10', display: 'Hypertension' }],
    },
  ],
};
const medication = {
  id: 'med-1',
  name: 'Recorded medication',
  status: 'taking',
  code: { system: 'TEST', code: 'med-1' },
};
const allergy = {
  id: 'allergy-1',
  allergen: 'Recorded allergen',
  type: 'drug',
  code: { system: 'TEST', code: 'allergen-1' },
};
const order = {
  orderId: 'order-1',
  type: 'procedure',
  display: 'Recorded plan action',
  concernId: 'condition-1',
  code: { fullid: 'TEST:action-1', codetype: 'TEST', fullcode: 'action-1' },
};
const id = (sectionId: string) => getEncounterFieldId(sectionId, 'value');
const response = (value: unknown) => ({ answer: JSON.stringify(value) });
const recorded = (): EncounterResponses => ({
  [id('conditions')]: response({ concerns: [condition] }),
  [id('medications')]: response({ medications: [medication] }),
  [id('allergies')]: response({ allergies: [allergy] }),
  [id('assessment')]: response({
    concerns: [],
    items: [{ concernId: 'condition-1', assertionId: 'assertion-1' }],
    orders: [],
  }),
  [id('plan')]: response({ orders: [order] }),
  [getEncounterFieldId('plan')]: { answer: 'Authored supplementary plan.' },
});
function fixture(initial: EncounterResponses = {}) {
  let responses = initial;
  let readOnly = false;
  const tools = createEncounterVisitTools({
    getDefinition: () => definition,
    getResponses: () => responses,
    setResponses: (next) => {
      responses = next;
    },
    isReadOnly: () => readOnly,
  });
  return {
    tools,
    getResponses: () => responses,
    freeze: () => {
      readOnly = true;
    },
  };
}

describe('coded clinical sections and explicit narrative findings', () => {
  it('roundtrips native clinical codes, external condition references and supplemental plan prose through MDY', async () => {
    const original = recorded();
    const snapshot = createEncounterSnapshot(definition, original);
    expect(snapshot.errors).toEqual([]);
    for (const sectionId of [
      'conditions',
      'medications',
      'allergies',
      'assessment',
      'plan',
    ])
      expect(
        snapshot.observations.find(
          (observation) =>
            observation.sectionId === sectionId && observation.code
        )?.code
      ).toBeDefined();
    const assessed = snapshot.observations.find(
      (observation) => observation.sectionId === 'assessment'
    );
    expect(assessed?.code?.code).toBe('I10');
    expect(
      snapshot.observations.filter(
        (observation) => observation.sectionId === 'plan'
      )
    ).toHaveLength(2);
    expect(parseEncounterMdy(snapshot.mdy).response).toEqual(original);
    const rendered = await renderEncounterMdy(snapshot.mdy);
    expect(
      rendered.diagnostics.filter((item) => item.severity === 'error')
    ).toEqual([]);
    expect(
      rendered.fields.find((field) => field.fieldId === id('assessment'))
        ?.display
    ).toContain('Hypertension');
    expect(
      rendered.fields.find(
        (field) => field.fieldId === getEncounterFieldId('plan')
      )?.display
    ).toBe('Authored supplementary plan.');
  });

  it.each([
    [
      'medications',
      {
        medications: [
          { id: 'm', name: 'Uncoded medication', status: 'taking' },
        ],
      },
    ],
    ['allergies', { allergies: [{ id: 'a', allergen: 'Uncoded allergen' }] }],
    [
      'conditions',
      {
        concerns: [
          {
            ...condition,
            assertions: [{ ...condition.assertions[0], coding: [] }],
          },
        ],
      },
    ],
    ['plan', { orders: [{ ...order, code: undefined }] }],
    [
      'assessment',
      {
        concerns: [
          {
            ...condition,
            assertions: [{ ...condition.assertions[0], coding: [] }],
          },
        ],
        items: [{ concernId: 'condition-1', assertionId: 'assertion-1' }],
        orders: [],
      },
    ],
  ])(
    'requires codes for %s without silently deleting imported uncoded capture',
    (sectionId, value) => {
      const initial = {
        ...recorded(),
        [id(sectionId as string)]: response(value),
      };
      const snapshot = createEncounterSnapshot(definition, initial);
      expect(
        snapshot.errors.some(
          (issue) =>
            issue.sectionId === sectionId &&
            issue.message.includes('clinical code')
        )
      ).toBe(true);
      expect(snapshot.responses[id(sectionId as string)]).toEqual(
        response(value)
      );
      expect(
        snapshot.observations.some(
          (observation) =>
            observation.sectionId === sectionId &&
            String(observation.value).includes('Coding required')
        )
      ).toBe(true);
      const f = fixture(recorded());
      expect(
        f.tools.updateSection(sectionId as string, JSON.stringify(value))
          .success
      ).toBe(false);
      expect(f.getResponses()).toEqual(recorded());
    }
  );

  it('codes only an explicitly recorded no-known-allergies flag', () => {
    const absent = createEncounterSnapshot(definition, {});
    expect(absent.observations).toEqual([]);
    const explicit = createEncounterSnapshot(definition, {
      [id('allergies')]: response({ allergies: [], noKnownAllergies: true }),
    });
    expect(explicit.errors).toEqual([]);
    expect(explicit.observations[0].code).toEqual({
      system: 'http://snomed.info/sct',
      code: '716186003',
      display: 'No known allergy',
    });
  });

  it('rejects dangling plan indications and prevents MCP from breaking existing clinical links', () => {
    const invalid = {
      ...recorded(),
      [id('plan')]: response({ orders: [{ ...order, concernId: 'missing' }] }),
    };
    expect(
      validateEncounterResponses(definition, invalid).some(
        (issue) => issue.path === 'orders.0.concernId'
      )
    ).toBe(true);
    const f = fixture(recorded());
    expect(
      f.tools.updateSection('plan', {
        orders: [{ ...order, concernId: 'missing' }],
      }).success
    ).toBe(false);
    expect(f.tools.updateSection('conditions', { concerns: [] }).success).toBe(
      false
    );
    expect(f.getResponses()).toEqual(recorded());
  });

  it('retains a recorded assessment assertion when its external condition is refined', async () => {
    const responses = recorded();
    responses[id('conditions')] = response({
      concerns: [
        {
          ...condition,
          assertions: [
            ...condition.assertions,
            {
              ...condition.assertions[0],
              id: 'refined',
              text: 'Refined condition',
              coding: [{ system: 'ICD10', code: 'I11.9' }],
            },
          ],
        },
      ],
    });
    const snapshot = createEncounterSnapshot(definition, responses);
    expect(snapshot.errors).toEqual([]);
    expect(
      snapshot.observations.find((item) => item.sectionId === 'conditions')
        ?.code?.code
    ).toBe('I11.9');
    expect(
      snapshot.observations.find((item) => item.sectionId === 'assessment')
        ?.code?.code
    ).toBe('I10');
    expect(
      (await renderEncounterMdy(snapshot.mdy)).fields.find(
        (field) => field.fieldId === id('assessment')
      )?.display
    ).toContain('Hypertension');
    expect(JSON.parse(snapshot.responses[id('assessment')].answer!)).toEqual({
      concerns: [],
      items: [{ concernId: 'condition-1', assertionId: 'assertion-1' }],
      orders: [],
    });
  });

  it('prevents an MCP condition removal from orphaning an assessment order indication', () => {
    const responses = {
      [id('conditions')]: response({ concerns: [condition] }),
      [id('assessment')]: response({
        concerns: [],
        items: [],
        orders: [order],
      }),
    };
    const f = fixture(responses);
    expect(createEncounterSnapshot(definition, responses).errors).toEqual([]);
    expect(f.tools.updateSection('conditions', { concerns: [] }).success).toBe(
      false
    );
    expect(f.getResponses()).toEqual(responses);
  });

  it('keeps clinical record IDs in native data while omitting them from readable reports', async () => {
    const responses = recorded();
    const snapshot = createEncounterSnapshot(definition, responses);
    const rendered = await renderEncounterMdy(snapshot.mdy);
    for (const internalId of [
      condition.concernId,
      condition.assertions[0].id,
      medication.id,
      allergy.id,
      order.orderId,
    ]) {
      expect(snapshot.note).not.toContain(internalId);
      expect(rendered.html).not.toContain(internalId);
    }
    expect(rendered.html).toContain('Hypertension');
    expect(rendered.html).toContain('Recorded plan action');
    expect(parseEncounterMdy(snapshot.mdy).response).toEqual(responses);
    expect(
      snapshot.observations.some((item) => item.groupId === condition.concernId)
    ).toBe(true);
  });

  it('rejects a source update that removes coding from a pinned assessment assertion', () => {
    const concerns = [
      {
        ...condition,
        assertions: [
          ...condition.assertions,
          {
            ...condition.assertions[0],
            id: 'latest',
            text: 'Latest condition',
          },
        ],
      },
    ];
    const responses = {
      ...recorded(),
      [id('conditions')]: response({ concerns }),
    };
    const f = fixture(responses);
    expect(createEncounterSnapshot(definition, responses).errors).toEqual([]);
    const replacement = concerns.map((concern) => ({
      ...concern,
      assertions: concern.assertions.map((assertion) =>
        assertion.id === 'assertion-1'
          ? { ...assertion, coding: [] }
          : assertion
      ),
    }));
    expect(
      f.tools.updateSection('conditions', { concerns: replacement }).success
    ).toBe(false);
    expect(f.getResponses()).toEqual(responses);
  });

  it('selects a configured finding through MCP, appends once and preserves coded section data', async () => {
    const initial = {
      ...recorded(),
      [getEncounterFieldId('hpi')]: {
        answer: 'Reported symptoms.',
        attributes: {
          host: 'preserved',
          encounterNarrativeHtml: '<strong>Reported symptoms.</strong>',
          encounterNarrativeText: 'Reported symptoms.',
        },
      },
    };
    const f = fixture(initial);
    const result = await executeEncounterVisitToolCall(
      'encounter_visit_select_narrative_finding',
      { sectionId: 'hpi', findingId: 'no-fever' },
      f.tools
    );
    expect(result.isError).toBeUndefined();
    expect(f.getResponses()[getEncounterFieldId('hpi')].answer).toBe(
      'Reported symptoms.\nDenies fever.'
    );
    expect(f.getResponses()[getEncounterFieldId('hpi')].attributes?.host).toBe(
      'preserved'
    );
    expect(f.getResponses()[getEncounterFieldId('hpi')]._ai).toBe(true);
    expect(
      f.getResponses()[getEncounterFieldId('hpi')].attributes
        ?.encounterNarrativeHtml
    ).toBe('<strong>Reported symptoms.</strong><p>Denies fever.</p>');
    expect(
      f.getResponses()[getEncounterFieldId('hpi')].attributes
        ?.encounterNarrativeText
    ).toBe('Reported symptoms.\nDenies fever.');
    expect(
      getEncounterNarrativeFindings(
        f.getResponses()[getEncounterFieldId('hpi')]
      )
    ).toHaveLength(1);
    expect(f.tools.selectNarrativeFinding('hpi', 'no-fever').success).toBe(
      true
    );
    expect(f.getResponses()[getEncounterFieldId('hpi')].answer).toBe(
      'Reported symptoms.\nDenies fever.'
    );
    for (const section of [
      'conditions',
      'medications',
      'allergies',
      'assessment',
      'plan',
    ])
      expect(f.getResponses()[id(section)]).toEqual(initial[id(section)]);
    expect(
      f.tools.selectNarrativeFinding('exam', 'alert', 'general').success
    ).toBe(true);
    expect(f.tools.selectNarrativeFinding('plan', 'questions').success).toBe(
      true
    );
    expect(f.getResponses()[getEncounterFieldId('plan')].answer).toBe(
      'Authored supplementary plan.\nQuestions were answered.'
    );
    expect(
      f.tools.setNarrative('plan', 'Updated supplementary prose.').success
    ).toBe(true);
    expect(
      getEncounterNarrativeFindings(
        f.getResponses()[getEncounterFieldId('plan')]
      )
    ).toEqual([]);
    expect(
      parseEncounterMdy(
        createEncounterSnapshot(definition, f.getResponses()).mdy
      ).response
    ).toEqual(f.getResponses());
  });

  it('rejects unknown findings, wrong fields and frozen coded/narrative writes', async () => {
    const f = fixture(recorded());
    expect(f.tools.selectNarrativeFinding('hpi', 'invented').success).toBe(
      false
    );
    expect(
      f.tools.selectNarrativeFinding('medications', 'no-fever').success
    ).toBe(false);
    expect(
      f.tools.selectNarrativeFinding('exam', 'alert', 'missing').success
    ).toBe(false);
    expect(
      (
        await executeEncounterVisitToolCall(
          'encounter_visit_select_narrative_finding',
          { sectionId: 'hpi', findingId: 'no-fever', extra: true },
          f.tools
        )
      ).isError
    ).toBe(true);
    f.freeze();
    expect(f.tools.selectNarrativeFinding('hpi', 'no-fever').success).toBe(
      false
    );
    expect(f.tools.updateSection('conditions', { concerns: [] }).success).toBe(
      false
    );
    expect(f.tools.updateSection('plan', { orders: [] }).success).toBe(false);
    expect(f.getResponses()).toEqual(recorded());
  });
});

describe('default and explicit clinical coding policy', () => {
  it.each([
    {
      kind: 'medications' as const,
      value: {
        medications: [
          { id: 'med', name: 'Explicit medication', status: 'unknown' },
        ],
      },
    },
    {
      kind: 'allergies' as const,
      value: { allergies: [{ id: 'allergy', allergen: 'Explicit allergen' }] },
    },
    {
      kind: 'conditions' as const,
      value: {
        concerns: [
          {
            ...condition,
            assertions: [{ ...condition.assertions[0], coding: undefined }],
          },
        ],
      },
    },
    {
      kind: 'assessment' as const,
      value: {
        concerns: [
          {
            ...condition,
            assertions: [{ ...condition.assertions[0], coding: undefined }],
          },
        ],
        items: [],
        orders: [],
      },
    },
    {
      kind: 'plan' as const,
      value: { orders: [{ ...order, concernId: undefined, code: undefined }] },
    },
  ])(
    'uses the same omitted/true/false coding policy for $kind validation and MCP writes',
    ({ kind, value }) => {
      for (const requireCoding of [undefined, true, false]) {
        const custom: EncounterVisitDefinition = {
          id: 'policy',
          title: 'Policy',
          sections: [{ id: kind, title: kind, kind, requireCoding }],
        };
        const responses = { [id(kind)]: response(value) };
        expect(validateEncounterResponses(custom, responses).length > 0).toBe(
          requireCoding !== false
        );
        const tools = createEncounterVisitTools({
          getDefinition: () => custom,
          getResponses: () => ({}),
          setResponses: () => {},
        });
        expect(tools.updateSection(kind, JSON.stringify(value)).success).toBe(
          requireCoding === false
        );
      }
    }
  );
});
