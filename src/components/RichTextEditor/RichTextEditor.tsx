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
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Separator } from '../Separator';
import { MacroLibrary, type Macro, type MacroGroup } from '../MacroLibrary';
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
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
  /** Forwarded to the macro panel's "Save as macro" action. */
  onCreateMacro?: () => void;
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
      onCreateMacro,
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
    const isEmpty = isHtmlEmpty(value);

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

    React.useEffect(() => {
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }, [value]);

    const updateContent = () => {
      if (editorRef.current) onChange(editorRef.current.innerHTML);
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

    const insertMacro = (macro: Macro) => {
      if (disabled || !editorRef.current) return;
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
        // Fallback (and jsdom path): manual range insertion.
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const fragment = document.createDocumentFragment();
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            fragment.appendChild(document.createTextNode(line));
            if (index < lines.length - 1) {
              fragment.appendChild(document.createElement('br'));
            }
          });
          range.insertNode(fragment);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (editorRef.current) {
          editorRef.current.innerHTML += content.replace(/\n/g, '<br>');
        }
      }
      saveSelection();
      updateContent();
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
      if (
        event.key !== ' ' ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        !macros
      )
        return;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selection.isCollapsed)
        return;
      const caret = selection.getRangeAt(0);
      const node = caret.startContainer;
      if (
        node.nodeType !== Node.TEXT_NODE ||
        !editorRef.current?.contains(node)
      )
        return;
      const typed = /(\S+)$/.exec(
        (node.textContent ?? '').slice(0, caret.startOffset)
      );
      if (!typed) return;
      const token = typed[1].toLowerCase();
      const macro = macros
        .flatMap((group) => group.macros)
        .find((candidate) => candidate.shortcut?.toLowerCase() === token);
      if (!macro) return;

      event.preventDefault();
      const replaceRange = document.createRange();
      replaceRange.setStart(node, caret.startOffset - typed[1].length);
      replaceRange.setEnd(node, caret.startOffset);
      selection.removeAllRanges();
      selection.addRange(replaceRange);
      insertTextAtSelection(macro.content);
    };

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

    return (
      <div
        data-slot="rich-text-editor"
        className={cn(
          'border-border bg-background flex flex-col overflow-hidden rounded-lg border',
          className
        )}
      >
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
                className={cn('h-8 gap-1 px-2', isListening && 'animate-pulse')}
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
                title={macrosOpen ? 'Hide macros' : 'Show macros'}
              >
                <BookOpen className="h-4 w-4" />
                <span className="ms-1 text-xs">Macros</span>
              </Button>
            </>
          )}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            className={cn(
              'relative flex-1',
              hasMacros && macrosOpen && 'md:me-72'
            )}
          >
            {isEmpty && placeholder && (
              <div
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute start-0 top-0 p-4"
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
              tabIndex={disabled ? -1 : 0}
              onInput={updateContent}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onBlur={hasMacros ? saveSelection : undefined}
              onKeyDown={hasMacros ? expandTypedShortcut : undefined}
              onKeyUp={hasMacros ? saveSelection : undefined}
              onMouseUp={hasMacros ? saveSelection : undefined}
              className={cn(
                'min-h-[250px] overflow-y-auto p-4 focus:outline-none',
                'prose prose-sm max-w-none',
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
                editorRef.current?.focus();
              }}
              onCreateMacro={onCreateMacro}
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
