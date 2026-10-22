import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Braces,
  Replace,
  Mic,
  MicOff,
  BookOpen,
  Plus,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Separator } from '../Separator';
import {
  MacroLibrary,
  type Macro,
  type MacroGroup,
  type MacroLibraryProps,
} from '../MacroLibrary';
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownSubmenu,
} from '../Dropdown';
import {
  processDictation,
  convertAngleBracketsToMustache,
  isHtmlEmpty,
} from './processDictation';

export interface RichTextVariable {
  /** Human-readable label shown in the variable menu. */
  label: string;
  /** The token displayed for the variable (e.g. `{{employee.name}}`). */
  value: string;
  /** Optional text inserted instead of `value` (e.g. an expanded group). */
  insertValue?: string;
}

export interface RichTextVariableGroup {
  /** Group heading shown in the variable menu. */
  label: string;
  /** Variables belonging to the group. */
  variables: RichTextVariable[];
}

export interface RichTextEditorBlockMenuLabels {
  /** Accessible label for the gutter `+` button. Defaults to "Block menu". */
  blockMenu?: string;
  /** "Text" (normal paragraph) menu item. */
  text?: string;
  /** "Heading 1" menu item. */
  heading1?: string;
  /** "Heading 2" menu item. */
  heading2?: string;
  /** "Heading 3" menu item. */
  heading3?: string;
  /** "Bullet list" menu item. */
  bulletList?: string;
  /** "Numbered list" menu item. */
  numberedList?: string;
  /** "Quote" menu item. */
  quote?: string;
  /** "Insert macro" submenu parent (shown when `macros` is provided). */
  insertMacro?: string;
  /** "Show macro library" menu item (shown when `macros` is provided). */
  showMacroLibrary?: string;
  /** Toolbar toggle item while the toolbar is hidden. */
  showToolbar?: string;
  /** Toolbar toggle item while the toolbar is visible. */
  hideToolbar?: string;
}

export interface RichTextEditorProps {
  /** Current HTML value of the editor. */
  value: string;
  /** Called with the updated HTML whenever the content changes. */
  onChange: (value: string) => void;
  /** Placeholder shown when the editor is empty. */
  placeholder?: string;
  /** Additional class for the editor wrapper. */
  className?: string;
  /**
   * Variable groups for the "Insert variable" menu. When omitted the variable
   * menu and the `<< >>` → `{{ }}` convert button are hidden.
   */
  variableGroups?: RichTextVariableGroup[];
  /** Enable the speech-to-text dictation button. Defaults to true. */
  enableDictation?: boolean;
  /** Called when dictation cannot start (replaces native alerts). */
  onDictationError?: (message: string) => void;
  /** Disable editing and toolbar actions. */
  disabled?: boolean;
  /**
   * Sanitises HTML introduced by paste or drop before it reaches the editable
   * DOM. Without it, pasted markup is inserted as the browser provides it.
   */
  sanitizeHtml?: (html: string) => string;
  /**
   * Grouped macros for the optional macro addon. When omitted the editor is
   * unchanged. When provided, a "Macros" toolbar toggle docks a searchable
   * macro panel inside the editor; selecting a macro inserts its content at
   * the retained caret position. Typing a macro shortcut (e.g. `.b`)
   * followed by a space expands it in place, panel open or not.
   */
  macros?: MacroGroup[];
  /** Open the macro panel initially. Defaults to false. */
  defaultMacrosOpen?: boolean;
  /**
   * Overridable labels for the macro addon (i18n). Panel labels are
   * forwarded to the docked `MacroLibrary`; `macros` doubles as the toolbar
   * toggle text, and `showMacros`/`hideMacros` set the toggle's title.
   */
  macroLabels?: MacroLibraryProps['labels'] & {
    /** Toggle title while the panel is closed. Defaults to "Show macros". */
    showMacros?: string;
    /** Toggle title while the panel is open. Defaults to "Hide macros". */
    hideMacros?: string;
  };
  /** Forwarded to the macro panel's "Save as macro" action. */
  onCreateMacro?: () => void;
  /**
   * Controlled toolbar visibility. `'hidden'` removes the toolbar entirely
   * for chromeless surfaces (typed shortcuts keep working; pair with
   * `markdownShortcuts` or `blockMenu` so formatting stays reachable). When
   * omitted the editor manages visibility itself, starting from
   * `defaultToolbar` — existing consumers are unchanged.
   */
  toolbar?: 'visible' | 'hidden';
  /**
   * Initial toolbar visibility when `toolbar` is uncontrolled. Defaults to
   * `'visible'`.
   */
  defaultToolbar?: 'visible' | 'hidden';
  /**
   * Called when the block gutter menu toggles the toolbar ("Show toolbar" /
   * "Hide toolbar"), so hosts can persist the preference or drive the
   * controlled `toolbar` prop.
   */
  onToolbarChange?: (toolbar: 'visible' | 'hidden') => void;
  /**
   * Notion-style block gutter menu. Hovering a text row reveals a `+`
   * button in the start gutter whose menu applies block formats to that
   * row, opens the macro panel (when `macros` is provided) and toggles the
   * toolbar. Also reachable from the keyboard with Ctrl/Cmd+/ on the
   * caret's block. Defaults to false.
   */
  blockMenu?: boolean;
  /** Overridable labels for the block gutter menu (i18n). */
  blockMenuLabels?: RichTextEditorBlockMenuLabels;
  /**
   * Expand markdown-style block shortcuts typed at the start of a line and
   * followed by a space: `#`/`##`/`###` → headings, `-`/`*` → bullet list,
   * `1.` → numbered list, `>` → block quote. Inline rules (`**bold**`) are
   * not interpreted. Defaults to false.
   */
  markdownShortcuts?: boolean;
  /**
   * Textarea-like surface: removes the wrapper border/radius and starts the
   * editable at a single Input-row height that auto-grows with content
   * (matching `Textarea`'s `md` metrics). The host supplies the chrome —
   * `RichTextArea` is the packaged pairing. Defaults to false.
   */
  chromeless?: boolean;
  /** Accessible label for the editable region. */
  'aria-label'?: string;
}

