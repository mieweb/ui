/**
 * Inline references through the real Kerebron editor and Markdown converter
 * (see markdownRoundTrip.test.ts for why the WASM grammars load from disk).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CoreEditor } from '@kerebron/editor';
import { DOMParser, DOMSerializer } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { createEditorKits } from './editorKits';
import {
  REFERENCE_NODE,
  createReferencesKit,
  deleteAdjacentReference,
  insertReference,
  linksToReferences,
  menuPlacement,
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

  it('opens no list inside a code block, which takes text alone', async () => {
    await editor.loadDocumentText(MARKDOWN_TYPE, '```\n@an\n```');
    caretAtEnd();
    expect(referenceQueryAt(editor.state, triggers)).toBeNull();
  });

  it('keeps the formatting being typed with on the chip and after it', async () => {
    await editor.loadDocumentText(MARKDOWN_TYPE, '**Ask @an**');
    caretAtEnd();
    const query = referenceQueryAt(editor.state, triggers)!;
    editor.view.dispatch(
      insertReference(editor.state, query, {
        kind: 'person',
        id: 'u-ann',
        label: '@Ann Lee',
      })
    );
    const markNames = (marks: readonly { type: { name: string } }[]) =>
      marks.map((m) => m.type.name);
    const { $from } = editor.state.selection;
    const chip = $from.doc.resolve($from.pos - 1).nodeBefore!;
    expect(chip.type.name).toBe(REFERENCE_NODE);
    expect(markNames(chip.marks)).toEqual(['strong']);
    expect(markNames($from.nodeBefore!.marks)).toEqual(['strong']);
    expect(markNames(editor.state.storedMarks ?? [])).toEqual(['strong']);
  });

  it('keeps a claimed link with a break in its text as one chip', async () => {
    const markdown = '[@Ann<br>Lee](/people/u-ann)';
    await editor.loadDocumentText(MARKDOWN_TYPE, markdown);
    expect(references()).toHaveLength(1);
    expect(await save()).toBe(markdown);
  });

  it('leaves a link split by a break node a link, not chips of its pieces', () => {
    // Kerebron's inline-HTML parser can import <br> inside a link without
    // the link mark, so the link reads as two runs of text around it.
    const { schema } = editor;
    const link = schema.marks.link.create({ href: '/people/u-ann' });
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('@Ann', [link]),
        schema.nodes.br.create(),
        schema.text('Lee', [link]),
        schema.text(' and '),
        schema.text('@Raj', [
          schema.marks.link.create({ href: '/people/u-raj' }),
        ]),
      ]),
    ]);
    let result = EditorState.create({ doc });
    linksToReferences(() => triggers)(result, (tr) => {
      result = result.apply(tr);
    });
    const kinds: string[] = [];
    result.doc.descendants((node) => {
      kinds.push(node.type.name === REFERENCE_NODE ? node.attrs.id : '');
    });
    expect(kinds.filter(Boolean)).toEqual(['u-raj']);
  });

  it('leaves a link with an image in its text a link, not chips of its pieces', () => {
    const { schema } = editor;
    const link = schema.marks.link.create({ href: '/people/u-ann' });
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('@Ann ', [link]),
        schema.nodes.image.create({ src: '/a.png' }, null, [link]),
        schema.text(' Lee', [link]),
      ]),
    ]);
    let result = EditorState.create({ doc });
    linksToReferences(() => triggers)(result, (tr) => {
      result = result.apply(tr);
    });
    let chips = 0;
    result.doc.descendants((node) => {
      if (node.type.name === REFERENCE_NODE) chips++;
    });
    expect(chips).toBe(0);
    expect(result.doc.eq(doc)).toBe(true);
  });

  it('makes a pasted chip only from a link a trigger claims, and never draws an unsafe href', () => {
    const { schema } = editor;
    const parse = (html: string) => {
      const dom = document.createElement('div');
      dom.innerHTML = html;
      const found: Record<string, string>[] = [];
      DOMParser.fromSchema(schema)
        .parse(dom)
        .descendants((node) => {
          if (node.type.name === REFERENCE_NODE) found.push(node.attrs);
        });
      return found;
    };
    const chip = (href: string) =>
      `<p><a href="${href}" data-reference-kind="person" data-reference-id="forged">@Ann</a></p>`;
    expect(parse(chip('javascript:alert(1)'))).toEqual([]);
    expect(parse(chip('java\tscript:alert(1)'))).toEqual([]);
    expect(parse(chip('https://example.com/'))).toEqual([]);
    // Kind and id come from the trigger, not the pasted attributes.
    expect(parse(chip('/people/u-ann'))).toEqual([
      { kind: 'person', id: 'u-ann', label: '@Ann', href: '/people/u-ann' },
    ]);

    const drawn = (href: string) =>
      (
        DOMSerializer.fromSchema(schema).serializeNode(
          schema.nodes[REFERENCE_NODE].create({
            kind: 'person',
            id: 'x',
            label: '@x',
            href,
          })
        ) as HTMLAnchorElement
      ).getAttribute('href');
    expect(drawn('javascript:alert(1)')).toBeNull();
    const drawnChip = DOMSerializer.fromSchema(schema).serializeNode(
      schema.nodes[REFERENCE_NODE].create({ label: '@Ann', href: '/x' })
    ) as HTMLElement;
    const label = drawnChip.querySelector('[data-slot="reference-chip-label"]');
    expect(label?.textContent).toBe('@Ann');
    expect(label?.getAttribute('dir')).toBe('auto');
    expect(drawn('/people/u-ann')).toBe('/people/u-ann');
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

describe('menuPlacement', () => {
  const screen = (height: number) => ({
    visibleLeft: 0,
    visibleRight: 1000,
    height,
    visibleTop: 0,
    visibleBottom: height,
  });

  it('opens below the caret with its full height when it fits', () => {
    expect(
      menuPlacement({ left: 40, top: 120, bottom: 140 }, 200, screen(800))
    ).toMatchObject({
      position: 'fixed',
      zIndex: 9999,
      top: 144,
      maxHeight: 224,
    });
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

  it('stays on screen when the caret scrolls out of view', () => {
    // Caret scrolled above the 800px viewport: the list pins to its top.
    expect(
      menuPlacement({ left: 40, top: -60, bottom: -40 }, 200, screen(800))
    ).toMatchObject({ top: 8, maxHeight: 224 });
    // Caret scrolled below it: the list opens above, pinned to its bottom.
    const pinned = menuPlacement(
      { left: 40, top: 900, bottom: 920 },
      200,
      screen(800)
    );
    expect(pinned).toMatchObject({ bottom: 8, maxHeight: 224 });
    expect(pinned).not.toHaveProperty('top');
  });

  it('is never wider than the screen', () => {
    const narrow = {
      visibleLeft: 0,
      visibleRight: 240,
      height: 600,
      visibleTop: 0,
      visibleBottom: 600,
    };
    expect(
      menuPlacement({ left: 100, top: 120, bottom: 140 }, 256, narrow)
    ).toMatchObject({ left: 8, maxWidth: 224 });
  });

  it('stays inside the visible area of a pinch-zoomed, panned page', () => {
    // 390px layout viewport zoomed 2×: only x 95–290 shows.
    const zoomed = {
      visibleLeft: 95,
      visibleRight: 290,
      height: 844,
      visibleTop: 0,
      visibleBottom: 400,
    };
    expect(
      menuPlacement({ left: 200, top: 120, bottom: 140 }, 256, zoomed)
    ).toMatchObject({ left: 103, maxWidth: 179 });
  });

  it('keeps clear of the status bar and an on-screen keyboard', () => {
    // A phone: 844px layout viewport, a 47px status bar, and a keyboard
    // covering everything below 450px. The caret sits at 165–185px.
    const phone = {
      visibleLeft: 0,
      visibleRight: 390,
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
