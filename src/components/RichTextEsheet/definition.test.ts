import { describe, expect, it } from 'vitest';
import {
  createRichTextEsheetFormDefinition,
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
        id: 'party:Patient:Jordan%20Rivera:DOB%201979-03-14',
        label: 'Patient: Jordan Rivera',
        text: 'Jordan Rivera (DOB 1979-03-14)',
      },
      {
        id: 'party:Provider:Dr.%20Casey%20Morgan:',
        label: 'Provider: Dr. Casey Morgan',
        text: 'Dr. Casey Morgan',
      },
    ]);
  });

  it('derives macro identity from content so edited parties stay insertable', () => {
    const [before] = partyFindings([{ role: 'Patient', name: 'Jordan' }]);
    const [after] = partyFindings([{ role: 'Patient', name: 'Jordan R.' }]);
    expect(before.id).not.toBe(after.id);
    // Reordering alone must not change identities.
    expect(partyFindings(parties).map((p) => p.id)).toEqual(
      partyFindings([...parties].reverse())
        .map((p) => p.id)
        .reverse()
    );
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

  it('keeps findings when the narrative type is requested explicitly', () => {
    const form = createRichTextEsheetFormDefinition(
      {
        ...definition,
        sections: [{ ...definition.sections[1], fieldType: 'esheetNarrative' }],
      },
      parties
    );
    const field = (form.pages[0].fields ?? []).flatMap((section) =>
      'fields' in section ? section.fields! : []
    )[0] as unknown as {
      _sourceData?: { narrativeHideLabel: boolean };
    };
    expect(field._sourceData?.narrativeHideLabel).toBe(true);
  });
});
