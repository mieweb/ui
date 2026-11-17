import { describe, expect, it } from 'vitest';
import { parseDocument } from 'yaml';
import { getRichTextEsheetFieldId } from './definition';
import {
  richTextEsheetFormFromLegacy,
  type RichTextEsheetDefinition,
} from './legacy';
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

const form = richTextEsheetFormFromLegacy(definition);

const parties = [
  { role: 'Patient', name: 'Jordan Rivera', detail: 'DOB 1979-03-14' },
  { role: 'Provider', name: 'Dr. Casey Morgan' },
];

const reasonId = getRichTextEsheetFieldId('reason');

describe('createRichTextEsheetSnapshot', () => {
  it('serializes in-place form edits in subsequent snapshots', () => {
    const draft = globalThis.structuredClone(form);
    expect(createRichTextEsheetMdy({ form: draft, responses: {} })).toContain(
      '## Reason'
    );
    (draft.pages[0].fields![0] as { title?: string }).title = 'Chief complaint';
    expect(createRichTextEsheetMdy({ form: draft, responses: {} })).toContain(
      '## Chief complaint'
    );
  });

  it('derives progress, required errors and portable MDY with parties', () => {
    const empty = createRichTextEsheetSnapshot(form, {}, parties);
    expect(empty.documentedSections).toEqual([]);
    expect(empty.errors).toEqual([
      { sectionId: 'reason', message: 'Reason is required.' },
    ]);
    const filled = createRichTextEsheetSnapshot(
      form,
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
    const selectionForm = richTextEsheetFormFromLegacy({
      ...definition,
      sections: [
        {
          id: 'reason',
          title: 'Reason',
          required: true,
          fieldType: 'customChoice',
        },
      ],
    });
    const snapshot = createRichTextEsheetSnapshot(selectionForm, {
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
      form,
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
    form,
    responses: {
      [reasonId]: { answer: 'Routine evaluation, please.' },
    },
    parties,
  };

  it('recovers the form, responses and parties from the document', () => {
    const parsed = parseRichTextEsheetMdy(createRichTextEsheetMdy(input));
    expect(
      parsed.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')
    ).toEqual([]);
    // Saves no longer write the legacy richTextEsheet key (mieweb/ui#772).
    expect(parsed.definition).toBeUndefined();
    expect(parsed.form).toEqual(form);
    expect(parsed.response?.[reasonId]?.answer).toBe(
      'Routine evaluation, please.'
    );
    expect(getRichTextEsheetMdyParties(parsed.frontMatter)).toEqual(parties);
  });

  it('imports the legacy richTextEsheet key once and saves only the native form', () => {
    const source = createRichTextEsheetMdy(input);
    const parsed = parseRichTextEsheetMdy(source);
    const document = parseDocument(parsed.frontMatterSource.slice(4, -4));
    // Pre-#772 saves stamped the native form alongside the legacy key.
    document.set('richTextEsheet', definition);
    const legacySource = `---\n${document.toString()}---\n${parsed.body}`;
    const legacy = parseRichTextEsheetMdy(legacySource);
    expect(legacy.definition).toEqual(definition);
    expect(legacy.diagnostics).toEqual([]);
    const migrated = createRichTextEsheetMdy(
      {
        form: richTextEsheetFormFromLegacy(legacy.definition!),
        responses: legacy.response ?? {},
        parties,
      },
      undefined,
      legacySource
    );
    const reparsed = parseRichTextEsheetMdy(migrated);
    expect(reparsed.definition).toBeUndefined();
    expect(migrated).not.toContain('richTextEsheet:');
    expect(reparsed.form).toEqual(form);
    expect(reparsed.response?.[reasonId]?.answer).toBe(
      'Routine evaluation, please.'
    );
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
      form,
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
    expect(getRichTextEsheetRetiredMdyFields({ form, responses })).toEqual([]);
    // A same-id definition that drops a section leaves its imported link
    // behind; editors use this projection to normalize and protect it.
    const retired = getRichTextEsheetRetiredMdyFields({
      form: richTextEsheetFormFromLegacy({
        ...definition,
        sections: definition.sections.filter(
          (section) => section.id !== 'reason'
        ),
      }),
      responses,
    });
    expect(retired).toHaveLength(1);
    expect(retired[0]).toMatchObject({
      fieldId: reasonId,
      sectionId: 'reason',
      display: 'Field no longer configured',
    });
  });

  it('retires removed-section links in locally authored drafts too', () => {
    // Authoring in RichEdit stores only the body — no imported front matter
    // to index retired links from; they are found in the prose itself.
    const body = parseRichTextEsheetMdy(createRichTextEsheetMdy(input)).body;
    const narrowed = richTextEsheetFormFromLegacy({
      ...definition,
      sections: definition.sections.filter(
        (section) => section.id !== 'reason'
      ),
    });
    const responses = {
      [RICHTEXT_ESHEET_DOCUMENT_FIELD_ID]: { answer: body },
    };
    const retired = getRichTextEsheetRetiredMdyFields({
      form: narrowed,
      responses,
    });
    expect(retired).toHaveLength(1);
    expect(retired[0]).toMatchObject({
      fieldId: reasonId,
      display: 'Field no longer configured',
    });
    // View/Export serialization normalizes the stale link the same way.
    const snapshot = createRichTextEsheetSnapshot(narrowed, responses);
    expect(snapshot.mdy).toContain('[Field no longer configured](mdy:doc_');
    expect(snapshot.mdy).not.toContain('Routine evaluation, please.');
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
