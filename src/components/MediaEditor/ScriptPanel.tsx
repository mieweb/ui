/**
 * ScriptPanel — the transcript "script" as editable YAML/JSON, side by side
 * with the editor.
 *
 * Two sources: "Editor" is the live edit state (EditableWord[], remapped as
 * you edit) and can be edited as text and applied back; "Original" is the
 * canonical transcript (immutable, read-only). The panel live-follows the
 * editor until you start typing; Apply parses + validates and replaces the
 * edit state (undo-safe via useTranscriptEdits.replaceEditedWords).
 *
 * js-yaml is loaded lazily on first use (same pattern as Markdown's
 * SurveyBlock) so it stays out of the MediaEditor bundle.
 */

import * as React from 'react';
import { Button } from '../Button';
import type {
  Transcript,
  EditableWord,
  TranscriptWord,
} from '../TranscriptView/transcript';

let yamlPromise: Promise<typeof import('js-yaml')> | null = null;
function loadYaml() {
  yamlPromise ??= import(/* @vite-ignore */ 'js-yaml');
  return yamlPromise;
}

export interface ScriptPanelProps {
  /** The canonical transcript (read-only source) */
  transcript: Transcript;
  /** The live edit state (editable source) */
  editedWords: EditableWord[];
  /** Apply parsed script back into the editor */
  onApply: (words: EditableWord[]) => void;
  /** Close the panel */
  onClose: () => void;
  className?: string;
}

type ScriptSource = 'editor' | 'original';
type ScriptFormat = 'yaml' | 'json';

/** Parse + validate script text into EditableWord[]; throws with a readable message. */
async function parseScript(
  text: string,
  format: ScriptFormat
): Promise<EditableWord[]> {
  let data: unknown;
  if (format === 'json') {
    data = JSON.parse(text);
  } else {
    const yaml = await loadYaml();
    data = yaml.load(text);
  }
  if (!Array.isArray(data)) {
    throw new Error('Script must be a list of word entries.');
  }
  return data.map((raw, i) => {
    const ew = raw as {
      originalIndex?: unknown;
      deleted?: unknown;
      inserted?: unknown;
      word?: Record<string, unknown>;
    };
    const w = ew.word;
    if (
      !w ||
      typeof w.text !== 'string' ||
      typeof w.startMs !== 'number' ||
      typeof w.endMs !== 'number'
    ) {
      throw new Error(
        `Entry ${i + 1}: each entry needs word.text, word.startMs and word.endMs.`
      );
    }
    const word: TranscriptWord = {
      text: w.text,
      startMs: w.startMs,
      endMs: w.endMs,
      ...(typeof w.wordType === 'string'
        ? { wordType: w.wordType as TranscriptWord['wordType'] }
        : {}),
      ...(typeof w.speakerId === 'string' ? { speakerId: w.speakerId } : {}),
    };
    return {
      originalIndex:
        typeof ew.originalIndex === 'number' ? ew.originalIndex : -1,
      deleted: Boolean(ew.deleted),
      ...(ew.inserted !== undefined ? { inserted: Boolean(ew.inserted) } : {}),
      word,
    } as EditableWord;
  });
}

export const ScriptPanel: React.FC<ScriptPanelProps> = ({
  transcript,
  editedWords,
  onApply,
  onClose,
  className,
}) => {
  const [source, setSource] = React.useState<ScriptSource>('editor');
  const [format, setFormat] = React.useState<ScriptFormat>('yaml');
  const [text, setText] = React.useState('');
  const [dirty, setDirty] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const readOnly = source === 'original';

  // Live-follow the selected source until the user starts editing.
  React.useEffect(() => {
    if (dirty) return;
    let cancelled = false;
    const data = source === 'original' ? transcript : editedWords;
    (async () => {
      const serialized =
        format === 'json'
          ? JSON.stringify(data, null, 2)
          : (await loadYaml()).dump(data, { lineWidth: 120 });
      if (!cancelled) {
        setText(serialized);
        setError(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, format, transcript, editedWords, dirty]);

  const handleApply = async () => {
    try {
      const words = await parseScript(text, format);
      onApply(words);
      setDirty(false);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not parse the script.'
      );
    }
  };

  const handleReset = () => {
    setDirty(false);
    setError(null);
  };

  const sourceButton = (value: ScriptSource, label: string) => (
    <button
      type="button"
      onClick={() => {
        setSource(value);
        setDirty(false);
        setError(null);
      }}
      aria-pressed={source === value}
      className={`focus-visible:ring-ring rounded px-1.5 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none ${
        source === value
          ? 'bg-primary-800 font-medium text-white'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <aside
      className={`border-border bg-card flex w-80 shrink-0 flex-col border-l lg:w-96 ${className ?? ''}`}
      aria-label="Transcript script"
    >
      <div className="border-border flex shrink-0 flex-wrap items-center gap-1.5 border-b px-3 py-2">
        <span className="text-foreground text-xs font-semibold">Script</span>
        <span className="bg-border mx-1 h-4 w-px" aria-hidden="true" />
        {sourceButton('editor', 'Editor')}
        {sourceButton('original', 'Original')}
        <span className="bg-border mx-1 h-4 w-px" aria-hidden="true" />
        <button
          type="button"
          onClick={() => {
            setFormat(format === 'yaml' ? 'json' : 'yaml');
            setDirty(false);
            setError(null);
          }}
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring rounded px-1.5 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          title="Toggle YAML / JSON"
        >
          {format.toUpperCase()}
        </button>
        <span className="text-muted-foreground ml-auto text-[10px]">
          {readOnly ? 'read-only' : dirty ? 'edited' : 'live'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close script panel"
        >
          ✕
        </Button>
      </div>

      <textarea
        value={text}
        readOnly={readOnly}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        className="text-foreground min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-relaxed focus:outline-none"
        aria-label={`Script source (${source}, ${format.toUpperCase()})`}
      />

      {error && (
        <p
          className="border-border text-destructive m-0 shrink-0 border-t px-3 py-2 text-xs"
          role="alert"
        >
          {error}
        </p>
      )}

      {!readOnly && (
        <div className="border-border flex shrink-0 items-center gap-2 border-t px-3 py-2">
          <Button size="sm" onClick={handleApply} disabled={!dirty}>
            Apply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!dirty}
            title="Throw away unapplied typing and re-sync from the editor"
          >
            Discard
          </Button>
          <span className="text-muted-foreground text-[10px]">
            Apply pushes into the editor &mdash; revert an applied change with
            Undo
          </span>
        </div>
      )}
    </aside>
  );
};
