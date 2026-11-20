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
  timelineFromFrames,
  transcriptFromFrames,
  type LaneFrames,
  type SpeakerTimeline,
} from './nemotron/attribution';
import { MODEL_REVISION } from './nemotron/modelConfig';
import {
  defaultNemotronModel,
  enrollNemotron,
  listenNemotron,
  runNemotron,
  type NemotronListener,
  type NemotronModel,
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
  /** Variant and backend. Default `defaultNemotronModel()`: fp32 on WebGPU on desktops with a GPU, else int8 on WASM. */
  model?: NemotronModel;
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
  /** Call with the recorder's pause and resume, so the labels' times match the recorded audio. */
  pause: () => void;
  resume: () => void;
}

interface LiveSession extends LiveDiarization {
  listener: NemotronListener;
  names: string[];
  namespace: string | undefined;
  /** The stored voices had loaded when listening began, so `names` is the full enrolled list. */
  hydrated: boolean;
}

export interface UseNemotronDiarizationResult {
  /** The model in use; null for a moment while the device default is picked. */
  model: NemotronModel | null;
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
  /**
   * Stops `live` and returns who spoke when, without transcribing, for a host that has its own word
   * timestamps; pair with `transcriptFromActivity`.
   */
  finish: (live: LiveDiarization) => Promise<SpeakerTimeline>;
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

/** `model` when given, else this device's default once it has been picked (null until then). */
export function useNemotronModel(model?: NemotronModel): NemotronModel | null {
  const [device, setDevice] = React.useState<NemotronModel | null>(null);
  const explicit = model !== undefined;
  React.useEffect(() => {
    if (explicit) return;
    let cancelled = false;
    void defaultNemotronModel().then((picked) => {
      if (!cancelled) setDevice(picked);
    });
    return () => {
      cancelled = true;
    };
  }, [explicit]);
  return model ?? device;
}

export function useNemotronDiarization({
  model: modelOption,
  voiceprintNamespace,
}: UseNemotronDiarizationOptions = {}): UseNemotronDiarizationResult {
  const model = useNemotronModel(modelOption);
  const variant = model?.variant;
  const executionProvider = model?.executionProvider;
  const [prints, setPrints] = React.useState<NemotronVoiceprint[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [stage, setStage] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<NemotronDiarization | null>(null);

  const printsRef = React.useRef(prints);
  printsRef.current = prints;
  const nsRef = React.useRef(voiceprintNamespace);
  nsRef.current = voiceprintNamespace;
  /** The current namespace's stored voices; every task waits for it before reading `printsRef`. */
  const loadRef = React.useRef<Promise<void> | null>(null);
  const hydratedRef = React.useRef(false);

  // Another user's voices and transcript must not linger after a namespace switch.
  React.useEffect(() => {
    let cancelled = false;
    printsRef.current = [];
    hydratedRef.current = false;
    setPrints([]);
    setResult(null);
    const load = loadNemotronVoiceprints(voiceprintNamespace).then((loaded) => {
      if (cancelled) return;
      printsRef.current = loaded;
      hydratedRef.current = true;
      setPrints(loaded);
    });
    loadRef.current = load;
    load.catch((e: unknown) => {
      if (!cancelled) setError(messageOf(e));
    });
    return () => {
      cancelled = true;
    };
  }, [voiceprintNamespace]);

  const track = React.useCallback(
    async <T>(
      task: (assertNamespace: () => void) => Promise<T>
    ): Promise<T> => {
      const passNamespace = nsRef.current;
      const assertNamespace = () => {
        if (nsRef.current !== passNamespace)
          throw new Error('Voiceprint namespace changed during processing');
      };
      setBusy(true);
      setError(null);
      try {
        // A save before the stored voices load would overwrite them; diarize would omit them.
        await loadRef.current;
        assertNamespace();
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

  /** Settings for a pass with the enrolled voices this model can use. */
  const nemotronOptions = React.useCallback(() => {
    if (!variant || !executionProvider)
      throw new Error('The speaker model is still being chosen; try again');
    const enrolled = printsRef.current.filter((p) => isUsableWith(p, variant));
    return {
      variant,
      names: enrolled.map((p) => p.name),
      options: {
        variant,
        executionProvider,
        streamingMode: 'offline' as const,
        voiceprints: enrolled.map((p) => p.embeds),
      },
    };
  }, [variant, executionProvider]);

  const enroll = React.useCallback(
    (name: string, blob: Blob) =>
      track(async (assertNamespace) => {
        const label = name.trim();
        if (!label) throw new Error('Enter a name for the voice');
        const { variant, names, options } = nemotronOptions();
        if (names.filter((n) => n !== label).length >= MAX_VOICES)
          throw new Error(`At most ${MAX_VOICES} voices can be enrolled`);

        setStage('Decoding audio');
        const samples = await decodeTo16kMono(blob);
        if (samples.length < MIN_ENROLL_SECONDS * SR)
          throw new Error(
            `Record at least ${MIN_ENROLL_SECONDS} seconds of one person talking`
          );
        const embeds = await enrollNemotron(
          samples,
          {
            variant,
            executionProvider: options.executionProvider,
            streamingMode: options.streamingMode,
          },
          setStage
        );
        if (!embeds)
          throw new Error(
            'No clear voice in the sample; record one person talking'
          );

        assertNamespace();
        const next = [
          ...printsRef.current.filter((p) => p.name !== label),
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
    [track, nemotronOptions]
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

  const listen = React.useCallback(
    (stream: MediaStream): LiveDiarization => {
      const { names, options } = nemotronOptions();
      const listener = listenNemotron(stream, options);
      const session: LiveSession = {
        listener,
        names,
        namespace: nsRef.current,
        hydrated: hydratedRef.current,
        cancel: listener.cancel,
        pause: listener.pause,
        resume: listener.resume,
      };
      return session;
    },
    [nemotronOptions]
  );

  /** The live labels when they belong to this user, used every enrolled voice and finished, else a
   *  fresh pass over `samples` (run after the stored voices load). */
  const labelSpeakers = React.useCallback(
    async (
      samples: Float32Array,
      live: LiveDiarization | undefined
    ): Promise<{ frames: LaneFrames; names: string[] }> => {
      const session = live as LiveSession | undefined;
      if (session && session.hydrated && session.namespace === nsRef.current) {
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

  const finish = React.useCallback(
    (live: LiveDiarization) => {
      const session = live as LiveSession;
      // Stop now, not after `track` waits for the stored voices: the host's recorder has already
      // stopped, and a failed voice load must not leave the listener running.
      const stopping =
        session.namespace === nsRef.current ? session.listener.stop() : null;
      if (stopping) stopping.catch(() => {});
      else session.cancel();
      return track(async (assertNamespace) => {
        if (!stopping)
          throw new Error('Voiceprint namespace changed during processing');
        const frames = await stopping;
        assertNamespace();
        return timelineFromFrames(
          frames,
          laneNames(frames, session.names),
          frames.numFrames * frames.frameDurationSeconds
        );
      });
    },
    [track]
  );

  const voices = React.useMemo(
    () =>
      prints.map((p) => ({
        name: p.name,
        usable: !variant || isUsableWith(p, variant),
      })),
    [prints, variant]
  );

  return {
    model,
    voices,
    busy,
    stage,
    error,
    result,
    enroll,
    removeVoice,
    listen,
    diarize,
    finish,
  };
}
