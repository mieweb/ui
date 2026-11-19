import { describe, expect, it } from 'vitest';
import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { insertMention, mentionAt } from './editorMentions';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'inline*', group: 'block', toDOM: () => ['p', 0] },
    text: { group: 'inline' },
  },
  marks: {
    link: {
      attrs: { href: {} },
      inclusive: false,
      toDOM: (mark) => ['a', { href: mark.attrs.href }, 0],
    },
  },
});

/** A one-paragraph document holding `text`, the caret at its end (or at `caret`). */
const stateWith = (text: string, caret = text.length) => {
  const state = EditorState.create({
    doc: schema.node('doc', null, [
      schema.node('paragraph', null, text ? [schema.text(text)] : []),
    ]),
  });
  // Position 1 is the start of the paragraph's content.
  return state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, 1 + caret))
  );
};

describe('mentionAt', () => {
  it('finds the @query before the caret, with the range it covers', () => {
    expect(mentionAt(stateWith('Talk to @Pa'))).toEqual({
      query: 'Pa',
      from: 9,
      to: 12,
    });
    expect(mentionAt(stateWith('@'))).toEqual({ query: '', from: 1, to: 2 });
  });

  it('ignores an @ inside a word, after a space, or behind the caret', () => {
    expect(mentionAt(stateWith('mail me@x'))).toBeNull();
    expect(mentionAt(stateWith('@Pam done'))).toBeNull();
    expect(mentionAt(stateWith('@Pam', 0))).toBeNull();
  });
});

describe('insertMention', () => {
  it('writes @value and a space, the caret after them', () => {
    const state = stateWith('Talk to @Pa');
    const next = state.apply(
      insertMention(state, mentionAt(state)!, { id: 'u1', label: 'Pam Beesly' })
    );
    expect(next.doc.textContent).toBe('Talk to @Pam ');
    expect(next.selection.from).toBe(1 + 'Talk to @Pam '.length);
  });

  it('writes the label as a link when the option has an href', () => {
    const state = stateWith('See @TH');
    const next = state.apply(
      insertMention(state, mentionAt(state)!, {
        id: 't1',
        label: 'TH-923: Catalog page',
        href: '/app/tickets/t1',
      })
    );
    expect(next.doc.textContent).toBe('See TH-923: Catalog page ');
    const linked = next.doc.firstChild!.child(1);
    expect(linked.text).toBe('TH-923: Catalog page');
    expect(linked.marks[0].attrs.href).toBe('/app/tickets/t1');
    // The space after it is plain, so typing on doesn't extend the link.
    expect(next.doc.firstChild!.lastChild!.marks).toHaveLength(0);
  });
});
