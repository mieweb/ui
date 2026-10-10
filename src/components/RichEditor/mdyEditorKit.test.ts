import { afterEach, describe, expect, it, vi } from 'vitest';
import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
  canEditMdyTransaction,
  createMdyFieldPlugin,
  getMdyFieldSpans,
  refreshMdyFieldProjections,
} from './mdyEditorKit';
import type { CoreEditor } from '@kerebron/editor';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'inline*', group: 'block', toDOM: () => ['p', 0] },
    heading: {
      content: 'inline*',
      group: 'block',
      attrs: { level: { default: 2 } },
      toDOM: (node) => [`h${node.attrs.level}`, 0],
    },
    text: { group: 'inline' },
    br: { group: 'inline', inline: true, toDOM: () => ['br'] },
  },
  marks: {
    link: {
      attrs: { href: {}, mdTemplate: { default: undefined } },
      inclusive: false,
      toDOM: (mark) => ['a', { href: mark.attrs.href }, 0],
    },
    strong: { toDOM: () => ['strong', 0] },
  },
});
const fieldIds = new Set(['weight']);
const doc = () =>
  schema.node('doc', null, [
    schema.node('heading', null, [schema.text('Assessment')]),
    schema.node('paragraph', null, [
      schema.text('Weight: '),
      schema.text('198 lb', [schema.marks.link.create({ href: 'mdy:weight' })]),
      schema.text('. Stable.'),
    ]),
  ]);
const state = () => EditorState.create({ doc: doc() });
const span = () => getMdyFieldSpans(doc(), fieldIds)[0];

let view: EditorView | undefined;
afterEach(() => {
  view?.destroy();
  view = undefined;
  document.body.replaceChildren();
});

