/**
 * useTranscriptEdits — headless transcript-editing state hook.
 *
 * Extracted from pulseclip's TranscriptViewer for @mieweb/ui. Holds the
 * edited word timeline (deletions, insertions, text edits, silence
 * splitting), a single-level undo stack, an internal clipboard, speed
 * markers, and derived playback/statistics data.
 *
 * Controlled + persistence-agnostic: no DOM, no fetches. Selection lives in
 * the UI layer — mutations take explicit indices. State flows out via
 * `onChange` and back in via `initialEditedWords` / `initialUndoStack`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Transcript,
  TranscriptWord,
  EditableWord,
  PlaybackSegment,
  PlaybackSpeed,
  SpeedMarker,
} from '../components/TranscriptView/transcript';
import { isSilenceType } from '../components/TranscriptView/transcript';

/** Default filler words offered for removal */
export const DEFAULT_FILLER_WORDS = [
  'um',
  'uh',
  'umm',
  'uhh',
  'uh-huh',
  'mm-hmm',
  'hmm',
  'hm',
  'er',
  'err',
  'ah',
  'ahh',
  'eh',
  'oh',
  'ooh',
  'like',
  'you know',
  'i mean',
  'so',
  'well',
  'actually',
  'basically',
  'literally',
  'right',
  'okay',
  'ok',
];

/** Default minimum silence duration in milliseconds to detect and insert */
export const DEFAULT_MIN_SILENCE_MS = 400;

/** Default threshold for "newline" silences - longer pauses that indicate paragraph breaks */
export const DEFAULT_NL_SILENCE_MS = 1500;

/** Silence thresholds (seconds) reported by the filler analysis */
const SILENCE_ANALYSIS_THRESHOLDS = [0.3, 0.4, 0.5, 0.75, 1.0, 1.5, 2.0];

/** Clipboard data for cut/copy/paste operations */
export interface TranscriptClipboard {
  words: EditableWord[];
  operation: 'cut' | 'copy';
}

/** Count and total duration of silences above a given threshold (seconds) */
export interface SilenceThresholdCount {
  threshold: number;
  count: number;
  durationMs: number;
}

/**
 * Builds playback segments from the edited word list.
 * Consecutive words in original order are merged into single segments.
 * Inserted (pasted) words each get their own segment since they may be duplicates.
 */
