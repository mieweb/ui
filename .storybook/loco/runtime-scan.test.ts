import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { filterLocoTextnodes, type LocoTextnode } from './live-sync';

// Exercises the vendored runtime itself, including the local Loco.scan() patch.
const runtimeSource = readFileSync(
  resolve(__dirname, 'static/loco.min.js'),
  'utf8'
);
const Loco = new Function(`${runtimeSource}\nreturn Loco;`)() as {
  scan: (root: Element) => Promise<LocoTextnode[]>;
};

function mount(html: string): HTMLElement {
  const root = document.createElement('main');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Loco.scan (vendored runtime patch)', () => {
  it('returns apply()-compatible keys without touching React-owned DOM', async () => {
    const root = mount('<label>Email<strong>*</strong></label>');
    const asterisk = root.querySelector('strong');
    const before = root.innerHTML;

    const nodes = await Loco.scan(root);

    expect(nodes.map((node) => node.key)).toContain('Email{{text:0}}');
    expect(root.innerHTML).toBe(before);
    expect(asterisk?.isConnected).toBe(true);
  });

  it('never keeps a phrase that embeds a nested protected name', async () => {
    const root = mount(
      '<p>👤 <span>Patient: <span translate="no">Jane Doe</span></span></p>'
    );
    const nodes = await Loco.scan(root);

    expect(nodes.map((node) => node.key)).toContain('Patient: Jane Doe');
    expect(
      filterLocoTextnodes(nodes, root).map((entry) => entry.key)
    ).not.toContain('Patient: Jane Doe');
  });

  it('rejects contexts truncated inside a protected heading name', async () => {
    const root = mount(
      '<section><h2><span>Visit summary prepared for the attending team:</span> <span translate="no">Jane Doe-Smith</span></h2><button>Save</button></section>'
    );
    const nodes = await Loco.scan(root);

    // The runtime cuts contexts at 60 characters, mid-name.
    expect(nodes.find((node) => node.key === 'Save')?.context).toMatch(/Jane Doe-Smit$/);
    expect(
      filterLocoTextnodes(nodes, root).map((entry) => entry.key)
    ).not.toContain('Save');
  });

  it('harvests text slots as their own keys, still privacy-filtered', async () => {
    const root = mount(
      '<p>Click <strong>Save</strong> to continue</p><p>Hello <strong translate="no">Jane Doe</strong> again</p>'
    );
    const keys = filterLocoTextnodes(await Loco.scan(root), root).map(
      (entry) => entry.key
    );

    expect(keys).toContain('Click{{text:0}}to continue');
    expect(keys).toContain('Save');
    expect(keys).not.toContain('Jane Doe');
  });

  it('skips mixed phrases whose rebuild would drop inline code', async () => {
    const root = mount(
      '<p><code>@mieweb/ui</code> brings that approach under its <a href="#">license terms</a>, not just MIE products.</p>'
    );
    const keys = filterLocoTextnodes(await Loco.scan(root), root).map(
      (entry) => entry.key
    );

    expect(keys.some((key) => key.startsWith('brings that approach'))).toBe(false);
    expect(keys).toContain('license terms');
  });

  it('recomputes contexts after a protected heading changes in place', async () => {
    const root = mount(
      '<section><h2 translate="no">Jane Doe</h2><button>Save</button></section>'
    );
    expect(filterLocoTextnodes(await Loco.scan(root), root)).toEqual([]);

    root.querySelector('h2')!.firstChild!.textContent = 'John Roe';
    const nodes = await Loco.scan(root);

    expect(nodes.find((node) => node.key === 'Save')?.context).toBe('John Roe');
    expect(filterLocoTextnodes(nodes, root)).toEqual([]);
  });
});
