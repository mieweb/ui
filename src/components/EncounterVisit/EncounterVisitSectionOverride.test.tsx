import * as React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EncounterVisit } from './EncounterVisit';
import type { EncounterVisitDefinition } from './types';

const definition: EncounterVisitDefinition = {
  id: 'section-override-visit',
  title: 'Section override',
  sections: [{ id: 'hpi', title: 'HPI', kind: 'narrative' }],
};

/**
 * Must stay in its own test file: eSheet's one-time stock component
 * registration (which overwrites the encounter `section` override) only runs
 * on the first EsheetRenderer mount in a module graph, so this file exercises
 * the true first-mount ordering. The assertion locks the integration outcome
 * — the very first mounted visit must paint encounter section chrome — so a
 * future eSheet that registers or mounts fields earlier cannot silently
 * regress it.
 */
describe('EncounterVisit section override vs eSheet default registration', () => {
  it('renders encounter section chrome on the very first renderer mount', () => {
    const { container } = render(<EncounterVisit definition={definition} />);
    // The encounter override renders a plain labelled div + h3; the stock
    // SectionField renders a <section> element instead.
    expect(
      container.querySelector('div.section-field-preview > h3')
    ).not.toBeNull();
    expect(container.querySelector('section.section-field-preview')).toBeNull();
  });
});