describe('MDY field-link protection', () => {
  it('rejects typing, partial deletion and replacement inside a linked value', () => {
    const { from, to } = span();
    expect(
      canEditMdyTransaction(state().tr.insertText('0', from + 2), fieldIds)
    ).toBe(false);
    expect(
      canEditMdyTransaction(state().tr.delete(from, from + 1), fieldIds)
    ).toBe(false);
    expect(
      canEditMdyTransaction(state().tr.insertText('200 lb', from, to), fieldIds)
    ).toBe(false);
  });

  it('allows free prose, headings and typing next to a chip', () => {
    const { from, to } = span();
    expect(
      canEditMdyTransaction(state().tr.insertText('New ', 1), fieldIds)
    ).toBe(true);
    expect(
      canEditMdyTransaction(state().tr.insertText('About ', from), fieldIds)
    ).toBe(true);
    expect(
      canEditMdyTransaction(state().tr.insertText(' today', to), fieldIds)
    ).toBe(true);
    expect(
      canEditMdyTransaction(
        state().tr.setNodeMarkup(0, schema.nodes.paragraph),
        fieldIds
      )
    ).toBe(true);
  });

  it('allows deleting a complete projection, including surrounding prose', () => {
    const { from, to } = span();
    expect(canEditMdyTransaction(state().tr.delete(from, to), fieldIds)).toBe(
      true
    );
    expect(
      canEditMdyTransaction(state().tr.delete(from - 2, to + 2), fieldIds)
    ).toBe(true);
    const current = state();
    expect(
      canEditMdyTransaction(
        current.tr.deleteRange(0, current.doc.content.size),
        fieldIds
      )
    ).toBe(true);
  });

  it('prevents removing or changing a field id, and allows display formatting', () => {
    const { from, to } = span();
    expect(
      canEditMdyTransaction(
        state().tr.removeMark(from, to, schema.marks.link),
        fieldIds
      )
    ).toBe(false);
    expect(
      canEditMdyTransaction(
        state().tr.addMark(
          from,
          to,
          schema.marks.link.create({ href: '#weight' })
        ),
        fieldIds
      )
    ).toBe(false);
    expect(
      canEditMdyTransaction(
        state().tr.addMark(
          from,
          to,
          schema.marks.link.create({ href: 'mdy:other' })
        ),
        fieldIds
      )
    ).toBe(false);
    expect(
      canEditMdyTransaction(
        state().tr.addMark(from, to, schema.marks.strong.create()),
        fieldIds
      )
    ).toBe(true);
  });

  it('rejects marked text pasted at a chip boundary that would extend its value', () => {
    const current = state();
    const transaction = current.tr.insert(
      span().to,
      schema.text('0', [schema.marks.link.create({ href: 'mdy:weight' })])
    );
    expect(canEditMdyTransaction(transaction, fieldIds)).toBe(false);
  });

  it('keeps ordinary anchors and dangling field links editable', () => {
    const ordinary = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('Heading', [
          schema.marks.link.create({ href: '#heading' }),
        ]),
        schema.text('Unknown', [
          schema.marks.link.create({ href: 'mdy:missing' }),
        ]),
      ]),
    ]);
    const current = EditorState.create({ doc: ordinary });
    expect(canEditMdyTransaction(current.tr.insertText('x', 2), fieldIds)).toBe(
      true
    );
    expect(canEditMdyTransaction(current.tr.insertText('x', 9), fieldIds)).toBe(
      true
    );
    expect(getMdyFieldSpans(ordinary, fieldIds)).toEqual([]);
  });

  it('protects an entire linked value even when its text has different marks', () => {
    const split = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('198', [schema.marks.link.create({ href: 'mdy:weight' })]),
        schema.text(' lb', [
          schema.marks.link.create({ href: 'mdy:weight' }),
          schema.marks.strong.create(),
        ]),
      ]),
    ]);
    expect(getMdyFieldSpans(split, fieldIds)).toEqual([
      { id: 'weight', from: 1, to: 7 },
    ]);
    expect(
      canEditMdyTransaction(
        EditorState.create({ doc: split }).tr.delete(1, 4),
        fieldIds
      )
    ).toBe(false);
  });

  it('protects inline breaks within one multiline linked value', () => {
    const multiline = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('Pulse: 80', [
          schema.marks.link.create({ href: 'mdy:weight' }),
        ]),
        schema.nodes.br.create(),
        schema.nodes.br.create(),
        schema.text('Temp: 36', [
          schema.marks.link.create({ href: 'mdy:weight' }),
        ]),
      ]),
    ]);
    const spans = getMdyFieldSpans(multiline, fieldIds);
    expect(spans).toHaveLength(1);
    expect(
      canEditMdyTransaction(
        EditorState.create({ doc: multiline }).tr.delete(1, 10),
        fieldIds
      )
    ).toBe(false);
  });

  it('refreshes linked values without replacing prose or adding an undo event', () => {
    const plugin = createMdyFieldPlugin({
      getFieldIds: () => fieldIds,
      onFieldActivate: vi.fn(),
    });
    const current = EditorState.create({ doc: doc(), plugins: [plugin] });
    view = new EditorView(
      document.body.appendChild(document.createElement('div')),
      { state: current }
    );
    view.dispatch(view.state.tr.insertText('Authored ', 1));
    const beforeText = view.state.doc.textContent;
    const host = { view } as unknown as CoreEditor;
    const dispatch = vi.spyOn(view, 'dispatch');
    expect(
      refreshMdyFieldProjections(host, [{ id: 'weight', display: '200 lb' }])
    ).toBe(true);
    expect(view.state.doc.textContent).toBe(
      beforeText.replace('198 lb', '200 lb')
    );
    expect(dispatch.mock.calls[0][0].getMeta('addToHistory')).toBe(false);
    expect(
      refreshMdyFieldProjections(host, [{ id: 'weight', display: '200 lb' }])
    ).toBe(false);
  });

  it('enforces the guard through ProseMirror transaction filtering', () => {
    const plugin = createMdyFieldPlugin({
      getFieldIds: () => fieldIds,
      onFieldActivate: vi.fn(),
    });
    const current = EditorState.create({ doc: doc(), plugins: [plugin] });
    const result = current.applyTransaction(
      current.tr.insertText('0', span().from + 2)
    );
    expect(result.transactions).toHaveLength(0);
    expect(result.state.doc.eq(current.doc)).toBe(true);
  });

  it('renders an accessible chip and activates the form resolver on click or Enter', () => {
    const onFieldActivate = vi.fn();
    const plugin = createMdyFieldPlugin({
      getFieldIds: () => fieldIds,
      onFieldActivate,
    });
    const current = EditorState.create({
      doc: doc(),
      plugins: [plugin],
      selection: TextSelection.create(doc(), span().from + 1),
    });
    view = new EditorView(
      document.body.appendChild(document.createElement('div')),
      {
        state: current,
      }
    );
    const chip = view.dom.querySelector<HTMLElement>(
      '[data-mdy-field="weight"]'
    )!;
    expect(chip.getAttribute('role')).toBe('button');
    expect(chip.getAttribute('tabindex')).toBe('0');
    expect(chip.getAttribute('aria-label')).toContain('Linked field: weight');

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    // The DOM handler intercepts link navigation before ProseMirror's pointer
    // selection logic (which requires caretFromPoint, unavailable in jsdom).
    chip.dispatchEvent(click);
    expect(onFieldActivate).toHaveBeenLastCalledWith('weight');
    expect(click.defaultPrevented).toBe(true);
    expect(
      plugin.props.handleKeyDown?.call(
        plugin,
        view,
        new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
      )
    ).toBe(true);
    expect(onFieldActivate).toHaveBeenCalledTimes(2);
  });

  it('does not activate a resolver while disabled', () => {
    const onFieldActivate = vi.fn();
    const plugin = createMdyFieldPlugin({
      getFieldIds: () => fieldIds,
      onFieldActivate,
      isDisabled: () => true,
    });
    const current = EditorState.create({ doc: doc(), plugins: [plugin] });
    view = new EditorView(
      document.body.appendChild(document.createElement('div')),
      {
        state: current,
      }
    );
    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.create(view.state.doc, span().from + 1)
      )
    );
    expect(
      plugin.props.handleKeyDown?.call(
        plugin,
        view,
        new KeyboardEvent('keydown', { key: 'Enter' })
      )
    ).toBe(false);
    expect(onFieldActivate).not.toHaveBeenCalled();
  });
});
