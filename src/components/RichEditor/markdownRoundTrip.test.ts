/**
 * Markdown round-trip tests for the marks RichEditor's kit enables.
 *
 * Unlike `RichEditor.test.tsx` (which mocks Kerebron entirely), this builds a
 * real `CoreEditor` with the same kit assembly RichEditor uses, loads the
 * tree-sitter WASM grammars from `@kerebron/wasm`'s assets on disk, and
 * round-trips markdown through the real converters. It exists to pin the
 * `@kerebron/extension-markdown` mark-table patch (see pnpm-workspace.yaml):
 * without it, highlight/superscript/subscript are silently dropped on
 * serialize (mieweb/ui#536).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CoreEditor } from '@kerebron/editor';
import { createEditorKits } from './editorKits';
import { createMdyEditorKit, refreshMdyFieldProjections } from './mdyEditorKit';

const MARKDOWN_TYPE = 'text/x-markdown';

/**
 * `@kerebron/wasm/node`'s own `assetLoad` fetches `file://` URLs, which
 * undici's fetch refuses — read the assets directory with `fs` instead. The
 * package's `exports` map has no `require` condition, so resolve the assets
 * by path from the workspace root rather than through `require.resolve`.
 */
const assetsDir = path.join(
  import.meta.dirname,
  '../../../node_modules/@kerebron/wasm/assets'
);
const assetLoad = async (name: string) =>
  new Uint8Array(await readFile(path.join(assetsDir, name)));

let editor: CoreEditor;

async function roundTrip(markdown: string): Promise<string> {
  await editor.loadDocumentText(MARKDOWN_TYPE, markdown);
  const buffer = await editor.saveDocument(MARKDOWN_TYPE);
  return new TextDecoder().decode(buffer).trim();
}

beforeAll(async () => {
  const { kits: editorKits } = await createEditorKits();
  editor = CoreEditor.create({
    element: document.body.appendChild(document.createElement('div')),
    uri: 'file:///untitled.md',
    assetLoad,
    editorKits: [
      ...editorKits,
      createMdyEditorKit({
        getFieldIds: () => new Set(['weight']),
        onFieldActivate: () => undefined,
      }),
    ],
  });
});

afterAll(() => {
  editor?.destroy();
});

describe('markdown mark round-trip', () => {
  it('preserves MDY field ids and editable headings through the real converter', async () => {
    expect(
      await roundTrip('## Assessment\n\nWeight: [198 lb](mdy:weight).')
    ).toBe('## Assessment\n\nWeight: [198 lb](mdy:weight).');
  });

  it('refreshes multiline field projections without duplicating their values', async () => {
    await editor.loadDocumentText(
      MARKDOWN_TYPE,
      '## Vitals\n\n[Pulse: 80<br>Temp: 36](mdy:weight).'
    );
    refreshMdyFieldProjections(editor, [
      { id: 'weight', display: 'Pulse: 90\nTemp: 37' },
    ]);
    const saved = new TextDecoder()
      .decode(await editor.saveDocument(MARKDOWN_TYPE))
      .trim();
    expect(saved).toBe('## Vitals\n\n[Pulse: 90<br>Temp: 37](mdy:weight).');
  });

  it('keeps the CommonMark marks (control)', async () => {
    expect(await roundTrip('**strong** and *em* and `code`')).toBe(
      '**strong** and *em* and `code`'
    );
  });

  it('keeps underline as _text_', async () => {
    expect(await roundTrip('_underlined_')).toBe('_underlined_');
  });

  it('keeps superscript through <sup>', async () => {
    expect(await roundTrip('E = mc<sup>2</sup>')).toBe('E = mc<sup>2</sup>');
  });

  it('keeps subscript through <sub>', async () => {
    expect(await roundTrip('H<sub>2</sub>O')).toBe('H<sub>2</sub>O');
  });

  it('keeps highlight through <mark>', async () => {
    expect(await roundTrip('a <mark>highlighted</mark> word')).toBe(
      'a <mark>highlighted</mark> word'
    );
  });

  it('keeps a non-default highlight color', async () => {
    expect(
      await roundTrip('<mark style="background-color: red">warning</mark>')
    ).toBe('<mark style="background-color: red">warning</mark>');
  });

  it('escapes quote-bearing highlight colors instead of injecting attributes', async () => {
    // The markdown/HTML parse paths sanitize malformed styles, so inject the
    // hostile color straight into the mark attrs to pin the serializer: it
    // must HTML-escape the value rather than let `"` break out of the
    // attribute (both inline-token handler contexts share escapeHtmlAttr).
    editor.setDocument({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [
                {
                  type: 'highlight',
                  attrs: { color: 'red" onmouseover="alert(1)' },
                },
              ],
            },
          ],
        },
      ],
    });
    const saved = new TextDecoder()
      .decode(await editor.saveDocument(MARKDOWN_TYPE))
      .trim();
    expect(saved).toBe(
      '<mark style="background-color: red&quot; onmouseover=&quot;alert(1)">x</mark>'
    );
  });
});