export function buildPlaybackSegments(
  editedWords: EditableWord[]
): PlaybackSegment[] {
  const activeWords = editedWords.filter((w) => !w.deleted);
  if (activeWords.length === 0) return [];

  const segments: PlaybackSegment[] = [];
  let currentSegment: PlaybackSegment | null = null;
  let lastOriginalIndex = -2; // Use -2 so first word always starts new segment
  let lastWasInserted = false;

  for (let i = 0; i < editedWords.length; i++) {
    const ew = editedWords[i];
    if (ew.deleted) continue;

    // Check if this word is consecutive to the previous in the original
    // Inserted words always start a new segment (they might be duplicates)
    const isConsecutive =
      !ew.inserted &&
      !lastWasInserted &&
      ew.originalIndex === lastOriginalIndex + 1;

    if (currentSegment && isConsecutive) {
      // Extend current segment
      currentSegment.endMs = ew.word.endMs;
      currentSegment.editedIndices.push(i);
    } else {
      // Start new segment
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = {
        startMs: ew.word.startMs,
        endMs: ew.word.endMs,
        editedIndices: [i],
      };
    }

    lastOriginalIndex = ew.originalIndex;
    lastWasInserted = ew.inserted ?? false;
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Get the effective playback speed at a given word index.
 * Finds the most recent speed marker at or before the word index,
 * or returns the default speed if no marker applies.
 */
export function getSpeedAtIndex(
  wordIndex: number,
  speedMarkers: SpeedMarker[],
  defaultSpeed: PlaybackSpeed
): PlaybackSpeed {
  // Single O(n) pass that takes the marker with the greatest wordIndex at or
  // before the target. This avoids the per-call copy+sort (stats calls this
  // once per word) without assuming callers pass sorted markers — it is a
  // public helper, so arbitrary order must still yield the right answer.
  let effectiveSpeed = defaultSpeed;
  let nearest = -1;
  for (const marker of speedMarkers) {
    if (marker.wordIndex <= wordIndex && marker.wordIndex > nearest) {
      nearest = marker.wordIndex;
      effectiveSpeed = marker.speed;
    }
  }
  return effectiveSpeed;
}

/**
 * Detect silences between words and return a new array with silence pseudo-words inserted.
 * Silences are detected as gaps between the endMs of one word and startMs of the next.
 * Silences >= nlSilenceMs are marked as 'silence-newline' for visual line breaks.
 */
export function insertSilences(
  words: TranscriptWord[],
  minSilenceMs: number = DEFAULT_MIN_SILENCE_MS,
  nlSilenceMs: number = DEFAULT_NL_SILENCE_MS
): TranscriptWord[] {
  if (words.length === 0) return [];

  const result: TranscriptWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check for silence before the first word (from 0ms)
    if (i === 0 && word.startMs > minSilenceMs) {
      const isNewline = word.startMs >= nlSilenceMs;
      result.push({
        text: `[${(word.startMs / 1000).toFixed(1)}s]`,
        startMs: 0,
        endMs: word.startMs,
        wordType: isNewline ? 'silence-newline' : 'silence',
      });
    }

    // Add the word (with default wordType)
    result.push({ ...word, wordType: word.wordType ?? 'word' });

    // Check for silence after this word (gap before next word)
    if (i < words.length - 1) {
      const nextWord = words[i + 1];
      const gapMs = nextWord.startMs - word.endMs;

      if (gapMs >= minSilenceMs) {
        const isNewline = gapMs >= nlSilenceMs;
        result.push({
          text: `[${(gapMs / 1000).toFixed(1)}s]`,
          startMs: word.endMs,
          endMs: nextWord.startMs,
          wordType: isNewline ? 'silence-newline' : 'silence',
        });
      }
    }
  }

  return result;
}

/** Initialize editable words from transcript, inserting detected silences */
export function initEditableWords(
  transcript: Transcript,
  minSilenceMs: number = DEFAULT_MIN_SILENCE_MS,
  nlSilenceMs: number = DEFAULT_NL_SILENCE_MS
): EditableWord[] {
  // First insert silences between the original words
  const wordsWithSilences = insertSilences(
    transcript.words,
    minSilenceMs,
    nlSilenceMs
  );

  return wordsWithSilences.map((word, index) => ({
    originalIndex: index,
    word,
    deleted: false,
  }));
}

/** Strip trailing punctuation and lowercase for filler-word matching */
function normalizeWordText(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:]/g, '');
}

export interface UseTranscriptEditsOptions {
  /** The source transcript (canonical, immutable) */
  transcript: Transcript;
  /** Initial edited words (from saved edits) */
  initialEditedWords?: EditableWord[];
  /** Initial undo stack (from saved edits) */
  initialUndoStack?: EditableWord[][];
  /** Fired after every mutation (for persistence) */
  onChange?: (editedWords: EditableWord[], undoStack: EditableWord[][]) => void;
  /** Minimum silence duration (ms) to detect and insert. Default 400 */
  minSilenceMs?: number;
  /** Threshold (ms) for "newline" silences (paragraph breaks). Default 1500 */
  nlSilenceMs?: number;
}

export interface TranscriptEditStats {
  /** Non-deleted spoken words (silences excluded) */
  activeWordCount: number;
  /** Non-deleted silence entries */
  activeSilenceCount: number;
  /** Deleted spoken words */
  deletedWordCount: number;
  /** Deleted silence entries */
  deletedSilenceCount: number;
  /** Total duration of non-deleted entries, adjusted for speed markers */
  editedDurationMs: number;
}

export interface FillerAnalysis {
  /** Occurrence count per normalized word (fillers and every active word) */
  matchCounts: Map<string, number>;
  /** Total duration (ms) per normalized word */
  durations: Map<string, number>;
  /** Count + total duration of active silences above each analysis threshold */
  silenceCounts: SilenceThresholdCount[];
  /** The built-in filler word list */
  defaultFillerWords: string[];
}

export interface UseTranscriptEditsResult {
  // -- State --
  /** The edited timeline (words + silence pseudo-words) */
  editedWords: EditableWord[];
  /** Undo snapshots, oldest first */
  undoStack: EditableWord[][];
  /** Internal clipboard from the last cut/copy, or null */
  clipboard: TranscriptClipboard | null;
  /** Whether any edit has been made (deletions, insertions, text edits, speed markers) */
  hasEdits: boolean;

