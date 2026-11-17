import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '@esheet/core';
import {
  createMdyDocumentEngine,
  type MdyDocumentSnapshot,
} from './documentMdy';

const engine = createMdyDocumentEngine<MdyDocumentSnapshot>({
  documentFieldId: 'document:body',
  linkPrefix: 'doc',
  engineName: 'esheet',
  missingFrontMatterMessage: 'Missing front matter.',
  sourceDataProperties: [],
});

// Nested sections regressed to indistinguishable rows under the outer
// heading (mieweb/ui#773 review): Limbs → Left/Right → Strength must keep
// each side's heading, in source order, with interleaved fields attributed.
const form: FormDefinition = {
  id: 'nested-doc',
  title: 'Nested document',
  pages: [
    {
      id: 'page-1',
      fields: [
        {
          id: 'limbs',
          fieldType: 'section',
          title: 'Limbs',
          fields: [
            { id: 'overview', fieldType: 'text', question: 'Overview' },
            {
              id: 'left',
              fieldType: 'section',
              title: 'Left',
              fields: [
                {
                  id: 'left-strength',
                  fieldType: 'text',
                  question: 'Strength',
                },
              ],
            },
            {
              id: 'right',
              fieldType: 'section',
              title: 'Right',
              fields: [
                {
                  id: 'right-strength',
                  fieldType: 'text',
                  question: 'Strength',
                },
              ],
            },
            { id: 'summary', fieldType: 'text', question: 'Summary' },
          ],
        },
      ],
    },
  ],
} as unknown as FormDefinition;

describe('MDY document engine nested sections', () => {
  it('keeps nested section headings and source order in the generated body', () => {
    const source = engine.create({ form, responses: {} });
    const { body, diagnostics } = engine.parse(source);
    expect(diagnostics).toEqual([]);
    const at = (text: string) => {
      const index = body.indexOf(text);
      expect(index, text).toBeGreaterThanOrEqual(0);
      return index;
    };
    const overview = at(`**Overview:** [—](mdy:${engine.linkId('overview')})`);
    const left = at('### Left');
    const leftStrength = at(
      `**Strength:** [—](mdy:${engine.linkId('left-strength')})`
    );
    const right = at('### Right');
    const rightStrength = at(
      `**Strength:** [—](mdy:${engine.linkId('right-strength')})`
    );
    const summary = at(`**Summary:** [—](mdy:${engine.linkId('summary')})`);
    expect(at('## Limbs')).toBeLessThan(overview);
    expect(overview).toBeLessThan(left);
    expect(left).toBeLessThan(leftStrength);
    expect(leftStrength).toBeLessThan(right);
    expect(right).toBeLessThan(rightStrength);
    expect(rightStrength).toBeLessThan(summary);
    // The interrupted parent section reopens so Summary stays attributed.
    const reopened = body.lastIndexOf('## Limbs');
    expect(reopened).toBeGreaterThan(rightStrength);
    expect(reopened).toBeLessThan(summary);
  });

  it('projects each nested field against its innermost section', () => {
    const fields = engine.fields({ form, responses: {} });
    const byFieldId = Object.fromEntries(
      fields.map((field) => [field.fieldId, field])
    );
    expect(byFieldId['overview'].sectionId).toBe('limbs');
    expect(byFieldId['left-strength'].sectionId).toBe('left');
    expect(byFieldId['right-strength'].sectionId).toBe('right');
    expect(byFieldId['summary'].sectionId).toBe('limbs');
  });
});
