/**
 * useVoiceSetup — headless controller for on-device voice enrollment (the "set up your voice" flow).
 *
 * One guided pass builds BOTH prints per phrase: the speaker (WHO) centroid via `useSpeakerVerify`, and
 * the phrase (WHAT) templates via the wake model's embedding — each rep phrase-validated by the wake
 * detector firing (the fire IS proof they said the phrase). WHAT prints persist via the shared
 * voiceprint store; WHO prints persist inside the speaker runtime. Everything on-device.
 *
 * The matching `<VoiceSetup>` component renders the octopus UI over this hook; a host can also drive a
 * custom enrollment UI from the returned state.
 */
import * as React from 'react';
import { useSpeakerVerify } from './SpeakerVerify/useSpeakerVerify';
import { useWakeWord } from './WakeWord/useWakeWord';
import { warmWhisper } from '../whisperTranscribe';
import { loadWhatPrints, saveWhatPrints } from '../voiceprintStore';
import { openRollingRecorder, chime, type RollingRecorder } from './audio';

export type VoiceSetupPhase = 'intro' | 'getready' | 'speak' | 'gotit' | 'deny' | 'done';

const PHRASES = [
  { key: 'hey-ozwell', label: 'hey ozwell' },
  { key: "ozwell-i'm-done", label: "ozwell I'm done" },
];
const REPS = 3;
const TIMEOUT_MS = 5000;
const VP_CAP = 18;
const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export interface UseVoiceSetupResult {
  /** Both the speaker runtime and wake detector are loaded — enrollment can start. */
  ready: boolean;
  error: string | null;
  phase: VoiceSetupPhase;
  /** The phrase currently being captured (human label). */
  phrase: string;
  /** Reps captured so far (0..total). */
  step: number;
  /** Total reps across all phrases (PHRASES × REPS). */
  total: number;
  /** This pass appends a new condition (room/distance) instead of replacing. */
  adding: boolean;
  /** Room volume 0..1 for the octopus pulse while enrolling. */
  level: number;
  /** Begin the guided enrollment pass (no-op until ready / already running). */
  start: () => void;
  /** After "done", start another appended pass (a new room / distance / background). */
  addAnotherSpot: () => void;
}

export function useVoiceSetup(): UseVoiceSetupResult {
  const sv = useSpeakerVerify();
  const expectRef = React.useRef<string | null>(null);
  const resolveRef = React.useRef<((n: string) => void) | null>(null);
  const whatRef = React.useRef<Record<string, Float32Array[]>>({});
  const recRef = React.useRef<RollingRecorder | null>(null);
  const [level, setLevel] = React.useState(0);

  const wake = useWakeWord({
    onWake: (name) => {
      if (expectRef.current && resolveRef.current) resolveRef.current(name);
    },
  });
  const wakeRef = React.useRef(wake);
  wakeRef.current = wake;
  const bothReady = sv.ready && wake.ready;

  const [phase, setPhase] = React.useState<VoiceSetupPhase>('intro');
  const [phrase, setPhrase] = React.useState('hey ozwell');
  const [step, setStep] = React.useState(0);
  const [adding, setAdding] = React.useState(false);
  const total = PHRASES.length * REPS;

  // Preload the dictation model while enrolling (it gets the ~30s pass as a head start), and restore any
  // persisted WHAT templates so "Add another spot" appends across reloads.
  React.useEffect(() => {
    warmWhisper();
    void loadWhatPrints().then((w) => {
      whatRef.current = w;
    });
  }, []);

  // Rolling recorder (for the enrollment clips) + a room-volume analyser for the octopus pulse — both as
  // second consumers of the detector's shared stream (no extra getUserMedia).
  React.useEffect(() => {
    if (!wake.ready) {
      setLevel(0);
      return;
    }
    let raf = 0;
    let ctx: AudioContext | null = null;
    let cancelled = false;
    let tries = 0;
    let smooth = 0;
    const start = () => {
      if (cancelled) return;
      const stream = wakeRef.current.getStream();
      if (!stream) {
        if (tries++ < 40) window.setTimeout(start, 300);
        return;
      }
      if (!recRef.current) recRef.current = openRollingRecorder(stream);
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctx();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const data = new Float32Array(an.fftSize);
      const tick = () => {
        an.getFloatTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
          const a = Math.abs(data[i]);
          if (a > peak) peak = a;
        }
        smooth = smooth * 0.78 + peak * 0.22;
        setLevel(smooth);
        raf = requestAnimationFrame(tick);
      };
      tick();
    };
    start();
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      void ctx?.close();
      recRef.current?.close();
      recRef.current = null;
    };
  }, [wake.ready]);

  const awaitWake = (expect: string): Promise<{ fired?: string; timeout?: boolean }> => {
    expectRef.current = expect;
    return new Promise((resolve) => {
      const t = window.setTimeout(() => {
        if (resolveRef.current) {
          resolveRef.current = null;
          expectRef.current = null;
          resolve({ timeout: true });
        }
      }, TIMEOUT_MS);
      resolveRef.current = (n) => {
        window.clearTimeout(t);
        expectRef.current = null;
        resolveRef.current = null;
        resolve({ fired: n });
      };
    });
  };

  const start = React.useCallback(async () => {
    if (!bothReady || phase !== 'intro' || !recRef.current) return;
    const append = adding;
    let overall = 0;
    for (const ph of PHRASES) {
      const clips: { samples: Float32Array; sampleRate: number }[] = [];
      const embs: Float32Array[] = [];
      setPhrase(ph.label);
      while (clips.length < REPS) {
        setStep(overall);
        setPhase('getready');
        chime(660);
        await delay(550);
        setPhase('speak');
        const w = await awaitWake(ph.key);
        const rec = recRef.current;
        if (!rec) break;
        const samples = rec.snapshot();
        const emb = wakeRef.current.getLastEmbedding();
        if (w.fired === ph.key) {
          clips.push({ samples, sampleRate: rec.sampleRate });
          if (emb) embs.push(emb);
          chime(990);
          setPhase('gotit');
          overall++;
          setStep(overall);
          await delay(750);
        } else {
          setPhase('deny');
          await delay(1500);
        }
      }
      // append keeps prior conditions: WHO adds a new centroid, WHAT concatenates templates (capped).
      sv.enroll(ph.key, clips, { append });
      const prior = append ? whatRef.current[ph.key] || [] : [];
      const merged = [...prior, ...embs].slice(-VP_CAP);
      whatRef.current[ph.key] = merged;
      wakeRef.current.setVoiceprint(ph.key, merged);
    }
    void saveWhatPrints(whatRef.current);
    setAdding(false);
    setPhase('done');
  }, [bothReady, phase, adding, sv]);

  const addAnotherSpot = React.useCallback(() => {
    setAdding(true);
    setPhase('intro');
  }, []);

  return {
    ready: bothReady,
    error: sv.error || wake.error,
    phase,
    phrase,
    step,
    total,
    adding,
    level,
    start: () => void start(),
    addAnotherSpot,
  };
}
