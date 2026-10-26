/**
 * Storybook-only demo recordings for TranscriptPlayer. Each speaker gets their own pitch, mixed
 * where they overlap, so playing a segment is audibly that speaker. Not exported from the package.
 */
import type {
  SpeakerActivity,
  Transcript,
  TranscriptSegment,
  TranscriptWord,
} from '../../../TranscriptView/transcript';
import { computePeaks, type WaveformPeaks } from './peaks';

const SAMPLE_RATE = 8000;
const PITCHES = [160, 230, 310, 190, 270, 350, 140, 400];
const NAMES = [
  'Dr. Smith',
  'Patient',
  'Caregiver',
  'Nurse',
  'Interpreter',
  'Resident',
  'Pharmacist',
  'Therapist',
];
const LINES = [
  'How has the knee been this week?',
  'A bit better, but it still hurts on the stairs.',
  'She has been limping since Tuesday.',
  'Any swelling or warmth around the joint?',
  'Yes, a little in the evenings after walking.',
  'Are you still taking the ibuprofen twice a day?',
  'Only in the morning, it upsets my stomach.',
  'Let me check your range of motion now.',
  'Does it hurt when I bend it like this?',
  'Only at the very end, a sharp pain on the inside.',
  'We will get an X-ray before you leave today.',
  'Should she keep icing it at night?',
  'Twenty minutes at a time is fine.',
  'I will send the referral to physical therapy.',
  'Can we do the appointments on Fridays?',
];

export interface DemoRecording {
  src: string;
  transcript: Transcript;
  peaks?: WaveformPeaks;
}

interface Turn {
  speaker: number;
  start: number;
  end: number;
  /** Backchannels ("mm-hm") are heard and diarized but have no transcript words. */
  text?: string;
}

/** Deterministic so stories render the same every time. */
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function words(text: string, start: number, end: number, speakerId: string) {
  const tokens = text.split(' ');
  const step = (end - start) / tokens.length;
  return tokens.map<TranscriptWord>((t, i) => ({
    text: t,
    startMs: Math.round((start + i * step) * 1000),
    endMs: Math.round((start + (i + 1) * step) * 1000),
    speakerId,
  }));
}

function render(turns: readonly Turn[], duration: number): Int16Array {
  const pcm = new Int16Array(Math.ceil(duration * SAMPLE_RATE));
  for (const turn of turns) {
    const pitch = PITCHES[turn.speaker % PITCHES.length];
    const from = Math.floor(turn.start * SAMPLE_RATE);
    const to = Math.min(pcm.length, Math.floor(turn.end * SAMPLE_RATE));
    for (let i = from; i < to; i++) {
      const t = i / SAMPLE_RATE;
      const edge = Math.min(1, (t - turn.start) * 50, (turn.end - t) * 50);
      const syllables = 0.55 + 0.45 * Math.sin(2 * Math.PI * 4.5 * t);
      const tone =
        Math.sin(2 * Math.PI * pitch * t) +
        0.4 * Math.sin(2 * Math.PI * pitch * 2 * t);
      const value = pcm[i] + edge * syllables * tone * 6000;
      pcm[i] = Math.max(-32768, Math.min(32767, value));
    }
  }
  return pcm;
}

