import type { Transcript } from '../../TranscriptView/transcript';

/**
 * Applies a reviewer's speaker corrections to a diarized transcript.
 *
 * - `names` renames speakers by id; speakers that end up with the same name are merged into the
 *   first of them, across segments, words, overlap and activity.
 * - `lineSpeaker` moves a segment (by index) and its words to another speaker. Activity is left as
 *   the diarizer heard it.
 */
export function applySpeakerEdits(
  transcript: Transcript,
  names: Readonly<Record<string, string>>,
  lineSpeaker: Readonly<Record<number, string>>
): Transcript {
  const speakers = transcript.speakers ?? [];
  const nameOf = (id: string) =>
    names[id]?.trim() || speakers.find((s) => s.id === id)?.name || id;
  const canonical = new Map<string, string>();
  const firstWithName = new Map<string, string>();
  for (const { id } of speakers) {
    const name = nameOf(id);
    if (!firstWithName.has(name)) firstWithName.set(name, id);
    canonical.set(id, firstWithName.get(name) ?? id);
  }
  const idOf = (id: string) => canonical.get(id) ?? id;

  const segments = transcript.segments?.map((segment, i) => {
    const speakerId = idOf(lineSpeaker[i] ?? segment.speakerId ?? '');
    const overlap = [
      ...new Set((segment.overlapSpeakerIds ?? []).map(idOf)),
    ].filter((id) => id !== speakerId);
    return {
      text: segment.text,
      startMs: segment.startMs,
      endMs: segment.endMs,
      speakerId,
      words: segment.words.map((w) => ({ ...w, speakerId })),
      ...(overlap.length ? { overlapSpeakerIds: overlap } : {}),
    };
  });

  return {
    ...transcript,
    speakers: [...firstWithName].map(([name, id]) => ({ id, name })),
    segments,
    words: segments
      ? segments.flatMap((s) => s.words)
      : transcript.words.map((w) =>
          w.speakerId ? { ...w, speakerId: idOf(w.speakerId) } : w
        ),
    speakerActivity: transcript.speakerActivity?.map((a) => ({
      ...a,
      speakerId: idOf(a.speakerId),
    })),
  };
}