// --- Minimal Web Speech API typings (absent from the standard DOM lib) ---
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as SpeechWindow;
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

/** Elements that end a visible word, equivalent to whitespace. */
const BLOCK_BOUNDARY =
  /^(BR|DIV|P|LI|UL|OL|TABLE|TR|TD|TH|H[1-6]|BLOCKQUOTE|PRE|HR)$/;

/**
 * Markdown-style block tokens expanded on space at the start of a line.
 * Values feed `document.execCommand`; block rules only — inline markdown
 * (e.g. `**bold**`) is intentionally not interpreted.
 */
const MARKDOWN_BLOCK_RULES: Record<
  string,
  { command: string; value?: string }
> = {
  '#': { command: 'formatBlock', value: 'h1' },
  '##': { command: 'formatBlock', value: 'h2' },
  '###': { command: 'formatBlock', value: 'h3' },
  '-': { command: 'insertUnorderedList' },
  '*': { command: 'insertUnorderedList' },
  '1.': { command: 'insertOrderedList' },
  '>': { command: 'formatBlock', value: 'blockquote' },
};

/**
 * Bounding rect of a top-level editor node. Text nodes (a bare first line
 * has no element wrapper) are measured through a Range.
 */
function nodeRect(node: Node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return (node as HTMLElement).getBoundingClientRect();
  }
  if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').length > 0) {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
  }
  return null;
}

/**
 * Last non-empty text node rendered inside `node`, or 'boundary' when it
 * ends with a line break or block element.
 */
function lastTextWithin(node: Node): Text | 'boundary' | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').length > 0 ? (node as Text) : null;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  if (BLOCK_BOUNDARY.test((node as HTMLElement).tagName)) return 'boundary';
  for (let child = node.lastChild; child; child = child.previousSibling) {
    const found = lastTextWithin(child);
    if (found) return found;
  }
  return null;
}

/**
 * Previous visible text node before `node`, looking across adjacent inline
 * elements (e.g. the "." in `.<b>c</b>` precedes the "c"). Returns null at
 * a block/line-break boundary or the editor root, where a word cannot
 * continue.
 */
function previousVisibleText(node: Node, root: HTMLElement): Text | null {
  let current: Node = node;
  while (current !== root) {
    let sibling: Node | null = current.previousSibling;
    while (sibling) {
      const found = lastTextWithin(sibling);
      if (found === 'boundary') return null;
      if (found) return found;
      sibling = sibling.previousSibling;
    }
    const parent: Node | null = current.parentNode;
    if (!parent) return null;
    if (
      parent !== root &&
      parent.nodeType === Node.ELEMENT_NODE &&
      BLOCK_BOUNDARY.test((parent as HTMLElement).tagName)
    ) {
      return null;
    }
    current = parent;
  }
  return null;
}

/**
 * A presentational rich-text editor with formatting, template-variable
 * insertion and optional speech-to-text dictation. Content is supplied and
 * surfaced via `value`/`onChange` so it can be wired to any store. The variable
 * menu is data-agnostic — pass `variableGroups` to populate it.
 */