function wavUrl(pcm: Int16Array): string {
  const header = new DataView(new ArrayBuffer(44));
  const ascii = (offset: number, text: string) =>
    [...text].forEach((c, i) => header.setUint8(offset + i, c.charCodeAt(0)));
  ascii(0, 'RIFF');
  header.setUint32(4, 36 + pcm.byteLength, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, 1, true);
  header.setUint32(24, SAMPLE_RATE, true);
  header.setUint32(28, SAMPLE_RATE * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  ascii(36, 'data');
  header.setUint32(40, pcm.byteLength, true);
  return URL.createObjectURL(
    new Blob([header.buffer, pcm.buffer as ArrayBuffer], { type: 'audio/wav' })
  );
}

/** Builds audio, peaks and a diarized transcript from turns. The caller revokes `src`. */
export function buildRecording(
  turns: readonly Turn[],
  speakerCount: number,
  duration: number
): DemoRecording {
  const ids = Array.from({ length: speakerCount }, (_, i) => `spk${i}`);
  const segments: TranscriptSegment[] = turns
    .filter((t) => t.text)
    .map((t) => {
      const speakerId = ids[t.speaker];
      const overlapSpeakerIds = [
        ...new Set(
          turns
            .filter(
              (o) =>
                o.speaker !== t.speaker && o.start < t.end && o.end > t.start
            )
            .map((o) => ids[o.speaker])
        ),
      ];
      return {
        text: t.text ?? '',
        startMs: Math.round(t.start * 1000),
        endMs: Math.round(t.end * 1000),
        speakerId,
        words: words(t.text ?? '', t.start, t.end, speakerId),
        ...(overlapSpeakerIds.length ? { overlapSpeakerIds } : {}),
      };
    });
  const speakerActivity: SpeakerActivity[] = turns.map((t) => ({
    speakerId: ids[t.speaker],
    startMs: Math.round(t.start * 1000),
    endMs: Math.round(t.end * 1000),
  }));
  const pcm = render(turns, duration);
  return {
    src: wavUrl(pcm),
    peaks: computePeaks(pcm, SAMPLE_RATE),
    transcript: {
      durationMs: Math.round(duration * 1000),
      speakers: ids.map((id, i) => ({ id, name: NAMES[i % NAMES.length] })),
      segments,
      words: segments.flatMap((s) => s.words),
      speakerActivity,
    },
  };
}

/**
 * A plausible visit: alternating turns of 2–9 s, some overlap (`overlapRate`) and short
 * backchannels with no words, mostly between the first two speakers.
 */
export function conversation({
  duration,
  speakers,
  seed = 7,
  overlapRate = 0.12,
  pace = 1,
}: {
  duration: number;
  speakers: number;
  seed?: number;
  overlapRate?: number;
  /** Below 1 makes turns shorter, so there are more transcript lines. */
  pace?: number;
}): DemoRecording {
  const next = random(seed);
  const turns: Turn[] = [];
  let t = 0.4;
  let speaker = 0;
  while (t < duration - 1) {
    const length = Math.min((2 + next() * 7) * pace, duration - t - 0.2);
    if (length < 0.6) break;
    turns.push({
      speaker,
      start: t,
      end: t + length,
      text: LINES[Math.floor(next() * LINES.length)],
    });
    if (next() < overlapRate) {
      const other =
        (speaker + 1 + Math.floor(next() * (speakers - 1))) % speakers;
      const start = t + length * (0.5 + next() * 0.3);
      turns.push({
        speaker: other,
        start,
        end: Math.min(duration - 0.1, start + 1 + next() * 2),
        text:
          next() < 0.5 ? LINES[Math.floor(next() * LINES.length)] : undefined,
      });
    }
    t += length + 0.2 + next() * 0.8;
    speaker =
      speakers === 1
        ? 0
        : next() < 0.7
          ? (speaker + 1) % Math.min(2, speakers)
          : Math.floor(next() * speakers);
  }
  turns.sort((a, b) => a.start - b.start);
  return buildRecording(turns, speakers, duration);
}

/** The 10-second example: a clear overlap at 5.0–5.6 s and an "mm-hm" at 8 s with no words. */
export function shortVisit(): DemoRecording {
  return buildRecording(
    [
      { speaker: 0, start: 0.3, end: 2.4, text: LINES[0] },
      { speaker: 1, start: 2.6, end: 5.6, text: LINES[1] },
      { speaker: 2, start: 5.0, end: 6.2, text: LINES[2] },
      { speaker: 0, start: 6.6, end: 9.6, text: LINES[7] },
      { speaker: 1, start: 8.0, end: 8.4 },
    ],
    3,
    10
  );
}
