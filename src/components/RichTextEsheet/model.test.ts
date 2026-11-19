import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '@esheet/core';
import {
  getRichTextEsheetFieldId,
  withRichTextEsheetParties,
} from './definition';
import {
  createRichTextEsheetMdy,
  getRichTextEsheetMdyFields,
  getRichTextEsheetMdyParties,
  getRichTextEsheetRetiredMdyFields,
  parseRichTextEsheetMdy,
  renderRichTextEsheetMdy,
  richTextEsheetDocumentResponse,
  RICHTEXT_ESHEET_DOCUMENT_FIELD_ID,
} from './mdy';
import { createRichTextEsheetSnapshot } from './model';

const form = {
  id: 'referral-letter',
  title: 'Referral letter',
  pages: [
    {
      id: 'referral-letter:document',
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
                narrativeFindings: [],
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

const reasonId = getRichTextEsheetFieldId('reason');

describe('createRichTextEsheetSnapshot', () => {
  it('serializes in-place form edits in subsequent snapshots', () => {
    const draft = globalThis.structuredClone(form);
    // The same input object is reused across calls: nothing may cache views.
    const input = { form: draft, responses: {} };
    expect(createRichTextEsheetMdy(input)).toContain('## Reason');
    (draft.pages[0].fields![0] as { title?: string }).title = 'Chief complaint';
    expect(createRichTextEsheetMdy(input)).toContain('## Chief complaint');
    // Projection labels come from the live section views, never a cache.
    const labels = getRichTextEsheetMdyFields(input).map(
      (field) => field.label
    );
    expect(labels).toContain('Chief complaint');
    expect(labels).not.toContain('Reason');
  });

  it('strips stamped party macros from the persisted form', () => {
    // Pre-#772 native-only saves stamped party macros into the form itself.
    const stamped = withRichTextEsheetParties(form, parties);
    const cleared = createRichTextEsheetSnapshot(stamped, {}, []);
    expect(cleared.mdy).not.toContain('Jordan Rivera');
    const replaced = createRichTextEsheetSnapshot(stamped, {}, [
      { role: 'Patient', name: 'Avery Lane' },
    ]);
    // The replacement lives in the parties front matter, never in the form.
    expect(replaced.mdy).not.toContain('Jordan Rivera');
    expect(replaced.mdy).toContain('name: Avery Lane');
    expect(replaced.mdy.split('Avery Lane')).toHaveLength(2);
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
    const selectionForm = {
      id: 'referral-letter',
      title: 'Referral letter',
      pages: [
        {
          id: 'referral-letter:document',
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
                  fieldType: 'customChoice',
                  question: 'Reason',
                  required: true,
                  width: 'full',
                },
              ],
            },
          ],
        },
      ],
    } as unknown as FormDefinition;
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
    expect(parsed.form).toEqual(form);
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

  it('scrubs the removed legacy richTextEsheet key on re-save', () => {
    // A transition-era document may carry the pre-#772 schema key alongside
    // the native form; the engine otherwise preserves imported front matter.
    const imported = createRichTextEsheetMdy(input).replace(
      '---\n',
      '---\nrichTextEsheet:\n  id: letter\n  title: Legacy\n  sections: []\n'
    );
    expect(imported).toContain('richTextEsheet:');
    const resaved = createRichTextEsheetMdy(input, undefined, imported);
    expect(resaved).not.toContain('richTextEsheet');
    expect(parseRichTextEsheetMdy(resaved).form).toEqual(form);
  });

  it('drops removed field rules instead of resurrecting them on re-save', () => {
    const ruledForm = globalThis.structuredClone(form);
    const section = ruledForm.pages[0].fields![0] as unknown as {
      fields: Record<string, unknown>[];
    };
    section.fields[0].rules = [
      { effect: 'show', condition: { field: 'richtext:reason:value' } },
    ];
    const imported = createRichTextEsheetMdy({ ...input, form: ruledForm });
    expect(imported).toContain('rules:');
    const resaved = createRichTextEsheetMdy(input, undefined, imported);
    expect(resaved).not.toContain('rules:');
    expect(parseRichTextEsheetMdy(resaved).form).toEqual(form);
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
      form: {
        ...form,
        pages: [{ ...form.pages[0], fields: form.pages[0].fields!.slice(1) }],
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

  it('retires removed-section links in locally authored drafts too', () => {
    // Authoring in RichEdit stores only the body — no imported front matter
    // to index retired links from; they are found in the prose itself.
    const body = parseRichTextEsheetMdy(createRichTextEsheetMdy(input)).body;
    const narrowed = {
      ...form,
      pages: [{ ...form.pages[0], fields: form.pages[0].fields!.slice(1) }],
    };
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
