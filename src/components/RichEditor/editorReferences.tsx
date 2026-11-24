'use client';

import * as React from 'react';
import {
  Extension,
  Node as EditorNode,
  type CoreEditor,
  type EditorKit,
} from '@kerebron/editor';
import { Mark, type NodeSpec, type Node as PmNode } from 'prosemirror-model';
import {
  Plugin,
  TextSelection,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { badgeVariants } from '../Badge/Badge';
import { safeHref } from '../../templates/Section';
import {
  useSuggestionList,
  type MentionMenuState,
} from '../Messaging/useMentionAutocomplete';
import {
  matchReference,
  type ReferenceOption,
  type ReferenceTrigger,
} from '../ReferenceChip/references';
import { cn } from '../../utils/cn';

/** Name of the editor node a picked reference is held in. */
export const REFERENCE_NODE = 'reference';

// The chip's look in the editor — ReferenceChip's, applied through toDOM.
const CHIP_CLASS = cn(
  badgeVariants({ variant: 'secondary', size: 'sm' }),
  'align-baseline no-underline'
);

/**
 * A picked reference: one atomic inline node, so the caret steps over it and
 * Backspace removes it whole. Drawn as a link chip; read back from one when
 * pasted between editors — only when a trigger claims its link, which also
 * decides its kind and id, so pasted markup can't make a chip of any other
 * link. The chip's `href` is drawn only with a safe scheme (no `javascript:`).
 * `leafText` is its label, for anything that reads the editor as plain text.
 */
class ReferenceNode extends EditorNode {
  override name = REFERENCE_NODE;
  constructor(private readonly triggers: () => readonly ReferenceTrigger[]) {
    super({});
  }
  override getNodeSpec(): NodeSpec {
    const triggers = this.triggers;
    return {
      inline: true,
      group: 'inline',
      atom: true,
      selectable: true,
      draggable: false,
      attrs: {
        kind: { default: '' },
        id: { default: '' },
        label: { default: '' },
        href: { default: '' },
      },
      leafText: (node) => node.attrs.label,
      toDOM: (node) => [
        'a',
        {
          href: safeHref(node.attrs.href),
          class: CHIP_CLASS,
          'data-slot': 'reference-chip',
          'data-reference-kind': node.attrs.kind,
          'data-reference-id': node.attrs.id,
        },
        // Its own element, as ReferenceChip's: a long label is cut short with
        // an ellipsis inside the chip (kerebron.css) instead of spilling out
        // of it, and keeps its own direction. The full text stays the link's
        // accessible name.
        [
          'span',
          { dir: 'auto', 'data-slot': 'reference-chip-label' },
          node.attrs.label,
        ],
      ],
      parseDOM: [
        {
          tag: 'a[data-reference-kind][data-reference-id]',
          // Ahead of the link mark's `a[href]` (marks' rules are tried
          // first at equal priority); a link no trigger claims falls
          // through to it and stays an ordinary link.
          priority: 60,
          getAttrs: (dom) => {
            const href = dom.getAttribute('href') ?? '';
            const match = safeHref(href) && matchReference(href, triggers());
            if (!match) return false;
            return { ...match, label: dom.textContent ?? '', href };
          },
        },
      ],
    };
  }
}

/** A hard or soft line break node. */
function isBreak(node: PmNode): boolean {
  return (
    !!node.type.spec.linebreakReplacement ||
    node.type.name === 'br' ||
    node.type.name === 'softbreak'
  );
}

/** Whether the first node after the breaks at `pos` carries `link`. */
function sameLinkAfterBreaks(doc: PmNode, pos: number, link: Mark): boolean {
  let next = doc.nodeAt(pos);
  while (next && isBreak(next)) {
    pos += next.nodeSize;
    next = doc.nodeAt(pos);
  }
  return !!next && link.isInSet(next.marks);
}

type MarkdownHook = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

/**
 * After Markdown is read: every link a trigger claims becomes a reference
 * node (its label the link's text). Formatting around the whole link (bold,
 * italic) moves onto the chip. A link that can't round-trip as a chip —
 * formatting on part of its text, or a title — stays a link, as do links no
 * trigger claims.
 */
export function linksToReferences(
  triggers: () => readonly ReferenceTrigger[]
): MarkdownHook {
  return (state, dispatch) => {
    const { schema, doc } = state;
    const type = schema.nodes[REFERENCE_NODE];
    const link = schema.marks.link;
    if (!type || !link) return true;
    const spans: {
      from: number;
      to: number;
      link: Mark;
      marks: readonly Mark[];
      label: string;
      uniform: boolean;
    }[] = [];
    doc.descendants((node, pos) => {
      const last = spans[spans.length - 1];
      // Kerebron reads a <br> inside a link without the link mark, so the
      // link would look like two. A break between text of the same link
      // keeps it one span, left a link: a chip's label is one line.
      if (isBreak(node)) {
        if (last?.to === pos && sameLinkAfterBreaks(doc, pos, last.link)) {
          last.to = pos + node.nodeSize;
          last.uniform = false;
        }
        return;
      }
      if (!node.isText) return;
      const mark = node.marks.find((m) => m.type === link);
      if (!mark) return;
      // One link split over several text nodes (bold inside it) is one span.
      if (last && last.to === pos && last.link.eq(mark)) {
        last.to = pos + node.nodeSize;
        last.label += node.text;
        last.uniform &&= Mark.sameSet(last.marks, node.marks);
        return;
      }
      spans.push({
        from: pos,
        to: pos + node.nodeSize,
        link: mark,
        marks: node.marks,
        label: node.text ?? '',
        uniform: true,
      });
    });
    const tr = state.tr;
    for (const span of spans.reverse()) {
      if (!span.uniform || span.link.attrs.title) continue;
      const { href } = span.link.attrs;
      const match = matchReference(href, triggers());
      if (!match) continue;
      tr.replaceWith(
        span.from,
        span.to,
        type.create(
          { ...match, label: span.label, href },
          null,
          span.link.removeFromSet(span.marks)
        )
      );
    }
    if (tr.docChanged) dispatch?.(tr);
    return true;
  };
}

/**
 * Before Markdown is written: every reference node becomes its link again,
 * keeping the chip's formatting.
 */
export const referencesToLinks: MarkdownHook = (state, dispatch) => {
  const { schema, doc } = state;
  const type = schema.nodes[REFERENCE_NODE];
  const link = schema.marks.link;
  if (!type || !link) return true;
  const found: { pos: number; node: PmNode }[] = [];
  doc.descendants((node, pos) => {
    if (node.type === type) found.push({ pos, node });
  });
  const tr = state.tr;
  for (const { pos, node } of found.reverse()) {
    const { label, href } = node.attrs;
    tr.replaceWith(
      pos,
      pos + node.nodeSize,
      schema.text(label || href, link.create({ href }).addToSet(node.marks))
    );
  }
  if (tr.docChanged) dispatch?.(tr);
  return true;
};

/** Adds `hook` to the Markdown converter's hooks of `type`, after any set. */
function addMarkdownHook(
  editor: CoreEditor,
  type: 'md2pm.post' | 'pm2md.pre',
  hook: MarkdownHook
) {
  const run = editor.run;
  if (!run.getMarkdownHooks || !run.setMarkdownHooks) return;
  let existing: MarkdownHook[] = [];
  run.getMarkdownHooks(type, (hooks?: MarkdownHook[]) => {
    existing = hooks ?? [];
  });
  run.setMarkdownHooks(type, [...existing, hook]);
}

/** The trigger query before the caret: which trigger, what's typed, and its range (trigger character included). */
export interface ReferenceQuery {
  trigger: ReferenceTrigger;
  query: string;
  from: number;
  to: number;
}

/** Stands for an inline leaf other than a hard break in the text before the caret. */
const LEAF = '￼';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

/**
 * The trigger query immediately before the caret, if any: a trigger
 * character at the start of the text or after whitespace, then no spaces.
 * So `ann@example.com` doesn't open a list. Null when text is selected.
 */
export function referenceQueryAt(
  state: EditorState,
  triggers: readonly ReferenceTrigger[]
): ReferenceQuery | null {
  const { selection } = state;
  if (!triggers.length || !selection.empty) return null;
  const $from = selection.$from;
  // Only where a chip can go: a code block takes text alone, so `@ann` typed
  // there stays text.
  const type = state.schema.nodes[REFERENCE_NODE];
  const index = $from.index();
  if (!type || !$from.parent.canReplaceWith(index, index, type)) return null;
  // One character per inline leaf, so offsets from the caret stay exact: a
  // hard break reads as a newline (whitespace, so a trigger may follow it),
  // any other leaf (a chip, an image) as U+FFFC, which a query never spans,
  // so picking a result can't replace the leaf.
  const before = $from.parent.textBetween(
    0,
    $from.parentOffset,
    undefined,
    (leaf) => (leaf.type.spec.linebreakReplacement ? '\n' : LEAF)
  );
  const chars = triggers.map((t) => escapeRegExp(t.char)).join('');
  const match = new RegExp(`(^|\\s)([${chars}])([^\\s${LEAF}${chars}]*)$`).exec(
    before
  );
  if (!match) return null;
  const trigger = triggers.find((t) => t.char === match[2]);
  if (!trigger) return null;
  const query = match[3];
  return { trigger, query, from: $from.pos - query.length - 1, to: $from.pos };
}

/**
 * Replaces the query `range` with a reference to `option` and a space, caret
 * after them — one transaction, so one undo puts the typed query back. The
 * formatting being typed with (bold, italic; not a link) carries onto both,
 * and typing after them continues in it.
 */
export function insertReference(
  state: EditorState,
  range: ReferenceQuery,
  option: ReferenceOption
): Transaction {
  const { schema } = state;
  const marks = (
    state.storedMarks ?? state.doc.resolve(range.to).marks()
  ).filter((mark) => mark.type !== schema.marks.link);
  const node = schema.nodes[REFERENCE_NODE].create(
    {
      kind: option.kind,
      id: option.id,
      label: option.label,
      href: range.trigger.toHref(option.id),
    },
    null,
    marks
  );
  const tr = state.tr.replaceWith(range.from, range.to, [
    node,
    schema.text(' ', marks),
  ]);
  const caret = range.from + node.nodeSize + 1;
  return tr
    .setSelection(TextSelection.create(tr.doc, caret))
    .setStoredMarks(marks)
    .scrollIntoView();
}

/**
 * Backspace or Delete beside a chip removes it in one transaction. Left to
 * the browser, deleting a non-editable inline element is a DOM edit
 * ProseMirror reads back, which can drop the space after it.
 */
export function deleteAdjacentReference(
  state: EditorState,
  direction: 'backward' | 'forward'
): Transaction | null {
  const { selection } = state;
  if (!selection.empty) return null;
  const $pos = selection.$from;
  const node = direction === 'backward' ? $pos.nodeBefore : $pos.nodeAfter;
  if (node?.type.name !== REFERENCE_NODE) return null;
  const from = direction === 'backward' ? $pos.pos - node.nodeSize : $pos.pos;
  return state.tr.delete(from, from + node.nodeSize).scrollIntoView();
}

interface ReferenceHandlers {
  update: (view: EditorView) => void;
  keyDown: (view: EditorView, event: KeyboardEvent) => boolean;
  blur: () => void;
}

/** Wires the editor's caret moves, keys and the Markdown hooks to {@link useEditorReferences}. */
class ReferencesExtension extends Extension {
  override name = 'references';
  constructor(
    private readonly handlers: { current: ReferenceHandlers },
    private readonly triggers: () => readonly ReferenceTrigger[]
  ) {
    super({});
  }
  override created() {
    const editor = this.editor as CoreEditor;
    // The hooks are set through a command, which needs the view; 'ready'
    // fires once it and the plugins exist, before `create` returns.
    editor.addEventListener(
      'ready',
      () => {
        addMarkdownHook(editor, 'md2pm.post', linksToReferences(this.triggers));
        addMarkdownHook(editor, 'pm2md.pre', referencesToLinks);
      },
      { once: true }
    );
  }
  override getProseMirrorPlugins(): Plugin[] {
    const handlers = this.handlers;
    return [
      new Plugin({
        props: {
          handleKeyDown: (view, event) => {
            // A read-only or disabled editor takes no reference edits.
            if (!view.editable) return false;
            if (handlers.current.keyDown(view, event)) return true;
            if (event.key !== 'Backspace' && event.key !== 'Delete')
              return false;
            const tr = deleteAdjacentReference(
              view.state,
              event.key === 'Backspace' ? 'backward' : 'forward'
            );
            if (!tr) return false;
            view.dispatch(tr);
            return true;
          },
          handleDOMEvents: {
            blur: () => {
              handlers.current.blur();
              return false;
            },
          },
        },
        view: (view) => {
          handlers.current.update(view);
          return { update: (next) => handlers.current.update(next) };
        },
      }),
    ];
  }
}

const NO_HANDLERS: ReferenceHandlers = {
  update: () => undefined,
  keyDown: () => false,
  blur: () => undefined,
};

/**
 * The editor kit for references: the chip node and the Markdown hooks that
 * turn claimed links into chips on load and back into links on save.
 * {@link useEditorReferences} adds the suggestion list on top.
 */
export function createReferencesKit(
  triggers: () => readonly ReferenceTrigger[],
  handlers: { current: ReferenceHandlers } = { current: NO_HANDLERS }
): EditorKit {
  return {
    getExtensions: () => [
      new ReferenceNode(triggers),
      new ReferencesExtension(handlers, triggers),
    ],
  };
}

const NO_OPTIONS: ReferenceOption[] = [];

/** Room the list needs below the caret before it opens above it instead. */
const MENU_MAX_HEIGHT = 224;
/** Gap kept between the list and the viewport's edge. */
const VIEWPORT_MARGIN = 8;
/** Gap between the caret's line and the list. */
const CARET_GAP = 4;

/**
 * The screen the list can use, in the layout viewport's coordinates (where
 * `coordsAtPos` and `position: fixed` both measure from).
 */
export interface MenuViewport {
  /** The visible area's left and right: the part of the page a pinch-zoom shows. */
  visibleLeft: number;
  visibleRight: number;
  /** The layout viewport's height, which a fixed `bottom` is measured from. */
  height: number;
  /** The visible area's top and bottom: below the status bar, above the keyboard. */
  visibleTop: number;
  visibleBottom: number;
}

/**
 * Where the fixed list goes for a caret at `anchor`: below it when the list
 * fits there or below has at least as much room, otherwise above, with its
 * height capped to the room on that side so its first options are never off
 * screen (as useAnchoredPosition does). Kept inside the viewport sideways
 * (a caret near the end of a line).
 */
export function menuPlacement(
  anchor: { left: number; top: number; bottom: number },
  menuWidth: number,
  viewport: MenuViewport
): React.CSSProperties {
  const spaceBelow =
    viewport.visibleBottom - anchor.bottom - CARET_GAP - VIEWPORT_MARGIN;
  const spaceAbove =
    anchor.top - CARET_GAP - VIEWPORT_MARGIN - viewport.visibleTop;
  const below = spaceBelow >= MENU_MAX_HEIGHT || spaceBelow >= spaceAbove;
  // Never wider than the visible area (MentionMenu is a fixed w-64), and
  // kept inside it sideways, so a narrow window, or a phone zoomed in and
  // panned, still shows the whole list.
  const maxWidth = Math.max(
    0,
    viewport.visibleRight - viewport.visibleLeft - 2 * VIEWPORT_MARGIN
  );
  const width = Math.min(menuWidth, maxWidth);
  return {
    position: 'fixed',
    // The floating-panel layer (as useAnchoredPosition), above elevated
    // modal hosts, so the list stays usable inside dialogs.
    zIndex: 9999,
    left: Math.max(
      viewport.visibleLeft + VIEWPORT_MARGIN,
      Math.min(anchor.left, viewport.visibleRight - width - VIEWPORT_MARGIN)
    ),
    maxWidth,
    maxHeight: Math.max(
      0,
      Math.min(MENU_MAX_HEIGHT, below ? spaceBelow : spaceAbove)
    ),
    ...(below
      ? { top: anchor.bottom + CARET_GAP }
      : { bottom: viewport.height - anchor.top + CARET_GAP }),
  };
}

let safeAreaProbe: HTMLDivElement | null = null;

/** The page's safe-area insets (status bar, home indicator); 0 where there are none. */
function safeAreaInsets(): { top: number; bottom: number } {
  if (!safeAreaProbe) {
    safeAreaProbe = document.createElement('div');
    safeAreaProbe.setAttribute('aria-hidden', 'true');
    safeAreaProbe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;' +
      'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
    document.body.appendChild(safeAreaProbe);
  }
  const style = getComputedStyle(safeAreaProbe);
  return {
    top: parseFloat(style.paddingTop) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
  };
}

/**
 * The screen as the list sees it now. An on-screen keyboard shrinks only the
 * visual viewport (iOS doesn't resize the layout one, and its `innerHeight`
 * may follow either), so the visible area comes from `visualViewport`.
 */
function currentMenuViewport(): MenuViewport {
  const visual = window.visualViewport;
  const height = document.documentElement.clientHeight || window.innerHeight;
  const insets = safeAreaInsets();
  const top = visual?.offsetTop ?? 0;
  const left = visual?.offsetLeft ?? 0;
  return {
    visibleLeft: left,
    visibleRight: visual ? left + visual.width : window.innerWidth,
    height,
    visibleTop: top + insets.top,
    visibleBottom: (visual ? top + visual.height : height) - insets.bottom,
  };
}

/**
 * Inline references for a Kerebron editor: the kit to install, and the list
 * state {@link MentionMenu} renders. Typing a trigger's character searches
 * its records; arrows move, Enter or Tab inserts a chip, Escape closes the
 * list for that spot. `triggers` is read on every use, so its search
 * functions may change between renders.
 */
export function useEditorReferences(triggers: readonly ReferenceTrigger[]): {
  kit: EditorKit;
  menu: MentionMenuState<ReferenceOption>;
  /** The open list's trigger, for its accessible name. */
  activeTrigger: ReferenceTrigger | null;
} {
  const [range, setRange] = React.useState<ReferenceQuery | null>(null);
  const [answer, setAnswer] = React.useState<{
    kind: string;
    query: string;
    options: ReferenceOption[];
  } | null>(null);
  const [anchor, setAnchor] = React.useState<{
    left: number;
    top: number;
    bottom: number;
  } | null>(null);
  // The query start Escape closed the list at; it stays closed there.
  const dismissedAt = React.useRef<number | null>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  // The editor's surface, as state: RichEditor creates the view
  // asynchronously, so the ARIA effect below must re-run once it exists.
  const [surface, setSurface] = React.useState<HTMLElement | null>(null);
  const floatingRef = React.useRef<HTMLUListElement | null>(null);
  const triggersRef = React.useRef(triggers);
  triggersRef.current = triggers;

  // Search as the query changes; only the latest search's answer is kept.
  const searchSeq = React.useRef(0);
  const kind = range?.trigger.kind;
  const query = range?.query;
  React.useEffect(() => {
    const seq = ++searchSeq.current;
    const trigger = triggersRef.current.find((t) => t.kind === kind);
    if (!trigger || kind === undefined || query === undefined) {
      setAnswer(null);
      return;
    }
    const settle = (options: ReferenceOption[]) => {
      if (seq === searchSeq.current) setAnswer({ kind, query, options });
    };
    Promise.resolve()
      .then(() => trigger.search(query))
      .then(settle, () => settle([]));
  }, [kind, query]);

  // An answer shows only for the query it was asked for: while the next
  // search is pending, the previous one's options are neither shown nor
  // insertable (they may belong to another trigger).
  const answered =
    range !== null &&
    answer?.kind === range.trigger.kind &&
    answer.query === range.query;
  const results = answered ? answer.options : NO_OPTIONS;
  const menuOpen = answered && results.length > 0 && !!anchor;

  function insert(option: ReferenceOption) {
    const view = viewRef.current;
    if (!view || !range || !answered) return;
    setRange(null);
    // The host may have locked the editor while the list was open.
    if (!view.editable) return;
    // This render's trigger, not the one captured with the range: the host
    // may have changed `toHref`, or removed the trigger, since it opened.
    const trigger = triggersRef.current.find(
      (t) => t.kind === range.trigger.kind
    );
    if (!trigger) return;
    view.dispatch(insertReference(view.state, { ...range, trigger }, option));
    view.focus();
  }

  // Highlight, option ids and arrow / Enter / Tab: the same list logic as
  // the `@mention` autocomplete. Range detection and insertion stay here.
  const list = useSuggestionList(results, menuOpen, insert);
  const { highlight, setHighlight, listId, optionId, activeOptionId } = list;

  // Read through a ref so the plugin, created once with the editor, always
  // sees this render's triggers, results and range.
  const handlers = React.useRef<ReferenceHandlers>(NO_HANDLERS);
  handlers.current = {
    update: (view) => {
      viewRef.current = view;
      setSurface(view.dom);
      let next =
        view.editable && view.hasFocus()
          ? referenceQueryAt(view.state, triggersRef.current)
          : null;
      if (next?.from !== dismissedAt.current) dismissedAt.current = null;
      else next = null;
      setRange((prev) =>
        prev?.from === next?.from &&
        prev?.query === next?.query &&
        prev?.trigger === next?.trigger
          ? prev
          : next
      );
      if (!next) return;
      // At the caret, not the trigger: a query that wraps onto the next line
      // keeps the list under the text being typed.
      const { left, top, bottom } = view.coordsAtPos(next.to);
      setAnchor({ left, top, bottom });
    },
    keyDown: (_view, event) => {
      if (!range) return false;
      // Escape closes the spot even before the list appears, so a pending
      // search's answer doesn't open it afterwards. Once a search came back
      // empty there is nothing to close, and Escape is left to the host.
      if (event.key === 'Escape' && (menuOpen || !answered)) {
        dismissedAt.current = range.from;
        setRange(null);
        // Handled here only: a host's document-level Escape (a Modal) would
        // otherwise close too. The next Escape reaches the host.
        event.stopPropagation();
        return true;
      }
      return list.handleKey(event);
    },
    blur: () => setRange(null),
  };

  // A new query starts at the first match.
  React.useEffect(
    () => setHighlight(0),
    [setHighlight, range?.from, range?.query]
  );

  // The list is fixed to the viewport, so it follows the caret when the page
  // or an editor ancestor scrolls, the window resizes, or an on-screen
  // keyboard opens (the visual viewport shrinks and pans) — none of which
  // changes the editor's state, so `update` doesn't run.
  const rangeTo = range?.to;
  React.useEffect(() => {
    const view = viewRef.current;
    if (rangeTo === undefined || !view) return;
    const measure = () => {
      const { left, top, bottom } = view.coordsAtPos(rangeTo);
      setAnchor({ left, top, bottom });
    };
    const visual = window.visualViewport;
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    visual?.addEventListener('resize', measure);
    visual?.addEventListener('scroll', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      visual?.removeEventListener('resize', measure);
      visual?.removeEventListener('scroll', measure);
    };
  }, [rangeTo]);

  // The editor stays a multi-line textbox (a combobox role would misdescribe
  // the whole document); while the list is open it points at the list and
  // its highlighted option, which a textbox supports. An unlabeled surface
  // gets the textbox role here, since RichEditor sets it only with a label.
  React.useEffect(() => {
    const dom = surface;
    if (!dom || !triggersRef.current.length) return;
    if (!dom.hasAttribute('role')) {
      dom.setAttribute('role', 'textbox');
      dom.setAttribute('aria-multiline', 'true');
    }
    dom.setAttribute('aria-autocomplete', 'list');
    if (activeOptionId) {
      dom.setAttribute('aria-controls', listId);
      dom.setAttribute('aria-activedescendant', activeOptionId);
    } else {
      dom.removeAttribute('aria-controls');
      dom.removeAttribute('aria-activedescendant');
    }
  }, [surface, activeOptionId, listId]);

  // Measured once the list renders, before paint, so it never shows clipped
  // — and again whenever the caret is re-measured (scroll, resize, zoom), as
  // a wider viewport lets the list grow past the width it opened at.
  const [menuWidth, setMenuWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    if (menuOpen && floatingRef.current) {
      setMenuWidth(floatingRef.current.offsetWidth);
    }
  }, [menuOpen, results, anchor]);

  const kit = React.useMemo(
    () => createReferencesKit(() => triggersRef.current, handlers),
    []
  );

  const menuStyle: React.CSSProperties =
    anchor && typeof window !== 'undefined'
      ? menuPlacement(anchor, menuWidth, currentMenuViewport())
      : {};

  return {
    kit,
    activeTrigger: range?.trigger ?? null,
    menu: {
      menuOpen,
      suggestions: results,
      highlight,
      listId,
      optionId,
      floatingRef,
      menuStyle,
      insert,
      setHighlight,
    },
  };
}
