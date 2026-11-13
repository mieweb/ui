import { describe, expect, it } from 'vitest';
import {
  getRichTextEsheetFieldId,
  type RichTextEsheetDefinition,
} from './definition';
import {
  createRichTextEsheetMdy,
  getRichTextEsheetMdyParties,
  getRichTextEsheetRetiredMdyFields,
  parseRichTextEsheetMdy,
  renderRichTextEsheetMdy,
  richTextEsheetDocumentResponse,
  RICHTEXT_ESHEET_DOCUMENT_FIELD_ID,
} from './mdy';
import { createRichTextEsheetSnapshot } from './model';

const definition: RichTextEsheetDefinition = {
  id: 'referral-letter',
  title: 'Referral letter',
  sections: [
    { id: 'reason', title: 'Reason', required: true },
    { id: 'closing', title: 'Closing' },
  ],
};

const parties = [
  { role: 'Patient', name: 'Jordan Rivera', detail: 'DOB 1979-03-14' },
  { role: 'Provider', name: 'Dr. Casey Morgan' },
];

const reasonId = getRichTextEsheetFieldId('reason');

describe('createRichTextEsheetSnapshot', () => {
  it('derives progress, required errors and portable MDY with parties', () => {
    const empty = createRichTextEsheetSnapshot(definition, {}, parties);
    expect(empty.documentedSections).toEqual([]);
    expect(empty.errors).toEqual([
      { sectionId: 'reason', message: 'Reason is required.' },
    ]);
    const filled = createRichTextEsheetSnapshot(
      definition,
      { [reasonId]: { answer: 'Routine evaluation, please.' } },
      parties
    );
    expect(filled.documentedSections).toEqual(['reason']);
    expect(filled.errors).toEqual([]);
    expect(filled.mdy).toContain('name: Jordan Rivera');
    expect(filled.mdy).toContain(
      '## Reason\n\n[Routine evaluation, please.](mdy:doc_'
    );
    // Empty sections stay as memory aids; View-mode rendering prunes them.
    expect(filled.mdy).toContain('## Closing\n\n[—](mdy:doc_');
  });

  it('counts native selection responses as documented content', () => {
    const selectionDefinition: RichTextEsheetDefinition = {
      ...definition,
      sections: [
        {
          id: 'reason',
          title: 'Reason',
          required: true,
          fieldType: 'customChoice',
        },
      ],
    };
    const snapshot = createRichTextEsheetSnapshot(selectionDefinition, {
      [reasonId]: {
        selected: [{ label: 'Urgency', value: 'Routine' }],
      } as never,
    });
    expect(snapshot.documentedSections).toEqual(['reason']);
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.mdy).toContain('## Reason\n\n[Urgency: Routine](mdy:doc_');
  });

  it('keeps authored plain text literal in the projected display', () => {
    const snapshot = createRichTextEsheetSnapshot(
      definition,
      {
        [reasonId]: {
          answer: 'Use <input> here & stay *plain*\nSecond paragraph',
        },
      },
      parties
    );
    expect(snapshot.mdy).toContain(
      '[Use \\<input\\> here &amp; stay \\*plain\\*<br>Second paragraph](mdy:doc_'
    );
  });
});

describe('RichTextEsheet MDY round trip', () => {
  const input = {
    definition,
    responses: {
      [reasonId]: { answer: 'Routine evaluation, please.' },
    },
    parties,
  };

  it('recovers the definition, responses and parties from the document', () => {
    const parsed = parseRichTextEsheetMdy(createRichTextEsheetMdy(input));
    expect(
      parsed.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')
    ).toEqual([]);
    expect(parsed.definition).toEqual(definition);
    expect(parsed.response?.[reasonId]?.answer).toBe(
      'Routine evaluation, please.'
    );
    expect(getRichTextEsheetMdyParties(parsed.frontMatter)).toEqual(parties);
  });

  it('preserves authored prose and refreshes projections on data change', () => {
    const initial = createRichTextEsheetMdy(input);
    const authored = createRichTextEsheetMdy(
      input,
      `${parseRichTextEsheetMdy(initial).body}\n\nAuthored note stays.`,
      initial
    );
    expect(authored).toContain('Authored note stays.');
    const updated = createRichTextEsheetMdy(
      {
        ...input,
        responses: {
          [reasonId]: { answer: 'Changed reason.' },
        },
      },
      undefined,
      authored
    );
    expect(updated).toContain('[Changed reason.](mdy:doc_');
    expect(updated).not.toContain('Routine evaluation, please.');
    expect(updated).toContain('Authored note stays.');
  });

  it('carries an imported document through the reserved response', () => {
    const imported = createRichTextEsheetMdy(input);
    const snapshot = createRichTextEsheetSnapshot(
      definition,
      {
        ...input.responses,
        [RICHTEXT_ESHEET_DOCUMENT_FIELD_ID]:
          richTextEsheetDocumentResponse(imported),
      },
      parties
    );
    expect(snapshot.mdy).toContain('[Routine evaluation, please.](mdy:doc_');
    // The reserved carrier never leaks into the exported response map.
    expect(snapshot.mdy).not.toContain(RICHTEXT_ESHEET_DOCUMENT_FIELD_ID);
  });

  it('reports imported links whose sections were removed as retired', () => {
    const imported = createRichTextEsheetMdy(input);
    const responses = {
      [RICHTEXT_ESHEET_DOCUMENT_FIELD_ID]:
        richTextEsheetDocumentResponse(imported),
    };
    // Every imported link still has its section: nothing is retired.
    expect(
      getRichTextEsheetRetiredMdyFields({ definition, responses })
    ).toEqual([]);
    // A same-id definition that drops a section leaves its imported link
    // behind; editors use this projection to normalize and protect it.
    const retired = getRichTextEsheetRetiredMdyFields({
      definition: {
        ...definition,
        sections: definition.sections.filter(
          (section) => section.id !== 'reason'
        ),
      },
      responses,
    });
    expect(retired).toHaveLength(1);
    expect(retired[0]).toMatchObject({
      fieldId: reasonId,
      sectionId: 'reason',
      display: 'Field no longer configured',
    });
  });

  it('renders projected section content to HTML', async () => {
    const rendered = await renderRichTextEsheetMdy(
      createRichTextEsheetMdy(input)
    );
    expect(
      rendered.diagnostics.filter(
        (diagnostic) => diagnostic.severity === 'error'
      )
    ).toEqual([]);
    expect(rendered.html).toContain('Routine evaluation, please.');
    expect(
      rendered.fields.find((field) => field.sectionId === 'closing')?.empty
    ).toBe(true);
  });
});
