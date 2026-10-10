import { Extension, type CoreEditor, type EditorKit } from '@kerebron/editor';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { MDY_PROJECTION_META } from './mdyTransaction';
export { MDY_PROJECTION_META } from './mdyTransaction';

export interface MdyEditorOptions {
  /** Only links to fields in the host's data index are protected. */
  getFieldIds: () => ReadonlySet<string>;
  getFieldLabel?: (id: string) => string | undefined;
  onFieldActivate: (id: string) => void;
  isDisabled?: () => boolean;
}

export interface MdyFieldSpan {
  id: string;
  from: number;
  to: number;
}

export interface MdyFieldProjection {
  id: string;
  display: string;
  label?: string;
}

/** MDY links have field semantics only when their target exists in the data. */
function linkedFieldId(href: unknown, fieldIds: ReadonlySet<string>) {
  if (typeof href !== 'string') return null;
  const id = href.startsWith('mdy:')
    ? href.slice(4)
    : href.startsWith('#')
      ? href.slice(1)
      : '';
  return fieldIds.has(id) ? id : null;
}

/** Merge neighboring text nodes, including differently formatted link text. */
export function getMdyFieldSpans(
  doc: ProseMirrorNode,
  fieldIds: ReadonlySet<string>
): MdyFieldSpan[] {
  const spans: MdyFieldSpan[] = [];
  doc.descendants((node, pos) => {
    if (!node.isInline) return;
    const mark = node.marks.find((candidate) => candidate.type.name === 'link');
    let id = linkedFieldId(mark?.attrs.href, fieldIds);
    const previous = spans[spans.length - 1];
    // Kerebron's inline-HTML parser imports <br> without the surrounding link
    // mark. Keep those breaks inside a single protected field projection.
    if (
      !id &&
      (node.type.name === 'br' || node.type.name === 'softbreak') &&
      previous?.to === pos
    ) {
      let nextPos = pos + node.nodeSize;
      let next = doc.nodeAt(nextPos);
      while (
        next &&
        (next.type.name === 'br' || next.type.name === 'softbreak')
      ) {
        nextPos += next.nodeSize;
        next = doc.nodeAt(nextPos);
      }
      const nextMark = next?.marks.find(
        (candidate) => candidate.type.name === 'link'
      );
      if (linkedFieldId(nextMark?.attrs.href, fieldIds) === previous.id)
        id = previous.id;
    }
    if (!id) return;
    if (previous?.id === id && previous.to === pos) {
      previous.to = pos + node.nodeSize;
    } else {
      spans.push({ id, from: pos, to: pos + node.nodeSize });
    }
  });
  return spans;
}

