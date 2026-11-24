import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { filterLocoTextnodes, type LocoTextnode } from './live-sync';

// Exercises the unmodified vendored runtime: the filters run on its real phrases.
const runtimeSource = readFileSync(
  resolve(__dirname, 'static/loco.min.js'),
  'utf8'
);
const Loco = new Function(`${runtimeSource}\nreturn Loco;`)() as {
  rescan: () => Promise<unknown>;
  textnodes: () => LocoTextnode[];
};

// What live sync does while no translations are loaded (rescan() is read-only then).
async function scan(): Promise<LocoTextnode[]> {
  await Loco.rescan();
  return Loco.textnodes();
}

function mount(html: string): HTMLElement {
  const root = document.createElement('main');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

beforeEach(() => {
  // Outside file mode rescan() also registers phrases with the (absent) Loco server.
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}'))));
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('live sync on the Loco runtime', () => {
  it('scans apply()-compatible keys without touching the DOM before any apply', async () => {
    const root = mount('<label>Email<strong>*</strong></label>');
    const asterisk = root.querySelector('strong');
    const before = root.innerHTML;

    const nodes = await scan();

    expect(nodes.map((node) => node.key)).toContain('Email{{text:0}}');
    expect(root.innerHTML).toBe(before);
    expect(asterisk?.isConnected).toBe(true);
  });

  it('never keeps a phrase that embeds a nested protected name', async () => {
    const root = mount(
      '<p>👤 <span>Patient: <span translate="no">Jane Doe</span></span></p>'
    );
    const nodes = await scan();

    expect(nodes.map((node) => node.key)).toContain('Patient: Jane Doe');
    expect(
      filterLocoTextnodes(nodes, root).map((entry) => entry.key)
    ).not.toContain('Patient: Jane Doe');
  });

  it('rejects contexts truncated inside a protected heading name', async () => {
    const root = mount(
      '<section><h2><span>Visit summary prepared for the attending team:</span> <span translate="no">Jane Doe-Smith</span></h2><button>Save</button></section>'
    );
    const nodes = await scan();

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
    const keys = filterLocoTextnodes(await scan(), root).map(
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
    const keys = filterLocoTextnodes(await scan(), root).map(
      (entry) => entry.key
    );

    expect(keys.some((key) => key.startsWith('brings that approach'))).toBe(false);
    // A translated slot alone also makes apply() rebuild the paragraph, so skip slots too.
    expect(keys).not.toContain('license terms');
  });
});
