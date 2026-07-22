/**
 * Transcript schema for @mieweb/ui media components.
 *
 * Provider-agnostic and persistence-agnostic. Canonical time unit is
 * **milliseconds** (consumers with seconds-based data, e.g. osheet, adapt
 * at the boundary).
 *
 * Shared by TranscriptView, MediaEditor, and useTranscriptEdits.
 */

/** Type of transcript word - 'word' for spoken content, 'silence' for detected gaps, 'silence-newline' for longer pauses */
export type WordType = 'word' | 'silence' | 'silence-newline';

export interface TranscriptWord {
  text: string;
  startMs: number;
  endMs: number;
  /** References Speaker.id when diarization is available */
  speakerId?: string;
  confidence?: number;
  /** Type of word: 'word' for spoken content, 'silence' for detected gaps. Defaults to 'word' */
  wordType?: WordType;
}

/** A diarized segment of contiguous speech (osheet-style granularity) */
export interface TranscriptSegment {
  text: string;
  startMs: number;
  endMs: number;
  /** References Speaker.id when diarization is available */
  speakerId?: string;
  words: TranscriptWord[];
}

export interface Speaker {
  id: string;
  /** Display name (e.g. 'Clinician', 'Patient'). Hosts may remap via speakerLabels props. */
  name?: string;
}

export interface Transcript {
  durationMs: number;
  speakers?: Speaker[];
  words: TranscriptWord[];
  segments?: TranscriptSegment[];
}

/**
 * An editable word that references the original transcript word.
 * Used in the edited timeline to track deletions and reordering.
 */
export interface EditableWord {
  /** Reference to original word in transcript.words */
  originalIndex: number;
  /** The word data (from original transcript) */
  word: TranscriptWord;
  /** Whether this word is marked as deleted */
  deleted: boolean;
  /** Whether this word was inserted (pasted from clipboard) */
  inserted?: boolean;
}

/**
 * Represents a contiguous segment of playback from the original media.
 * Used when playing back an edited timeline with potentially reordered/deleted words.
 */
export interface PlaybackSegment {
  startMs: number;
  endMs: number;
  /** Indices into the editedWords array that this segment covers */
  editedIndices: number[];
}

/** Available playback speed multipliers */
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

/** Array of all available speed options for dropdowns */
export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [
  0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
];

/**
 * A speed marker applied to a word in the transcript.
 * The speed applies from this word until the next speed marker or end of transcript.
 */
export interface SpeedMarker {
  /** Index in the editedWords array where the speed marker is placed */
  wordIndex: number;
  /** The playback speed multiplier */
  speed: PlaybackSpeed;
}
