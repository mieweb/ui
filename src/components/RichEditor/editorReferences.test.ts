/**
 * Inline references through the real Kerebron editor and Markdown converter
 * (see markdownRoundTrip.test.ts for why the WASM grammars load from disk).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CoreEditor } from '@kerebron/editor';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { createEditorKits } from './editorKits';
import {
  REFERENCE_NODE,
  createReferencesKit,
  deleteAdjacentReference,
  insertReference,
  referenceQueryAt,
  referencesToLinks,
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

afterAll(async () => {
  // Kerebron's debounced Markdown snapshot (800ms, not cancelled by
  // destroy()) would fire after jsdom is torn down; let it flush first, as
  // markdownRoundTrip.test.ts does.
  await new Promise((resolve) => setTimeout(resolve, 850));
  editor?.destroy();
});

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

  it('carries formatting around a claimed link onto the chip and back', async () => {
    const marksOf = (type: string) => {
      const found: string[] = [];
      editor.state.doc.descendants((node) => {
        if (
          node.type.name === type ||
          node.marks.some((m) => m.type.name === 'link')
        )
          found.push(...node.marks.map((m) => m.type.name));
      });
      return found.sort();
    };
    await editor.loadDocumentText(
      MARKDOWN_TYPE,
      'Ask **[@Ann Lee](/people/u-ann)** today.'
    );
    expect(marksOf(REFERENCE_NODE)).toEqual(['strong']);

    referencesToLinks(editor.state, (tr) => editor.view.dispatch(tr));
    expect(marksOf(REFERENCE_NODE)).toEqual(['link', 'strong']);
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

  it('opens after a hard break, and never spans a chip', async () => {
    await editor.loadDocumentText(MARKDOWN_TYPE, 'Ask\\\n@an');
    caretAtEnd();
    const query = referenceQueryAt(editor.state, triggers)!;
    expect(query.query).toBe('an');
    expect(editor.state.doc.textBetween(query.from, query.to)).toBe('@an');

    // `@` then a chip: the chip isn't query text, so picking can't replace it.
    await editor.loadDocumentText(MARKDOWN_TYPE, 'Ask @[@Ann](/people/u-ann)');
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

  it('leaves chips alone on Backspace when the editor is read-only', async () => {
    await editor.loadDocumentText(MARKDOWN_TYPE, 'Ask [@Ann](/people/u-ann)');
    caretAtEnd();
    const view = editor.view as EditorView;
    const backspace = () =>
      view.someProp('handleKeyDown', (handle) =>
        handle(view, new KeyboardEvent('keydown', { key: 'Backspace' }))
      );
    editor.view.setProps({ editable: () => false });
    try {
      expect(backspace()).toBeFalsy();
      expect(references()).toHaveLength(1);
    } finally {
      editor.view.setProps({ editable: () => true });
    }
    expect(backspace()).toBe(true);
    expect(references()).toEqual([]);
  });
});
