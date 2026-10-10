import { describe, expect, it } from 'vitest';
import { isMap, parseDocument } from 'yaml';
import {
  getEncounterFieldId,
  createEncounterFormDefinition,
} from './definition';
import {
  createEncounterMdy,
  encounterDocumentResponse,
  ENCOUNTER_DOCUMENT_FIELD_ID,
  getEncounterDocumentBody,
  getEncounterMdyFields,
  parseEncounterMdy,
  refreshEncounterMdyLinks,
  renderEncounterMdy,
  updateEncounterDocumentBody,
} from './mdy';
import { createEncounterSnapshot } from './model';
import type { EncounterResponses, EncounterVisitDefinition } from './types';

const definition: EncounterVisitDefinition = {
  id: 'visit',
  title: 'Visit note',
  sections: [
    { id: 'hpi', title: 'History', kind: 'narrative' },
    {
      id: 'exam',
      title: 'Examination',
      kind: 'observations',
      observations: [
        {
          id: 'pulse',
          label: 'Pulse',
          type: 'number',
          unit: '/min',
          code: { system: 'http://loinc.org', code: '8867-4' },
        },
        {
          id: 'tobacco',
          label: 'Tobacco use',
          type: 'choice',
          options: ['Yes', 'No'],
        },
      ],
    },
    { id: 'vitals', title: 'Vitals', kind: 'vitals' },
    { id: 'plan', title: 'Plan', kind: 'narrative' },
  ],
};

const hpiId = getEncounterFieldId('hpi');
const pulseId = getEncounterFieldId('exam', 'pulse');
const choiceId = getEncounterFieldId('exam', 'tobacco');
const vitalsId = getEncounterFieldId('vitals', 'value');

function snapshot(responses: EncounterResponses = {}) {
  return createEncounterSnapshot(definition, responses);
}

