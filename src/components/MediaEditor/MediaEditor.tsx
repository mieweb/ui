/**
 * MediaEditor — media playback + editable word-level transcript.
 *
 * Composition of MediaPlayer (imperative MediaPlayerRef) and an editable
 * word-mode transcript, with all edit state held by useTranscriptEdits.
 * Ported from pulseclip's TranscriptViewer; UI-only state (cursor,
 * selection, modals, sequence-playback bookkeeping) lives here.
 *
 * Controlled + persistence-agnostic: edits flow out via
 * onEditorStateChange / onEditedWordsRender and back in via
 * initialEditedWords / initialUndoStack. Timestamps in ms.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button } from '../Button';
import { Select } from '../Select';
import type {
  Transcript,
  TranscriptWord,
  EditableWord,
  PlaybackSegment,
  PlaybackSpeed,
} from '../TranscriptView/transcript';
import { PLAYBACK_SPEEDS, isSilenceType } from '../TranscriptView/transcript';
import { useTranscriptEdits } from '../../hooks/useTranscriptEdits';
import {
  MediaPlayer,
  type MediaPlayerRef,
  type MediaKind,
} from '../MediaPlayer/MediaPlayer';
import { FillerWordsModal } from './FillerWordsModal';
import { WordEditorModal } from './WordEditorModal';
import { SilenceSettingsModal } from './SilenceSettingsModal';
import { SpeedMarkerMenu } from './SpeedMarkerMenu';
import { ScriptPanel } from './ScriptPanel';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MediaEditorProps extends VariantProps<
  typeof mediaEditorVariants
> {
  /** Media URL */
  src: string;
  /** Force the media kind; inferred from the src extension when omitted */
  kind?: MediaKind;
  /** The source transcript (canonical, immutable) */
  transcript: Transcript;
  /** Initial edited words (from saved edits) */
  initialEditedWords?: EditableWord[];
  /** Initial undo stack (from saved edits) */
  initialUndoStack?: EditableWord[][];
  /** Fired after every edit mutation (for persistence) */
  onEditorStateChange?: (
    editedWords: EditableWord[],
    undoStack: EditableWord[][]
  ) => void;
  /** Fired when the hasEdits flag changes */
  onHasEditsChange?: (hasEdits: boolean) => void;
  /** Fired when the cursor moves (start time of the cursor word in ms, or null) */
  onCursorTimestampChange?: (timestampMs: number | null) => void;
  /** Fired whenever the edited words change — lets the host build raw-data views */
  onEditedWordsRender?: (editedWords: EditableWord[]) => void;
  /** Optional ref to the internal MediaPlayer (host escape hatch, e.g. thumbnail capture) */
  playerRef?: React.Ref<MediaPlayerRef>;
  /** Additional class name */
  className?: string;
  /**
   * 'horizontal' (default): media stacked above the transcript.
   * 'vertical': media and transcript side by side.
   */
  splitLayout?: 'horizontal' | 'vertical';
}

interface SelectionRange {
  start: number;
  end: number;
}

// ============================================================================
// Variants
// ============================================================================

const mediaEditorVariants = cva(
  // Root is always a row so the ScriptPanel can dock on the right; the
  // media/transcript split direction lives on the inner wrapper below.
  'flex h-full min-h-0 w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground',
  {
    variants: {
      splitLayout: {
        horizontal: '',
        vertical: '',
      },
    },
    defaultVariants: {
      splitLayout: 'horizontal',
    },
  }
);

// ============================================================================
// Helpers
// ============================================================================

