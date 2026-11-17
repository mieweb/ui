import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '@esheet/core';
import {
  getRichTextEsheetFieldId,
  getRichTextEsheetFormSections,
  partyFindings,
  withRichTextEsheetParties,
} from './definition';
import {
  richTextEsheetFormFromLegacy,
  validateRichTextEsheetDefinition,
  type RichTextEsheetDefinition,
} from './legacy';

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

const form = richTextEsheetFormFromLegacy(definition);

const parties = [
  { role: 'Patient', name: 'Jordan Rivera', detail: 'DOB 1979-03-14' },
  { role: 'Provider', name: 'Dr. Casey Morgan' },
];

type NarrativeField = {
  id?: string;
  fieldType: string;
  _sourceData?: { narrativeFindings?: { label: string }[] };
};

function findingLabels(candidate: FormDefinition, sectionId: string): string[] {
  const field = (candidate.pages[0].fields ?? [])
    .flatMap((section) => ('fields' in section ? section.fields! : []))
    .find(
      (child) => child.id === getRichTextEsheetFieldId(sectionId)
    ) as unknown as NarrativeField;
  return (field._sourceData?.narrativeFindings ?? []).map(
    (finding) => finding.label
  );
}

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

describe('richTextEsheetFormFromLegacy', () => {
  it('converts sections to native narrative fields with their own findings', () => {
    expect(findingLabels(form, 'closing')).toEqual(['Thanks']);
    const closing = (form.pages[0].fields ?? [])
      .flatMap((section) => ('fields' in section ? section.fields! : []))
      .find(
        (child) => child.id === getRichTextEsheetFieldId('closing')
      ) as unknown as NarrativeField;
    expect(closing.fieldType).toBe('esheetNarrative');
  });

  it('keeps findings when the narrative type is requested explicitly', () => {
    const explicit = richTextEsheetFormFromLegacy({
      ...definition,
      sections: [{ ...definition.sections[1], fieldType: 'esheetNarrative' }],
    });
    const field = (explicit.pages[0].fields ?? []).flatMap((section) =>
      'fields' in section ? section.fields! : []
    )[0] as unknown as {
      _sourceData?: { narrativeHideLabel: boolean };
    };
    expect(field._sourceData?.narrativeHideLabel).toBe(true);
  });
});

describe('withRichTextEsheetParties', () => {
  it('docks party macros beside every narrative section without duplicates', () => {
    const docked = withRichTextEsheetParties(form, parties);
    expect(findingLabels(docked, 'closing')).toEqual([
      'Thanks',
      'Patient: Jordan Rivera',
      'Provider: Dr. Casey Morgan',
    ]);
    // Pre-#772 forms already stamped macros; docking again adds nothing.
    expect(
      findingLabels(withRichTextEsheetParties(docked, parties), 'closing')
    ).toEqual(findingLabels(docked, 'closing'));
    // The configured form stays clean — macros are rendering state only.
    expect(findingLabels(form, 'closing')).toEqual(['Thanks']);
  });
});

describe('getRichTextEsheetFormSections (mieweb/ui#772)', () => {
  it('rebuilds section views from the native form', () => {
    expect(getRichTextEsheetFormSections(form)).toEqual([
      { id: 'reason', title: 'Reason', required: true },
      { id: 'closing', title: 'Closing' },
    ]);
  });

  const mutated = (
    change: (fields: { id: string; fields?: { id: string }[] }[]) => void
  ): FormDefinition => {
    const clone = JSON.parse(JSON.stringify(form)) as FormDefinition;
    change(clone.pages[0].fields as never);
    return clone;
  };

  it('rejects a noncanonical section field id', () => {
    expect(() =>
      getRichTextEsheetFormSections(
        mutated((fields) => {
          fields[0].id = 'richtext:%72eason:section';
        })
      )
    ).toThrow('canonical encoded section id');
  });

  it('rejects a value field borrowed from another section', () => {
    expect(() =>
      getRichTextEsheetFormSections(
        mutated((fields) => {
          fields[0].fields![0].id = getRichTextEsheetFieldId('closing');
        })
      )
    ).toThrow('unexpected field');
  });

  it('rejects a section without its value field and duplicate sections', () => {
    expect(() =>
      getRichTextEsheetFormSections(
        mutated((fields) => {
          fields[0].fields = [];
        })
      )
    ).toThrow('requires its richtext value field');
    expect(() =>
      getRichTextEsheetFormSections(
        mutated((fields) => {
          fields.push(fields[0]);
        })
      )
    ).toThrow('duplicate section id');
  });
});