describe('Encounter MDY data and linked narrative', () => {
  it('writes legal native eSheet form/response with safe, stable aliases', () => {
    const responses = {
      [hpiId]: { answer: 'Back pain for two days.' },
      [pulseId]: { answer: '72' },
      [choiceId]: { selected: { id: 'No', value: 'No' } },
    };
    const source = createEncounterMdy(snapshot(responses));
    const parsed = parseEncounterMdy(source);
    expect(parsed.form).toEqual(createEncounterFormDefinition(definition));
    expect(parsed.response).toEqual(responses);
    expect(parsed.definition).toEqual(definition);
    expect(parsed.frontMatter?.mdy).toMatchObject({
      kind: 'document',
      schema: 'esheet',
    });
    expect(parsed.diagnostics).toEqual([]);
    const fields = getEncounterMdyFields(snapshot(responses));
    expect(new Set(fields.map(({ id }) => id)).size).toBe(fields.length);
    expect(fields.every(({ id }) => /^[a-z0-9_-]+$/.test(id))).toBe(true);
    for (const field of fields) {
      expect(parsed.body).toContain(`](mdy:${field.id})`);
      expect(parsed.frontMatter?.[field.id]).toMatchObject({
        fieldId: field.fieldId,
      });
    }
    expect(parsed.body).toContain('[72 /min]');
    expect(parsed.body).toContain('[No]');
    expect(parsed.body).toContain('[—]');
    expect(parsed.body).not.toContain('8867-4');
    expect(parsed.body).not.toContain('](mdy:encounter:');
    const reordered = {
      ...definition,
      sections: [...definition.sections].reverse(),
    };
    const reorderedFields = getEncounterMdyFields(
      createEncounterSnapshot(reordered, responses)
    );
    expect(reorderedFields.find(({ fieldId }) => fieldId === hpiId)?.id).toBe(
      fields.find(({ fieldId }) => fieldId === hpiId)?.id
    );
  });

  it('keeps grouped repeated vitals linked to one canonical custom response', () => {
    const value = {
      readings: [
        { id: 'first', systolic: 140, diastolic: 90, pulse: 80 },
        { id: 'repeat', systolic: 130, diastolic: 82, pulse: 74 },
      ],
    };
    const responses = { [vitalsId]: { answer: JSON.stringify(value) } };
    const current = snapshot(responses);
    const fields = getEncounterMdyFields(current);
    const vitals = fields.filter(({ fieldId }) => fieldId === vitalsId);
    expect(vitals).toHaveLength(1);
    expect(vitals[0].display).toContain('140/90 mmHg');
    expect(vitals[0].display).toContain('130/82 mmHg');
    expect(vitals[0].display).toContain('first');
    expect(vitals[0].display).toContain('repeat');
    const parsed = parseEncounterMdy(createEncounterMdy(current));
    expect(parsed.frontMatter?.[vitals[0].id]).toMatchObject({ value });
    expect(parsed.response).toEqual(responses);
  });

  it('preserves authored headings, unlinked prose, deleted projections and code', () => {
    const fields = getEncounterMdyFields(
      snapshot({ [hpiId]: { answer: 'Updated [finding]' } })
    );
    const hpi = fields.find(({ fieldId }) => fieldId === hpiId)!;
    const oldLink = `[Old](mdy:${hpi.id})`;
    const body = `# My heading\n\nA free paragraph. ${oldLink}\n\nUnlinked Old stays.\n\n\`${oldLink}\`\n\n\`\`\`md\n${oldLink}\n\`\`\`\n\n![Old](mdy:${hpi.id})\n`;
    const updated = refreshEncounterMdyLinks(body, fields);
    expect(updated).toContain(
      `A free paragraph. [Updated \\[finding\\]](mdy:${hpi.id})`
    );
    expect(updated).toContain('Unlinked Old stays.');
    expect(updated).toContain(`\`${oldLink}\``);
    expect(updated).toContain(`\`\`\`md\n${oldLink}\n\`\`\``);
    expect(updated).toContain(`![Old](mdy:${hpi.id})`);
    expect(refreshEncounterMdyLinks('# Authored\n\nNo links.', fields)).toBe(
      '# Authored\n\nNo links.'
    );
  });

  it('preserves imported YAML bytes on no-op and comments/provenance on data writes', () => {
    const originalSnapshot = snapshot({ [hpiId]: { answer: 'Original' } });
    const source = createEncounterMdy(originalSnapshot).replace(
      '---\n',
      "---\n# Keep this source comment.\nexternal: 'keep this quote' # unchanged metadata\n"
    );
    const parsed = parseEncounterMdy(source);
    expect(createEncounterMdy(originalSnapshot, parsed.body, source)).toBe(
      source
    );
    const document = parseDocument(parsed.frontMatterSource.slice(4, -4));
    document.setIn(['mdy', 'template'], {
      name: 'Imported template',
      version: '7.2',
    });
    const imported = `---\n${document.toString()}---\n${parsed.body}`;
    const updatedSnapshot = snapshot({ [hpiId]: { answer: 'Changed' } });
    const updated = createEncounterMdy(updatedSnapshot, undefined, imported);
    const updatedParsed = parseEncounterMdy(updated);
    expect(updated).toContain('# Keep this source comment.');
    expect(updated).toContain(
      "external: 'keep this quote' # unchanged metadata"
    );
    expect(updatedParsed.frontMatter?.mdy).toMatchObject({
      template: { name: 'Imported template', version: '7.2' },
    });
    expect(updatedParsed.response?.[hpiId].answer).toBe('Changed');
    expect(updatedParsed.body).toContain('[Changed]');
    expect(updatedParsed.body).not.toContain('[Original]');
  });

  it('carries imported front matter in the reserved answer without recursively embedding it', () => {
    const source = createEncounterMdy(
      snapshot({ [hpiId]: { answer: 'Clinical answer' } })
    );
    const imported = encounterDocumentResponse(source);
    const responses = {
      [hpiId]: { answer: 'Clinical answer' },
      [ENCOUNTER_DOCUMENT_FIELD_ID]: imported,
    };
    const updated = updateEncounterDocumentBody(responses, '# Authored body', {
      _ai: true,
    });
    expect(getEncounterDocumentBody(updated)).toBe('# Authored body');
    expect(updated[ENCOUNTER_DOCUMENT_FIELD_ID].attributes).toEqual(
      imported.attributes
    );
    expect(updated[ENCOUNTER_DOCUMENT_FIELD_ID]._ai).toBe(true);
    expect(updated[hpiId]).toBe(responses[hpiId]);
    const parsed = parseEncounterMdy(createEncounterMdy(snapshot(updated)));
    expect(parsed.body).toBe('# Authored body');
    expect(parsed.response).toEqual({ [hpiId]: { answer: 'Clinical answer' } });
    expect(parsed.response).not.toHaveProperty(ENCOUNTER_DOCUMENT_FIELD_ID);
    expect(
      getEncounterDocumentBody(updateEncounterDocumentBody(updated, ''))
    ).toBe('');
  });

  it('accepts CRLF and retains the full source when no data changed', () => {
    const current = snapshot({ [hpiId]: { answer: 'Original' } });
    const source = createEncounterMdy(current).replace(/\n/g, '\r\n');
    expect(createEncounterMdy(current, undefined, source)).toBe(source);
    expect(parseEncounterMdy(source).diagnostics).toEqual([]);
  });

  it('inserts a fence boundary when adding prose to a source ending at its fence', () => {
    const current = snapshot();
    const source = createEncounterMdy(current, '').trimEnd();
    expect(parseEncounterMdy(source).body).toBe('');
    const updated = createEncounterMdy(current, '# Added prose', source);
    expect(parseEncounterMdy(updated).body).toBe('# Added prose');
    expect(updated).toContain('---\n# Added prose');
  });

  it('reports invalid YAML/native response and dangling links without dropping source', () => {
    const bad = '---\nresponse: [invalid\n---\nBody remains.';
    expect(parseEncounterMdy(bad)).toMatchObject({
      source: bad,
      body: 'Body remains.',
      frontMatter: null,
    });
    expect(parseEncounterMdy(bad).diagnostics[0].code).toBe('frontmatter');
    const badResponse = createEncounterMdy(snapshot()).replace(
      'response: {}',
      'response: []'
    );
    expect(
      parseEncounterMdy(badResponse).diagnostics.some(
        ({ code }) => code === 'response'
      )
    ).toBe(true);
    const dangling = createEncounterMdy(
      snapshot(),
      '[Missing](mdy:unknown_field)'
    );
    expect(
      parseEncounterMdy(dangling).diagnostics.some(
        ({ code }) => code === 'dangling-link'
      )
    ).toBe(true);
  });

  it('accepts portable native eSheet MDY without optional encounter host metadata', () => {
    const source = createEncounterMdy(snapshot());
    const parsed = parseEncounterMdy(source);
    const document = parseDocument(parsed.frontMatterSource.slice(4, -4));
    document.delete('encounterDefinition');
    const portable = parseEncounterMdy(
      `---\n${document.toString()}---\n${parsed.body}`
    );
    expect(portable.form).toBeDefined();
    expect(portable.response).toEqual({});
    expect(portable.definition).toBeUndefined();
    expect(portable.diagnostics).toEqual([]);
  });

  it('renders real Templit markdown without evaluating authored template-looking text', async () => {
    const source = createEncounterMdy(
      snapshot(),
      '# Authored\n\nLiteral {{patient.name}} and {% for visit %}.'
    );
    const rendered = await renderEncounterMdy(source);
    expect(rendered.raw).toBe(
      '# Authored\n\nLiteral {{patient.name}} and {% for visit %}.'
    );
    expect(rendered.html).toContain('<h1>Authored</h1>');
    expect(rendered.html).toContain('{{patient.name}}');
    expect(rendered.raw).not.toContain('response:');
    expect(
      rendered.diagnostics.some(({ code }) => code === 'template-syntax')
    ).toBe(true);
  });

  it('renders multiline narrative as one safe linked projection with readable breaks', async () => {
    const narrative =
      'First paragraph.\n\nSecond paragraph.\n- one item\n- another item\n<script>alert(1)</script>';
    const source = createEncounterMdy(
      snapshot({ [hpiId]: { answer: narrative } })
    );
    const parsed = parseEncounterMdy(source);
    expect(parsed.response?.[hpiId].answer).toBe(narrative);
    expect(parsed.body).toContain(
      'First paragraph.<br><br>Second paragraph.<br>- one item'
    );
    const rendered = await renderEncounterMdy(source);
    expect(rendered.html).toContain(
      'First paragraph.<br><br>Second paragraph.<br>- one item'
    );
    expect(rendered.html).not.toContain('<script>');
    expect(rendered.html).toContain('&lt;script&gt;');
    const blankSource = createEncounterMdy(snapshot(), '# Entirely authored');
    expect(parseEncounterMdy(blankSource).diagnostics).toEqual([]);
  });

  it('preserves native form extensions and retained comments while removing fields', () => {
    const original = snapshot({ [hpiId]: { answer: 'Recorded history' } });
    const parsed = parseEncounterMdy(original.mdy);
    const document = parseDocument(parsed.frontMatterSource.slice(4, -4));
    document.setIn(['form', 'description'], 'Imported instructions');
    document.setIn(['form', 'pages', 0, 'hostPageKey'], 'Page extension');
    document.setIn(
      ['form', 'pages', 0, 'fields', 0, 'hostSectionKey'],
      'Section extension'
    );
    document.setIn(
      ['form', 'pages', 0, 'fields', 0, 'fields', 0, 'helpText'],
      'Imported help'
    );
    const section = document.getIn(['form', 'pages', 0, 'fields', 0], true);
    if (isMap(section))
      section.commentBefore = 'Retain this active section comment.';
    const imported = `---\n${document.toString()}---\n${parsed.body}`;
    const reduced = {
      ...definition,
      sections: definition.sections.slice(0, 3),
    };
    const updated = createEncounterMdy(
      createEncounterSnapshot(reduced, original.responses),
      undefined,
      imported
    );
    const data = parseEncounterMdy(updated).form as unknown as {
      description: string;
      pages: {
        hostPageKey: string;
        fields: { hostSectionKey: string; fields?: { helpText: string }[] }[];
      }[];
    };
    expect(data.description).toBe('Imported instructions');
    expect(data.pages[0].hostPageKey).toBe('Page extension');
    expect(data.pages[0].fields[0].hostSectionKey).toBe('Section extension');
    expect(data.pages[0].fields[0].fields?.[0].helpText).toBe('Imported help');
    expect(data.pages[0].fields).toHaveLength(3);
    expect(updated).toContain('#Retain this active section comment.');
  });

  it('removes retired aliases and replaces stale clinical text without changing native responses', async () => {
    const planId = getEncounterFieldId('plan');
    const original = snapshot({ [planId]: { answer: 'Old plan' } });
    const retired = getEncounterMdyFields(original).find(
      ({ fieldId }) => fieldId === planId
    )!;
    const reduced = {
      ...definition,
      sections: definition.sections.slice(0, 3),
    };
    const responses = {
      [planId]: { answer: 'Latest retained answer' },
      [ENCOUNTER_DOCUMENT_FIELD_ID]: encounterDocumentResponse(original.mdy),
    };
    const updated = createEncounterSnapshot(reduced, responses);
    const parsed = parseEncounterMdy(updated.mdy);
    expect(parsed.frontMatter).not.toHaveProperty(retired.id);
    expect(parsed.response?.[planId]).toEqual({
      answer: 'Latest retained answer',
    });
    expect(parsed.body).toContain('[Field no longer configured]');
    expect(parsed.body).not.toContain('[Old plan]');
    expect(
      parsed.diagnostics.some(({ code }) => code === 'dangling-link')
    ).toBe(true);
    const rendered = await renderEncounterMdy(updated.mdy);
    expect(rendered.raw).not.toContain('Old plan');
    expect(rendered.raw).toContain('Field no longer configured');
  });

  it('renders canonical response-only changes rather than stale cached BP/narrative projections', async () => {
    const original = snapshot({
      [hpiId]: { answer: 'Old narrative' },
      [vitalsId]: {
        answer: JSON.stringify({
          readings: [{ id: 'one', systolic: 140, diastolic: 90 }],
        }),
      },
    });
    const parsed = parseEncounterMdy(original.mdy);
    const document = parseDocument(parsed.frontMatterSource.slice(4, -4));
    document.setIn(
      ['response', hpiId, 'answer'],
      'Updated paragraph.\n\nA second paragraph.'
    );
    document.setIn(
      ['response', vitalsId, 'answer'],
      JSON.stringify({
        readings: [{ id: 'one', systolic: 128, diastolic: 82 }],
      })
    );
    const source = `---\n${document.toString()}---\n${parsed.body}\n\nAuthored discussion stays.`;
    const rendered = await renderEncounterMdy(source);
    expect(rendered.raw).toContain(
      'Updated paragraph.<br><br>A second paragraph.'
    );
    expect(rendered.raw).toContain('128/82 mmHg');
    expect(rendered.raw).not.toContain('140/90');
    expect(rendered.raw).not.toContain('Old narrative');
    expect(rendered.raw).toContain('Authored discussion stays.');
  });

  it('refreshes and diagnoses generic native projections changed outside the host', async () => {
    const original = snapshot({ [pulseId]: { answer: '72' } });
    const parsed = parseEncounterMdy(original.mdy);
    const document = parseDocument(parsed.frontMatterSource.slice(4, -4));
    document.delete('encounterDefinition');
    document.setIn(['response', pulseId, 'answer'], '80');
    const rendered = await renderEncounterMdy(
      `---\n${document.toString()}---\n${parsed.body}`
    );
    expect(rendered.raw).toContain('[80 /min]');
    expect(rendered.raw).not.toContain('[72 /min]');
    expect(
      rendered.diagnostics.some(
        ({ code, fieldId }) => code === 'response' && fieldId === pulseId
      )
    ).toBe(true);
  });

  it('preserves literal HTML entity text in the displayed native answer', async () => {
    const answer = 'Measured &lt;140; literal &amp; stays.';
    const rendered = await renderEncounterMdy(
      snapshot({ [hpiId]: { answer } }).mdy
    );
    const report = new globalThis.DOMParser().parseFromString(
      rendered.html ?? '',
      'text/html'
    );
    expect(report.body.textContent).toContain(answer);
    expect(rendered.html).toContain('&amp;lt;140');
  });

  it('consumes only the document envelope when authored prose begins with YAML-shaped fences', async () => {
    const body =
      '---\nframed: authored prose\n---\n\n# Authored heading\n\nThe framed text belongs to the report.';
    const source = createEncounterMdy(snapshot(), body);
    expect(parseEncounterMdy(source).body).toBe(body);
    const rendered = await renderEncounterMdy(source);
    expect(rendered.raw).toBe(body);
    expect(rendered.html).toContain('framed: authored prose');
    expect(rendered.html).toContain('Authored heading');
    expect(rendered.raw).not.toContain('encounterDefinition:');
  });
});
