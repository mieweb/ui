import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '@esheet/core';
import {
  getRichTextEsheetFieldId,
  getRichTextEsheetFormSections,
  partyFindings,
  withRichTextEsheetParties,
} from './definition';

const form = {
  id: 'letter',
  title: 'Referral letter',
  pages: [
    {
      id: 'letter:document',
      title: 'Referral letter',
      fields: [
        {
          id: 'richtext:reason:section',
          fieldType: 'section',
          title: 'Reason',
          sectionCollapse: 'expanded',
          width: 'full',
          fields: [
            {
              id: 'richtext:reason:value',
              fieldType: 'esheetNarrative',
              question: 'Reason',
              required: true,
              width: 'full',
              _sourceData: {
                narrativeHideLabel: true,
                narrativeFindings: [],
              },
            },
          ],
        },
        {
          id: 'richtext:closing:section',
          fieldType: 'section',
          title: 'Closing',
          sectionCollapse: 'expanded',
          width: 'full',
          fields: [
            {
              id: 'richtext:closing:value',
              fieldType: 'esheetNarrative',
              question: 'Closing',
              width: 'full',
              _sourceData: {
                narrativeHideLabel: true,
                narrativeFindings: [
                  {
                    id: 'thanks',
                    label: 'Thanks',
                    text: 'Thank you.',
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
} as unknown as FormDefinition;

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

  it('replaces stamped party macros with the live parties', () => {
    const docked = withRichTextEsheetParties(form, parties);
    // A replacement patient swaps the macros instead of accumulating them.
    expect(
      findingLabels(
        withRichTextEsheetParties(docked, [
          { role: 'Patient', name: 'Avery Lane' },
        ]),
        'closing'
      )
    ).toEqual(['Thanks', 'Patient: Avery Lane']);
    // An empty live list removes the macros but keeps authored findings.
    expect(
      findingLabels(withRichTextEsheetParties(docked, []), 'closing')
    ).toEqual(['Thanks']);
    expect(findingLabels(withRichTextEsheetParties(docked), 'closing')).toEqual(
      ['Thanks']
    );
  });

  it('drops malformed authored findings instead of crashing', () => {
    const corrupted = globalThis.structuredClone(form);
    const field = (corrupted.pages[0].fields ?? [])
      .flatMap((section) => ('fields' in section ? section.fields! : []))
      .find(
        (child) => child.id === getRichTextEsheetFieldId('closing')
      ) as unknown as NarrativeField;
    field._sourceData!.narrativeFindings = [
      null,
      { id: 'thanks', label: 'Thanks', text: 'Thank you.' },
    ] as unknown as { label: string }[];
    expect(
      findingLabels(withRichTextEsheetParties(corrupted, parties), 'closing')
    ).toEqual([
      'Thanks',
      'Patient: Jordan Rivera',
      'Provider: Dr. Casey Morgan',
    ]);
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

  it('rejects forms with more than one page', () => {
    const multiPage = {
      ...form,
      pages: [form.pages[0], { ...form.pages[0], id: 'letter:extra' }],
    } as FormDefinition;
    expect(() => getRichTextEsheetFormSections(multiPage)).toThrow(
      'exactly one page is required'
    );
  });

  it('rejects a structural container as the section value field', () => {
    expect(() =>
      getRichTextEsheetFormSections(
        mutated((fields) => {
          (fields[0].fields![0] as { fieldType?: string }).fieldType =
            'section';
        })
      )
    ).toThrow('must be an answer-bearing field');
  });

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

  it('rejects duplicate section description fields', () => {
    // documentMdy's validNativeForm rejects duplicate field ids on reopen, so
    // the section view guard must refuse them before a document is saved.
    expect(() =>
      getRichTextEsheetFormSections(
        mutated((fields) => {
          const description = {
            id: `${fields[0].id}:description`,
            fieldType: 'display',
          };
          fields[0].fields!.push(description as never, description as never);
        })
      )
    ).toThrow('duplicate section description field');
  });
});
