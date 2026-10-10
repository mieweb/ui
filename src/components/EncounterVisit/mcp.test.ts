import { describe, expect, it, vi } from 'vitest';
import { getEncounterFieldId } from './definition';
import {
  createEncounterVisitTools,
  ENCOUNTER_VISIT_TOOL_DEFINITIONS,
  executeEncounterVisitToolCall,
  type EncounterVisitToolResult,
} from './mcp';
import type { EncounterResponses, EncounterVisitDefinition } from './types';

const definition: EncounterVisitDefinition = {
  id: 'anonymous-visit',
  title: 'Visit',
  sections: [
    { id: 'hpi', title: 'HPI', kind: 'narrative', required: true },
    {
      id: 'exam',
      title: 'Physical exam',
      kind: 'observations',
      narrative: true,
      observations: [
        { id: 'back', label: 'Back' },
        {
          id: 'motion',
          label: 'Range of motion',
          type: 'number',
          unit: 'degrees',
        },
        {
          id: 'gait',
          label: 'Gait',
          type: 'choice',
          options: ['Not assessed', 'Steady'],
        },
      ],
    },
    { id: 'vitals', title: 'Vitals', kind: 'vitals' },
    { id: 'medications', title: 'Medications', kind: 'medications' },
    { id: 'allergies', title: 'Allergies', kind: 'allergies' },
    { id: 'assessment', title: 'Assessment', kind: 'assessment' },
  ],
};

function fixture(initial: EncounterResponses = {}) {
  let responses = initial;
  let readOnly = false;
  let currentDefinition = definition;
  const navigate = vi.fn();
  const setResponses = vi.fn((next: EncounterResponses) => {
    responses = next;
  });
  const tools = createEncounterVisitTools({
    getDefinition: () => currentDefinition,
    getResponses: () => responses,
    setResponses,
    isReadOnly: () => readOnly,
    navigateToSection: navigate,
  });
  return {
    tools,
    setResponses,
    navigate,
    responses: () => responses,
    setReadOnly: (value: boolean) => {
      readOnly = value;
    },
    setDefinition: (value: EncounterVisitDefinition) => {
      currentDefinition = value;
    },
  };
}

function errorCode(result: EncounterVisitToolResult): string {
  if (result.success) throw new Error('Expected failure');
  return result.error.code;
}

