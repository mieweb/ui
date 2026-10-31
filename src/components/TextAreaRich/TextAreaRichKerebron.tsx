import * as React from 'react';
import { Plugin, TextSelection } from 'prosemirror-state';
import type { Transaction } from 'prosemirror-state';
import type { Node as PMNode } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { Extension, type CoreEditor, type EditorKit } from '@kerebron/editor';
import { MenuItem } from '@kerebron/extension-menu';
import { Plus } from 'lucide-react';

import { cn } from '../../utils/cn';
import { Button } from '../Button';
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownSubmenu,
} from '../Dropdown';
import { MacroLibrary, type Macro } from '../MacroLibrary';
import { Animated, AnimatedPresence } from '../../motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import {
  RichEditor,
  type RichEditorHandle,
  type MenuElement,
  type ModifyMenu,
} from '../RichEditor';
import {
  processDictation,
  type RichTextEditorBlockMenuLabels,
} from '../RichTextEditor';
import type { TextAreaRichProps } from './TextAreaRich';
import { getSpeechRecognition, type SpeechRecognitionLike } from './speech';

/**
 * Kerebron-backed TextAreaRich surface: ProseMirror underneath, the stock
 * Kerebron toolbar (hidden until requested), the block gutter menu, docked
 * macro panel, `.shortcut` expansion and dictation — same `TextAreaRichProps`
 * contract (`value`/`onChange` carry HTML) as the legacy surface, but
 * strictly controlled like a native input: an edit that `onChange` does not
 * echo back into `value` reverts (see {@link RichEditorProps.strictValue}).
 *
 * Exported as `TextAreaRich` from `@mieweb/ui/kerebron`, and the engine
 * behind the main bundle's `Textarea` — which is why the `@kerebron/*`
 * runtime peers are required: hosts install them and load
 * `@mieweb/ui/kerebron.css`. (Only the Yjs collab peers remain optional.)
 */

/** Carries our keydown behaviors (macro shortcuts, Ctrl+/) into the editor. */
class TextAreaRichExtension extends Extension {
  name = 'textAreaRichShortcuts';
  constructor(
    private readonly onKeyDown: (
      view: EditorView,
      event: KeyboardEvent
    ) => boolean
  ) {
    super({});
  }
  override getProseMirrorPlugins(): Plugin[] {
    return [new Plugin({ props: { handleKeyDown: this.onKeyDown } })];
  }
}

/**
 * `CoreEditor.view` is typed `EditorView | DummyEditorView` (the dummy exists
 * only until `create()` returns, which is before `onReady` ever fires), so
 * every ready-time consumer can treat it as the real view.
 */
const viewOf = (editor: CoreEditor) => editor.view as EditorView;

/**
 * CSS properties whose numeric values are valid without a `px` unit —
 * React's full unitless list, so `editorStyle` keeps the React.CSSProperties
 * contract (`{ flex: 1 }` must not become `flex: 1px`).
 */
const UNITLESS_STYLE_PROPS = new Set([
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'boxFlexGroup',
  'boxOrdinalGroup',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'fontWeight',
  'gridArea',
  'gridRow',
  'gridRowEnd',
  'gridRowSpan',
  'gridRowStart',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnSpan',
  'gridColumnStart',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
  // SVG-related
  'fillOpacity',
  'floodOpacity',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
]);

/**
 * Replace `[from, to]` (defaults: the current selection) with plain text,
 * mapping `\n` to hard breaks, and put the caret after the insertion.
 */
function insertPlainText(
  view: EditorView,
  text: string,
  from = view.state.selection.from,
  to = view.state.selection.to
) {
  const { schema } = view.state;
  const br = schema.nodes.br ?? schema.nodes.hard_break;
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const nodes: PMNode[] = [];
  lines.forEach((line, index) => {
    if (index > 0) {
      if (br) nodes.push(br.create());
      else if (line) nodes.push(schema.text(' '));
    }
    if (line) nodes.push(schema.text(line));
  });
  let tr = view.state.tr.replaceWith(from, to, nodes);
  const end = Math.min(
    from + nodes.reduce((size, node) => size + node.nodeSize, 0),
    tr.doc.content.size
  );
  tr = tr.setSelection(TextSelection.near(tr.doc.resolve(end)));
  view.dispatch(tr.scrollIntoView());
}

/** One empty textblock — the ProseMirror notion of "nothing typed yet". */
function docIsEmpty(view: EditorView) {
  const { doc } = view.state;
  return (
    doc.childCount === 1 &&
    !!doc.firstChild &&
    doc.firstChild.isTextblock &&
    doc.firstChild.content.size === 0
  );
}