  // -- Undo --
  /** Push the current editedWords onto the undo stack (call before external batch mutations) */
  pushUndo: () => void;
  /** Restore the most recent undo snapshot */
  undo: () => void;

  // -- Word mutations (selection-agnostic: pass explicit indices) --
  /** Toggle the deleted flag on a single word */
  toggleWordDeleted: (index: number) => void;
  /**
   * Toggle the deleted state of a contiguous range. The first index acts as
   * the anchor: all words are set to the opposite of the anchor's state
   * (delete all if anchor active, restore all if anchor deleted).
   */
  deleteRange: (indices: number[]) => void;
  /** Cut words at the given indices into the clipboard (marks them deleted) */
  cut: (indices: number[]) => void;
  /** Copy non-deleted words at the given indices into the clipboard */
  copy: (indices: number[]) => void;
  /**
   * Paste the clipboard at a word index. `before` (default true) inserts
   * before the word at `atIndex`; false inserts after it. Returns the index
   * where the first pasted word landed, or null if the clipboard was empty.
   */
  paste: (atIndex: number, before?: boolean) => number | null;
  /** Replace a word's text (no-op if unchanged) */
  setWordText: (index: number, text: string) => void;
  /** Split a silence at the given index into segments with the given durations (seconds) */
  splitSilence: (index: number, durationsSec: number[]) => void;
  /** Toggle the word at the index deleted (editor "delete" action) */
  deleteWord: (index: number) => void;
  /** Replace the entire edit state from an external source (e.g. an editable script view); undo-safe */
  replaceEditedWords: (next: EditableWord[]) => void;
  /** Mark matching filler words (and silences above the given seconds threshold) deleted */
  removeFillers: (
    fillerWords: string[],
    removeSilenceAboveSec: number | null
  ) => void;

  // -- Silence thresholds --
  /** Rebuild silence detection with new thresholds, preserving word deletions.
   *  Not undoable — clears the undo stack (prior snapshots reference the old silence layout). */
  setSilenceThresholds: (minMs: number, nlMs: number) => void;
  /** Current silence detection thresholds (ms) */
  silenceThresholds: { minSilenceMs: number; nlSilenceMs: number };

  // -- Playback speed --
  /** Speed markers, sorted by word index */
  speedMarkers: SpeedMarker[];
  /** Default playback speed when no marker applies */
  defaultSpeed: PlaybackSpeed;
  /** Set the default playback speed */
  setDefaultSpeed: (speed: PlaybackSpeed) => void;
  /** Add/update/remove a speed marker (re-selecting the same speed removes it) */
  toggleSpeedMarker: (index: number, speed: PlaybackSpeed) => void;
  /** Remove the speed marker at a word index, if any */
  removeSpeedMarker: (index: number) => void;
  /** Effective playback speed at a word index */
  getSpeedAtIndex: (index: number) => PlaybackSpeed;
  /** The speed marker at a word index, if any */
  getSpeedMarkerAtIndex: (index: number) => SpeedMarker | undefined;

  // -- Derived --
  /** Contiguous playback segments built from the edited timeline */
  playbackSegments: PlaybackSegment[];
  /** Word/silence counts and speed-adjusted edited duration */
  stats: TranscriptEditStats;
  /** Filler word and silence analysis for removal UIs */
  fillerAnalysis: FillerAnalysis;
}

/**
 * Headless transcript-editing hook. See module docs for scope.
 *
 * Undo semantics: each mutation snapshots the full `editedWords` array onto
 * a single-level stack before applying; `undo` pops one snapshot. Speed
 * markers and silence-threshold changes are NOT part of the undo stack
 * (matching the source component).
 */