/** Refresh only linked data in the live document, leaving authored prose intact. */
export function refreshMdyFieldProjections(
  editor: CoreEditor,
  fields: readonly MdyFieldProjection[]
): boolean {
  const byId = new Map(fields.map((field) => [field.id, field.display]));
  const state = editor.view.state;
  const spans = getMdyFieldSpans(state.doc, new Set(byId.keys()));
  const transaction = state.tr;
  for (const span of spans.reverse()) {
    const display = byId.get(span.id)!;
    const current = state.doc.textBetween(span.from, span.to, '', '\n');
    const oldMarks = state.doc.nodeAt(span.from)?.marks ?? [];
    const link = oldMarks.find((mark) => mark.type.name === 'link');
    if (!link) continue;
    // Kerebron 0.8.12's link serializer gathers text tokens and drops inline
    // breaks. Its existing mdTemplate attribute emits this safe MDY label as
    // one link, preserving multiline projections without an upstream patch.
    const label = display
      .split(/\r?\n/)
      .map((line) =>
        line
          .replace(/&/g, '&amp;')
          .replace(/\$/g, '&#36;')
          .replace(/[\\[\]`*_~<>]/g, '\\$&')
      )
      .join('<br>');
    const template = `[${label}](${link.attrs.href})`;
    let looseBreak = false;
    state.doc.nodesBetween(span.from, span.to, (node) => {
      if (
        (node.type.name === 'br' || node.type.name === 'softbreak') &&
        !node.marks.some((mark) => mark.type.name === 'link')
      )
        looseBreak = true;
    });
    if (
      current === display &&
      !looseBreak &&
      link.attrs.mdTemplate === template
    )
      continue;
    const marks = oldMarks.map((mark) =>
      mark.type.name === 'link'
        ? mark.type.create({ ...mark.attrs, mdTemplate: template })
        : mark
    );
    const breakType = state.schema.nodes.br ?? state.schema.nodes.softbreak;
    const replacement: ProseMirrorNode[] = [];
    display.split(/\r?\n/).forEach((line, index) => {
      if (index && breakType)
        replacement.push(breakType.create(null, null, marks));
      if (line) replacement.push(state.schema.text(line, marks));
    });
    transaction.replaceWith(span.from, span.to, replacement);
  }
  if (!transaction.docChanged) return false;
  transaction.setMeta(MDY_PROJECTION_META, true);
  transaction.setMeta('addToHistory', false);
  editor.view.dispatch(transaction);
  return true;
}

/**
 * Protect each existing field projection from text edits or link removal.
 * A writer may delete a whole projection; its underlying data stays intact.
 * Inspect every step so paste, drag/drop, IME and toolbar commands obey the
 * same rule as typing. Programmatic document loads bypass this edit guard.
 */
export function canEditMdyTransaction(
  transaction: Transaction,
  fieldIds: ReadonlySet<string>
): boolean {
  if (!transaction.docChanged) return true;
  for (let index = 0; index < transaction.steps.length; index += 1) {
    const before = transaction.docs[index];
    const after = transaction.docs[index + 1] ?? transaction.doc;
    const map = transaction.steps[index].getMap();
    const spans = getMdyFieldSpans(before, fieldIds);
    const step = transaction.steps[index].toJSON();
    if (
      (step.stepType === 'addMark' || step.stepType === 'removeMark') &&
      step.mark?.type === 'link' &&
      spans.some((span) => step.from < span.to && step.to > span.from)
    ) {
      return false;
    }
    const removed = new Set<MdyFieldSpan>();
    let allowed = true;

    map.forEach((oldStart, oldEnd, newStart, newEnd) => {
      for (const span of spans) {
        if (oldStart === oldEnd) {
          if (oldStart > span.from && oldStart < span.to) allowed = false;
        } else if (oldStart < span.to && oldEnd > span.from) {
          if (
            oldStart <= span.from &&
            oldEnd >= span.to &&
            (newStart === newEnd || after.textBetween(newStart, newEnd) === '')
          ) {
            removed.add(span);
          } else {
            allowed = false;
          }
        }
      }
    });
    if (!allowed) return false;

    // Mark-only steps have empty maps. Ensure they cannot detach a protected
    // projection from its id, while allowing harmless text formatting.
    const nextSpans = getMdyFieldSpans(after, fieldIds);
    for (const span of spans) {
      if (removed.has(span)) continue;
      const from = map.map(span.from, 1);
      const to = map.map(span.to, -1);
      if (
        before.textBetween(span.from, span.to) !==
          after.textBetween(from, to) ||
        !nextSpans.some(
          (next) => next.id === span.id && next.from === from && next.to === to
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

const mdyPluginKey = new PluginKey('mdy-field-links');

export function createMdyFieldPlugin(options: MdyEditorOptions): Plugin {
  const activate = (id: string, event: Event) => {
    if (options.isDisabled?.()) return false;
    event.preventDefault();
    options.onFieldActivate(id);
    return true;
  };
  const targetId = (event: Event) => {
    const element = event.target;
    const chip =
      element instanceof Element ? element.closest('[data-mdy-field]') : null;
    const id = chip?.getAttribute('data-mdy-field');
    return id && options.getFieldIds().has(id) ? id : null;
  };

  return new Plugin({
    key: mdyPluginKey,
    filterTransaction: (transaction) =>
      transaction.getMeta(MDY_PROJECTION_META) === true ||
      canEditMdyTransaction(transaction, options.getFieldIds()),
    props: {
      decorations: (state) =>
        DecorationSet.create(
          state.doc,
          getMdyFieldSpans(state.doc, options.getFieldIds()).map((span) =>
            Decoration.inline(span.from, span.to, {
              class: 'encounter-mdy-field',
              'data-mdy-field': span.id,
              role: 'button',
              tabindex: '0',
              'aria-label': `Linked field: ${options.getFieldLabel?.(span.id) ?? span.id}. Activate to edit in the form.`,
              'aria-disabled': options.isDisabled?.() ? 'true' : 'false',
              style:
                'background:rgba(59,130,246,.12);border-radius:.2em;padding:0 .15em;cursor:pointer;text-decoration:underline;text-underline-offset:.15em',
            })
          )
        ),
      handleDOMEvents: {
        click: (_view, event) => {
          const id = targetId(event);
          return id ? activate(id, event) : false;
        },
      },
      handleKeyDown: (view, event) => {
        const focusedId = targetId(event);
        if (focusedId && (event.key === 'Enter' || event.key === ' ')) {
          return activate(focusedId, event);
        }
        if (event.key !== 'Enter') return false;
        const { from, to } = view.state.selection;
        const span = getMdyFieldSpans(
          view.state.doc,
          options.getFieldIds()
        ).find((candidate) => from >= candidate.from && to <= candidate.to);
        return span ? activate(span.id, event) : false;
      },
    },
  });
}

class MdyFieldExtension extends Extension {
  name = 'mdy-field-links';
  constructor(private readonly options: MdyEditorOptions) {
    super();
  }

  override getProseMirrorPlugins() {
    return [createMdyFieldPlugin(this.options)];
  }
}

class MdyEditorKit implements EditorKit {
  name = 'mdy-field-links';
  constructor(private readonly options: MdyEditorOptions) {}

  getExtensions() {
    return [new MdyFieldExtension(this.options)];
  }
}

export function createMdyEditorKit(options: MdyEditorOptions): EditorKit {
  return new MdyEditorKit(options);
}