/** Gutter menu rows → Kerebron command names. */
const BLOCK_FORMAT_ITEMS: Array<{
  key: keyof RichTextEditorBlockMenuLabels;
  label: string;
  command: string;
}> = [
  { key: 'text', label: 'Text', command: 'setParagraph' },
  { key: 'heading1', label: 'Heading 1', command: 'setHeading1' },
  { key: 'heading2', label: 'Heading 2', command: 'setHeading2' },
  { key: 'heading3', label: 'Heading 3', command: 'setHeading3' },
  { key: 'bulletList', label: 'Bullet list', command: 'toggleBulletList' },
  { key: 'numberedList', label: 'Numbered list', command: 'toggleOrderedList' },
  { key: 'quote', label: 'Quote', command: 'toggleBlockquote' },
];

const TextAreaRichKerebron = React.forwardRef<
  HTMLDivElement,
  TextAreaRichProps
>(
  (
    {
      value = '',
      onChange,
      placeholder,
      className,
      enableDictation = true,
      onDictationError,
      disabled = false,
      macros,
      defaultMacrosOpen = false,
      macrosOnFocus = false,
      compactMacros = false,
      onMacroInsert,
      macroLabels,
      onCreateMacro,
      toolbar,
      defaultToolbar = 'hidden',
      onToolbarChange,
      blockMenuLabels,
      id,
      readOnly = false,
      editorClassName,
      editorStyle,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-required': ariaRequired,
    },
    ref
  ) => {
    const inert = disabled || readOnly;

    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const gutterWrapperRef = React.useRef<HTMLDivElement>(null);
    const editorHandleRef = React.useRef<RichEditorHandle>(null);
    const editorRef = React.useRef<CoreEditor | null>(null);
    const [ready, setReady] = React.useState(false);
    // Hosts reach the editable region through the ref (focus, `dir`,
    // ARIA attributes), as with the legacy surface's contenteditable; the
    // wrapper only stands in until the editor mounts.
    React.useImperativeHandle(
      ref,
      () =>
        ready && editorRef.current
          ? (viewOf(editorRef.current).dom as HTMLDivElement)
          : wrapperRef.current!,
      [ready]
    );

    const [macrosOpen, setMacrosOpen] = React.useState(
      defaultMacrosOpen && !macrosOnFocus
    );
    const [uncontrolledToolbar, setUncontrolledToolbar] =
      React.useState(defaultToolbar);
    const toolbarVisible = (toolbar ?? uncontrolledToolbar) === 'visible';
    const [isListening, setIsListening] = React.useState(false);
    const [speechSupported, setSpeechSupported] = React.useState(false);
    const [isEmpty, setIsEmpty] = React.useState(true);
    // Offset of the editable below the (optional) toolbar, inside the wrapper.
    const [editorTop, setEditorTop] = React.useState(0);
    const [blockMenuOpen, setBlockMenuOpen] = React.useState(false);
    const [gutterTop, setGutterTop] = React.useState(4);

    const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
    const isListeningRef = React.useRef(false);
    const shouldRestartRef = React.useRef(false);
    // Invalidates dictation starts still awaiting microphone permission.
    const dictationSessionRef = React.useRef(0);
    const hoverBlockRef = React.useRef<HTMLElement | null>(null);
    const blockTargetPosRef = React.useRef<number | null>(null);
    const firstBlockItemRef = React.useRef<HTMLButtonElement>(null);
    const macroPanelId = React.useId();

    const macroSidePanel = useMediaQuery('(min-width: 768px)');
    const prefersReducedMotion = usePrefersReducedMotion();

    const hasMacros = Boolean(macros);
    const hasMacroEntries = Boolean(
      macros?.some((group) => group.macros.length > 0)
    );
    // The gutter `+` stays discoverable on hover even while a focus-docked
    // field rests as a one-line input.
    const gutterActive = !inert;

    // Mount-time closures (the toolbar and keydown plugin are built once)
    // read the latest props/state through refs.
    const macrosRef = React.useRef(macros);
    macrosRef.current = macros;
    const hasMacrosRef = React.useRef(hasMacros);
    hasMacrosRef.current = hasMacros;
    const onMacroInsertRef = React.useRef(onMacroInsert);
    onMacroInsertRef.current = onMacroInsert;
    const onChangeRef = React.useRef(onChange);
    onChangeRef.current = onChange;
    const inertRef = React.useRef(inert);
    inertRef.current = inert;
    const macrosOpenRef = React.useRef(macrosOpen);
    macrosOpenRef.current = macrosOpen;
    const toolbarVisibleRef = React.useRef(toolbarVisible);
    toolbarVisibleRef.current = toolbarVisible;
    const dictationAvailableRef = React.useRef(false);
    dictationAvailableRef.current = enableDictation && speechSupported;
    const onDictationErrorRef = React.useRef(onDictationError);
    onDictationErrorRef.current = onDictationError;

    const reportError = (message: string) => {
      if (onDictationErrorRef.current) onDictationErrorRef.current(message);
      else if (typeof console !== 'undefined') console.warn(message);
    };

    const setToolbarVisibility = (next: 'visible' | 'hidden') => {
      if (toolbar === undefined) setUncontrolledToolbar(next);
      onToolbarChange?.(next);
    };

    const focusEditor = () => editorHandleRef.current?.focus();

    /** The live ProseMirror view, once the editor is mounted. */
    const currentView = () =>
      editorRef.current ? viewOf(editorRef.current) : null;

    // RichEditor publishes edits asynchronously, but a host that takes over
    // macro insertion (`onMacroInsert` returning true) composes from its last
    // published value — so a token-removal edit must reach `onChange` before
    // the hook runs. These waiters bridge that gap.
    const changeWaitersRef = React.useRef<(() => void)[]>([]);
    // The doc as of the last `onChange` emission — when the live doc is ahead
    // of this, a publish is still in flight.
    const publishedDocRef = React.useRef<unknown>(null);
    const handleChange = (next: string) => {
      publishedDocRef.current = currentView()?.state.doc ?? null;
      onChangeRef.current?.(next);
      const waiters = changeWaitersRef.current;
      changeWaitersRef.current = [];
      for (const resolve of waiters) resolve();
    };
    /** Resolves after the next `onChange` emission (or a short fallback). */
    const afterNextChange = () =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 250);
        changeWaitersRef.current.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });

    // --- Macro insertion ---

    const insertMacro = (macro: Macro) => {
      if (inertRef.current) return;
      if (!onMacroInsertRef.current) {
        const view = currentView();
        if (!view) return;
        view.focus();
        insertPlainText(view, macro.content);
        return;
      }
      // A host hook composes from the last *published* value — let any
      // in-flight publish land first, so a pick right after typing doesn't
      // overwrite the unpublished keystrokes.
      const view = currentView();
      const pending = view && view.state.doc !== publishedDocRef.current;
      const invoke = () => {
        if (inertRef.current) return; // went inert (or unmounted) waiting
        const liveView = currentView();
        if (!liveView) return;
        if (onMacroInsertRef.current?.(macro) === true) return;
        liveView.focus();
        insertPlainText(liveView, macro.content);
      };
      if (pending) void afterNextChange().then(invoke);
      else invoke();
    };

    /** Typed `.shortcut` + space → macro expansion (space consumed). */
    const expandTypedShortcut = (view: EditorView): boolean => {
      const groups = macrosRef.current;
      if (!groups) return false;
      const { selection } = view.state;
      if (!selection.empty) return false;
      const { $from } = selection;
      const textBefore = $from.parent.textBetween(
        0,
        $from.parentOffset,
        undefined,
        '\uFFFC'
      );
      const match = /(\S+)$/.exec(textBefore);
      if (!match) return false;
      const lowered = match[1].toLowerCase();
      const macro = groups
        .flatMap((group) => group.macros)
        .find((candidate) => candidate.shortcut?.toLowerCase() === lowered);
      if (!macro) return false;

      const from = $from.pos - match[1].length;
      // Without a host hook the whole expansion is one synchronous
      // transaction (token replaced by content — one undo step, no race).
      if (!onMacroInsertRef.current) {
        insertPlainText(view, macro.content, from, $from.pos);
        return true;
      }
      // A host hook composes from the last *published* value, so the token
      // removal must reach `onChange` first. While that publish is pending,
      // further edits (or a moved caret) must not misplace the insertion:
      // map the deletion point through every transaction and give up if it
      // is deleted out from under us.
      const editor = editorRef.current;
      view.dispatch(view.state.tr.delete(from, $from.pos));
      if (!editor) return true;
      let insertAt = from;
      let targetValid = true;
      const trackInsertionPoint = (event: Event) => {
        const tr = (
          event as globalThis.CustomEvent<{ transaction?: Transaction }>
        ).detail?.transaction;
        if (!tr) return;
        const mapped = tr.mapping.mapResult(insertAt);
        if (mapped.deleted) targetValid = false;
        insertAt = mapped.pos;
      };
      editor.addEventListener('transaction', trackInsertionPoint);
      void afterNextChange().then(() => {
        editor.removeEventListener('transaction', trackInsertionPoint);
        if (onMacroInsertRef.current?.(macro) === true) return;
        if (editorRef.current !== editor || !targetValid) return;
        const liveView = viewOf(editor);
        liveView.focus();
        const at = Math.min(insertAt, liveView.state.doc.content.size);
        insertPlainText(liveView, macro.content, at, at);
      });
      return true;
    };

    // --- Block gutter menu ---

    const resetGutter = () => {
      hoverBlockRef.current = null;
      setGutterTop(editorTop + 4);
    };

    const handleGutterMouseMove = (event: React.MouseEvent) => {
      if (blockMenuOpen) return;
      const view = currentView();
      const wrapper = gutterWrapperRef.current;
      if (!view || !wrapper) return;
      let target: HTMLElement | null = null;
      let top: number | null = null;
      for (const child of Array.from(view.dom.children)) {
        const rect = child.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (rect.top <= event.clientY) {
          target = child as HTMLElement;
          top = rect.top;
        }
      }
      if (!target || top === null) {
        resetGutter();
        return;
      }
      hoverBlockRef.current = target;
      const wrapperTop = wrapper.getBoundingClientRect().top;
      const next = Math.max(Math.round(top - wrapperTop), editorTop + 4);
      setGutterTop((current) => (current === next ? current : next));
    };

    /** Dropdown open/close driven by the gutter trigger (mouse path). */
    const handleBlockMenuOpenChange = (open: boolean) => {
      const view = currentView();
      if (open) {
        const block = hoverBlockRef.current;
        blockTargetPosRef.current =
          view && block && view.dom.contains(block)
            ? view.posAtDOM(block, 0)
            : null;
      } else if (view && document.activeElement?.closest('[role="menu"]')) {
        // Escape: focus sits on a menu item about to unmount — hand it back
        // to the editor so typing resumes.
        view.focus();
      }
      setBlockMenuOpen(open);
    };

    /** Ctrl/Cmd+/ — open the menu targeting the caret's block. */
    const openBlockMenuAtCaret = () => {
      const view = currentView();
      const wrapper = gutterWrapperRef.current;
      if (view && wrapper) {
        const { from } = view.state.selection;
        blockTargetPosRef.current = from;
        try {
          const coords = view.coordsAtPos(from);
          const wrapperTop = wrapper.getBoundingClientRect().top;
          setGutterTop(
            Math.max(Math.round(coords.top - wrapperTop), editorTop + 4)
          );
        } catch {
          // Position lookup can fail mid-update; the menu still opens.
        }
      }
      setBlockMenuOpen(true);
    };

    /** Put the selection at the menu's captured target block. */
    const applyBlockTarget = (view: EditorView) => {
      const pos = blockTargetPosRef.current;
      if (pos === null) return;
      const clamped = Math.min(pos, view.state.doc.content.size);
      view.dispatch(
        view.state.tr.setSelection(
          TextSelection.near(view.state.doc.resolve(clamped))
        )
      );
    };

    const applyBlockFormat = (command: string) => {
      const editor = editorRef.current;
      if (inert || !editor) return;
      setBlockMenuOpen(false);
      const view = viewOf(editor);
      view.focus();
      applyBlockTarget(view);
      (editor.run as Record<string, undefined | (() => boolean)>)[command]?.();
    };

    // Menus move focus to their first item on open (WAI-ARIA menu pattern);
    // required for the Ctrl/Cmd+/ path, where focus is still in the editor.
    React.useEffect(() => {
      if (!blockMenuOpen) return;
      const frame = requestAnimationFrame(() =>
        firstBlockItemRef.current?.focus()
      );
      return () => cancelAnimationFrame(frame);
    }, [blockMenuOpen]);

    // --- Dictation ---

    const toggleDictation = React.useRef(async () => {
      const SpeechRecognition = getSpeechRecognition();
      if (!SpeechRecognition) return;

      // Stop anything live — or still pending between `start()` and
      // `onstart`, when nothing is listening yet.
      if (isListeningRef.current || recognitionRef.current) {
        stopDictation();
        return;
      }

      const session = ++dictationSessionRef.current;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        reportError(
          'Microphone access is required for dictation. Please allow microphone access in your browser settings and try again.'
        );
        return;
      }

      // The toolbar (and its Stop control) may have been hidden — or the
      // editor made disabled/readOnly or unmounted — while awaiting
      // microphone permission; do not start an unstoppable, read-only or
      // orphaned session.
      if (session !== dictationSessionRef.current) return;
      if (!toolbarVisibleRef.current || inertRef.current) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        // A stop issued between `start()` and this callback already tore the
        // session down — do not arm an unstoppable restart loop.
        if (session !== dictationSessionRef.current) {
          try {
            recognition.stop();
          } catch {
            // Already stopped.
          }
          return;
        }
        setIsListening(true);
        isListeningRef.current = true;
        shouldRestartRef.current = true;
      };

      recognition.onresult = (event) => {
        if (inertRef.current) return;
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) finalTranscript += result[0].transcript;
        }
        const view = currentView();
        if (finalTranscript && view) {
          view.focus();
          insertPlainText(view, processDictation(finalTranscript) + ' ');
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        if (event.error === 'not-allowed') {
          reportError(
            'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
          );
          shouldRestartRef.current = false;
          isListeningRef.current = false;
          setIsListening(false);
          return;
        }
        if (event.error === 'network') return;
        shouldRestartRef.current = false;
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognition.onend = () => {
        if (
          shouldRestartRef.current &&
          isListeningRef.current &&
          !inertRef.current
        ) {
          setTimeout(() => {
            if (
              shouldRestartRef.current &&
              isListeningRef.current &&
              !inertRef.current
            ) {
              try {
                recognition.start();
              } catch {
                shouldRestartRef.current = false;
                isListeningRef.current = false;
                if (recognitionRef.current === recognition)
                  recognitionRef.current = null;
                setIsListening(false);
              }
            }
          }, 100);
        } else {
          // Ended for good — release the ref so the next toggle starts a
          // fresh session instead of "stopping" a dead one.
          if (recognitionRef.current === recognition)
            recognitionRef.current = null;
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        recognitionRef.current = null;
        reportError('Failed to start speech recognition. Please try again.');
      }
    }).current;

    const stopDictation = React.useCallback(() => {
      // Invalidate any start still awaiting microphone permission — or a
      // recognition whose `onstart` hasn't fired yet — and tear down
      // unconditionally: `isListeningRef` is false in that pending window,
      // so an early-return would leave the recognition to arm itself with
      // no Stop control visible.
      dictationSessionRef.current += 1;
      shouldRestartRef.current = false;
      isListeningRef.current = false;
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      try {
        recognition?.stop();
      } catch {
        // Stopping before `onstart` can throw; the session bump above
        // already keeps it from arming.
      }
      setIsListening(false);
    }, []);

    React.useEffect(() => {
      setSpeechSupported(Boolean(getSpeechRecognition()));
    }, []);

    // Hiding the toolbar hides the Stop control; never leave an orphaned
    // session running. Same when the editor turns disabled/readOnly.
    React.useEffect(() => {
      if (!toolbarVisible || inert) stopDictation();
    }, [toolbarVisible, inert, stopDictation]);

    // End-of-life cleanup.
    React.useEffect(() => stopDictation, [stopDictation]);

    // --- Kerebron toolbar additions (built once, read state through refs) ---

    const openBlockMenuAtCaretRef = React.useRef(openBlockMenuAtCaret);
    openBlockMenuAtCaretRef.current = openBlockMenuAtCaret;
    const expandTypedShortcutRef = React.useRef(expandTypedShortcut);
    expandTypedShortcutRef.current = expandTypedShortcut;

    const [menuAddon] = React.useState(() => {
      // Icon-only (filled Material-style paths, like Kerebron's stock
      // items): text labels clip to an empty square in the 32px overflow
      // grid and force the popup onto extra rows.
      const macrosItem = new MenuItem({
        icon: {
          width: 24,
          height: 24,
          // Material Symbols "text snippet" (Apache-2.0)
          path: 'M20.41 8.41l-4.83-4.83c-.37-.37-.88-.58-1.41-.58H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9.83c0-.53-.21-1.04-.59-1.42zM7 7h7v2H7V7zm10 10H7v-2h10v2zm0-4H7v-2h10v2z',
        },
        title: macroLabels?.showMacros ?? 'Show macros',
        class: 'tar-menu-macros',
        select: () => hasMacrosRef.current,
        enable: () => !inertRef.current,
        active: () => macrosOpenRef.current,
        run: () => {
          setMacrosOpen((open) => !open);
          return true;
        },
      });
      const dictateItem = new MenuItem({
        icon: {
          width: 24,
          height: 24,
          // Material Symbols "mic" (Apache-2.0)
          path: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
        },
        title: 'Start dictation',
        class: 'tar-menu-dictate',
        select: () => dictationAvailableRef.current,
        enable: () => !inertRef.current,
        active: () => isListeningRef.current,
        run: () => {
          void toggleDictation();
          return true;
        },
      });
      const modifyMenu: ModifyMenu = (menus: MenuElement[][]) => [
        ...menus,
        // The patched MenuItem types `render().dom` as nullable, which no
        // longer satisfies MenuElement; our items always render a button.
        [macrosItem, dictateItem] as unknown as MenuElement[],
      ];
      const kit: EditorKit = {
        getExtensions: () => [
          new TextAreaRichExtension((view, event) => {
            if (inertRef.current) return false;
            if (
              event.key === '/' &&
              (event.ctrlKey || event.metaKey) &&
              !event.altKey
            ) {
              openBlockMenuAtCaretRef.current();
              return true;
            }
            if (
              event.key !== ' ' ||
              event.isComposing ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey
            ) {
              return false;
            }
            return expandTypedShortcutRef.current(view);
          }),
        ],
      };
      return { modifyMenu, kits: [kit] };
    });

    // The toolbar only repaints items on document/selection changes, so
    // React-side state (panel open, dictation) is synced into our injected
    // buttons directly.
    React.useEffect(() => {
      const root = wrapperRef.current;
      if (!root || !ready) return;
      // Disabled/readOnly must neutralize the stock toolbar too — its
      // buttons dispatch regardless of the view's `editable` prop. `inert`
      // blocks both pointer and keyboard access.
      for (const toolbar of root.querySelectorAll<HTMLElement>(
        '.kb-custom-menu, .kb-custom-menu__overflow-menu'
      )) {
        toolbar.inert = inert;
      }
      const macrosButton = root.querySelector<HTMLElement>('.tar-menu-macros');
      if (macrosButton) {
        macrosButton.style.display = hasMacros ? '' : 'none';
        macrosButton.classList.toggle('kb-menu__button--active', macrosOpen);
        macrosButton.setAttribute('aria-pressed', String(macrosOpen));
        const title = macrosOpen
          ? (macroLabels?.hideMacros ?? 'Hide macros')
          : (macroLabels?.showMacros ?? 'Show macros');
        macrosButton.setAttribute('title', title);
        macrosButton.setAttribute('aria-label', title);
      }
      const dictateButton =
        root.querySelector<HTMLElement>('.tar-menu-dictate');
      if (dictateButton) {
        dictateButton.style.display =
          enableDictation && speechSupported ? '' : 'none';
        dictateButton.classList.toggle('kb-menu__button--active', isListening);
        dictateButton.setAttribute('aria-pressed', String(isListening));
        const title = isListening ? 'Stop dictation' : 'Start dictation';
        dictateButton.setAttribute('title', title);
        dictateButton.setAttribute('aria-label', title);
      }
    }, [
      ready,
      inert,
      hasMacros,
      macrosOpen,
      macroLabels,
      enableDictation,
      speechSupported,
      isListening,
      toolbarVisible,
    ]);

    // --- Editor wiring ---

    const handleReady = (editor: CoreEditor) => {
      editorRef.current = editor;
      // The initial load publishes nothing; the loaded doc is the baseline.
      publishedDocRef.current = viewOf(editor).state.doc;
      setIsEmpty(docIsEmpty(viewOf(editor)));
      editor.addEventListener('transaction', () => {
        if (editorRef.current !== editor) return;
        setIsEmpty(docIsEmpty(viewOf(editor)));
      });
      setReady(true);
    };

    // The editable region's identity: ARIA naming, validation state and the
    // host-given id all live on the ProseMirror surface, like the legacy
    // contenteditable. setProps merges, so this never clobbers editability.
    React.useEffect(() => {
      const view = currentView();
      if (!view || !ready) return;
      view.setProps({
        attributes: {
          role: 'textbox',
          'aria-multiline': 'true',
          ...(id ? { id } : {}),
          ...((ariaLabel ?? placeholder)
            ? { 'aria-label': (ariaLabel ?? placeholder) as string }
            : {}),
          ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
          ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
          ...(ariaInvalid ? { 'aria-invalid': String(ariaInvalid) } : {}),
          // Booleanish: the string "false" must not read as required.
          ...(ariaRequired !== undefined
            ? { 'aria-required': String(ariaRequired) }
            : {}),
          ...(readOnly ? { 'aria-readonly': 'true' } : {}),
          ...(disabled ? { 'aria-disabled': 'true' } : {}),
          // Read-only keeps keyboard focus and text selection available;
          // ProseMirror drops natural tabbability once `editable` is false.
          tabindex: disabled ? '-1' : '0',
          // setProps replaces the create-time attributes, so the base
          // kb-editor class must be restated alongside any custom class.
          class: editorClassName ? `kb-editor ${editorClassName}` : 'kb-editor',
        },
      });
    }, [
      ready,
      id,
      ariaLabel,
      placeholder,
      ariaLabelledBy,
      ariaDescribedBy,
      ariaInvalid,
      ariaRequired,
      readOnly,
      disabled,
      editorClassName,
    ]);

    // Read-only keeps the region focusable/selectable but blocks edits —
    // enforced by RichEditor's own `readOnly` prop from creation (so the
    // surface is locked even while the initial document load is in flight).

    const appliedEditorStyle = React.useRef<string[]>([]);
    React.useEffect(() => {
      const view = currentView();
      if (!view || !ready) return;
      // React style contract: camelCase keys, numbers in px (unless the
      // property is unitless), and removed keys actually un-apply.
      const style = (view.dom as HTMLElement).style;
      for (const property of appliedEditorStyle.current) {
        style.removeProperty(property);
      }
      appliedEditorStyle.current = [];
      if (!editorStyle) return;
      for (const [key, raw] of Object.entries(editorStyle)) {
        if (raw === null || raw === undefined) continue;
        const property = key.startsWith('--')
          ? key
          : key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
        const value =
          typeof raw === 'number' && !UNITLESS_STYLE_PROPS.has(key)
            ? `${raw}px`
            : String(raw);
        style.setProperty(property, value);
        appliedEditorStyle.current.push(property);
      }
    }, [ready, editorStyle]);

    // The editable sits below the (optional) toolbar inside the gutter
    // wrapper; everything anchored beside it (placeholder, gutter +, docked
    // macro panel) offsets by the toolbar's live height.
    React.useEffect(() => {
      const view = currentView();
      const wrapper = gutterWrapperRef.current;
      if (!view || !wrapper || !ready) return;
      const measure = () => {
        const top = Math.max(
          Math.round(
            view.dom.getBoundingClientRect().top -
              wrapper.getBoundingClientRect().top
          ),
          0
        );
        setEditorTop((current) => (current === top ? current : top));
        // A hovered block may have been deleted since; a detached node must
        // not pin the gutter button to its old offset.
        if (!hoverBlockRef.current?.isConnected) {
          hoverBlockRef.current = null;
          setGutterTop(top + 4);
        }
      };
      measure();
      // Re-measure when the toolbar wraps to more/fewer rows.
      const observer = new ResizeObserver(measure);
      observer.observe(wrapper);
      return () => observer.disconnect();
    }, [ready, toolbarVisible]);

    return (
      <div
        ref={wrapperRef}
        data-slot="textarea-rich"
        data-toolbar={toolbarVisible ? 'visible' : 'hidden'}
        data-inert={inert ? '' : undefined}
        data-macros-open={hasMacros && macrosOpen ? '' : undefined}
        data-compact-macros={compactMacros ? '' : undefined}
        data-gutter={gutterActive ? '' : undefined}
        data-block-menu={blockMenuOpen ? '' : undefined}
        className={cn(
          'border-input rounded-lg border',
          'transition-colors duration-200',
          'focus-within:ring-ring focus-within:border-transparent focus-within:ring-2',
          'flex flex-col',
          disabled && 'bg-muted/20',
          className
        )}
        onFocus={
          hasMacros && macrosOnFocus ? () => setMacrosOpen(true) : undefined
        }
        onBlur={
          hasMacros && macrosOnFocus
            ? (event) => {
                const related = event.relatedTarget as HTMLElement | null;
                if (related && event.currentTarget.contains(related)) return;
                // The block gutter's dropdown — and its "Insert macro"
                // submenu — mount in portals under document.body (outside
                // this frame); focus moving into our own menu tree is an
                // internal move, not leaving the field. Walk each menu back
                // to its trigger (a submenu's trigger sits in the parent
                // menu's portal) until one lands inside this frame.
                let menu = related?.closest<HTMLElement>('[role="menu"]');
                while (menu && menu.id) {
                  const trigger = document.querySelector(
                    `[aria-controls="${globalThis.CSS.escape(menu.id)}"]`
                  );
                  if (!trigger) break;
                  if (event.currentTarget.contains(trigger)) return;
                  menu = trigger.closest<HTMLElement>('[role="menu"]');
                }
                setMacrosOpen(false);
              }
            : undefined
        }
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={gutterWrapperRef}
            data-slot="textarea-rich-body"
            className={cn('relative flex-1', 'group/tar-body')}
            onMouseMove={gutterActive ? handleGutterMouseMove : undefined}
          >
            {gutterActive && (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- mousedown here only guards editor focus (preventDefault); the real controls inside are native buttons.
              <div
                data-slot="textarea-rich-block-gutter"
                className="absolute start-1 z-10"
                style={{ top: gutterTop }}
                // Keep the editor focused through gutter interaction (see
                // the legacy surface for the full iOS rationale).
                onMouseDown={(event) => event.preventDefault()}
              >
                <Dropdown
                  open={blockMenuOpen}
                  onOpenChange={handleBlockMenuOpenChange}
                  placement="bottom-start"
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-6 w-6 p-0',
                        'opacity-0 transition-opacity',
                        'group-hover/tar-body:opacity-100',
                        'focus-visible:opacity-100',
                        '[@media(hover:none)]:opacity-100',
                        blockMenuOpen && 'opacity-100'
                      )}
                      aria-label={blockMenuLabels?.blockMenu ?? 'Block menu'}
                      title={blockMenuLabels?.blockMenu ?? 'Block menu'}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                >
                  {BLOCK_FORMAT_ITEMS.map((item, index) => (
                    <DropdownItem
                      key={item.key}
                      ref={index === 0 ? firstBlockItemRef : undefined}
                      onClick={() => applyBlockFormat(item.command)}
                    >
                      {blockMenuLabels?.[item.key] ?? item.label}
                    </DropdownItem>
                  ))}
                  <DropdownSeparator />
                  {hasMacros && macros && (
                    <>
                      <DropdownSubmenu
                        label={blockMenuLabels?.insertMacro ?? 'Insert macro'}
                        disabled={!hasMacroEntries}
                      >
                        {blockMenuOpen &&
                          macros.flatMap((group) => [
                            ...(macros.length > 1
                              ? [
                                  <DropdownLabel key={`h:${group.id}`}>
                                    {group.label}
                                  </DropdownLabel>,
                                ]
                              : []),
                            ...group.macros.map((macro) => (
                              <DropdownItem
                                key={`m:${JSON.stringify([group.id, macro.id])}`}
                                className="[&>[data-slot=dropdown-item-label]]:min-w-0 [&>[data-slot=dropdown-item-label]]:flex-1"
                                onClick={() => {
                                  setBlockMenuOpen(false);
                                  const view = currentView();
                                  if (view) {
                                    view.focus();
                                    // Insertion lands at the menu's target
                                    // block, mirroring the panel flow.
                                    applyBlockTarget(view);
                                  }
                                  insertMacro(macro);
                                }}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  {macro.shortcut && (
                                    <span
                                      dir="ltr"
                                      className="border-border bg-background text-muted-foreground rounded border px-1 font-mono text-[11px]"
                                    >
                                      {macro.shortcut}
                                    </span>
                                  )}
                                  <span className="min-w-0 flex-1 truncate">
                                    {macro.label}
                                  </span>
                                </span>
                              </DropdownItem>
                            )),
                          ])}
                      </DropdownSubmenu>
                      <DropdownItem
                        onClick={() => {
                          setBlockMenuOpen(false);
                          setMacrosOpen(true);
                          focusEditor();
                        }}
                      >
                        {blockMenuLabels?.showMacroLibrary ??
                          'Show macro library'}
                      </DropdownItem>
                      <DropdownSeparator />
                    </>
                  )}
                  <DropdownItem
                    onClick={() => {
                      setBlockMenuOpen(false);
                      setToolbarVisibility(
                        toolbarVisible ? 'hidden' : 'visible'
                      );
                      focusEditor();
                    }}
                  >
                    {toolbarVisible
                      ? (blockMenuLabels?.hideToolbar ?? 'Hide toolbar')
                      : (blockMenuLabels?.showToolbar ?? 'Show toolbar')}
                  </DropdownItem>
                </Dropdown>
              </div>
            )}
            {isEmpty && placeholder && (
              <div
                aria-hidden="true"
                className={cn(
                  'text-muted-foreground pointer-events-none absolute start-0 end-0 z-[1]',
                  'truncate px-3 py-[7px] text-base',
                  'transition-[padding] duration-200 motion-reduce:transition-none',
                  // Mirrors the editable's sliding gutter indent.
                  gutterActive &&
                    'group-focus-within/tar-body:ps-10 group-hover/tar-body:ps-10',
                  gutterActive && blockMenuOpen && 'ps-10',
                  hasMacros && macrosOpen && 'md:me-72',
                  editorClassName
                )}
                style={{ top: editorTop }}
              >
                {placeholder}
              </div>
            )}
            <RichEditor
              ref={editorHandleRef}
              value={value}
              onChange={handleChange}
              valueType="text/html"
              strictValue
              modifyMenu={menuAddon.modifyMenu}
              editorKits={menuAddon.kits}
              onReady={handleReady}
              disabled={disabled}
              readOnly={readOnly}
            />
          </div>

          {hasMacros && (
            <AnimatedPresence>
              {macrosOpen && (
                <Animated
                  key="macro-panel"
                  preset={macroSidePanel ? 'menu' : 'collapse'}
                  enabled={macroSidePanel || !prefersReducedMotion}
                  mode="presence"
                  custom={
                    typeof document !== 'undefined' && document.dir === 'rtl'
                      ? 'left'
                      : 'right'
                  }
                  fallbackClassName="animate-fade-in"
                  className="border-border flex max-h-72 flex-col overflow-hidden border-t md:absolute md:end-0 md:bottom-0 md:max-h-none md:w-72 md:overflow-visible md:border-s md:border-t-0"
                  // Docked below the toolbar (top only applies when the
                  // panel goes absolute at md:).
                  style={{ top: editorTop }}
                >
                  <MacroLibrary
                    id={macroPanelId}
                    groups={macros!}
                    onSelect={insertMacro}
                    targetLabel={ariaLabel ?? placeholder}
                    onClose={
                      macrosOnFocus
                        ? undefined
                        : () => {
                            setMacrosOpen(false);
                            focusEditor();
                          }
                    }
                    onCreateMacro={onCreateMacro}
                    labels={macroLabels}
                    compact={compactMacros}
                    className="min-h-0 flex-1"
                  />
                </Animated>
              )}
            </AnimatedPresence>
          )}
        </div>
      </div>
    );
  }
);

TextAreaRichKerebron.displayName = 'TextAreaRichKerebron';

export { TextAreaRichKerebron };
