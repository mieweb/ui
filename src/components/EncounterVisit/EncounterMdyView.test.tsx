import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EncounterMdyView } from './EncounterMdyView';
import { getEncounterFieldId } from './definition';
import { parseEncounterMdy, type EncounterMdyField } from './mdy';
import { createEncounterSnapshot } from './model';
import { createEncounterReportHtml } from './report';
import type { EncounterVisitDefinition } from './types';

const definition: EncounterVisitDefinition = {
  id: 'view-test',
  title: 'Visit report',
  sections: [
    { id: 'hpi', title: 'History', kind: 'narrative' },
    {
      id: 'exam',
      title: 'Examination',
      kind: 'observations',
      observations: [{ id: 'pulse', label: 'Pulse', type: 'number' }],
    },
    { id: 'plan', title: 'Plan', kind: 'narrative' },
  ],
};

function field(id: string, label: string, empty: boolean): EncounterMdyField {
  return { id, label, empty, fieldId: id, sectionId: id, display: '—' };
}

function report(html: string, fields: EncounterMdyField[]) {
  return new globalThis.DOMParser().parseFromString(
    createEncounterReportHtml(html, fields),
    'text/html'
  ).body;
}

describe('Encounter MDY final report', () => {
  it('shows captured values without blank field prompts or empty section headings', async () => {
    const snapshot = createEncounterSnapshot(definition, {
      [getEncounterFieldId('hpi')]: { answer: 'Supplied history.' },
    });
    render(<EncounterMdyView source={snapshot.mdy} />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'History' })).toBeVisible()
    );
    expect(
      screen.getAllByRole('heading').map((heading) => heading.textContent)
    ).toEqual(['Visit report', 'History']);
    expect(screen.getByRole('region')).toHaveTextContent('Supplied history.');
    expect(screen.getByRole('region')).not.toHaveTextContent('Pulse:');
    expect(screen.getByRole('region')).not.toHaveTextContent('—');
    // Presentation must not rewrite the editable memory aids or responses.
    expect(parseEncounterMdy(snapshot.mdy).body).toContain('## Examination');
    expect(parseEncounterMdy(snapshot.mdy).body).toContain('[—]');
    expect(snapshot.responses[getEncounterFieldId('hpi')].answer).toBe(
      'Supplied history.'
    );
  });

  it('removes the whole empty report and restores a section when a value is captured', async () => {
    const blank = createEncounterSnapshot(definition, {
      [getEncounterFieldId('hpi')]: { answer: ' \n ' },
    });
    const { container, rerender } = render(
      <EncounterMdyView source={blank.mdy} />
    );
    await waitFor(() =>
      expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false')
    );
    expect(
      container.querySelector('.encounter-mdy-view')?.textContent?.trim()
    ).toBe('');
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
    const captured = createEncounterSnapshot(definition, {
      [getEncounterFieldId('exam', 'pulse')]: { answer: '0' },
    });
    rerender(<EncounterMdyView source={captured.mdy} />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Examination' })).toBeVisible()
    );
    expect(
      screen.getAllByRole('heading').map((heading) => heading.textContent)
    ).toEqual(['Visit report', 'Examination']);
    expect(screen.getByRole('region')).toHaveTextContent('Pulse: 0');
  });

  it('removes generated labels and empty list/table scaffolding, keeping populated rows', () => {
    const result = report(
      '<h1>Visit</h1><h2>Vitals</h2><ul>' +
        '<li><strong>Pulse:</strong> <a href="mdy:pulse">—</a></li>' +
        '<li><b>Pain score</b>: <a href="mdy:pain">—</a></li>' +
        '<li><strong>BP:</strong> <a href="mdy:bp">142/88</a></li></ul>' +
        '<h2>Empty table</h2><table><thead><tr><th>Field</th><th>Value</th></tr></thead>' +
        '<tbody><tr><td>Pulse</td><td><a href="mdy:pulse">—</a></td></tr></tbody></table>',
      [field('pulse', 'Pulse', true), field('pain', 'Pain score', true)]
    );
    expect(
      Array.from(result.querySelectorAll('li'), (row) => row.textContent)
    ).toEqual(['BP: 142/88']);
    expect(result.querySelector('table')).toBeNull();
    expect(result.textContent).not.toContain('Empty table');
    expect(result.textContent).not.toContain('Pulse');
    expect(result.textContent).not.toContain('Pain score');
  });

  it('keeps populated descendant headings and authored prose around empty links', () => {
    const result = report(
      '<h1>Visit</h1><h2>Exam</h2><h3>Blank system</h3>' +
        '<p><a href="mdy:empty">—</a></p>' +
        '<h3>Discussion</h3><p>Authored context. <a href="mdy:empty">—</a></p>' +
        '<h2>Heading only</h2><h3>Empty child</h3><p><br></p>',
      [field('empty', 'Empty', true)]
    );
    expect(
      Array.from(
        result.querySelectorAll('h1,h2,h3'),
        (node) => node.textContent
      )
    ).toEqual(['Visit', 'Exam', 'Discussion']);
    expect(result.textContent).toContain('Authored context.');
    expect(result.textContent).not.toContain('—');
  });

  it('keeps real em dash, zero and negative responses rather than treating display text as emptiness', () => {
    const result = report(
      '<h1>Visit</h1><h2>Entered values</h2><ul>' +
        '<li><a href="mdy:dash">—</a></li><li><a href="mdy:zero">0</a></li>' +
        '<li><a href="mdy:no">No</a></li></ul>',
      [
        field('dash', 'Dash', false),
        field('zero', 'Zero', false),
        field('no', 'No', false),
      ]
    );
    expect(
      Array.from(result.querySelectorAll('li'), (row) => row.textContent)
    ).toEqual(['—', '0', 'No']);
    expect(result.querySelectorAll('h1,h2')).toHaveLength(2);
  });

  it('preserves authored media, tables and code, and leaves ordinary fragments inert', () => {
    const result = report(
      '<h1>Visit</h1><h2>Illustration</h2><p><a href="mdy:empty">—</a><img src="/exam.png" alt="Exam sketch"></p>' +
        '<h2>Table</h2><table><tr><td>Authored table content.</td></tr></table>' +
        '<h2>Code</h2><pre><code>[—](mdy:empty)</code></pre>' +
        '<h2>Reference</h2><p><a href="#visit_summary">Authored bookmark</a></p>',
      [field('empty', 'Empty', true)]
    );
    expect(result.querySelector('img')?.getAttribute('alt')).toBe(
      'Exam sketch'
    );
    expect(result.querySelector('table')).not.toBeNull();
    expect(result.querySelector('pre')?.textContent).toBe('[—](mdy:empty)');
    // Only targets in the field index are MDY fragments; bookmarks stay prose.
    expect(result.querySelector('a[href="#visit_summary"]')?.textContent).toBe(
      'Authored bookmark'
    );
  });

  it('sanitizes before deciding whether a section has readable content', () => {
    const result = report(
      '<h1>Visit</h1><h2>Empty section</h2>' +
        '<p><strong>Empty:</strong><a href="mdy:empty">—</a><script>alert(1)</script></p>' +
        '<h2>Discussion</h2><p>Safe prose. <a href="https://example.test">Reference</a></p>',
      [field('empty', 'Empty', true)]
    );
    expect(result.textContent).not.toContain('Empty section');
    expect(result.querySelector('script')).toBeNull();
    expect(result.querySelector('a')?.getAttribute('rel')).toBe(
      'noopener noreferrer'
    );
    expect(result.textContent).toContain('Safe prose.');
  });

  it('preserves table column alignment and matching labels in authored prose', () => {
    const result = report(
      '<h1>Visit</h1><h2>Readings</h2>' +
        '<table><tr><th>AM</th><th>PM</th></tr><tr><td></td><td>138/82</td></tr></table>' +
        '<table><tr><td rowspan="2">First group</td><td>142/88</td></tr>' +
        '<tr><td></td></tr><tr><td>Second group</td><td>138/82</td></tr></table>' +
        '<h2>Discussion</h2><p><strong>Plan:</strong> No medication change. <a href="mdy:emptyPlan">—</a></p>',
      [field('emptyPlan', 'Plan', true)]
    );
    const rows = result.querySelectorAll('tr');
    expect(Array.from(rows[0].children, (cell) => cell.textContent)).toEqual([
      'AM',
      'PM',
    ]);
    expect(Array.from(rows[1].children, (cell) => cell.textContent)).toEqual([
      '',
      '138/82',
    ]);
    const groups = result.querySelectorAll('table')[1].querySelectorAll('tr');
    expect(groups).toHaveLength(3);
    expect(groups[0].firstElementChild?.getAttribute('rowspan')).toBe('2');
    expect(groups[1].textContent).toBe('');
    expect(groups[2].textContent).toBe('Second group138/82');
    expect(result.querySelector('strong')?.textContent).toBe('Plan:');
    expect(result.textContent).toContain('No medication change.');
    expect(result.textContent).not.toContain('—');
  });

  it('clears empty prompt content without shifting rowspan groups and drops empty span scaffolding', () => {
    const result = report(
      '<h1>Visit</h1><h2>Readings</h2>' +
        '<table><tr><td rowspan="2">First group</td><td>142/88</td></tr>' +
        '<tr><td><strong>Pulse:</strong> <a href="mdy:emptyPulse">—</a></td></tr>' +
        '<tr><td>Second group</td><td>138/82</td></tr></table>' +
        '<h2>Empty scaffold</h2><table>' +
        '<tr><th rowspan="2">Field</th><th>Value</th></tr>' +
        '<tr><td><strong>Pulse:</strong> <a href="mdy:emptyPulse">—</a></td></tr></table>',
      [field('emptyPulse', 'Pulse', true)]
    );
    expect(result.querySelectorAll('table')).toHaveLength(1);
    const rows = result.querySelectorAll('tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].firstElementChild?.getAttribute('rowspan')).toBe('2');
    expect(rows[0].textContent).toBe('First group142/88');
    expect(rows[1].children).toHaveLength(1);
    expect(rows[1].firstElementChild?.tagName).toBe('TD');
    expect(rows[1].textContent).toBe('');
    expect(rows[2].textContent).toBe('Second group138/82');
    expect(result.textContent).not.toContain('Pulse');
    expect(result.textContent).not.toContain('Empty scaffold');
  });

  it('keeps captured data in headings without retaining empty linked titles', () => {
    const result = report(
      '<h1>Visit</h1><h2><a href="mdy:history">Back pain.</a></h2>' +
        '<h2><a href="mdy:empty">—</a></h2><p>Authored paragraph.</p>',
      [field('history', 'History', false), field('empty', 'Empty', true)]
    );
    expect(
      Array.from(
        result.querySelectorAll('h1,h2'),
        (heading) => heading.textContent
      )
    ).toEqual(['Visit', 'Back pain.']);
    expect(result.textContent).toContain('Authored paragraph.');
    expect(
      result.querySelector('[data-encounter-captured-heading]')
    ).toBeNull();
  });

  it('keeps tables whose content lives in row-label headers, captions or captured header cells', () => {
    const result = report(
      '<h1>Visit</h1><h2>Grids</h2>' +
        '<table><tr><th>Morning readings</th><td><a href="mdy:am">—</a></td></tr></table>' +
        '<table><caption>Authored caption</caption>' +
        '<tr><th>Pulse</th><td><a href="mdy:pulse">—</a></td></tr></table>' +
        '<table><tr><th><a href="mdy:weight">82 kg</a></th></tr>' +
        '<tr><td><a href="mdy:am">—</a></td></tr></table>',
      [
        field('am', 'AM', true),
        field('pulse', 'Pulse', true),
        field('weight', 'Weight', false),
      ]
    );
    const tables = result.querySelectorAll('table');
    expect(tables).toHaveLength(3);
    expect(tables[0].textContent).toContain('Morning readings');
    expect(tables[1].textContent).toBe('Authored caption');
    expect(tables[2].textContent).toContain('82 kg');
    expect(result.querySelector('[data-encounter-captured-field]')).toBeNull();
  });

  it('removes a prompt row whose labels sit in separate plain cells', () => {
    const result = report(
      '<h1>Visit</h1><h2>Vitals</h2>' +
        '<table><tr><td>Pulse</td><td><a href="mdy:pulse">—</a></td>' +
        '<td>Temperature</td><td><a href="mdy:temp">—</a></td></tr>' +
        '<tr><td>BP</td><td>142/88</td></tr></table>',
      [field('pulse', 'Pulse', true), field('temp', 'Temperature', true)]
    );
    expect(
      Array.from(result.querySelectorAll('tr'), (row) => row.textContent)
    ).toEqual(['BP142/88']);
  });

  it('keeps a spanning label cell when clearing an empty prompt row beneath it', () => {
    const result = report(
      '<h1>Visit</h1><h2>Readings</h2>' +
        '<table><tr><td rowspan="2">Pulse</td>' +
        '<td><strong>Pulse:</strong> <a href="mdy:am">—</a></td></tr>' +
        '<tr><td>80</td></tr><tr><td>BP</td><td>142/88</td></tr></table>',
      [field('am', 'Pulse', true)]
    );
    const rows = result.querySelectorAll('tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].firstElementChild?.getAttribute('rowspan')).toBe('2');
    expect(rows[0].textContent).toBe('Pulse');
    expect(rows[1].textContent).toBe('80');
    expect(rows[2].textContent).toBe('BP142/88');
  });

  it('never prunes a row holding a captured value that matches an empty prompt label', () => {
    const result = report(
      '<h1>Visit</h1><h2>Vitals</h2>' +
        '<ul><li><a href="mdy:status">Pulse</a> <strong>Pulse:</strong> ' +
        '<a href="mdy:pulse">—</a></li></ul>',
      [field('status', 'Status', false), field('pulse', 'Pulse', true)]
    );
    expect(
      Array.from(result.querySelectorAll('li'), (row) => row.textContent)
    ).toEqual(['Pulse Pulse: ']);
    expect(result.querySelector('[data-encounter-captured-field]')).toBeNull();
  });

  it('uses a captured heading as the boundary when pruning the empty section before it', () => {
    const result = report(
      '<h1>Visit</h1><h2>Empty section</h2><p><a href="mdy:empty">—</a></p>' +
        '<h2><a href="mdy:cc">Headache</a></h2><p>Notes.</p>',
      [field('empty', 'Empty', true), field('cc', 'Chief complaint', false)]
    );
    expect(
      Array.from(
        result.querySelectorAll('h1,h2'),
        (heading) => heading.textContent
      )
    ).toEqual(['Visit', 'Headache']);
    expect(result.textContent).not.toContain('Empty section');
    expect(result.textContent).toContain('Notes.');
  });
});
