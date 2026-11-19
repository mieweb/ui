'use client';

import * as React from 'react';
import { Extension, type EditorKit } from '@kerebron/editor';
import {
  Plugin,
  TextSelection,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import {
  activeMentionQuery,
  filterMentionOptions,
  mentionText,
  type MentionMenuState,
  type MentionOption,
} from '../Messaging/useMentionAutocomplete';

/** The `@query` being typed: its text, and the document range it covers (`@` included). */
export interface MentionRange {
  query: string;
  from: number;
  to: number;
}

/**
 * The `@query` immediately before the caret, by the same rule as the
 * plain-text composers ({@link activeMentionQuery}); null when there is none
 * or text is selected.
 */
export function mentionAt(state: EditorState): MentionRange | null {
  const { selection } = state;
  if (!selection.empty || !selection.$from.parent.isTextblock) return null;
  const $from = selection.$from;
  const before = $from.parent.textBetween(
    0,
    $from.parentOffset,
    undefined,
    '\ufffc'
  );
  const found = activeMentionQuery(before, before.length);
  if (!found) return null;
  return {
    query: found.query,
    from: $from.pos - found.query.length - 1,
    to: $from.pos,
  };
}

/**
 * Replaces `range` with the chosen option and a space, caret after them: a
 * link to `href` labelled `label` when the option has one (and the schema has
 * a `link` mark), else `@value`.
 */
export function insertMention(
  state: EditorState,
  range: MentionRange,
  option: MentionOption
): Transaction {
  const { schema } = state;
  const link = option.href ? schema.marks.link : undefined;
  const text = link ? option.label : mentionText(option);
  const marks = link ? [link.create({ href: option.href })] : undefined;
  const tr = state.tr.replaceWith(range.from, range.to, [
    schema.text(text, marks),
    schema.text(' '),
  ]);
  const caret = range.from + text.length + 1;
  return tr.setSelection(TextSelection.create(tr.doc, caret)).scrollIntoView();
}

interface MentionHandlers {
  update: (view: EditorView) => void;
  keyDown: (view: EditorView, event: KeyboardEvent) => boolean;
}

/** Carries the editor's caret moves and keys to {@link useEditorMentions}. */
class EditorMentionsExtension extends Extension {
  name = 'editorMentions';
  constructor(private readonly handlers: { current: MentionHandlers }) {
    super({});
  }
  override getProseMirrorPlugins(): Plugin[] {
    const handlers = this.handlers;
    return [
      new Plugin({
        props: {
          handleKeyDown: (view, event) => handlers.current.keyDown(view, event),
        },
        view: (view) => {
          handlers.current.update(view);
          return { update: (next) => handlers.current.update(next) };
        },
      }),
    ];
  }
}

/** Room the list needs below the caret before it opens above it instead. */
const MENU_MAX_HEIGHT = 224;
/** Gap kept between the list and the viewport's edge. */
const VIEWPORT_MARGIN = 8;

/**
 * `@mention` autocomplete for a Kerebron editor: the kit to install, and the
 * state {@link MentionMenu} renders. Typing `@` offers `options` whose label
 * matches what follows; arrows move, Enter or Tab inserts, Escape closes.
 */
export function useEditorMentions(options: MentionOption[] | undefined): {
  kit: EditorKit;
  menu: MentionMenuState;
} {
  const [range, setRange] = React.useState<MentionRange | null>(null);
  const [highlight, setHighlight] = React.useState(0);
  const [anchor, setAnchor] = React.useState<{
    left: number;
    top: number;
    bottom: number;
  } | null>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  const floatingRef = React.useRef<HTMLUListElement | null>(null);
  const listId = React.useId();
  const optionId = React.useCallback(
    (index: number) => `${listId}-option-${index}`,
    [listId]
  );

  const suggestions = React.useMemo(
    () => (range ? filterMentionOptions(options, range.query) : []),
    [range, options]
  );
  const menuOpen = range !== null && suggestions.length > 0 && !!anchor;
  const clamped = menuOpen ? Math.min(highlight, suggestions.length - 1) : -1;

  const insert = (option: MentionOption) => {
    const view = viewRef.current;
    if (!view || !range) return;
    view.dispatch(insertMention(view.state, range, option));
    setRange(null);
    view.focus();
  };

  // Read through a ref so the plugin, created once with the editor, always
  // sees this render's options and range.
  const handlers = React.useRef<MentionHandlers>({
    update: () => undefined,
    keyDown: () => false,
  });
  handlers.current = {
    update: (view) => {
      viewRef.current = view;
      const next = options?.length ? mentionAt(view.state) : null;
      setRange((prev) =>
        prev?.from === next?.from && prev?.query === next?.query ? prev : next
      );
      if (!next) return;
      const { left, top, bottom } = view.coordsAtPos(next.from);
      setAnchor({ left, top, bottom });
    },
    keyDown: (_view, event) => {
      if (!menuOpen) return false;
      const count = suggestions.length;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setHighlight((h) => (Math.min(h, count - 1) + step + count) % count);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        insert(suggestions[clamped]);
        return true;
      }
      if (event.key === 'Escape') {
        setRange(null);
        return true;
      }
      return false;
    },
  };

  // A new query starts at the first match.
  React.useEffect(() => setHighlight(0), [range?.from, range?.query]);

  // The editor is the combobox; point it at the open list for screen readers.
  React.useEffect(() => {
    const dom = viewRef.current?.dom;
    if (!dom || !options?.length) return;
    dom.setAttribute('aria-autocomplete', 'list');
    if (menuOpen) {
      dom.setAttribute('aria-controls', listId);
      dom.setAttribute('aria-activedescendant', optionId(clamped));
    } else {
      dom.removeAttribute('aria-controls');
      dom.removeAttribute('aria-activedescendant');
    }
  }, [menuOpen, clamped, listId, optionId, options]);

  // Measured once the list renders, before paint, so it never shows clipped.
  const [menuWidth, setMenuWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    if (menuOpen && floatingRef.current) {
      setMenuWidth(floatingRef.current.offsetWidth);
    }
  }, [menuOpen, suggestions]);

  const kit = React.useMemo<EditorKit>(
    () => ({ getExtensions: () => [new EditorMentionsExtension(handlers)] }),
    []
  );

  // Below the caret, or above it where the viewport has no room below; kept
  // inside the viewport sideways (a caret near the end of a line).
  const below =
    !anchor ||
    typeof window === 'undefined' ||
    anchor.bottom + MENU_MAX_HEIGHT + VIEWPORT_MARGIN <= window.innerHeight;
  const menuStyle: React.CSSProperties = anchor
    ? {
        position: 'fixed',
        zIndex: 50,
        left: Math.max(
          VIEWPORT_MARGIN,
          Math.min(anchor.left, window.innerWidth - menuWidth - VIEWPORT_MARGIN)
        ),
        maxHeight: MENU_MAX_HEIGHT,
        ...(below
          ? { top: anchor.bottom + 4 }
          : { bottom: window.innerHeight - anchor.top + 4 }),
      }
    : {};

  return {
    kit,
    menu: {
      menuOpen,
      suggestions,
      highlight: clamped,
      listId,
      optionId,
      floatingRef,
      menuStyle,
      insert,
      setHighlight,
    },
  };
}
