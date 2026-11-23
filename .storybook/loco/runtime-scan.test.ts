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
