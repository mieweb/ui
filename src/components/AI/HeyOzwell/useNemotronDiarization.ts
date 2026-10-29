/**
 * useNemotronDiarization: on-device "who spoke when" with Nemotron 3 Diarization (mieweb/ui#492).
 *
 * Whisper word timestamps + Nemotron lane activity → a diarized `Transcript` (with overlap), ready for
 * `TranscriptPlayer`. Enrolled people are named by pre-filling Nemotron's speaker cache with their
 * stored voiceprints, so TitaNet is not used. Experimental; the supported path is `useDiarization`.
 */
import * as React from 'react';
import type { Transcript } from '../../TranscriptView/transcript';
import type { TranscriptSegment } from '../diarize';
import {
  decodeTo16kMono,
  transcribeSegmentsFromSamples,
  transcribeWordsFromSamples,
} from '../whisperTranscribe';
import {
  laneNames,
  transcriptFromFrames,
  type LaneFrames,
} from './nemotron/attribution';
import {
  MODEL_REVISION,
  type ExecutionProvider,
  type ModelVariant,
} from './nemotron/modelConfig';
import {
  enrollNemotron,
  listenNemotron,
  runNemotron,
  type NemotronListener,
} from './nemotron/runNemotron';
import {
  isUsableWith,
  loadNemotronVoiceprints,
  saveNemotronVoiceprints,
  type NemotronVoiceprint,
} from './nemotron/voiceprints';
import { computePeaks, type WaveformPeaks } from './TranscriptPlayer/peaks';

const SR = 16000;
/** Long enough for the sample to pass Nemotron's FIFO queue into its speaker cache. */
export const MIN_ENROLL_SECONDS = 5;
/** Nemotron has 8 lanes; one stays free so unenrolled people still get their own. */
const MAX_VOICES = 7;

export interface UseNemotronDiarizationOptions {
  /** Model weights. Default `model_quantized` (int8, ~121 MB). */
  variant?: ModelVariant;
  /** Default `wasm`. On `webgpu` only `model` (fp32) gives correct output. */
  executionProvider?: ExecutionProvider;
  /** Isolates enrolled voices per user, as in `useDiarization`. Omit for the unscoped store. */
  voiceprintNamespace?: string;
}

export interface NemotronVoice {
  name: string;
  /** False when enrolled with another model variant or revision; re-enroll to use it. */
  usable: boolean;
}

export interface NemotronDiarization {
  /** Speakers are Nemotron lanes (`lane-N`), named after enrolled voices or "Speaker N". */
  transcript: Transcript;
  /** Waveform of the analysed clip, so `TranscriptPlayer` need not decode it again. */
  peaks: WaveformPeaks;
}

/** Speaker labels being worked out while a clip records; see `listen`. */
export interface LiveDiarization {
  /** Stops listening without using the result, e.g. when the recording is abandoned. */
  cancel: () => void;
}

interface LiveSession extends LiveDiarization {
  listener: NemotronListener;
  names: string[];
  namespace: string | undefined;
}

