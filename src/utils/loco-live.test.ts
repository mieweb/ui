import { describe, expect, it } from 'vitest';
import { collectLocoKeysFromElement } from './loco-live';

function collect(html: string): string[] {
  const root = document.createElement('div');
  root.innerHTML = html;
  return collectLocoKeysFromElement(root).map((entry) => entry.key);
}

describe('collectLocoKeysFromElement', () => {
  it('collects UI phrases from text and labelling attributes', () => {
    expect(
      collect(
        '<h1>Edit Contact</h1><button aria-label="Close dialog">x</button><input placeholder="Search" />'
      )
    ).toEqual(['Edit Contact', 'Close dialog', 'Search']);
  });

  it('skips text that may carry PII', () => {
    expect(
      collect(
        [
          '<p>jamie.rivera@bluehive.com</p>',
          '<p>https://example.com/patient</p>',
          '<p>MRN 00482913</p>',
          '<p>Call (555) 123-4567</p>',
          '<p>SSN 123-45-6789</p>',
          '<p>DOB 04/12/1987</p>',
          '<p>Save</p>',
        ].join('')
      )
    ).toEqual(['Save']);
  });

  it('skips text nested anywhere under code, pre or svg', () => {
    expect(
      collect(
        '<pre><code><span>const x</span></code></pre><svg><text>Chart label</text></svg><p>Save</p>'
      )
    ).toEqual(['Save']);
  });

  it('honors data-loco-ignore and translate="no" regions', () => {
    expect(
      collect(
        '<p>Patient</p><div data-loco-ignore="true"><p>Jane Doe</p></div><span translate="no">Dr. Jamie Rivera</span>'
      )
    ).toEqual(['Patient']);
  });
});
