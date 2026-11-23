/**
 * Inline references through the real Kerebron editor and Markdown converter
 * (see markdownRoundTrip.test.ts for why the WASM grammars load from disk).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CoreEditor } from '@kerebron/editor';
import { TextSelection } from 'prosemirror-state';
import { createEditorKits } from './editorKits';
import {
  REFERENCE_NODE,
  createReferencesKit,
  deleteAdjacentReference,
  insertReference,
  menuPlacement,
  referenceQueryAt,
} from './editorReferences';
import type { ReferenceTrigger } from '../ReferenceChip/references';

const MARKDOWN_TYPE = 'text/x-markdown';
const assetsDir = path.join(
  import.meta.dirname,
  '../../../node_modules/@kerebron/wasm/assets'
);
const assetLoad = async (name: string) =>
  new Uint8Array(await readFile(path.join(assetsDir, name)));

const trigger = (
  kind: string,
  char: string,
  prefix: string
): ReferenceTrigger => ({
  kind,
  char,
  label: kind,
  search: () => [],
  toHref: (id) => `${prefix}${id}`,
  fromHref: (href) =>
    href.startsWith(prefix) ? href.slice(prefix.length) : null,
});
const triggers = [
  trigger('person', '@', '/people/'),
  trigger('ticket', '#', '/tickets/'),
];

let editor: CoreEditor;

const save = async () =>
  new TextDecoder().decode(await editor.saveDocument(MARKDOWN_TYPE)).trim();
const references = () => {
  const found: { kind: string; id: string; label: string }[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === REFERENCE_NODE) {
      const { kind, id, label } = node.attrs;
      found.push({ kind, id, label });
    }
  });
  return found;
};
/** Puts the caret at the end of the first paragraph. */
const caretAtEnd = () => {
  const end = editor.state.doc.firstChild!.nodeSize - 1;
  editor.view.dispatch(
    editor.state.tr.setSelection(TextSelection.create(editor.state.doc, end))
  );
};

beforeAll(async () => {
  const { kits } = await createEditorKits();
  editor = CoreEditor.create({
    element: document.body.appendChild(document.createElement('div')),
    uri: 'file:///untitled.md',
    assetLoad,
    editorKits: [...kits, createReferencesKit(() => triggers)],
  });
});

afterAll(() => editor?.destroy());

describe('references in RichEditor', () => {
  it('loads claimed links as chips and saves them back as the same links', async () => {
    const markdown =
      'Ask [@Ann Lee](/people/u-ann) about [TH-12: Fix login](/tickets/t-12), see [docs](https://example.com).';
    await editor.loadDocumentText(MARKDOWN_TYPE, markdown);
    expect(references()).toEqual([
      { kind: 'person', id: 'u-ann', label: '@Ann Lee' },
      { kind: 'ticket', id: 't-12', label: 'TH-12: Fix login' },
    ]);
    expect(await save()).toBe(markdown);
  });

  it('leaves links no trigger claims as ordinary links', async () => {
    await editor.loadDocumentText(MARKDOWN_TYPE, '[docs](https://example.com)');
    expect(references()).toEqual([]);
  });

  it('finds the trigger query before the caret, but not inside an address', async () => {
    await editor.loadDocumentText(MARKDOWN_TYPE, 'Ask #fix');
    caretAtEnd();
    const query = referenceQueryAt(editor.state, triggers);
    expect(query?.trigger.kind).toBe('ticket');
    expect(query?.query).toBe('fix');

    await editor.loadDocumentText(MARKDOWN_TYPE, 'mail ann@example');
    caretAtEnd();
    expect(referenceQueryAt(editor.state, triggers)).toBeNull();
  });

  it('inserts a pick as one chip that Backspace removes whole', async () => {
    await editor.loadDocumentText(MARKDOWN_TYPE, 'Ask @an');
    caretAtEnd();
    const query = referenceQueryAt(editor.state, triggers)!;
    editor.view.dispatch(
      insertReference(editor.state, query, {
        kind: 'person',
        id: 'u-ann',
        label: '@Ann Lee',
      })
    );
    expect(await save()).toBe('Ask [@Ann Lee](/people/u-ann)');

    // Caret after the trailing space: delete it, then Backspace the chip.
    const { from } = editor.state.selection;
    editor.view.dispatch(editor.state.tr.delete(from - 1, from));
    editor.view.dispatch(deleteAdjacentReference(editor.state, 'backward')!);
    expect(references()).toEqual([]);
    expect(await save()).toBe('Ask');
  });
});

describe('menuPlacement', () => {
  const screen = (height: number) => ({
    width: 1000,
    height,
    visibleTop: 0,
    visibleBottom: height,
  });

  it('opens below the caret with its full height when it fits', () => {
    expect(
      menuPlacement({ left: 40, top: 120, bottom: 140 }, 200, screen(800))
    ).toMatchObject({ top: 144, maxHeight: 224 });
  });

  it('takes the roomier side and caps its height when neither fits', () => {
    // 300px viewport: 148px below the caret, 108px above.
    expect(
      menuPlacement({ left: 40, top: 120, bottom: 140 }, 200, screen(300))
    ).toMatchObject({ top: 144, maxHeight: 148 });
    // Lower caret: 68px below, 188px above.
    const above = menuPlacement(
      { left: 40, top: 200, bottom: 220 },
      200,
      screen(300)
    );
    expect(above).toMatchObject({ bottom: 104, maxHeight: 188 });
    expect(above).not.toHaveProperty('top');
  });

  it('keeps clear of the status bar and an on-screen keyboard', () => {
    // A phone: 844px layout viewport, a 47px status bar, and a keyboard
    // covering everything below 450px. The caret sits at 165–185px.
    const phone = {
      width: 390,
      height: 844,
      visibleTop: 47,
      visibleBottom: 450,
    };
    const caret = { left: 300, top: 165, bottom: 185 };
    // 253px above the keyboard fits the list below, not under the status bar.
    expect(menuPlacement(caret, 200, phone)).toMatchObject({
      top: 189,
      maxHeight: 224,
    });
    // A caret near the keyboard opens above, measured from the layout
    // viewport's bottom and capped to the room under the status bar.
    const lowCaret = { left: 300, top: 400, bottom: 420 };
    expect(menuPlacement(lowCaret, 200, phone)).toMatchObject({
      bottom: 448,
      maxHeight: 224,
    });
    const nearTop = { left: 300, top: 200, bottom: 220 };
    expect(
      menuPlacement(nearTop, 200, { ...phone, visibleBottom: 300 })
    ).toMatchObject({ bottom: 648, maxHeight: 141 });
  });
});
