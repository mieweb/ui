import { describe, expect, it } from 'vitest';
import {
  createRichTextEsheetFormDefinition,
  createRichTextEsheetSnapshot,
  getRichTextEsheetFieldId,
  partyFindings,
  validateRichTextEsheetDefinition,
  type RichTextEsheetDefinition,
} from './definition';

const definition: RichTextEsheetDefinition = {
  id: 'letter',
  title: 'Referral letter',
  sections: [
    { id: 'reason', title: 'Reason', required: true },
    {
      id: 'closing',
      title: 'Closing',
      findings: [{ id: 'thanks', label: 'Thanks', text: 'Thank you.' }],
    },
  ],
};

const parties = [
  { role: 'Patient', name: 'Jordan Rivera', detail: 'DOB 1979-03-14' },
  { role: 'Provider', name: 'Dr. Casey Morgan' },
];

describe('validateRichTextEsheetDefinition', () => {
  it('rejects duplicate section ids and malformed findings', () => {
    expect(() =>
      validateRichTextEsheetDefinition({
        ...definition,
        sections: [definition.sections[0], definition.sections[0]],
      })
    ).toThrow(/duplicate section id/);
    expect(() =>
      validateRichTextEsheetDefinition({
        ...definition,
        sections: [
          {
            id: 'a',
            title: 'A',
            findings: [{ id: 'x', label: '', text: 'y' }],
          },
        ],
      })
    ).toThrow(/findings require/);
  });
});

describe('partyFindings', () => {
  it('turns each party into an insertable macro with its detail', () => {
    expect(partyFindings(parties)).toEqual([
      {
        id: 'party:0',
        label: 'Patient: Jordan Rivera',
        text: 'Jordan Rivera (DOB 1979-03-14)',
      },
      {
        id: 'party:1',
        label: 'Provider: Dr. Casey Morgan',
        text: 'Dr. Casey Morgan',
      },
    ]);
  });
});

describe('createRichTextEsheetFormDefinition', () => {
  it('docks section findings and party macros on every narrative field', () => {
    const form = createRichTextEsheetFormDefinition(definition, parties);
    const sections = form.pages[0].fields ?? [];
    const closing = sections
      .flatMap((section) => ('fields' in section ? section.fields! : []))
      .find(
        (field) => field.id === getRichTextEsheetFieldId('closing')
      ) as unknown as {
      fieldType: string;
      _sourceData: { narrativeFindings: { label: string }[] };
    };
    expect(closing.fieldType).toBe('esheetNarrative');
    expect(
      closing._sourceData.narrativeFindings.map((finding) => finding.label)
    ).toEqual([
      'Thanks',
      'Patient: Jordan Rivera',
      'Provider: Dr. Casey Morgan',
    ]);
  });
});

describe('createRichTextEsheetSnapshot', () => {
  it('derives progress, required errors and portable MDY with parties', () => {
    const empty = createRichTextEsheetSnapshot(definition, {}, parties);
    expect(empty.documentedSections).toEqual([]);
    expect(empty.errors).toEqual([
      { sectionId: 'reason', message: 'Reason is required.' },
    ]);
    const responses = {
      [getRichTextEsheetFieldId('reason')]: {
        fieldId: getRichTextEsheetFieldId('reason'),
        answer: 'Routine evaluation, please.',
      },
    };
    const filled = createRichTextEsheetSnapshot(definition, responses, parties);
    expect(filled.documentedSections).toEqual(['reason']);
    expect(filled.errors).toEqual([]);
    expect(filled.mdy).toContain('name: Jordan Rivera');
    expect(filled.mdy).toContain('## Reason\n\nRoutine evaluation, please.');
    expect(filled.mdy).not.toContain('## Closing');
  });
});