/** Format duration: seconds only if <90s, min:sec if <60min, h:mm:ss otherwise */
function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 90) {
    return `${totalSeconds}s`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface WordVisualState {
  isActive: boolean;
  isCursor: boolean;
  isSelected: boolean;
  isDeleted: boolean;
  isInserted: boolean;
  isSilence: boolean;
  isSilenceNewline: boolean;
  isAnchor: boolean;
  isFocused: boolean;
  hasSpeedMarker: boolean;
}

/**
 * Tailwind classes for one transcript word. Background/color states are
 * mutually exclusive (precedence: anchor > active > selected > deleted >
 * inserted > silence) so token utilities never conflict.
 */
function wordClassName(s: WordVisualState): string {
  const parts = [
    'relative cursor-pointer rounded-sm px-1 py-0.5 transition-colors duration-150',
  ];

  if (s.isSilence) {
    parts.push('text-xs font-medium italic tracking-wide');
  }
  if (s.isSilenceNewline) {
    parts.push('mt-1.5 block w-fit');
  }

  if (s.isAnchor) {
    parts.push('bg-warning/40 outline outline-2 outline-warning');
  } else if (s.isActive) {
    parts.push('bg-primary-800 font-medium text-white');
  } else if (s.isSelected && s.isFocused) {
    parts.push('bg-primary-500/40');
  } else if (s.isDeleted) {
    parts.push(
      'bg-destructive/10 text-destructive line-through opacity-40 hover:bg-destructive/20 hover:opacity-70'
    );
  } else if (s.isInserted) {
    parts.push('bg-success/15 text-success hover:bg-success/25');
  } else if (s.isSilenceNewline) {
    parts.push('text-primary-500 hover:bg-primary-500/15');
  } else if (s.isSilence) {
    parts.push(
      'border border-dashed border-border bg-muted text-muted-foreground hover:bg-muted/70'
    );
  } else {
    parts.push('hover:bg-primary-500/30');
  }

  // Keep the strikethrough visible when a deleted word is also active/selected/anchored
  if (
    s.isDeleted &&
    (s.isActive || (s.isSelected && s.isFocused) || s.isAnchor)
  ) {
    parts.push('line-through opacity-60');
  }

  // Cursor outline only when the transcript has focus (source behavior)
  if (s.isCursor && s.isFocused && !s.isAnchor) {
    if (s.isDeleted) {
      parts.push('outline outline-2 outline-offset-1 outline-destructive');
    } else if (s.isActive) {
      parts.push('outline outline-2 outline-offset-1 outline-background');
    } else {
      parts.push('outline outline-2 outline-offset-1 outline-primary-500');
    }
  }

  if (s.hasSpeedMarker) {
    parts.push('ml-0.5 border-l-[3px] border-l-warning pl-1.5');
  }

  return parts.join(' ');
}

/** Blinking caret rendered inside the cursor word */
const Caret: React.FC<{ side: 'before' | 'after' }> = ({ side }) => (
  <span
    aria-hidden="true"
    className={`bg-primary-500 absolute top-0.5 bottom-0.5 w-0.5 motion-safe:animate-pulse ${
      side === 'before' ? '-left-px' : 'right-0.5'
    }`}
  />
);

// ============================================================================
// Component
// ============================================================================

/**
 * Media editor: MediaPlayer on top, an editable word-mode transcript below,
 * and a toolbar with speed control, filler removal, and edit statistics.
 *
 * Interactions (ported from pulseclip's TranscriptViewer):
 * - Click a word: seek and play just that word
 * - Double-click: set a range anchor; click another word to select the range
 * - Mouse-down + drag: select a range; long-press (500ms) opens the editor
 * - Right-click: speed marker menu
 * - Keyboard: arrows (+Shift to select), Home/End, Backspace/Delete toggle
 *   delete, Cmd/Ctrl+X/C/V cut/copy/paste, Cmd/Ctrl+Z undo, Space plays the
 *   edited timeline from the cursor, Enter opens the word editor
 */
export const MediaEditor = React.forwardRef<HTMLDivElement, MediaEditorProps>(
  (
    {
      src,
      kind,
      transcript,
      initialEditedWords,
      initialUndoStack,
      onEditorStateChange,
      onHasEditsChange,
      onCursorTimestampChange,
      onEditedWordsRender,
      playerRef: externalPlayerRef,
      className,
      splitLayout,
    },
    ref
  ) => {
    // -- Edit state (headless hook) --
    const edits = useTranscriptEdits({
      transcript,
      initialEditedWords,
      initialUndoStack,
      onChange: onEditorStateChange,
    });
    const {
      editedWords,
      undoStack,
      clipboard,
      hasEdits,
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
      silenceThresholds,
      speedMarkers,
      defaultSpeed,
      setDefaultSpeed,
      toggleSpeedMarker,
      removeSpeedMarker,
      getSpeedAtIndex,
      getSpeedMarkerAtIndex,
      playbackSegments,
      stats,
      fillerAnalysis,
    } = edits;

    // -- UI state --
    const [activeWordIndex, setActiveWordIndex] = React.useState<number | null>(
      null
    );
    const [cursorIndex, setCursorIndex] = React.useState<number>(0);
    // 'before' = caret before the cursor word; 'after' = after the last word
    const [cursorPosition, setCursorPosition] = React.useState<
      'before' | 'after'
    >('before');
    const [selectionAnchor, setSelectionAnchor] = React.useState<number | null>(
      null
    );
    const [selection, setSelection] = React.useState<SelectionRange | null>(
      null
    );
    const [doubleClickAnchor, setDoubleClickAnchor] = React.useState<
      number | null
    >(null);
    const [isPlayingSequence, setIsPlayingSequence] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [showFillerModal, setShowFillerModal] = React.useState(false);
    const [showSilenceModal, setShowSilenceModal] = React.useState(false);
    const [showScriptPanel, setShowScriptPanel] = React.useState(false);
    const [editorWordIndex, setEditorWordIndex] = React.useState<number | null>(
      null
    );
    const [speedMenuWordIndex, setSpeedMenuWordIndex] = React.useState<
      number | null
    >(null);
    const [speedMenuPosition, setSpeedMenuPosition] = React.useState<{
      x: number;
      y: number;
    } | null>(null);

    // -- Refs --
    const playerRef = React.useRef<MediaPlayerRef>(null);
    // Mirror the internal player handle to the host-provided ref via a STABLE
    // delegating proxy: every call forwards to playerRef.current at call time.
    // (Snapshotting playerRef.current with [] deps captured the first-commit
    // handle — ref assignment doesn't re-render, so hosts could hold a stale
    // handle whose mediaElement stayed null forever.)
    React.useImperativeHandle(
      externalPlayerRef,
      (): MediaPlayerRef => ({
        seekToMs: (timeMs) => playerRef.current?.seekToMs(timeMs),
        play: () => playerRef.current?.play(),
        pause: () => playerRef.current?.pause(),
        getCurrentTimeMs: () => playerRef.current?.getCurrentTimeMs() ?? 0,
        getDurationMs: () => playerRef.current?.getDurationMs() ?? 0,
        isPaused: () => playerRef.current?.isPaused() ?? true,
        setPlaybackRate: (rate) => playerRef.current?.setPlaybackRate(rate),
        get mediaElement() {
          return playerRef.current?.mediaElement ?? null;
        },
      }),
      []
    );
    const contentRef = React.useRef<HTMLDivElement>(null);
    const userSetCursor = React.useRef<number | null>(null);
    const isDragging = React.useRef<boolean>(false);
    const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    );
    const longPressTriggered = React.useRef<boolean>(false);
    const wordPlaybackStartMs = React.useRef<number | null>(null);
    const wordPlaybackEndMs = React.useRef<number | null>(null);
    // Edited-timeline sequence playback
    const sequenceSegments = React.useRef<PlaybackSegment[]>([]);
    const currentSegmentIndex = React.useRef<number>(0);

    // ------------------------------------------------------------------
    // Parent notifications
    // ------------------------------------------------------------------

    React.useEffect(() => {
      onHasEditsChange?.(hasEdits);
    }, [hasEdits, onHasEditsChange]);

    React.useEffect(() => {
      onEditedWordsRender?.(editedWords);
    }, [editedWords, onEditedWordsRender]);

    // Report cursor timestamp changes to the parent
    React.useEffect(() => {
      if (onCursorTimestampChange) {
        const word = editedWords[cursorIndex];
        if (word && !word.deleted) {
          onCursorTimestampChange(word.word.startMs);
        } else {
          onCursorTimestampChange(null);
        }
      }
    }, [cursorIndex, editedWords, onCursorTimestampChange]);

    // ------------------------------------------------------------------
    // Transcript change / cursor sync / focus
    // ------------------------------------------------------------------

    // Reset UI state when the transcript changes (edit state resets in the hook)
    const prevTranscriptRef = React.useRef(transcript);
    React.useEffect(() => {
      if (prevTranscriptRef.current === transcript) return;
      prevTranscriptRef.current = transcript;
      setCursorIndex(0);
      setCursorPosition('before');
      setSelection(null);
      setSelectionAnchor(null);
      setDoubleClickAnchor(null);
      setActiveWordIndex(null);
      setIsPlayingSequence(false);
      sequenceSegments.current = [];
      currentSegmentIndex.current = 0;
    }, [transcript]);

    // Sync cursor with the active word while playing (unless a click-seek is pending)
    React.useEffect(() => {
      if (userSetCursor.current !== null) {
        return;
      }
      if (activeWordIndex !== null && activeWordIndex >= 0) {
        setCursorIndex(activeWordIndex);
        setCursorPosition('before');
        setSelection(null);
        setSelectionAnchor(null);
      }
    }, [activeWordIndex]);

    // Auto-scroll the active word into view during playback
    React.useEffect(() => {
      if (activeWordIndex === null) return;
      const el = contentRef.current?.querySelector(
        `[data-word-index="${activeWordIndex}"]`
      );
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [activeWordIndex]);

    // Auto-focus the transcript for keyboard navigation
    React.useEffect(() => {
      contentRef.current?.focus();
    }, [transcript]);

    // Apply the default speed when it changes (and no marker overrides it)
    React.useEffect(() => {
      const player = playerRef.current;
      if (!player) return;
      const timeMs = player.getCurrentTimeMs();
      const currentWordIndex = editedWords.findIndex(
        (ew) =>
          !ew.deleted && timeMs >= ew.word.startMs && timeMs < ew.word.endMs
      );
      const targetSpeed =
        currentWordIndex >= 0
          ? getSpeedAtIndex(currentWordIndex)
          : defaultSpeed;
      player.setPlaybackRate(targetSpeed);
    }, [defaultSpeed, speedMarkers, editedWords, getSpeedAtIndex]);

    // ------------------------------------------------------------------
    // Playback engine (timeupdate-driven)
    // ------------------------------------------------------------------

    const handleTimeUpdate = (timeMs: number) => {
      const player = playerRef.current;
      if (!player) return;

      // Segment-based playback of the edited timeline (jumps over deletions
      // and honors reordered/pasted words)
      if (isPlayingSequence && sequenceSegments.current.length > 0) {
        const currentSeg =
          sequenceSegments.current[currentSegmentIndex.current];
        if (currentSeg && timeMs >= currentSeg.endMs) {
          const nextIndex = currentSegmentIndex.current + 1;
          if (nextIndex < sequenceSegments.current.length) {
            currentSegmentIndex.current = nextIndex;
            player.seekToMs(sequenceSegments.current[nextIndex].startMs);
          } else {
            // End of all segments
            player.pause();
            setIsPlayingSequence(false);
            sequenceSegments.current = [];
            currentSegmentIndex.current = 0;
          }
        }
      } else if (hasEdits && !player.isPaused()) {
        // During normal playback with edits, skip over deleted words
        const inDeletedWord = editedWords.some(
          (ew) =>
            ew.deleted && timeMs >= ew.word.startMs && timeMs < ew.word.endMs
        );
        if (inDeletedWord) {
          const nextNonDeleted = editedWords.find(
            (ew) => !ew.deleted && ew.word.startMs >= timeMs
          );
          if (nextNonDeleted) {
            player.seekToMs(nextNonDeleted.word.startMs);
          }
        }
      }

      // Stop playback at the end of single-word playback, reseek to its start
      if (
        wordPlaybackEndMs.current !== null &&
        timeMs >= wordPlaybackEndMs.current
      ) {
        player.pause();
        if (wordPlaybackStartMs.current !== null) {
          player.seekToMs(wordPlaybackStartMs.current);
          wordPlaybackStartMs.current = null;
        }
        wordPlaybackEndMs.current = null;
      }

      // Find the active word. During segment playback use the current
      // segment's indices (disambiguates duplicate/pasted words that share
      // timing); otherwise fall back to a time-based lookup.
      let editedIndex = -1;
      if (isPlayingSequence && sequenceSegments.current.length > 0) {
        const currentSeg =
          sequenceSegments.current[currentSegmentIndex.current];
        if (currentSeg) {
          for (const idx of currentSeg.editedIndices) {
            const ew = editedWords[idx];
            if (
              ew &&
              !ew.deleted &&
              timeMs >= ew.word.startMs &&
              timeMs < ew.word.endMs
            ) {
              editedIndex = idx;
              break;
            }
          }
        }
      }
      if (editedIndex === -1) {
        editedIndex = editedWords.findIndex(
          (ew) =>
            !ew.deleted && timeMs >= ew.word.startMs && timeMs < ew.word.endMs
        );
      }

      // Update playback rate from speed markers when the word changes
      if (editedIndex !== activeWordIndex && editedIndex >= 0) {
        player.setPlaybackRate(getSpeedAtIndex(editedIndex));
      }
      setActiveWordIndex(editedIndex >= 0 ? editedIndex : null);

      // Playback has resumed reporting time: release the click-seek cursor lock
      userSetCursor.current = null;
    };

    const stopSequencePlayback = () => {
      setIsPlayingSequence(false);
      sequenceSegments.current = [];
      currentSegmentIndex.current = 0;
    };

    // ------------------------------------------------------------------
    // Selection / clipboard helpers
    // ------------------------------------------------------------------

    /** Indices covered by the selection, or the cursor word */
    const selectionIndices = React.useCallback((): number[] => {
      if (selection) {
        const indices: number[] = [];
        for (let i = selection.start; i <= selection.end; i++) indices.push(i);
        return indices;
      }
      return [cursorIndex];
    }, [selection, cursorIndex]);

    const handleCut = React.useCallback(() => {
      cut(selectionIndices());
    }, [cut, selectionIndices]);

    const handlePaste = React.useCallback(() => {
      if (!clipboard) return;
      const pastedCount = clipboard.words.length;
      const insertIndex = paste(cursorIndex, cursorPosition !== 'after');
      if (insertIndex !== null) {
        setCursorIndex(insertIndex + pastedCount - 1);
        setCursorPosition('after');
        setSelection(null);
        setSelectionAnchor(null);
      }
    }, [clipboard, paste, cursorIndex, cursorPosition]);

    // Toggle deleted state for the selection (anchor decides) or cursor word
    const handleDeleteToggle = React.useCallback(() => {
      if (selection) {
        const anchorIndex = selectionAnchor ?? selection.start;
        const indices: number[] = [anchorIndex];
        for (let i = selection.start; i <= selection.end; i++) {
          if (i !== anchorIndex) indices.push(i);
        }
        deleteRange(indices);
      } else {
        toggleWordDeleted(cursorIndex);
      }
    }, [
      selection,
      selectionAnchor,
      cursorIndex,
      deleteRange,
      toggleWordDeleted,
    ]);

    // Copy: put plain text on the system clipboard + fill the internal clipboard
    const handleCopy = React.useCallback(
      (e: React.ClipboardEvent) => {
        const indices = selectionIndices();
        const selectedWords = indices
          .map((i) => editedWords[i])
          .filter((ew): ew is EditableWord => ew !== undefined && !ew.deleted);
        if (selectedWords.length === 0) return;
        const selectedText = selectedWords
          .filter((ew) => !isSilenceType(ew.word.wordType))
          .map((ew) => ew.word.text)
          .join(' ');
        e.preventDefault();
        e.clipboardData.setData('text/plain', selectedText);
        copy(indices);
      },
      [selectionIndices, editedWords, copy]
    );

    // ------------------------------------------------------------------
    // Word editor modal
    // ------------------------------------------------------------------

    const openWordEditor = React.useCallback((index: number) => {
      setEditorWordIndex(index);
    }, []);

    const closeWordEditor = React.useCallback(() => {
      setEditorWordIndex(null);
      // Restore focus to the transcript after the modal closes
      setTimeout(() => contentRef.current?.focus(), 0);
    }, []);

    const handleEditorSave = React.useCallback(
      (newText: string) => {
        if (editorWordIndex === null) return;
        setWordText(editorWordIndex, newText);
      },
      [editorWordIndex, setWordText]
    );

    const handleEditorSplitSilence = React.useCallback(
      (durations: number[]) => {
        if (editorWordIndex === null) return;
        splitSilence(editorWordIndex, durations);
      },
      [editorWordIndex, splitSilence]
    );

    const handleEditorDelete = React.useCallback(() => {
      if (editorWordIndex !== null) {
        deleteWord(editorWordIndex);
        closeWordEditor();
      }
    }, [editorWordIndex, deleteWord, closeWordEditor]);

    // ------------------------------------------------------------------
    // Mouse interactions
    // ------------------------------------------------------------------

    const handleWordClick = (
      word: TranscriptWord,
      index: number,
      e: React.MouseEvent
    ) => {
      setCursorIndex(index);
      setCursorPosition('before');
      userSetCursor.current = index;

      if (e.shiftKey && selectionAnchor !== null) {
        // Extend selection with shift+click
        setSelection({
          start: Math.min(selectionAnchor, index),
          end: Math.max(selectionAnchor, index),
        });
      } else if (
        doubleClickAnchor !== null &&
        doubleClickAnchor !== index &&
        !isDragging.current
      ) {
        // A double-click anchor exists and a different word was clicked: select the range
        const start = Math.min(doubleClickAnchor, index);
        const end = Math.max(doubleClickAnchor, index);
        setSelection({ start, end });
        setSelectionAnchor(doubleClickAnchor);
        setDoubleClickAnchor(null);
      } else if (doubleClickAnchor === index) {
        // Clicking the anchor itself — wait for a potential double-click
      } else if (!isDragging.current) {
        // Clear selection, set a new anchor, and play just this word
        setSelectionAnchor(index);
        setSelection(null);

        const player = playerRef.current;
        if (player) {
          player.pause();
          player.seekToMs(word.startMs);
          wordPlaybackStartMs.current = word.startMs;
          wordPlaybackEndMs.current = word.endMs;
          player.play();
        }
      }
    };

    const handleWordDoubleClick = (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      // Don't trigger if a long press already fired
      if (longPressTriggered.current) return;

      if (doubleClickAnchor === index) {
        setDoubleClickAnchor(null);
      } else {
        setDoubleClickAnchor(index);
        setSelection(null);
      }
    };

    const handleWordMouseDown = (index: number, e: React.MouseEvent) => {
      if (e.button !== 0) return;

      // Long press (500ms) opens the word editor
      longPressTriggered.current = false;
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        openWordEditor(index);
      }, 500);

      isDragging.current = true;
      setSelectionAnchor(index);
      setCursorIndex(index);
      setCursorPosition('before');
      setSelection(null);
    };

    const handleWordMouseEnter = (index: number) => {
      // Cancel the long press when dragging to another word
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (!isDragging.current || selectionAnchor === null) return;

      setSelection({
        start: Math.min(selectionAnchor, index),
        end: Math.max(selectionAnchor, index),
      });
      setCursorIndex(index);
    };

    const handleMouseUp = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (isDragging.current) {
        isDragging.current = false;
      }
    };

    const handleWordContextMenu = (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      // Position the speed menu near the word, clamped to the viewport
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 280;
      const menuWidth = 150;

      let x = rect.left;
      let y = rect.bottom + 4;

      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 8;
      }
      if (y + menuHeight > window.innerHeight) {
        y = rect.top - menuHeight - 4;
        if (y < 0) {
          y = 8;
        }
      }

      setSpeedMenuPosition({ x, y });
      setSpeedMenuWordIndex(index);
    };

    // ------------------------------------------------------------------
    // Keyboard
    // ------------------------------------------------------------------

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        const wordCount = editedWords.length;
        if (wordCount === 0) return;

        let newIndex = cursorIndex;
        let handled = false;

        if (e.key === 'Delete' || e.key === 'Backspace') {
          handleDeleteToggle();
          handled = true;
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
          handleCut();
          handled = true;
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'v' && clipboard) {
          handlePaste();
          handled = true;
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
          undo();
          handled = true;
        } else if (e.key === 'ArrowLeft') {
          if (cursorPosition === 'after') {
            // Move from 'after' the last word back to 'before' it
            setCursorPosition('before');
          } else {
            newIndex = Math.max(0, cursorIndex - 1);
          }
          handled = true;
        } else if (e.key === 'ArrowRight') {
          if (cursorIndex === wordCount - 1 && cursorPosition === 'before') {
            // At the last word: move the caret after it
            setCursorPosition('after');
          } else if (cursorPosition !== 'after') {
            newIndex = Math.min(wordCount - 1, cursorIndex + 1);
          }
          handled = true;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          // Find the visually nearest word on the previous/next row
          const currentElement = contentRef.current?.querySelector(
            `[data-word-index="${cursorIndex}"]`
          ) as HTMLElement | null;
          if (currentElement) {
            const currentRect = currentElement.getBoundingClientRect();
            const currentCenterX = currentRect.left + currentRect.width / 2;

            const direction = e.key === 'ArrowUp' ? -1 : 1;
            let bestMatch = cursorIndex;
            let bestDistance = Infinity;
            let targetRowTop: number | null = null;

            for (
              let i = cursorIndex + direction;
              i >= 0 && i < wordCount;
              i += direction
            ) {
              const el = contentRef.current?.querySelector(
                `[data-word-index="${i}"]`
              ) as HTMLElement | null;
              if (!el) continue;

              const rect = el.getBoundingClientRect();
              const isOnDifferentRow =
                direction === -1
                  ? rect.bottom <= currentRect.top
                  : rect.top >= currentRect.bottom;

              if (isOnDifferentRow) {
                // The first word on a different row establishes the target row
                if (targetRowTop === null) {
                  targetRowTop = rect.top;
                }
                const isSameTargetRow = Math.abs(rect.top - targetRowTop) < 5;
                if (isSameTargetRow) {
                  const centerX = rect.left + rect.width / 2;
                  const distance = Math.abs(centerX - currentCenterX);
                  if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = i;
                  }
                } else {
                  // Moved past the target row; stop searching
                  break;
                }
              }
            }
            newIndex = bestMatch;
          }
          handled = true;
        } else if (e.key === 'Home') {
          newIndex = 0;
          handled = true;
        } else if (e.key === 'End') {
          newIndex = wordCount - 1;
          handled = true;
        } else if (e.key === 'Enter') {
          openWordEditor(cursorIndex);
          handled = true;
        } else if (e.key === ' ') {
          // Toggle play/pause from the cursor position
          const ew = editedWords[cursorIndex];
          const player = playerRef.current;
          if (player && ew && !ew.deleted) {
            if (player.isPaused()) {
              if (hasEdits) {
                // Play the edited timeline as a segment sequence
                const segments = playbackSegments;
                if (segments.length > 0) {
                  let startSegmentIdx = 0;
                  for (let i = 0; i < segments.length; i++) {
                    if (segments[i].editedIndices.includes(cursorIndex)) {
                      startSegmentIdx = i;
                      break;
                    }
                  }
                  sequenceSegments.current = segments;
                  currentSegmentIndex.current = startSegmentIdx;
                  setIsPlayingSequence(true);
                  // Start from the cursor word's time, not the segment's start
                  player.seekToMs(ew.word.startMs);
                  player.play();
                }
              } else {
                // Normal playback from the cursor
                player.seekToMs(ew.word.startMs);
                player.play();
              }
            } else {
              player.pause();
              setIsPlayingSequence(false);
            }
          }
          handled = true;
        }

        if (handled) {
          e.preventDefault();
          e.stopPropagation();
          if (newIndex !== cursorIndex) {
            setCursorIndex(newIndex);
            setCursorPosition('before');
          }

          if (e.shiftKey && e.key !== 'Delete' && e.key !== 'Backspace') {
            // Extend the selection (not for delete operations)
            const anchor = selectionAnchor ?? cursorIndex;
            if (selectionAnchor === null) {
              setSelectionAnchor(cursorIndex);
            }
            setSelection({
              start: Math.min(anchor, newIndex),
              end: Math.max(anchor, newIndex),
            });
          } else if (!e.metaKey && !e.ctrlKey) {
            // Clear the selection when moving without shift (not for cut/paste)
            setSelection(null);
            setSelectionAnchor(null);
          }

          // Scroll the cursor into view
          const wordElement = contentRef.current?.querySelector(
            `[data-word-index="${newIndex}"]`
          );
          wordElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      },
      [
        editedWords,
        cursorIndex,
        cursorPosition,
        selectionAnchor,
        clipboard,
        hasEdits,
        playbackSegments,
        handleDeleteToggle,
        handleCut,
        handlePaste,
        undo,
        openWordEditor,
      ]
    );

    // ------------------------------------------------------------------
    // Rendering
    // ------------------------------------------------------------------

    const isWordSelected = (index: number): boolean => {
      if (!selection) return false;
      return index >= selection.start && index <= selection.end;
    };

    const renderWord = (ew: EditableWord, index: number) => {
      const isActive = index === activeWordIndex;
      const isCursor = index === cursorIndex;
      const isSelected = isWordSelected(index);
      const isDeleted = ew.deleted;
      const isInserted = ew.inserted ?? false;
      const isSilence =
        ew.word.wordType === 'silence' ||
        ew.word.wordType === 'silence-newline';
      const isSilenceNewline = ew.word.wordType === 'silence-newline';
      const isAnchor = index === doubleClickAnchor;
      const showCursorBefore = isCursor && cursorPosition === 'before';
      const showCursorAfter =
        isCursor &&
        cursorPosition === 'after' &&
        index === editedWords.length - 1;
      const speedMarker = getSpeedMarkerAtIndex(index);
      const hasSpeedMarker = !!speedMarker;

      // For silences, show the duration adjusted for the effective speed
      const effectiveSpeed = getSpeedAtIndex(index);
      let displayText = ew.word.text;
      if (isSilence && effectiveSpeed !== 1) {
        const originalDurationMs = ew.word.endMs - ew.word.startMs;
        const adjustedDurationSec = originalDurationMs / effectiveSpeed / 1000;
        displayText = `[${adjustedDurationSec.toFixed(1)}s]`;
      }

      const title = `${ew.word.startMs}ms - ${ew.word.endMs}ms${
        ew.word.confidence ? ` (${Math.round(ew.word.confidence * 100)}%)` : ''
      }${
        isSilence
          ? ` [SILENCE: ${((ew.word.endMs - ew.word.startMs) / 1000).toFixed(1)}s${
              effectiveSpeed !== 1
                ? ` → ${((ew.word.endMs - ew.word.startMs) / effectiveSpeed / 1000).toFixed(1)}s @ ${effectiveSpeed}x`
                : ''
            }]`
          : ''
      }${isDeleted ? ' [DELETED]' : ''}${isInserted ? ' [INSERTED]' : ''}${
        hasSpeedMarker ? ` [SPEED: ${speedMarker.speed}x]` : ''
      }${
        isAnchor
          ? ' [ANCHOR - click another word to select range, double-click to clear]'
          : ''
      }${!isAnchor && !isDeleted ? ' (right-click to set speed marker)' : ''}`;

      return (
        // Keyboard interaction is owned by the parent listbox via roving focus
        // (aria-activedescendant); options are pointer affordances only.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
        <span
          key={`${ew.originalIndex}-${index}`}
          id={`word-${index}`}
          data-word-index={index}
          className={wordClassName({
            isActive,
            isCursor,
            isSelected,
            isDeleted,
            isInserted,
            isSilence,
            isSilenceNewline,
            isAnchor,
            isFocused,
            hasSpeedMarker,
          })}
          onClick={(e) => handleWordClick(ew.word, index, e)}
          onDoubleClick={(e) => handleWordDoubleClick(index, e)}
          onMouseDown={(e) => handleWordMouseDown(index, e)}
          onMouseEnter={() => handleWordMouseEnter(index)}
          onContextMenu={(e) => handleWordContextMenu(index, e)}
          role="option"
          aria-selected={isSelected || isCursor}
          title={title}
        >
          {showCursorBefore && isFocused && <Caret side="before" />}
          {hasSpeedMarker && (
            <span
              className="border-warning/50 bg-warning/20 text-warning-foreground mr-1 inline-block rounded-sm border px-0.5 align-middle text-[9px] leading-snug font-semibold"
              title={`Speed: ${speedMarker.speed}x from here`}
            >
              {speedMarker.speed}x
            </span>
          )}
          {displayText} {showCursorAfter && isFocused && <Caret side="after" />}
        </span>
      );
    };

    const showEditBar =
      hasEdits || doubleClickAnchor !== null || selection !== null;

    return (
      <div
        ref={ref}
        className={mediaEditorVariants({ splitLayout, className })}
      >
        <div
          className={`flex min-h-0 min-w-0 flex-1 ${
            splitLayout === 'vertical' ? 'flex-col md:flex-row' : 'flex-col'
          }`}
        >
          {/* Media surface */}
          <div
            className={`border-border bg-background min-h-0 shrink-0 ${
              splitLayout === 'vertical'
                ? 'md:w-1/2 md:border-r'
                : 'max-h-[50%] border-b'
            }`}
          >
            <MediaPlayer
              ref={playerRef}
              src={src}
              kind={kind}
              aria-label="Media player"
              onTimeUpdate={handleTimeUpdate}
              onEnded={stopSequencePlayback}
            />
          </div>

          {/* Transcript editor */}
          <div
            className={`flex min-h-0 flex-1 flex-col ${splitLayout === 'vertical' ? 'md:w-1/2' : ''}`}
          >
            {/* Toolbar */}
            <div className="border-border flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
              <div className="flex items-center gap-2">
                {hasEdits && (
                  <span className="bg-warning/20 text-warning-foreground rounded px-1.5 py-0.5 text-xs font-semibold">
                    Edited
                  </span>
                )}
                <label
                  className="text-muted-foreground text-xs"
                  htmlFor="media-editor-default-speed"
                >
                  Speed:
                </label>
                <div className="w-20">
                  <Select
                    id="media-editor-default-speed"
                    size="sm"
                    options={PLAYBACK_SPEEDS.map((speed) => ({
                      value: String(speed),
                      label: `${speed}x`,
                    }))}
                    value={String(defaultSpeed)}
                    onValueChange={(value) =>
                      setDefaultSpeed(parseFloat(value) as PlaybackSpeed)
                    }
                    aria-label="Default playback speed"
                  />
                </div>
                {speedMarkers.length > 0 && (
                  <span
                    className="text-muted-foreground text-xs"
                    title={`${speedMarkers.length} speed marker(s) set. Right-click on a word to add/remove speed markers.`}
                  >
                    {speedMarkers.length} marker
                    {speedMarkers.length !== 1 ? 's' : ''}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFillerModal(true)}
                  aria-label="Remove filler words"
                  title="Remove filler words"
                >
                  ✂️
                </Button>
                {undoStack.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    aria-label={`Undo (${undoStack.length} available)`}
                    title="Undo (⌘Z)"
                  >
                    Undo ({undoStack.length})
                  </Button>
                )}
              </div>

              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScriptPanel((v) => !v)}
                  aria-pressed={showScriptPanel}
                  aria-label="Show script"
                  title="Show the transcript script (editable YAML/JSON)"
                >
                  Script
                </Button>
                <span>{stats.activeWordCount} words</span>
                <button
                  type="button"
                  className="hover:bg-muted hover:text-foreground focus-visible:ring-ring rounded px-1 underline decoration-dotted transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  onClick={() => setShowSilenceModal(true)}
                  title={
                    stats.activeSilenceCount > 0
                      ? `Click to configure silence detection (currently ≥${(silenceThresholds.minSilenceMs / 1000).toFixed(1)}s)`
                      : `No silences detected (threshold: ${(silenceThresholds.minSilenceMs / 1000).toFixed(1)}s). Click to configure.`
                  }
                  aria-label="Configure silence detection"
                >
                  {stats.activeSilenceCount} silences
                </button>
                {(stats.deletedWordCount > 0 ||
                  stats.deletedSilenceCount > 0) && (
                  <span className="text-destructive">
                    {stats.deletedWordCount + stats.deletedSilenceCount} deleted
                  </span>
                )}
                {transcript.speakers && (
                  <span>{transcript.speakers.length} speakers</span>
                )}
                <span>{formatDuration(stats.editedDurationMs)}</span>
              </div>
            </div>

            {/* Contextual edit actions */}
            {showEditBar && (
              <div className="border-border bg-muted/40 flex shrink-0 items-center gap-1 border-b px-3 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openWordEditor(cursorIndex)}
                  title="Edit selected word (Enter)"
                >
                  Edit <kbd className="text-[10px] opacity-60">↵</kbd>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteToggle}
                  title="Delete selected word (Del)"
                >
                  Del <kbd className="text-[10px] opacity-60">⌫</kbd>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCut}
                  title="Cut selection (⌘X)"
                >
                  Cut <kbd className="text-[10px] opacity-60">⌘X</kbd>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePaste}
                  disabled={!clipboard}
                  title="Paste (⌘V)"
                >
                  Paste <kbd className="text-[10px] opacity-60">⌘V</kbd>
                </Button>
              </div>
            )}

            {/* Editable transcript */}
            <div
              ref={contentRef}
              className={`focus-visible:ring-ring min-h-0 flex-1 overflow-y-auto p-3 text-sm leading-relaxed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset ${
                isFocused ? 'bg-muted/20' : ''
              }`}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onCopy={handleCopy}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              role="listbox"
              aria-label="Transcript words"
              aria-activedescendant={`word-${cursorIndex}`}
            >
              {editedWords.map(renderWord)}
            </div>
          </div>
        </div>

        {showScriptPanel && (
          <ScriptPanel
            transcript={transcript}
            editedWords={editedWords}
            onApply={replaceEditedWords}
            onClose={() => setShowScriptPanel(false)}
          />
        )}

        {/* Modals & menus */}
        <FillerWordsModal
          isOpen={showFillerModal}
          onClose={() => setShowFillerModal(false)}
          onApply={removeFillers}
          matchingCounts={fillerAnalysis.matchCounts}
          fillerDurations={fillerAnalysis.durations}
          silenceCounts={fillerAnalysis.silenceCounts}
          currentDurationMs={stats.editedDurationMs}
        />

        <SilenceSettingsModal
          isOpen={showSilenceModal}
          onClose={() => setShowSilenceModal(false)}
          minSilenceMs={silenceThresholds.minSilenceMs}
          nlSilenceMs={silenceThresholds.nlSilenceMs}
          onApply={setSilenceThresholds}
        />

        <WordEditorModal
          isOpen={editorWordIndex !== null}
          editableWord={
            editorWordIndex !== null
              ? (editedWords[editorWordIndex] ?? null)
              : null
          }
          onClose={closeWordEditor}
          onSave={handleEditorSave}
          onSplitSilence={handleEditorSplitSilence}
          onDelete={handleEditorDelete}
        />

        <SpeedMarkerMenu
          isOpen={speedMenuWordIndex !== null}
          position={speedMenuPosition}
          wordIndex={speedMenuWordIndex}
          currentMarker={
            speedMenuWordIndex !== null
              ? getSpeedMarkerAtIndex(speedMenuWordIndex)
              : undefined
          }
          defaultSpeed={defaultSpeed}
          onSetSpeed={(speed) => {
            if (speedMenuWordIndex !== null) {
              toggleSpeedMarker(speedMenuWordIndex, speed);
            }
          }}
          onRemoveMarker={() => {
            if (speedMenuWordIndex !== null) {
              removeSpeedMarker(speedMenuWordIndex);
            }
          }}
          onClose={() => {
            setSpeedMenuWordIndex(null);
            setSpeedMenuPosition(null);
          }}
        />
      </div>
    );
  }
);

MediaEditor.displayName = 'MediaEditor';