export function useTranscriptEdits(
  options: UseTranscriptEditsOptions
): UseTranscriptEditsResult {
  const {
    transcript,
    initialEditedWords,
    initialUndoStack,
    onChange,
    minSilenceMs: initialMinSilenceMs = DEFAULT_MIN_SILENCE_MS,
    nlSilenceMs: initialNlSilenceMs = DEFAULT_NL_SILENCE_MS,
  } = options;

  // Track if we've initialized from saved state (skip first onChange notification)
  const initializedFromSaved = useRef(false);

  const [editedWords, setEditedWords] = useState<EditableWord[]>(
    () =>
      initialEditedWords ||
      initEditableWords(transcript, initialMinSilenceMs, initialNlSilenceMs)
  );
  const [undoStack, setUndoStack] = useState<EditableWord[][]>(
    initialUndoStack || []
  );
  const [clipboard, setClipboard] = useState<TranscriptClipboard | null>(null);
  const [hasEdits, setHasEdits] = useState(() => {
    // Compare saved state against the derived baseline: deletions, insertions,
    // length changes, AND text edits (text-only edits previously initialized
    // hasEdits=false, which also suppressed onChange persistence).
    if (initialEditedWords) {
      const baseline = initEditableWords(
        transcript,
        initialMinSilenceMs,
        initialNlSilenceMs
      );
      return (
        initialEditedWords.length !== baseline.length ||
        initialEditedWords.some(
          (ew, i) =>
            ew.deleted ||
            ew.inserted ||
            ew.originalIndex !== i ||
            ew.word.text !== baseline[i].word.text
        )
      );
    }
    return false;
  });
  const [minSilenceMs, setMinSilenceMs] = useState(initialMinSilenceMs);
  const [nlSilenceMs, setNlSilenceMs] = useState(initialNlSilenceMs);
  const [defaultSpeed, setDefaultSpeed] = useState<PlaybackSpeed>(1);
  const [speedMarkers, setSpeedMarkers] = useState<SpeedMarker[]>([]);

  // Helper to save current state to undo stack before making changes
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev, editedWords]);
  }, [editedWords]);

  // Track previous transcript to detect changes
  const prevTranscriptRef = useRef(transcript);

  // Reset edited words when transcript changes (but not on initial load with saved edits)
  useEffect(() => {
    if (prevTranscriptRef.current === transcript) {
      return;
    }
    prevTranscriptRef.current = transcript;

    // Transcript changed - reset to fresh state (use current silence thresholds)
    setEditedWords(initEditableWords(transcript, minSilenceMs, nlSilenceMs));
    setUndoStack([]);
    setHasEdits(false);
    setClipboard(null);
    initializedFromSaved.current = false;
  }, [transcript, minSilenceMs, nlSilenceMs]);

  // Notify consumer when editor state changes (for persistence)
  useEffect(() => {
    // Skip the initial render if we initialized from saved state
    if (!initializedFromSaved.current && initialEditedWords) {
      initializedFromSaved.current = true;
      return;
    }
    initializedFromSaved.current = true;

    // Only notify if there are edits to persist
    if (hasEdits || undoStack.length > 0) {
      onChange?.(editedWords, undoStack);
    }
  }, [editedWords, undoStack, hasEdits, onChange, initialEditedWords]);

  // Undo last edit
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setEditedWords(previousState);
    // Compare against the silence-inserted baseline (what the editor actually
    // starts from), not raw transcript.words — with any detected silence the
    // lengths never matched and hasEdits stayed true after undoing everything.
    const baseline = initEditableWords(transcript, minSilenceMs, nlSilenceMs);
    const isOriginal =
      previousState.length === baseline.length &&
      previousState.every(
        (ew, i) =>
          ew.originalIndex === i &&
          !ew.deleted &&
          !ew.inserted &&
          ew.word.text === baseline[i].word.text
      );
    setHasEdits(!isOriginal);
  }, [undoStack, transcript, minSilenceMs, nlSilenceMs]);

  // Toggle deleted state on a single word
  const toggleWordDeleted = useCallback(
    (index: number) => {
      const ew = editedWords[index];
      if (!ew) return;

      pushUndo();
      const newEditedWords = [...editedWords];
      newEditedWords[index] = { ...ew, deleted: !ew.deleted };
      setEditedWords(newEditedWords);
      setHasEdits(true);
    },
    [editedWords, pushUndo]
  );

  // Toggle deleted state for a range; the first index acts as the anchor
  const deleteRange = useCallback(
    (indices: number[]) => {
      if (indices.length === 0) return;
      const anchor = editedWords[indices[0]];
      if (!anchor) return;

      pushUndo();
      // The anchor word's state determines the action for all words:
      // if anchor is not deleted, delete all; if anchor is deleted, restore all
      const targetDeletedState = !anchor.deleted;
      setEditedWords((prev) => {
        const updated = [...prev];
        for (const i of indices) {
          if (updated[i]) {
            updated[i] = { ...updated[i], deleted: targetDeletedState };
          }
        }
        return updated;
      });
      setHasEdits(true);
    },
    [editedWords, pushUndo]
  );

  // Cut words at the given indices into the clipboard
  const cut = useCallback(
    (indices: number[]) => {
      if (indices.length === 0) return;
      const cutWords = indices
        .map((i) => editedWords[i])
        .filter((ew): ew is EditableWord => ew !== undefined);
      if (cutWords.length === 0) return;

      pushUndo();
      setClipboard({ words: cutWords, operation: 'cut' });
      setEditedWords((prev) => {
        const updated = [...prev];
        for (const i of indices) {
          if (updated[i]) {
            updated[i] = { ...updated[i], deleted: true };
          }
        }
        return updated;
      });
      setHasEdits(true);
    },
    [editedWords, pushUndo]
  );

  // Copy non-deleted words at the given indices into the clipboard (no mutation)
  const copy = useCallback(
    (indices: number[]) => {
      const selectedWords = indices
        .map((i) => editedWords[i])
        .filter((ew): ew is EditableWord => ew !== undefined && !ew.deleted);
      if (selectedWords.length === 0) return;
      setClipboard({ words: selectedWords, operation: 'copy' });
    },
    [editedWords]
  );

  // Paste from clipboard at a word index
  const paste = useCallback(
    (atIndex: number, before: boolean = true): number | null => {
      if (!clipboard) return null;
      pushUndo();
      const insertIndex = before ? atIndex : atIndex + 1;
      setEditedWords((prev) => {
        const updated = [...prev];
        const wordsToInsert = clipboard.words.map((w) => ({
          ...w,
          deleted: false,
          inserted: true,
        }));
        updated.splice(insertIndex, 0, ...wordsToInsert);
        return updated;
      });
      setHasEdits(true);
      return insertIndex;
    },
    [clipboard, pushUndo]
  );

  // Replace a word's text
  const setWordText = useCallback(
    (index: number, text: string) => {
      const ew = editedWords[index];
      if (!ew || text === ew.word.text) return;

      pushUndo();
      const newEditedWords = [...editedWords];
      newEditedWords[index] = {
        ...ew,
        word: { ...ew.word, text },
      };
      setEditedWords(newEditedWords);
      setHasEdits(true);
    },
    [editedWords, pushUndo]
  );

  // Split a silence into multiple segments
  const splitSilence = useCallback(
    (index: number, durationsSec: number[]) => {
      const ew = editedWords[index];
      if (!ew || !isSilenceType(ew.word.wordType)) return;

      pushUndo();

      // Create new silence segments from the durations
      const silenceStart = ew.word.startMs;
      const newSilences: EditableWord[] = [];
      let currentMs = silenceStart;

      for (let i = 0; i < durationsSec.length; i++) {
        const durationMs = Math.round(durationsSec[i] * 1000);
        const endMs = currentMs + durationMs;

        newSilences.push({
          originalIndex: -1, // Negative indicates a split/inserted silence
          word: {
            text: `[${durationsSec[i].toFixed(1)}s]`,
            startMs: currentMs,
            endMs: endMs,
            wordType: 'silence',
          },
          deleted: false,
          inserted: true,
        });

        currentMs = endMs;
      }

      // Replace the original silence with the new segments
      const newEditedWords = [...editedWords];
      newEditedWords.splice(index, 1, ...newSilences);
      setEditedWords(newEditedWords);
      setHasEdits(true);
    },
    [editedWords, pushUndo]
  );

  // Editor "delete" action: toggles the word's deleted state
  const deleteWord = useCallback(
    (index: number) => {
      toggleWordDeleted(index);
    },
    [toggleWordDeleted]
  );

  // Replace the entire edit state from an external source (e.g. the editable
  // script/YAML panel). Undo-safe: the previous state is pushed first.
  const replaceEditedWords = useCallback(
    (next: EditableWord[]) => {
      pushUndo();
      setEditedWords(next);
      setHasEdits(true);
    },
    [pushUndo]
  );

  // Mark filler words (and optionally silences above threshold) deleted
  const removeFillers = useCallback(
    (fillerWords: string[], removeSilenceAboveSec: number | null) => {
      const fillerSet = new Set(fillerWords.map((f) => f.toLowerCase()));
      const silenceThresholdMs =
        removeSilenceAboveSec !== null ? removeSilenceAboveSec * 1000 : null;

      const newEditedWords = editedWords.map((ew) => {
        if (ew.deleted) return ew;

        // Check if it's a silence that should be removed
        if (isSilenceType(ew.word.wordType) && silenceThresholdMs !== null) {
          const durationMs = ew.word.endMs - ew.word.startMs;
          if (durationMs > silenceThresholdMs) {
            return { ...ew, deleted: true };
          }
          return ew;
        }

        // Check if it's a filler word that should be removed
        if (!isSilenceType(ew.word.wordType)) {
          const wordText = normalizeWordText(ew.word.text);
          if (fillerSet.has(wordText)) {
            return { ...ew, deleted: true };
          }
        }

        return ew;
      });

      const deletedCount = newEditedWords.filter(
        (ew, i) => ew.deleted && !editedWords[i].deleted
      ).length;

      if (deletedCount > 0) {
        pushUndo();
        setEditedWords(newEditedWords);
        setHasEdits(true);
      }
    },
    [editedWords, pushUndo]
  );

  // Apply new silence thresholds, rebuilding silences while preserving word deletions
  const setSilenceThresholds = useCallback(
    (newMinSilenceMs: number, newNlSilenceMs: number) => {
      setMinSilenceMs(newMinSilenceMs);
      setNlSilenceMs(newNlSilenceMs);
      // Rebuild the editable words with new silence detection.
      // Preserve deleted status for actual words (not silences), keyed by the
      // word's ORDINAL among non-silence words — the same key the restore loop
      // below uses. (Keying by originalIndex — a position in the old
      // silence-inserted array — mismatched the restore counter and applied
      // deletions to the wrong words after a threshold change.)
      const wordDeletedStatus = new Map<number, boolean>();
      let saveIdx = 0;
      editedWords.forEach((ew) => {
        if (!isSilenceType(ew.word.wordType) && ew.originalIndex >= 0) {
          wordDeletedStatus.set(saveIdx, ew.deleted);
          saveIdx++;
        }
      });

      // Re-initialize with new thresholds
      const newEditedWords = initEditableWords(
        transcript,
        newMinSilenceMs,
        newNlSilenceMs
      );

      // Restore deleted status for words (same ordinal keyspace as the save)
      let wordIdx = 0;
      const restoredWords = newEditedWords.map((ew) => {
        if (!isSilenceType(ew.word.wordType)) {
          const wasDeleted = wordDeletedStatus.get(wordIdx) ?? false;
          wordIdx++;
          return { ...ew, deleted: wasDeleted };
        }
        return ew;
      });

      setEditedWords(restoredWords);
      // Undo snapshots were captured against the previous silence layout;
      // restoring one after a rebuild would resurrect silence chips that no
      // longer match the current thresholds. Threshold changes are not
      // undoable, so drop the stale history rather than restore it.
      setUndoStack([]);
    },
    [editedWords, transcript]
  );

  // Get the speed marker at a specific word index (if any)
  const getSpeedMarkerAtIndex = useCallback(
    (wordIndex: number): SpeedMarker | undefined => {
      return speedMarkers.find((m) => m.wordIndex === wordIndex);
    },
    [speedMarkers]
  );

  // Toggle a speed marker at a word index
  const toggleSpeedMarker = useCallback(
    (wordIndex: number, speed: PlaybackSpeed) => {
      setSpeedMarkers((prev) => {
        const existingIdx = prev.findIndex((m) => m.wordIndex === wordIndex);
        if (existingIdx >= 0) {
          // If marker exists with same speed, remove it
          if (prev[existingIdx].speed === speed) {
            return prev.filter((_, i) => i !== existingIdx);
          }
          // If marker exists with different speed, update it
          const updated = [...prev];
          updated[existingIdx] = { wordIndex, speed };
          return updated;
        }
        // Add new marker
        return [...prev, { wordIndex, speed }].sort(
          (a, b) => a.wordIndex - b.wordIndex
        );
      });
      setHasEdits(true);
    },
    []
  );

  // Remove a speed marker at a word index
  const removeSpeedMarker = useCallback(
    (wordIndex: number) => {
      const filtered = speedMarkers.filter((m) => m.wordIndex !== wordIndex);
      if (filtered.length !== speedMarkers.length) {
        setSpeedMarkers(filtered);
        setHasEdits(true);
      }
    },
    [speedMarkers]
  );

  // Effective playback speed at a word index (bound to current markers + default)
  const getSpeedAtIndexBound = useCallback(
    (index: number): PlaybackSpeed => {
      return getSpeedAtIndex(index, speedMarkers, defaultSpeed);
    },
    [speedMarkers, defaultSpeed]
  );

  // -- Derived data --

  const playbackSegments = useMemo(
    () => buildPlaybackSegments(editedWords),
    [editedWords]
  );

  const stats = useMemo<TranscriptEditStats>(() => {
    // Count active (non-deleted) words (excluding silences for word count)
    const activeWordCount = editedWords.filter(
      (ew) => !ew.deleted && !isSilenceType(ew.word.wordType)
    ).length;
    const activeSilenceCount = editedWords.filter(
      (ew) => !ew.deleted && isSilenceType(ew.word.wordType)
    ).length;
    const deletedWordCount = editedWords.filter(
      (ew) => ew.deleted && !isSilenceType(ew.word.wordType)
    ).length;
    const deletedSilenceCount = editedWords.filter(
      (ew) => ew.deleted && isSilenceType(ew.word.wordType)
    ).length;

    // Calculate edited duration (sum of non-deleted words/silences, adjusted for speed markers)
    const editedDurationMs = editedWords.reduce((sum, ew, index) => {
      if (ew.deleted) return sum;
      const wordDuration = ew.word.endMs - ew.word.startMs;
      const speed = getSpeedAtIndex(index, speedMarkers, defaultSpeed);
      // Duration is divided by speed (2x speed = half the time)
      return sum + wordDuration / speed;
    }, 0);

    return {
      activeWordCount,
      activeSilenceCount,
      deletedWordCount,
      deletedSilenceCount,
      editedDurationMs,
    };
  }, [editedWords, speedMarkers, defaultSpeed]);

  const fillerAnalysis = useMemo<FillerAnalysis>(() => {
    // Occurrence counts per filler (and every active word, for custom fillers)
    const matchCounts = new Map<string, number>();
    for (const ew of editedWords) {
      if (ew.deleted || isSilenceType(ew.word.wordType)) continue;
      const wordText = normalizeWordText(ew.word.text);
      // One increment per occurrence — DEFAULT_FILLER_WORDS entries were
      // previously counted twice (once in a defaults loop, once here).
      matchCounts.set(wordText, (matchCounts.get(wordText) || 0) + 1);
    }

    // Total duration per filler word type
    const durations = new Map<string, number>();
    for (const ew of editedWords) {
      if (ew.deleted || isSilenceType(ew.word.wordType)) continue;
      const wordText = normalizeWordText(ew.word.text);
      const wordDuration = ew.word.endMs - ew.word.startMs;
      // One accumulation per occurrence — DEFAULT_FILLER_WORDS entries were
      // previously accumulated twice, inflating time-saved estimates 2x.
      durations.set(wordText, (durations.get(wordText) || 0) + wordDuration);
    }

    // Silence counts and durations at various thresholds
    const silenceCounts = SILENCE_ANALYSIS_THRESHOLDS.map((threshold) => {
      const thresholdMs = threshold * 1000;
      let count = 0;
      let durationMs = 0;
      for (const ew of editedWords) {
        if (ew.deleted) continue;
        if (!isSilenceType(ew.word.wordType)) continue;
        const silenceDuration = ew.word.endMs - ew.word.startMs;
        if (silenceDuration > thresholdMs) {
          count++;
          durationMs += silenceDuration;
        }
      }
      return { threshold, count, durationMs };
    });

    return {
      matchCounts,
      durations,
      silenceCounts,
      defaultFillerWords: DEFAULT_FILLER_WORDS,
    };
  }, [editedWords]);

  return {
    editedWords,
    undoStack,
    clipboard,
    hasEdits,
    pushUndo,
    undo,
    toggleWordDeleted,
    deleteRange,
    cut,
    copy,
    paste,
    setWordText,
    splitSilence,
    deleteWord,
    replaceEditedWords,
    removeFillers,
    setSilenceThresholds,
    silenceThresholds: { minSilenceMs, nlSilenceMs },
    speedMarkers,
    defaultSpeed,
    setDefaultSpeed,
    toggleSpeedMarker,
    removeSpeedMarker,
    getSpeedAtIndex: getSpeedAtIndexBound,
    getSpeedMarkerAtIndex,
    playbackSegments,
    stats,
    fillerAnalysis,
  };
}