export interface UseNemotronDiarizationResult {
  voices: NemotronVoice[];
  busy: boolean;
  /** Current step while busy, e.g. "Downloading model". */
  stage: string;
  error: string | null;
  result: NemotronDiarization | null;
  /** Enroll (or replace) a voice from a one-speaker sample of at least `MIN_ENROLL_SECONDS`. */
  enroll: (name: string, blob: Blob) => Promise<void>;
  removeVoice: (name: string) => Promise<void>;
  /** Starts labelling speakers while `stream` records; pass the result to `diarize` with the clip. */
  listen: (stream: MediaStream) => LiveDiarization;
  /** Labels `blob`. With `live` from `listen` on the same recording, its finished labels are used. */
  diarize: (blob: Blob, live?: LiveDiarization) => Promise<NemotronDiarization>;
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Word timestamps when the Whisper runtime supports them, else segment timestamps. */
async function transcribe(samples: Float32Array): Promise<TranscriptSegment[]> {
  try {
    return await transcribeWordsFromSamples(samples.slice());
  } catch {
    return transcribeSegmentsFromSamples(samples.slice());
  }
}

export function useNemotronDiarization({
  variant = 'model_quantized',
  executionProvider = 'wasm',
  voiceprintNamespace,
}: UseNemotronDiarizationOptions = {}): UseNemotronDiarizationResult {
  const [prints, setPrints] = React.useState<NemotronVoiceprint[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [stage, setStage] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<NemotronDiarization | null>(null);

  const printsRef = React.useRef(prints);
  printsRef.current = prints;
  const nsRef = React.useRef(voiceprintNamespace);
  nsRef.current = voiceprintNamespace;

  // Another user's voices and transcript must not linger after a namespace switch.
  React.useEffect(() => {
    let cancelled = false;
    setPrints([]);
    setResult(null);
    loadNemotronVoiceprints(voiceprintNamespace).then(
      (loaded) => {
        if (!cancelled) setPrints(loaded);
      },
      (e: unknown) => {
        if (!cancelled) setError(messageOf(e));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [voiceprintNamespace]);

  const track = React.useCallback(
    async <T>(task: (assertNamespace: () => void) => Promise<T>) => {
      const passNamespace = nsRef.current;
      const assertNamespace = () => {
        if (nsRef.current !== passNamespace)
          throw new Error('Voiceprint namespace changed during processing');
      };
      setBusy(true);
      setError(null);
      try {
        return await task(assertNamespace);
      } catch (e) {
        setError(messageOf(e));
        throw e;
      } finally {
        setBusy(false);
        setStage('');
      }
    },
    []
  );

  const enroll = React.useCallback(
    (name: string, blob: Blob) =>
      track(async (assertNamespace) => {
        const label = name.trim();
        if (!label) throw new Error('Enter a name for the voice');
        const others = printsRef.current.filter((p) => p.name !== label);
        if (others.filter((p) => isUsableWith(p, variant)).length >= MAX_VOICES)
          throw new Error(`At most ${MAX_VOICES} voices can be enrolled`);

        setStage('Decoding audio');
        const samples = await decodeTo16kMono(blob);
        if (samples.length < MIN_ENROLL_SECONDS * SR)
          throw new Error(
            `Record at least ${MIN_ENROLL_SECONDS} seconds of one person talking`
          );
        const embeds = await enrollNemotron(
          samples,
          { variant, executionProvider, streamingMode: 'offline' },
          setStage
        );
        if (!embeds)
          throw new Error(
            'No clear voice in the sample; record one person talking'
          );

        assertNamespace();
        const next = [
          ...others,
          {
            name: label,
            modelRevision: MODEL_REVISION,
            variant,
            embeds,
            createdAt: Date.now(),
          },
        ];
        await saveNemotronVoiceprints(next, nsRef.current);
        assertNamespace();
        setPrints(next);
      }),
    [track, variant, executionProvider]
  );

  const removeVoice = React.useCallback(
    (name: string) =>
      track(async (assertNamespace) => {
        const next = printsRef.current.filter((p) => p.name !== name);
        await saveNemotronVoiceprints(next, nsRef.current);
        assertNamespace();
        setPrints(next);
      }),
    [track]
  );

  const nemotronOptions = React.useCallback(() => {
    const enrolled = printsRef.current.filter((p) => isUsableWith(p, variant));
    return {
      names: enrolled.map((p) => p.name),
      options: {
        variant,
        executionProvider,
        streamingMode: 'offline' as const,
        voiceprints: enrolled.map((p) => p.embeds),
      },
    };
  }, [variant, executionProvider]);

  const listen = React.useCallback(
    (stream: MediaStream): LiveDiarization => {
      const { names, options } = nemotronOptions();
      const listener = listenNemotron(stream, options);
      const session: LiveSession = {
        listener,
        names,
        namespace: nsRef.current,
        cancel: listener.cancel,
      };
      return session;
    },
    [nemotronOptions]
  );

  /** The live labels when they belong to this user and finished, else a fresh pass over `samples`. */
  const labelSpeakers = React.useCallback(
    async (
      samples: Float32Array,
      live: LiveDiarization | undefined
    ): Promise<{ frames: LaneFrames; names: string[] }> => {
      const session = live as LiveSession | undefined;
      if (session && session.namespace === nsRef.current) {
        const frames = await session.listener.stop().catch(() => null);
        if (frames) return { frames, names: session.names };
      } else {
        session?.cancel();
      }
      const { names, options } = nemotronOptions();
      return {
        frames: await runNemotron(samples, options, setStage),
        names,
      };
    },
    [nemotronOptions]
  );

  const diarize = React.useCallback(
    (blob: Blob, live?: LiveDiarization) =>
      track(async (assertNamespace) => {
        setStage('Decoding audio');
        const samples = await decodeTo16kMono(blob);
        const [words, { frames, names: enrolled }] = await Promise.all([
          transcribe(samples),
          labelSpeakers(samples, live),
        ]);
        assertNamespace();

        const names = laneNames(frames, enrolled);
        const out: NemotronDiarization = {
          transcript: transcriptFromFrames(
            words,
            frames,
            names,
            samples.length / SR
          ),
          peaks: computePeaks(samples, SR),
        };
        setResult(out);
        return out;
      }),
    [track, labelSpeakers]
  );

  const voices = React.useMemo(
    () =>
      prints.map((p) => ({ name: p.name, usable: isUsableWith(p, variant) })),
    [prints, variant]
  );

  return {
    voices,
    busy,
    stage,
    error,
    result,
    enroll,
    removeVoice,
    listen,
    diarize,
  };
}