const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      value,
      onChange,
      placeholder,
      className,
      variableGroups,
      enableDictation = true,
      onDictationError,
      disabled = false,
      sanitizeHtml,
      macros,
      defaultMacrosOpen = false,
      macroLabels,
      onCreateMacro,
      toolbar,
      defaultToolbar = 'visible',
      onToolbarChange,
      blockMenu = false,
      blockMenuLabels,
      markdownShortcuts = false,
      chromeless = false,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const [isListening, setIsListening] = React.useState(false);
    const [speechSupported, setSpeechSupported] = React.useState(false);
    const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
    const isListeningRef = React.useRef(false);
    const shouldRestartRef = React.useRef(false);
    const [macrosOpen, setMacrosOpen] = React.useState(defaultMacrosOpen);
    // Last caret/selection inside the editable region, retained while the
    // macro panel has focus so insertion lands where the clinician left off.
    const savedRangeRef = React.useRef<Range | null>(null);
    const macroPanelId = React.useId();

    const hasVariables = Boolean(variableGroups && variableGroups.length > 0);
    const hasMacros = Boolean(macros);
    const hasMacroEntries = Boolean(
      macros?.some((group) => group.macros.length > 0)
    );
    const isEmpty = isHtmlEmpty(value);
    const [uncontrolledToolbar, setUncontrolledToolbar] =
      React.useState(defaultToolbar);
    const toolbarVisible = (toolbar ?? uncontrolledToolbar) !== 'hidden';
    const setToolbarVisibility = (next: 'visible' | 'hidden') => {
      if (toolbar === undefined) setUncontrolledToolbar(next);
      onToolbarChange?.(next);
    };
    // Mirrored into a ref so async dictation code can read the live value
    // after awaiting microphone permission.
    const toolbarVisibleRef = React.useRef(toolbarVisible);

    // --- Block gutter menu state ---
    const [blockMenuOpen, setBlockMenuOpen] = React.useState(false);
    // Offset of the gutter button within the editor body; aligns with the
    // editable region's top padding (p-4 / chromeless py-[7px]) before any
    // row is hovered.
    const [gutterTop, setGutterTop] = React.useState(chromeless ? 7 : 16);
    const gutterWrapperRef = React.useRef<HTMLDivElement>(null);
    // Density styles (condensed-view.css) shrink that padding under the
    // defaults above, which would leave the at-rest trigger hanging below a
    // one-line condensed field — measure it from the live editable.
    const measureRestGutterTop = React.useCallback(() => {
      const fallback = chromeless ? 7 : 16;
      if (!editorRef.current) return fallback;
      const padding = parseFloat(
        getComputedStyle(editorRef.current).paddingTop
      );
      return Number.isNaN(padding) ? fallback : Math.round(padding);
    }, [chromeless]);
    React.useLayoutEffect(() => {
      if (!blockMenu || !editorRef.current) return;
      setGutterTop((current) => {
        const next = measureRestGutterTop();
        return current === next ? current : next;
      });
    }, [blockMenu, measureRestGutterTop]);
    const hoverBlockNodeRef = React.useRef<Node | null>(null);
    /** Park the trigger back at its rest offset and forget the hovered row. */
    const resetGutter = React.useCallback(() => {
      hoverBlockNodeRef.current = null;
      const next = measureRestGutterTop();
      setGutterTop((current) => (current === next ? current : next));
    }, [measureRestGutterTop]);
    /** Content edits can delete the hovered row (or every row) while the
     *  trigger still floats at the old offset — below a field that shrank,
     *  now that chromeless mode no longer clips the wrapper. */
    const reconcileGutterWithContent = React.useCallback(() => {
      if (!blockMenu || !editorRef.current) return;
      const hovered = hoverBlockNodeRef.current;
      if (
        (hovered && !editorRef.current.contains(hovered)) ||
        !editorRef.current.hasChildNodes()
      ) {
        resetGutter();
      }
    }, [blockMenu, resetGutter]);
    // Where the chosen menu action is applied: the hovered block's start
    // (mouse) or the caret position (Ctrl/Cmd+/), captured at open time.
    const blockTargetRangeRef = React.useRef<Range | null>(null);
    const firstBlockItemRef = React.useRef<HTMLButtonElement>(null);

    React.useImperativeHandle(ref, () => editorRef.current as HTMLDivElement);

    React.useEffect(() => {
      setSpeechSupported(Boolean(getSpeechRecognition()));
    }, []);

    React.useEffect(() => {
      return () => {
        if (recognitionRef.current) {
          shouldRestartRef.current = false;
          isListeningRef.current = false;
          recognitionRef.current.stop();
        }
      };
    }, []);

    // Hiding the toolbar removes the Stop control and listening indicator,
    // so a running dictation must not keep inserting text (and restarting
    // through onend) with no way to stop it.
    React.useEffect(() => {
      toolbarVisibleRef.current = toolbarVisible;
      if (toolbarVisible) return;
      if (recognitionRef.current && isListeningRef.current) {
        shouldRestartRef.current = false;
        isListeningRef.current = false;
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }, [toolbarVisible]);

    React.useEffect(() => {
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
        reconcileGutterWithContent();
      }
    }, [value, reconcileGutterWithContent]);

    const updateContent = () => {
      if (editorRef.current) onChange(editorRef.current.innerHTML);
      reconcileGutterWithContent();
    };

    // Pasted/dropped HTML otherwise lands in the live DOM unfiltered, where
    // hostile markup (position:fixed overlays, host CSS classes) is active.
    const insertSanitized = (html: string) => {
      if (!sanitizeHtml) return false;
      document.execCommand('insertHTML', false, sanitizeHtml(html));
      updateContent();
      return true;
    };
    const handlePaste = (e: React.ClipboardEvent) => {
      const html = e.clipboardData.getData('text/html');
      if (html && sanitizeHtml) {
        e.preventDefault();
        insertSanitized(html);
      }
    };
    const handleDrop = (e: React.DragEvent) => {
      const html = e.dataTransfer.getData('text/html');
      if (!html || !sanitizeHtml) return;
      e.preventDefault();
      const caret = (
        document as Document & {
          caretRangeFromPoint?: (
            x: number,
            y: number
          ) => ReturnType<Document['createRange']> | null;
        }
      ).caretRangeFromPoint?.(e.clientX, e.clientY);
      if (caret) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(caret);
      }
      editorRef.current?.focus();
      insertSanitized(html);
    };

    const execCommand = (command: string) => {
      if (disabled) return;
      document.execCommand(command, false);
      editorRef.current?.focus();
      updateContent();
    };

    const handleConvertToMustache = () => {
      if (disabled || !editorRef.current) return;
      editorRef.current.innerHTML = convertAngleBracketsToMustache(
        editorRef.current.innerHTML
      );
      updateContent();
    };

    const insertVariable = (variable: RichTextVariable) => {
      if (disabled || !editorRef.current) return;
      editorRef.current.focus();
      const textToInsert = variable.insertValue ?? variable.value;

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        if (textToInsert.includes('\n')) {
          const fragment = document.createDocumentFragment();
          const lines = textToInsert.split('\n');
          lines.forEach((line, index) => {
            fragment.appendChild(document.createTextNode(line));
            if (index < lines.length - 1) {
              fragment.appendChild(document.createElement('br'));
            }
          });
          range.insertNode(fragment);
          range.collapse(false);
        } else {
          const textNode = document.createTextNode(textToInsert);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
        }
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += textToInsert.replace(/\n/g, '<br>');
      }
      updateContent();
    };

    const reportError = (message: string) => {
      if (onDictationError) onDictationError(message);
      else if (typeof console !== 'undefined') console.warn(message);
    };

    /** Bookmark the selection whenever it lives inside the editable region. */
    const saveSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !editorRef.current)
        return;
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    };

    /** Focus the editor and restore the bookmarked selection if still valid. */
    const focusRestoringSelection = () => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      const saved = savedRangeRef.current;
      const selection = window.getSelection();
      if (
        saved &&
        selection &&
        editorRef.current.contains(saved.commonAncestorContainer)
      ) {
        selection.removeAllRanges();
        selection.addRange(saved);
      }
    };

    const insertMacro = (macro: Macro) => {
      if (disabled || !editorRef.current) return;
      focusRestoringSelection();
      insertTextAtSelection(macro.content);
    };

    /**
     * Replace the current selection with plain text. execCommand participates
     * in the browser's native undo stack, so an insertion can be reverted
     * with a single undo.
     */
    const insertTextAtSelection = (content: string) => {
      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, content);
      } catch {
        inserted = false;
      }
      if (!inserted) {
        // Fallback (and jsdom path): manual range insertion. Content is
        // always inserted as text nodes, never parsed as HTML.
        const fragment = document.createDocumentFragment();
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          fragment.appendChild(document.createTextNode(line));
          if (index < lines.length - 1) {
            fragment.appendChild(document.createElement('br'));
          }
        });
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(fragment);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (editorRef.current) {
          editorRef.current.appendChild(fragment);
        }
      }
      saveSelection();
      updateContent();
    };

    /**
     * The visible word immediately before the collapsed caret, spanning
     * adjacent inline nodes (`.<b>c</b>` is ".c"). Returns the token, the
     * range coordinates to replace it, and whether it sits at the start of
     * its line (nothing but a block boundary before it).
     */
    const collectTokenBeforeCaret = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selection.isCollapsed)
        return null;
      const caret = selection.getRangeAt(0);
      const node = caret.startContainer;
      if (
        node.nodeType !== Node.TEXT_NODE ||
        !editorRef.current?.contains(node)
      )
        return null;
      const typed = /(\S+)$/.exec(
        (node.textContent ?? '').slice(0, caret.startOffset)
      );
      if (!typed) return null;
      let token = typed[1];
      let startNode: Node = node;
      let startOffset = caret.startOffset - typed[1].length;
      while (startOffset === 0) {
        const prev = previousVisibleText(startNode, editorRef.current);
        if (!prev) break;
        const text = prev.textContent ?? '';
        const continued = /(\S+)$/.exec(text);
        if (!continued) break;
        token = continued[1] + token;
        startNode = prev;
        startOffset = text.length - continued[1].length;
      }
      const atLineStart =
        startOffset === 0 && !previousVisibleText(startNode, editorRef.current);
      return {
        token,
        startNode,
        startOffset,
        caretNode: node,
        caretOffset: caret.startOffset,
        atLineStart,
        selection,
      };
    };

    /** Select `collected`'s token so the next editing command replaces it. */
    const selectCollectedToken = (
      collected: NonNullable<ReturnType<typeof collectTokenBeforeCaret>>
    ) => {
      const replaceRange = document.createRange();
      replaceRange.setStart(collected.startNode, collected.startOffset);
      replaceRange.setEnd(collected.caretNode, collected.caretOffset);
      collected.selection.removeAllRanges();
      collected.selection.addRange(replaceRange);
      return replaceRange;
    };

    /**
     * Expand a typed macro shortcut (dot phrase). When the word immediately
     * before the caret matches a macro shortcut and the user presses space,
     * the shortcut is replaced with the macro content in a single undoable
     * edit; the triggering space is consumed.
     */
    const expandTypedShortcut = (
      event: React.KeyboardEvent<HTMLDivElement>
    ) => {
      if (!macros) return;
      const collected = collectTokenBeforeCaret();
      if (!collected) return;
      const lowered = collected.token.toLowerCase();
      const macro = macros
        .flatMap((group) => group.macros)
        .find((candidate) => candidate.shortcut?.toLowerCase() === lowered);
      if (!macro) return;

      event.preventDefault();
      selectCollectedToken(collected);
      insertTextAtSelection(macro.content);
    };

    /**
     * Apply a markdown block rule when the token before the caret starts its
     * line and matches `MARKDOWN_BLOCK_RULES` (`##` + space → heading). The
     * token removal and the block command both run through execCommand so
     * the expansion stays natively undoable. Returns true when handled.
     */
    const applyMarkdownShortcut = (
      event: React.KeyboardEvent<HTMLDivElement>
    ) => {
      const collected = collectTokenBeforeCaret();
      if (!collected || !collected.atLineStart) return false;
      // Own-property check: tokens like "constructor" or "toString" resolve
      // inherited object members and must not be treated as rules.
      if (!Object.hasOwn(MARKDOWN_BLOCK_RULES, collected.token)) return false;
      const rule = MARKDOWN_BLOCK_RULES[collected.token];

      event.preventDefault();
      const replaceRange = selectCollectedToken(collected);
      let deleted = false;
      try {
        deleted = document.execCommand('delete', false);
      } catch {
        deleted = false;
      }
      if (!deleted) {
        // Fallback (and jsdom path): manual removal, caret at the line start.
        replaceRange.deleteContents();
        replaceRange.collapse(true);
        collected.selection.removeAllRanges();
        collected.selection.addRange(replaceRange);
      }
      try {
        document.execCommand(rule.command, false, rule.value);
      } catch {
        // jsdom: no execCommand — the token is still consumed.
      }
      editorRef.current?.focus();
      saveSelection();
      updateContent();
      return true;
    };

    /** Space-keydown pipeline: markdown block rules, then macro shortcuts. */
    const handleEditorKeyDown = (
      event: React.KeyboardEvent<HTMLDivElement>
    ) => {
      if (disabled) return;
      if (
        blockMenu &&
        event.key === '/' &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey
      ) {
        event.preventDefault();
        openBlockMenuAtCaret();
        return;
      }
      if (
        event.key !== ' ' ||
        // Space during IME composition selects/converts a candidate; never
        // hijack it for shortcut expansion.
        event.nativeEvent.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (markdownShortcuts && applyMarkdownShortcut(event)) return;
      expandTypedShortcut(event);
    };

    // --- Block gutter menu ---

    /** Track the hovered block and keep the gutter button beside it. */
    const handleGutterMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      // While the menu is open its target must not follow the pointer.
      if (blockMenuOpen || !editorRef.current || !gutterWrapperRef.current)
        return;
      let target: Node | null = null;
      let top: number | null = null;
      // Last top-level node starting above the pointer; first node otherwise.
      for (const child of Array.from(editorRef.current.childNodes)) {
        const rect = nodeRect(child);
        if (!rect) continue;
        // Collapsed whitespace between blocks (formatted HTML) measures 0×0
        // at the origin; its top of 0 always passes the comparison below and
        // would steal the target from the visible row. Zero-width nodes that
        // still have a height (an empty rendered line) remain eligible.
        if (rect.width === 0 && rect.height === 0) continue;
        if (target === null || rect.top <= event.clientY) {
          target = child;
          top = rect.top;
        }
      }
      if (!target || top === null) {
        // Every row is gone (e.g. the controlled value was cleared) — don't
        // leave the trigger floating at the deleted row's offset.
        resetGutter();
        return;
      }
      hoverBlockNodeRef.current = target;
      const wrapperTop = gutterWrapperRef.current.getBoundingClientRect().top;
      const next = Math.max(Math.round(top - wrapperTop), 4);
      setGutterTop((current) => (current === next ? current : next));
    };

    /** Collapsed range at the very start of `node`. */
    const rangeAtStartOf = (node: Node) => {
      const range = document.createRange();
      range.setStart(node, 0);
      range.collapse(true);
      return range;
    };

    /** Dropdown open/close driven by the gutter trigger (mouse path). */
    const handleBlockMenuOpenChange = (open: boolean) => {
      if (open) {
        const block =
          hoverBlockNodeRef.current ?? editorRef.current?.firstChild ?? null;
        blockTargetRangeRef.current = block ? rangeAtStartOf(block) : null;
      } else if (
        editorRef.current &&
        document.activeElement?.closest('[role="menu"]')
      ) {
        // Escape: focus sits on a menu item about to unmount — without a
        // hand-off it falls to <body> and typing stops editing. Outside
        // clicks have already moved focus, so they skip this branch.
        const editor = editorRef.current;
        editor.focus();
        const target = blockTargetRangeRef.current;
        const selection = window.getSelection();
        if (target && selection && editor.contains(target.startContainer)) {
          selection.removeAllRanges();
          selection.addRange(target);
          saveSelection();
        }
      }
      setBlockMenuOpen(open);
    };

    /** Ctrl/Cmd+/ — open the menu targeting the caret's block. */
    const openBlockMenuAtCaret = () => {
      const selection = window.getSelection();
      if (
        selection &&
        selection.rangeCount > 0 &&
        editorRef.current?.contains(selection.getRangeAt(0).startContainer)
      ) {
        const caret = selection.getRangeAt(0);
        blockTargetRangeRef.current = caret.cloneRange();
        // Move the gutter button beside the caret's top-level block so the
        // menu opens where the action will land.
        let node: Node = caret.startContainer;
        while (node.parentNode && node.parentNode !== editorRef.current) {
          node = node.parentNode;
        }
        const rect = nodeRect(node);
        const wrapperRect = gutterWrapperRef.current?.getBoundingClientRect();
        if (rect && wrapperRect) {
          setGutterTop(Math.max(Math.round(rect.top - wrapperRect.top), 4));
        }
      } else {
        blockTargetRangeRef.current = null;
      }
      setBlockMenuOpen(true);
    };

    /** Apply a block command from the menu to the captured target range. */
    const applyBlockFormat = (command: string, value?: string) => {
      if (disabled || !editorRef.current) return;
      setBlockMenuOpen(false);
      editorRef.current.focus();
      const target = blockTargetRangeRef.current;
      const selection = window.getSelection();
      if (
        target &&
        selection &&
        editorRef.current.contains(target.startContainer)
      ) {
        selection.removeAllRanges();
        selection.addRange(target);
      }
      try {
        document.execCommand(command, false, value);
      } catch {
        // jsdom: no execCommand — nothing to apply.
      }
      saveSelection();
      updateContent();
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

    const toggleDictation = async () => {
      const SpeechRecognition = getSpeechRecognition();
      if (!SpeechRecognition) return;

      if (isListening && recognitionRef.current) {
        shouldRestartRef.current = false;
        isListeningRef.current = false;
        recognitionRef.current.stop();
        setIsListening(false);
        return;
      }

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

      // The toolbar (and its Stop control) may have been hidden while
      // awaiting microphone permission — do not start an unstoppable session.
      if (!toolbarVisibleRef.current) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        shouldRestartRef.current = true;
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) finalTranscript += result[0].transcript;
        }

        if (finalTranscript && editorRef.current) {
          const processedText = processDictation(finalTranscript);
          editorRef.current.focus();
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(processedText + ' ');
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            editorRef.current.innerHTML += processedText + ' ';
          }
          updateContent();
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
        if (shouldRestartRef.current && isListeningRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current && isListeningRef.current) {
              try {
                recognition.start();
              } catch {
                shouldRestartRef.current = false;
                isListeningRef.current = false;
                setIsListening(false);
              }
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        reportError('Failed to start speech recognition. Please try again.');
      }
    };

    const iconButtonClass = 'h-8 w-8 p-0';

    const blockFormatItems: Array<{
      key: keyof RichTextEditorBlockMenuLabels;
      label: string;
      command: string;
      value?: string;
    }> = [
      { key: 'text', label: 'Text', command: 'formatBlock', value: 'p' },
      {
        key: 'heading1',
        label: 'Heading 1',
        command: 'formatBlock',
        value: 'h1',
      },
      {
        key: 'heading2',
        label: 'Heading 2',
        command: 'formatBlock',
        value: 'h2',
      },
      {
        key: 'heading3',
        label: 'Heading 3',
        command: 'formatBlock',
        value: 'h3',
      },
      {
        key: 'bulletList',
        label: 'Bullet list',
        command: 'insertUnorderedList',
      },
      {
        key: 'numberedList',
        label: 'Numbered list',
        command: 'insertOrderedList',
      },
      {
        key: 'quote',
        label: 'Quote',
        command: 'formatBlock',
        value: 'blockquote',
      },
    ];

    return (
      <div
        data-slot="rich-text-editor"
        data-chromeless={chromeless || undefined}
        className={cn(
          'bg-background flex flex-col',
          !chromeless && 'border-border overflow-hidden rounded-lg border',
          className
        )}
      >
        {toolbarVisible && (
          <div
            data-slot="rich-text-editor-toolbar"
            className="border-border bg-muted/30 sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b p-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('bold')}
              disabled={disabled}
              className={iconButtonClass}
              aria-label="Bold"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('italic')}
              disabled={disabled}
              className={iconButtonClass}
              aria-label="Italic"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('underline')}
              disabled={disabled}
              className={iconButtonClass}
              aria-label="Underline"
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertUnorderedList')}
              disabled={disabled}
              className={iconButtonClass}
              aria-label="Bullet list"
              title="Bullet list"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertOrderedList')}
              disabled={disabled}
              className={iconButtonClass}
              aria-label="Numbered list"
              title="Numbered list"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyLeft')}
              disabled={disabled}
              className={iconButtonClass}
              aria-label="Align left"
              title="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyCenter')}
              disabled={disabled}
              className={iconButtonClass}
              aria-label="Align center"
              title="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyRight')}
              disabled={disabled}
              className={iconButtonClass}
              aria-label="Align right"
              title="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>

            {hasVariables && (
              <>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Dropdown
                  placement="bottom-start"
                  width={240}
                  searchable
                  searchPlaceholder="Search variables…"
                  searchAriaLabel="Search template variables"
                  disabled={disabled}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      disabled={disabled}
                      title="Insert variable"
                    >
                      <Braces className="h-4 w-4" />
                      <span className="ms-1 text-xs">Variables</span>
                    </Button>
                  }
                >
                  {variableGroups!.map((group, groupIndex) => (
                    <React.Fragment key={group.label}>
                      {groupIndex > 0 && <DropdownSeparator />}
                      <DropdownLabel>{group.label}</DropdownLabel>
                      {group.variables.map((variable) => (
                        <DropdownItem
                          key={variable.value}
                          onClick={() => insertVariable(variable)}
                        >
                          {variable.label}
                        </DropdownItem>
                      ))}
                    </React.Fragment>
                  ))}
                </Dropdown>

                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleConvertToMustache}
                  disabled={disabled}
                  className="h-8 gap-1 px-2"
                  title="Convert <<field>> to {{field}}"
                >
                  <Replace className="h-4 w-4" />
                  <span className="ms-1 text-xs">{'<< >> to {{ }}'}</span>
                </Button>
              </>
            )}

            {enableDictation && (
              <>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button
                  type="button"
                  variant={isListening ? 'danger' : 'ghost'}
                  size="sm"
                  onClick={toggleDictation}
                  disabled={disabled || !speechSupported}
                  className={cn(
                    'h-8 gap-1 px-2',
                    isListening && 'animate-pulse'
                  )}
                  title={
                    !speechSupported
                      ? 'Speech recognition not supported in this browser'
                      : isListening
                        ? 'Stop dictation'
                        : 'Start dictation'
                  }
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  <span className="ms-1 text-xs">
                    {isListening ? 'Stop' : 'Dictate'}
                  </span>
                </Button>
              </>
            )}

            {hasMacros && (
              <>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMacrosOpen((open) => !open)}
                  disabled={disabled}
                  className={cn('h-8 gap-1 px-2', macrosOpen && 'bg-muted')}
                  aria-expanded={macrosOpen}
                  aria-controls={macrosOpen ? macroPanelId : undefined}
                  title={
                    macrosOpen
                      ? (macroLabels?.hideMacros ?? 'Hide macros')
                      : (macroLabels?.showMacros ?? 'Show macros')
                  }
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="ms-1 text-xs">
                    {macroLabels?.macros ?? 'Macros'}
                  </span>
                </Button>
              </>
            )}
          </div>
        )}

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={gutterWrapperRef}
            className={cn(
              'relative flex-1',
              blockMenu && 'group/rte-body',
              hasMacros && macrosOpen && 'md:me-72'
            )}
            onMouseMove={
              blockMenu && !disabled ? handleGutterMouseMove : undefined
            }
          >
            {blockMenu && !disabled && (
              <div
                data-slot="rich-text-editor-block-gutter"
                className="absolute start-1 z-10"
                style={{ top: gutterTop }}
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
                        // Revealed on hover/focus; always visible on touch,
                        // which has no hover to reveal it with.
                        'opacity-0 transition-opacity',
                        'group-hover/rte-body:opacity-100',
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
                  {blockFormatItems.map((item, index) => (
                    <DropdownItem
                      key={item.key}
                      ref={index === 0 ? firstBlockItemRef : undefined}
                      onClick={() => applyBlockFormat(item.command, item.value)}
                    >
                      {blockMenuLabels?.[item.key] ?? item.label}
                    </DropdownItem>
                  ))}
                  <DropdownSeparator />
                  {hasMacros && macros && (
                    <>
                      <DropdownSubmenu
                        label={blockMenuLabels?.insertMacro ?? 'Insert macro'}
                        // No macros to offer — the panel's empty state (via
                        // "Show macro library") explains the situation.
                        disabled={!hasMacroEntries}
                      >
                        {/* Children are built per render even while closed
                            (the menu JSX lives in the editor's tree), so
                            skip the catalog walk until the menu is open. */}
                        {blockMenuOpen &&
                          macros.flatMap((group) => [
                            // Group headings only earn their row when there
                            // is more than one group to tell apart.
                            ...(macros.length > 1
                              ? [
                                  <DropdownLabel key={`h:${group.id}`}>
                                    {group.label}
                                  </DropdownLabel>,
                                ]
                              : []),
                            ...group.macros.map((macro) => (
                              <DropdownItem
                                // Serialized pair: plain `${a}-${b}` joins
                                // collide ('a-b','c' vs 'a','b-c') and can
                                // alias a heading key.
                                key={`m:${JSON.stringify([group.id, macro.id])}`}
                                onClick={() => {
                                  setBlockMenuOpen(false);
                                  // Insertion lands at the menu's target
                                  // block, mirroring the panel flow.
                                  if (blockTargetRangeRef.current) {
                                    savedRangeRef.current =
                                      blockTargetRangeRef.current;
                                  }
                                  insertMacro(macro);
                                }}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  {macro.shortcut && (
                                    <span
                                      // Shortcuts are typed sequences; keep
                                      // them LTR in RTL locales.
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
                          // Macro insertion restores the bookmarked
                          // selection; point it at the menu's target block.
                          if (blockTargetRangeRef.current) {
                            savedRangeRef.current = blockTargetRangeRef.current;
                          }
                          setMacrosOpen(true);
                          // The activated item unmounts with the menu; move
                          // focus back AND apply the bookmark to the live
                          // selection — a bare focus() would leave the old
                          // caret live, and the editor's onBlur (fired when
                          // the panel's search field takes focus) would then
                          // re-save it over the menu's target.
                          focusRestoringSelection();
                        }}
                      >
                        {blockMenuLabels?.showMacroLibrary ??
                          'Show macro library'}
                      </DropdownItem>
                      {/* The toolbar toggle is editor chrome, not a macro
                          action — keep it visually apart. */}
                      <DropdownSeparator />
                    </>
                  )}
                  <DropdownItem
                    onClick={() => {
                      setBlockMenuOpen(false);
                      setToolbarVisibility(
                        toolbarVisible ? 'hidden' : 'visible'
                      );
                      // See the macro item: the menu unmounts on close.
                      editorRef.current?.focus();
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
                  'text-muted-foreground pointer-events-none absolute start-0 top-0',
                  // Chromeless hosts drop the wrapper's clipping, so a long
                  // placeholder must stay a single ellipsized line (as a
                  // native textarea clips its own) instead of wrapping out
                  // of the one-row field.
                  chromeless ? 'end-0 truncate px-3 py-[7px] text-base' : 'p-4',
                  blockMenu && 'ps-10'
                )}
              >
                {placeholder}
              </div>
            )}
            <div
              ref={editorRef}
              role="textbox"
              aria-multiline="true"
              aria-label={ariaLabel ?? placeholder}
              contentEditable={!disabled}
              // Styling hook: condensed-view.css must not pin the editable
              // to its compact single-line minimum while the macro panel
              // (absolutely stretched over this region) needs the md
              // min-h-[400px] working space below.
              data-macros-open={hasMacros && macrosOpen ? '' : undefined}
              tabIndex={disabled ? -1 : 0}
              onInput={updateContent}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onBlur={hasMacros ? saveSelection : undefined}
              onKeyDown={
                hasMacros || markdownShortcuts || blockMenu
                  ? handleEditorKeyDown
                  : undefined
              }
              onKeyUp={hasMacros ? saveSelection : undefined}
              onMouseUp={hasMacros ? saveSelection : undefined}
              className={cn(
                'overflow-y-auto focus:outline-none',
                // Chromeless surfaces start one Input row tall (Textarea md
                // metrics: 24px line + 7px padding + the host's 1px borders
                // = h-10) and auto-grow with content.
                chromeless
                  ? 'min-h-[38px] px-3 py-[7px] text-base'
                  : 'min-h-[250px] p-4',
                'prose prose-sm max-w-none',
                // Baseline block styles: Tailwind preflight strips heading,
                // list and quote styling, and the `prose` classes above only
                // work when the host installs @tailwindcss/typography —
                // without these, block formats would apply invisibly.
                '[&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-bold',
                '[&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold',
                '[&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold',
                '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-6',
                '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-6',
                '[&_blockquote]:border-border [&_blockquote]:text-muted-foreground [&_blockquote]:my-2 [&_blockquote]:border-s-4 [&_blockquote]:ps-3',
                blockMenu && 'ps-10',
                hasMacros && macrosOpen && 'md:min-h-[400px]',
                disabled &&
                  'bg-muted/20 cursor-not-allowed text-neutral-700 dark:text-neutral-300'
              )}
              suppressContentEditableWarning
            />
          </div>

          {hasMacros && macrosOpen && (
            <MacroLibrary
              id={macroPanelId}
              groups={macros!}
              onSelect={insertMacro}
              targetLabel={ariaLabel ?? placeholder}
              onClose={() => {
                setMacrosOpen(false);
                // Selecting text in the panel moves the document selection;
                // put the caret back where the user left it.
                focusRestoringSelection();
              }}
              onCreateMacro={onCreateMacro}
              labels={macroLabels}
              className="border-border max-h-72 border-t md:absolute md:inset-y-0 md:end-0 md:max-h-none md:w-72 md:border-s md:border-t-0"
            />
          )}
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export { RichTextEditor };
