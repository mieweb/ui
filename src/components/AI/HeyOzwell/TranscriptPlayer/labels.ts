/** Every user-facing string in TranscriptPlayer, so hosts can translate them. */
export interface TranscriptPlayerLabels {
  recording: string;
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  volume: string;
  playbackSpeed: string;
  fullScreen: string;
  exitFullScreen: string;
  seek: string;
  zoomIn: string;
  zoomOut: string;
  followPlayback: string;
  earlier: string;
  later: string;
  visibleWindow: string;
  noRecording: string;
  loadError: string;
  playError: string;
  noActivity: string;
  allSpeakersHidden: string;
  transcript: string;
  searchTranscript: string;
  searchPlaceholder: string;
  showSpeakers: string;
  allSpeakers: string;
  someSpeakers: string;
  noTranscript: string;
  noMatches: string;
  noWords: string;
  backToCurrent: string;
  speakers: string;
  noSpeakers: string;
  overlapNote: string;
  hint: string;
  unknownSpeaker: string;
  /** Accessible name of a speaker's lane. */
  speakingTurns: (speaker: string) => string;
  /** A lane segment; times arrive formatted. */
  segment: (
    speaker: string,
    start: string,
    end: string,
    length: string
  ) => string;
  playSegment: (segment: string) => string;
  playLine: (speaker: string, time: string) => string;
  playingLine: (speaker: string, time: string) => string;
  overlapWith: (speakers: string) => string;
  seekValue: (current: string, total: string) => string;
  windowValue: (start: string, end: string) => string;
}

export const DEFAULT_TRANSCRIPT_PLAYER_LABELS: TranscriptPlayerLabels = {
  recording: 'Recording',
  play: 'Play',
  pause: 'Pause',
  mute: 'Mute',
  unmute: 'Unmute',
  volume: 'Volume',
  playbackSpeed: 'Playback speed',
  fullScreen: 'Full screen',
  exitFullScreen: 'Exit full screen',
  seek: 'Seek',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  followPlayback: 'Follow playback',
  earlier: 'Earlier',
  later: 'Later',
  visibleWindow: 'Visible part of the recording',
  noRecording: 'No recording available.',
  loadError: 'The recording could not be loaded.',
  playError: 'Playback failed.',
  noActivity: 'No speaker activity.',
  allSpeakersHidden: 'All speakers are hidden.',
  transcript: 'Transcript',
  searchTranscript: 'Search transcript',
  searchPlaceholder: 'Search transcript…',
  showSpeakers: 'Show speakers',
  allSpeakers: 'All speakers',
  someSpeakers: 'Some speakers',
  noTranscript: 'No transcript for this recording.',
  noMatches: 'No lines match the search or speaker filter.',
  noWords: '(no words)',
  backToCurrent: 'Back to current',
  speakers: 'Speakers',
  noSpeakers: 'No speakers detected.',
  overlapNote:
    'People talked over each other, so shares can add up to more than 100%.',
  hint: 'Hover a coloured segment for details, then click it (or a transcript line) to play just that part. Drag the box in the overview to move through long recordings.',
  unknownSpeaker: 'Unknown speaker',
  speakingTurns: (speaker) => `${speaker} speaking turns`,
  segment: (speaker, start, end, length) =>
    `${speaker}, ${start} to ${end} (${length})`,
  playSegment: (segment) => `Play ${segment}`,
  playLine: (speaker, time) => `Play ${speaker} at ${time}`,
  playingLine: (speaker, time) => `Playing ${speaker} at ${time}`,
  overlapWith: (speakers) => `Overlaps ${speakers}`,
  seekValue: (current, total) => `${current} of ${total}`,
  windowValue: (start, end) => `${start} to ${end}`,
};