describe('EncounterVisit in-process tools', () => {
  it('writes native narrative answers without erasing unrelated eSheet state', () => {
    const original = { unrelated: { answer: 'keep' } };
    const ctx = fixture(original);
    const result = ctx.tools.setNarrative(
      'hpi',
      '45-year-old male with back pain.'
    );
    expect(result.success).toBe(true);
    expect(ctx.setResponses).toHaveBeenCalledTimes(1);
    expect(ctx.responses()).toEqual({
      unrelated: { answer: 'keep' },
      [getEncounterFieldId('hpi')]: {
        answer: '45-year-old male with back pain.',
        _ai: true,
      },
    });
    expect(original).toEqual({ unrelated: { answer: 'keep' } });
  });

  it('returns detached reads and reads current definition and responses on each call', () => {
    const ctx = fixture();
    const result = ctx.tools.listSections();
    if (!result.success) throw new Error('Expected sections');
    result.data[0].title = 'Changed outside the controller';
    expect(definition.sections[0].title).toBe('HPI');
    ctx.setDefinition({ ...definition, title: 'Updated visit' });
    ctx.tools.setNarrative('hpi', 'Supplied history');
    const visit = ctx.tools.getVisit();
    if (!visit.success) throw new Error('Expected visit');
    expect(visit.data.definition.title).toBe('Updated visit');
    visit.data.responses[getEncounterFieldId('hpi')].answer =
      'Mutated snapshot';
    expect(ctx.responses()[getEncounterFieldId('hpi')].answer).toBe(
      'Supplied history'
    );
  });

  it('records observation fields in the native answer and selected formats', () => {
    const ctx = fixture();
    expect(
      ctx.tools.setObservation('exam', 'back', 'Tenderness reported.').success
    ).toBe(true);
    expect(ctx.tools.setObservation('exam', 'motion', 30).success).toBe(true);
    expect(
      ctx.tools.setObservation('exam', 'gait', 'Not assessed').success
    ).toBe(true);
    expect(ctx.responses()[getEncounterFieldId('exam', 'motion')].answer).toBe(
      '30'
    );
    expect(
      ctx.responses()[getEncounterFieldId('exam', 'gait')].selected
    ).toEqual({ id: 'Not%20assessed', value: 'Not assessed' });
    expect(
      ctx.tools.setNarrative('exam', 'The supplied exam narrative.').success
    ).toBe(true);
  });

  it('allows clearing fields and reports required omissions through validation', () => {
    const ctx = fixture();
    ctx.tools.setNarrative('hpi', 'History');
    ctx.tools.setObservation('exam', 'gait', 'Steady');
    expect(ctx.tools.setObservation('exam', 'gait', null).success).toBe(true);
    expect(
      ctx.responses()[getEncounterFieldId('exam', 'gait')].selected
    ).toBeUndefined();
    expect(ctx.tools.setNarrative('hpi', '').success).toBe(true);
    const result = ctx.tools.validateVisit();
    expect(result).toMatchObject({
      success: true,
      data: { valid: false, issues: [{ sectionId: 'hpi', code: 'required' }] },
    });
  });

  it('rejects unknown sections, observation ids, types and choices before writing', () => {
    const ctx = fixture();
    expect(errorCode(ctx.tools.setNarrative('missing', 'History'))).toBe(
      'UNKNOWN_SECTION'
    );
    expect(errorCode(ctx.tools.setNarrative('vitals', '140/90'))).toBe(
      'WRONG_SECTION_KIND'
    );
    expect(errorCode(ctx.tools.setObservation('hpi', 'back', 'Finding'))).toBe(
      'WRONG_SECTION_KIND'
    );
    expect(
      errorCode(ctx.tools.setObservation('exam', 'missing', 'Finding'))
    ).toBe('UNKNOWN_OBSERVATION');
    expect(errorCode(ctx.tools.setObservation('exam', 'motion', '30'))).toBe(
      'INVALID_ARGUMENT'
    );
    expect(
      errorCode(ctx.tools.setObservation('exam', 'motion', Infinity))
    ).toBe('INVALID_ARGUMENT');
    expect(errorCode(ctx.tools.setObservation('exam', 'back', 30))).toBe(
      'INVALID_ARGUMENT'
    );
    expect(
      errorCode(ctx.tools.setObservation('exam', 'gait', 'Invented choice'))
    ).toBe('INVALID_ARGUMENT');
    expect(ctx.setResponses).not.toHaveBeenCalled();
  });

  it('commits a coordinated BP pair once and preserves repeat readings', () => {
    const ctx = fixture();
    expect(
      ctx.tools.upsertVitals('vitals', {
        id: 'first',
        systolic: 140,
        diastolic: 90,
        pulse: 78,
      }).success
    ).toBe(true);
    expect(ctx.setResponses).toHaveBeenCalledTimes(1);
    expect(
      ctx.tools.upsertVitals('vitals', {
        id: 'repeat',
        systolic: 132,
        diastolic: 84,
      }).success
    ).toBe(true);
    expect(
      ctx.tools.upsertVitals('vitals', {
        id: 'first',
        systolic: 138,
        diastolic: 88,
      }).success
    ).toBe(true);
    const value = JSON.parse(
      ctx.responses()[getEncounterFieldId('vitals', 'value')].answer!
    );
    expect(value.readings).toEqual([
      { id: 'first', systolic: 138, diastolic: 88 },
      { id: 'repeat', systolic: 132, diastolic: 84 },
    ]);
    const visit = ctx.tools.getVisit();
    if (!visit.success) throw new Error('Expected snapshot');
    expect(
      visit.data.observations.filter(
        (observation) => observation.components?.length === 2
      )
    ).toHaveLength(2);
  });

  it.each([
    { id: 'bad', systolic: 140 },
    { id: 'bad', diastolic: 90 },
    { id: 'bad', pulse: -1 },
    { id: 'bad', oxygenSaturation: 101 },
    { id: 'bad', pain: 11 },
    { id: 'bad', pulse: '78' },
    { id: 'bad', pulse: 78, unexpected: true },
    { id: 'bad' },
  ])('rejects invalid vital readings before committing: %j', (reading) => {
    const ctx = fixture();
    const result = executeEncounterVisitToolCall(
      'encounter_visit_upsert_vitals',
      { sectionId: 'vitals', reading },
      ctx.tools
    );
    expect(result.isError).toBe(true);
    expect(ctx.setResponses).not.toHaveBeenCalled();
  });

  it('removes only the requested reading and rejects an unknown reading', () => {
    const ctx = fixture();
    ctx.tools.upsertVitals('vitals', { id: 'first', pulse: 78 });
    ctx.tools.upsertVitals('vitals', { id: 'repeat', pulse: 76 });
    expect(ctx.tools.removeVitals('vitals', 'first').success).toBe(true);
    expect(
      JSON.parse(
        ctx.responses()[getEncounterFieldId('vitals', 'value')].answer!
      ).readings
    ).toEqual([{ id: 'repeat', pulse: 76 }]);
    expect(errorCode(ctx.tools.removeVitals('vitals', 'unknown'))).toBe(
      'UNKNOWN_READING'
    );
    expect(ctx.tools.removeVitals('vitals', 'repeat').success).toBe(true);
  });

  it('does not silently replace existing malformed vitals with an empty list', () => {
    const ctx = fixture({
      [getEncounterFieldId('vitals', 'value')]: { answer: '{broken' },
    });
    expect(
      errorCode(ctx.tools.upsertVitals('vitals', { id: 'new', pulse: 78 }))
    ).toBe('INVALID_RESPONSE');
    expect(ctx.setResponses).not.toHaveBeenCalled();
  });

  it('preserves unrelated unfinished numeric inputs during vital edits and clears only an explicitly replaced reading', () => {
    const fieldId = getEncounterFieldId('vitals', 'value');
    const draft = { readingId: 'unfinished', key: 'pulse', text: '-' };
    const ctx = fixture({
      [fieldId]: {
        answer: JSON.stringify({
          readings: [
            { id: 'unfinished', pulse: 78 },
            { id: 'existing', pulse: 76 },
          ],
          inputDrafts: [draft],
        }),
      },
    });
    const result = ctx.tools.upsertVitals('vitals', {
      id: 'new',
      systolic: 140,
      diastolic: 90,
    });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected unrelated edit to succeed');
    expect(JSON.parse(ctx.responses()[fieldId].answer!).inputDrafts).toEqual([
      draft,
    ]);
    expect(result.data.errors).toContainEqual(
      expect.objectContaining({
        code: 'invalid-number',
        readingId: 'unfinished',
      })
    );
    expect(
      result.data.observations.some(
        (observation) =>
          observation.groupId === 'unfinished' && observation.label === 'Pulse'
      )
    ).toBe(false);
    expect(ctx.tools.removeVitals('vitals', 'existing').success).toBe(true);
    expect(JSON.parse(ctx.responses()[fieldId].answer!).inputDrafts).toEqual([
      draft,
    ]);
    expect(
      ctx.tools.upsertVitals('vitals', { id: 'unfinished', pulse: 80 }).success
    ).toBe(true);
    expect(JSON.parse(ctx.responses()[fieldId].answer!).inputDrafts).toEqual(
      []
    );
  });

  it('removes drafts for a removed reading while preserving another reading draft', () => {
    const fieldId = getEncounterFieldId('vitals', 'value');
    const retained = { readingId: 'second', key: 'weight', text: 'bad' };
    const ctx = fixture({
      [fieldId]: {
        answer: JSON.stringify({
          readings: [
            { id: 'first', pulse: 78 },
            { id: 'second', pulse: 76 },
          ],
          inputDrafts: [
            { readingId: 'first', key: 'pulse', text: '-' },
            retained,
          ],
        }),
      },
    });
    expect(ctx.tools.removeVitals('vitals', 'first').success).toBe(true);
    expect(JSON.parse(ctx.responses()[fieldId].answer!)).toEqual({
      readings: [{ id: 'second', pulse: 76 }],
      inputDrafts: [retained],
    });
  });

  it.each([
    { readings: [{ id: 'first', pulse: 78 }], inputDrafts: {} },
    { readings: [{ id: 'first', pulse: 78 }], inputDrafts: [null] },
    { readings: [{ id: 'first', pulse: 78 }], unknownMetadata: true },
  ])(
    'rejects malformed global vital metadata instead of discarding it: %j',
    (value) => {
      const fieldId = getEncounterFieldId('vitals', 'value');
      const ctx = fixture({ [fieldId]: { answer: JSON.stringify(value) } });
      expect(
        errorCode(ctx.tools.upsertVitals('vitals', { id: 'new', pulse: 80 }))
      ).toBe('INVALID_RESPONSE');
      expect(ctx.setResponses).not.toHaveBeenCalled();
      expect(JSON.parse(ctx.responses()[fieldId].answer!)).toEqual(value);
    }
  );

  it('validates custom component values and parses serialized JSON before writing', () => {
    const ctx = fixture();
    expect(
      ctx.tools.updateSection('medications', {
        medications: [
          { id: 'm1', name: 'Supplied medication', status: 'unknown' },
        ],
      }).success
    ).toBe(true);
    expect(
      ctx.tools.updateSection(
        'allergies',
        '{"allergies":[],"noKnownAllergies":true}'
      ).success
    ).toBe(true);
    expect(
      ctx.tools.updateSection('assessment', {
        concerns: [],
        items: [],
        orders: [],
      }).success
    ).toBe(true);
    expect(errorCode(ctx.tools.updateSection('medications', '{broken'))).toBe(
      'INVALID_ARGUMENT'
    );
    expect(
      errorCode(
        ctx.tools.updateSection('medications', {
          medications: [{ name: 'Missing id and status' }],
        })
      )
    ).toBe('INVALID_RESPONSE');
    expect(
      errorCode(
        ctx.tools.updateSection('allergies', {
          allergies: [],
          noKnownAllergies: 'yes',
        })
      )
    ).toBe('INVALID_RESPONSE');
    expect(
      errorCode(
        ctx.tools.updateSection('assessment', {
          concerns: 'invalid',
          items: [],
          orders: [],
        })
      )
    ).toBe('INVALID_RESPONSE');
    expect(errorCode(ctx.tools.updateSection('hpi', {}))).toBe(
      'WRONG_SECTION_KIND'
    );
    expect(ctx.setResponses).toHaveBeenCalledTimes(3);
  });

  it('rejects non-JSON values without serializing them into missing or null data', () => {
    const ctx = fixture();
    const circular: Record<string, unknown> = { medications: [] };
    circular.circular = circular;
    for (const value of [
      circular,
      { medications: [], extra: undefined },
      { medications: [], extra: NaN },
      new Date(),
    ]) {
      expect(errorCode(ctx.tools.updateSection('medications', value))).toBe(
        'INVALID_ARGUMENT'
      );
    }
    expect(ctx.setResponses).not.toHaveBeenCalled();
  });

  it('checks current read-only state for every data mutation while permitting reads and navigation', () => {
    const ctx = fixture();
    ctx.setReadOnly(true);
    const results = [
      ctx.tools.setNarrative('hpi', 'History'),
      ctx.tools.setObservation('exam', 'back', 'Finding'),
      ctx.tools.upsertVitals('vitals', { id: 'first', pulse: 78 }),
      ctx.tools.removeVitals('vitals', 'first'),
      ctx.tools.updateSection('medications', { medications: [] }),
    ];
    expect(results.map(errorCode)).toEqual(Array(5).fill('READ_ONLY'));
    expect(ctx.setResponses).not.toHaveBeenCalled();
    expect(ctx.tools.getVisit().success).toBe(true);
    expect(ctx.tools.getNote().success).toBe(true);
    expect(ctx.tools.navigateToSection('exam')).toEqual({
      success: true,
      data: { sectionId: 'exam' },
    });
    expect(ctx.navigate).toHaveBeenCalledWith('exam');
    ctx.setReadOnly(false);
    expect(ctx.tools.setNarrative('hpi', 'History').success).toBe(true);
  });

  it('returns a structured unavailable error when navigation is not provided', () => {
    const tools = createEncounterVisitTools({
      getDefinition: () => definition,
      getResponses: () => ({}),
      setResponses: vi.fn(),
    });
    expect(errorCode(tools.navigateToSection('exam'))).toBe('UNAVAILABLE');
  });
});

