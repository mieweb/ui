import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import {
  useTranscriptEdits,
  insertSilences,
  initEditableWords,
  buildPlaybackSegments,
  getSpeedAtIndex,
  DEFAULT_FILLER_WORDS,
} from './useTranscriptEdits';
import type {
  Transcript,
  EditableWord,
  SpeedMarker,
} from '../components/TranscriptView/transcript';

// A tightly-packed transcript (no inter-word gaps) so initEditableWords yields
// exactly the spoken words with no silence pseudo-entries — predictable indices.
const packed: Transcript = {
  durationMs: 1300,
  words: [
    { text: 'Hello', startMs: 0, endMs: 500 },
    { text: 'um', startMs: 500, endMs: 800 },
    { text: 'world', startMs: 800, endMs: 1300 },
  ],
};

// ============================================================================
// Pure helpers
// ============================================================================

describe('insertSilences', () => {
  it('inserts a silence pseudo-word for gaps at/above the threshold', () => {
    const words = [
      { text: 'A', startMs: 0, endMs: 500 },
      { text: 'B', startMs: 1000, endMs: 1500 },
    ];
    const result = insertSilences(words, 400, 1500);
    expect(result).toHaveLength(3);
    expect(result[1].wordType).toBe('silence');
    expect(result[1].startMs).toBe(500);
    expect(result[1].endMs).toBe(1000);
  });

  it('marks long gaps as silence-newline', () => {
    const words = [
      { text: 'A', startMs: 0, endMs: 500 },
      { text: 'B', startMs: 2500, endMs: 3000 },
    ];
    const result = insertSilences(words, 400, 1500);
    expect(result[1].wordType).toBe('silence-newline');
  });

  it('inserts a leading silence when the first word starts after the threshold', () => {
    const result = insertSilences(
      [{ text: 'A', startMs: 600, endMs: 1000 }],
      400,
      1500
    );
    expect(result[0].wordType).toBe('silence');
    expect(result[0].startMs).toBe(0);
    expect(result[0].endMs).toBe(600);
  });

  it('returns an empty array for no words', () => {
    expect(insertSilences([])).toEqual([]);
  });
});

describe('initEditableWords', () => {
  it('maps words to non-deleted editable words with sequential originalIndex', () => {
    const editable = initEditableWords(packed);
    expect(editable).toHaveLength(3);
    expect(editable.every((w) => !w.deleted)).toBe(true);
    expect(editable.map((w) => w.originalIndex)).toEqual([0, 1, 2]);
  });
});

describe('buildPlaybackSegments', () => {
  it('merges consecutive original words into a single segment', () => {
    const editable = initEditableWords(packed);
    const segments = buildPlaybackSegments(editable);
    expect(segments).toHaveLength(1);
    expect(segments[0].startMs).toBe(0);
    expect(segments[0].endMs).toBe(1300);
  });

  it('splits a segment around a deleted word', () => {
    const editable = initEditableWords(packed);
    editable[1] = { ...editable[1], deleted: true };
    const segments = buildPlaybackSegments(editable);
    expect(segments).toHaveLength(2);
  });

  it('returns no segments when everything is deleted', () => {
    const editable = initEditableWords(packed).map((w) => ({
      ...w,
      deleted: true,
    }));
    expect(buildPlaybackSegments(editable)).toEqual([]);
  });
});

describe('getSpeedAtIndex', () => {
  it('returns the default speed before any marker', () => {
    const markers: SpeedMarker[] = [{ wordIndex: 1, speed: 1.5 }];
    expect(getSpeedAtIndex(0, markers, 1)).toBe(1);
  });

  it('applies the most recent marker at or before the index', () => {
    const markers: SpeedMarker[] = [
      { wordIndex: 1, speed: 1.5 },
      { wordIndex: 3, speed: 2 },
    ];
    expect(getSpeedAtIndex(1, markers, 1)).toBe(1.5);
    expect(getSpeedAtIndex(2, markers, 1)).toBe(1.5);
    expect(getSpeedAtIndex(3, markers, 1)).toBe(2);
  });
});

// ============================================================================
// Hook
// ============================================================================

describe('useTranscriptEdits', () => {
  it('initializes the edited timeline from the transcript', () => {
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed })
    );
    expect(result.current.editedWords).toHaveLength(3);
    expect(result.current.hasEdits).toBe(false);
  });

  it('toggles a word deleted and flags edits, then restores via undo', () => {
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed })
    );

    act(() => result.current.toggleWordDeleted(1));
    expect(result.current.editedWords[1].deleted).toBe(true);
    expect(result.current.hasEdits).toBe(true);

    act(() => result.current.undo());
    expect(result.current.editedWords[1].deleted).toBe(false);
    expect(result.current.hasEdits).toBe(false);
  });

  it('deletes a range anchored on the first index', () => {
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed })
    );
    act(() => result.current.deleteRange([0, 1, 2]));
    expect(result.current.editedWords.every((w) => w.deleted)).toBe(true);
  });

  it('cuts words into the clipboard and marks them deleted', () => {
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed })
    );
    act(() => result.current.cut([0]));
    expect(result.current.clipboard?.operation).toBe('cut');
    expect(result.current.editedWords[0].deleted).toBe(true);
  });

  it('copies without mutating and pastes an inserted copy', () => {
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed })
    );

    act(() => result.current.copy([0]));
    expect(result.current.clipboard?.operation).toBe('copy');
    expect(result.current.editedWords).toHaveLength(3);

    act(() => {
      result.current.paste(2, true);
    });
    expect(result.current.editedWords).toHaveLength(4);
    expect(result.current.editedWords[2].inserted).toBe(true);
  });

  it('replaces a word text', () => {
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed })
    );
    act(() => result.current.setWordText(0, 'Hi'));
    expect(result.current.editedWords[0].word.text).toBe('Hi');
    expect(result.current.hasEdits).toBe(true);
  });

  it('removes filler words', () => {
    expect(DEFAULT_FILLER_WORDS).toContain('um');
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed })
    );
    act(() => result.current.removeFillers(['um'], null));
    const um = result.current.editedWords.find((w) => w.word.text === 'um');
    expect(um?.deleted).toBe(true);
  });

  it('toggles a speed marker and reports the effective speed', () => {
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed })
    );

    act(() => result.current.toggleSpeedMarker(1, 1.5));
    expect(result.current.speedMarkers).toEqual([{ wordIndex: 1, speed: 1.5 }]);
    expect(result.current.getSpeedAtIndex(2)).toBe(1.5);

    // Re-selecting the same speed removes the marker
    act(() => result.current.toggleSpeedMarker(1, 1.5));
    expect(result.current.speedMarkers).toHaveLength(0);
  });

  it('reports stats for the active timeline', () => {
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed })
    );
    expect(result.current.stats.activeWordCount).toBe(3);
    act(() => result.current.toggleWordDeleted(0));
    expect(result.current.stats.activeWordCount).toBe(2);
    expect(result.current.stats.deletedWordCount).toBe(1);
  });

  it('notifies onChange after a mutation', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTranscriptEdits({ transcript: packed, onChange })
    );
    act(() => result.current.toggleWordDeleted(0));
    expect(onChange).toHaveBeenCalled();
    const [words] = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect((words as EditableWord[])[0].deleted).toBe(true);
  });
});
