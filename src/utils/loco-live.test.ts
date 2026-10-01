import { describe, expect, it } from 'vitest';
import { filterLocoTextnodes, type LocoTextnode } from './loco-live';

// Mirrors Loco.textnodes(): one entry per phrase, pointing at its element.
function nodesFrom(html: string): { root: HTMLElement; nodes: LocoTextnode[] } {
  const root = document.createElement('div');
  root.innerHTML = html;
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>('[data-key]')
  ).map((element) => ({
    key: element.dataset.key ?? '',
    context: element.dataset.context ?? '',
    element,
  }));
  return { root, nodes };
}

function keys(html: string): string[] {
  const { root, nodes } = nodesFrom(html);
  return filterLocoTextnodes(nodes, root).map((entry) => entry.key);
}

describe('filterLocoTextnodes', () => {
  it('passes runtime keys and contexts through unchanged', () => {
    const { root, nodes } = nodesFrom(
      '<label data-key="Email{{text:0}}" data-context="Contact form">Email<strong>*</strong></label>'
    );
    expect(filterLocoTextnodes(nodes, root)).toEqual([
      { key: 'Email{{text:0}}', context: 'Contact form' },
    ]);
  });

  it('skips text that may carry PII', () => {
    expect(
      keys(
        [
          '<p data-key="jamie.rivera@bluehive.com"></p>',
          '<p data-key="https://example.com/patient"></p>',
          '<p data-key="MRN 00482913"></p>',
          '<p data-key="Call (555) 123-4567"></p>',
          '<p data-key="SSN 123-45-6789"></p>',
          '<p data-key="DOB 04/12/1987"></p>',
          '<p data-key="Save"></p>',
        ].join('')
      )
    ).toEqual(['Save']);
  });

  it('skips phrases nested anywhere under code, pre or svg', () => {
    expect(
      keys(
        '<pre><code><span data-key="const x"></span></code></pre><svg><text data-key="Chart label"></text></svg><p data-key="Save"></p>'
      )
    ).toEqual(['Save']);
  });

  it('honors data-loco-ignore and translate="no" regions', () => {
    expect(
      keys(
        '<p data-key="Patient"></p><div data-loco-ignore="true"><p data-key="Jane Doe"></p></div><span translate="no" data-key="Dr. Jamie Rivera"></span>'
      )
    ).toEqual(['Patient']);
  });

  it('drops phrases outside the scan root and duplicates', () => {
    const { root, nodes } = nodesFrom(
      '<p data-key="Save"></p><p data-key="Save"></p>'
    );
    const outside = document.createElement('p');
    expect(
      filterLocoTextnodes(
        [...nodes, { key: 'Storybook chrome', context: '', element: outside }],
        root
      ).map((entry) => entry.key)
    ).toEqual(['Save']);
  });
});