describe('EncounterVisit MCP tools/call adapter', () => {
  it('provides JSON schema metadata and structured/text results for every advertised tool', () => {
    expect(
      new Set(ENCOUNTER_VISIT_TOOL_DEFINITIONS.map((tool) => tool.name)).size
    ).toBe(ENCOUNTER_VISIT_TOOL_DEFINITIONS.length);
    expect(
      ENCOUNTER_VISIT_TOOL_DEFINITIONS.every(
        (tool) =>
          tool.inputSchema.type === 'object' &&
          tool.inputSchema.additionalProperties === false
      )
    ).toBe(true);
    const ctx = fixture();
    const result = executeEncounterVisitToolCall(
      'encounter_visit_set_narrative',
      { sectionId: 'hpi', text: 'Provided history' },
      ctx.tools
    );
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent.success).toBe(true);
    expect(JSON.parse(result.content[0].text)).toEqual(
      result.structuredContent
    );
  });

  it.each([
    ['unknown', {}],
    ['encounter_visit_get', null],
    ['encounter_visit_get', []],
    ['encounter_visit_get', { extra: true }],
    ['encounter_visit_set_narrative', { sectionId: 'hpi' }],
    ['encounter_visit_set_narrative', { sectionId: {}, text: 'History' }],
    ['encounter_visit_set_narrative', { sectionId: 'hpi', text: 45 }],
    [
      'encounter_visit_set_observation',
      { sectionId: 'exam', observationId: 'back', value: {} },
    ],
    ['encounter_visit_upsert_vitals', { sectionId: 'vitals', reading: null }],
    ['encounter_visit_remove_vitals', { sectionId: 'vitals', readingId: '' }],
  ])(
    'rejects malformed tool arguments for %s before mutating',
    (name, args) => {
      const ctx = fixture();
      const result = executeEncounterVisitToolCall(
        name as string,
        args,
        ctx.tools
      );
      expect(result.isError).toBe(true);
      expect(result.structuredContent.success).toBe(false);
      expect(ctx.setResponses).not.toHaveBeenCalled();
    }
  );

  it('returns an MCP error when a host callback fails', () => {
    const tools = createEncounterVisitTools({
      getDefinition: () => definition,
      getResponses: () => ({}),
      setResponses: () => {
        throw new Error('Host rejected update');
      },
    });
    const result = executeEncounterVisitToolCall(
      'encounter_visit_set_narrative',
      { sectionId: 'hpi', text: 'History' },
      tools
    );
    expect(result).toMatchObject({
      isError: true,
      structuredContent: {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Host rejected update' },
      },
    });
  });
});
