/**
 * useHeyOzwell — the headless controller for the Hey Ozwell voice entry point (mieweb/ui#287).
 *
 * Owns the whole wake → open-chat → dictate → transcribe → send state machine, model warming, and
 * transcription routing that used to live (and be re-implemented by each host) inside the Storybook
 * Demo. It returns ready-made prop bundles so a host can compose <HeyOzwellToggle>,
 * <OzwellSettingsMenu> and <FloatingAIChat> wherever its own layout needs them. The <HeyOzwell>
 * drop-in is a thin wrapper over this hook.
 *
 * One shared mic; audio never leaves the page unless `transcription: 'server'`.
 */
import * as React from 'react';
import type { AIMessage } from '../types';
import type { ModelStatus, ModelStatusKey } from './modelManifest';
import {
  useWakeWord,
  warmWakeModels,
  subscribeWakeWarm,
  getWakeWarm,
} from './WakeWord/useWakeWord';
import {
  transcribeBlob,
  transcribeServer,
  transcribeSamples,
  stripStopPhrase,
  trimTrailingStopPhrase,
  warmWhisper,
  subscribeDictationLoad,
  getDictationLoad,
} from '../whisperTranscribe';
import {
  askOzwellStream,
  isOzwellConfigured,
  toOzwellMessages,
} from '../ozwellChat';
import { useSpeakerVerify } from './SpeakerVerify/useSpeakerVerify';
import { useDiarization, type UseDiarizationOptions } from './useDiarization';
import { loadWhatPrints } from '../voiceprintStore';
import { openRollingRecorder, type RollingRecorder } from './audio';

export type HeyOzwellPhase = 'listening' | 'dictating' | 'transcribing';

// Per-phrase WHAT (phrase-print cosine) gate. Stop is a touch looser (0.75): the run-on
// "…ozwell I'm done" at the dictation tail embeds slightly differently from the isolated enrolled
// one, so it lands lower than the clean start phrase. Mirrors the hands-free gate.
const WHAT_THRESHOLDS: Record<string, number> = { 'hey-ozwell': 0.8, "ozwell-i'm-done": 0.75 };
const whatThr = (name: string) => WHAT_THRESHOLDS[name] ?? 0.8;

// The wake detector's run-length underestimates the full phrase (it only counts frames where the phrase was
// already recognized — the lead-in before that isn't detected), so add a margin when trimming the phrase off
// the audio. Overridable via `window.__ozwellStopLeadIn` for tuning on real speech.
function stopTrimLeadIn(): number {
  if (typeof window === 'undefined') return 0.35;
  const v = (window as unknown as { __ozwellStopLeadIn?: number }).__ozwellStopLeadIn;
  return typeof v === 'number' ? v : 0.35;
}

export interface UseHeyOzwellOptions {
  /** ON: "hey ozwell" opens the chat AND starts dictating. OFF: it just opens the chat and waits. */
  autoDictateOnWake?: boolean;
  /** Close the chat popup after "ozwell I'm done" transcribes + sends. */
  closeChatOnDone?: boolean;
  /** Transcribe on-device (browser, PHI-safe) or POST audio to the server. */
  transcription?: 'browser' | 'server';
  /**
   * Override the default send. By default the hook appends the user turn and either a canned keyless
   * reply or a streamed Ozwell response (see `ozwellChat`). Provide this to route sends to your own
   * backend / message store instead; the hook still appends the user turn first.
   */
  onSend?: (text: string) => void;
  /** Wake-model asset base, forwarded to `useWakeWord`. */
  assetBase?: string;
  /**
   * Doctor-only gate. When true, each wake is verified INVISIBLY against the enrolled voiceprint —
   * only the enrolled doctor (WHO) actually saying the phrase (WHAT) acts; everyone else is ignored.
   * If nothing is enrolled yet it stays open (so the chat works before voice setup). Loads the ~50 MB
   * speaker runtime only when enabled. Enroll via `useVoiceSetup`.
   */
  requireDoctor?: boolean;
  /** Start listening immediately on mount instead of waiting for a click (e.g. an always-on surface). */
  autoStart?: boolean;
  /** Live caption: while dictating, re-transcribe the growing utterance every ~2s and show the recognized
   *  text in the chat composer as it's heard (the final send still uses the full-clip transcription).
   *  On-device only (browser transcription); costs extra compute during dictation. Default false. */
  liveTranscript?: boolean;
  /**
   * Conversation mode: on "done", DIARIZE the captured clip (who-said-what) and send a speaker-labeled
   * transcript instead of a flat one — so the assistant gets "Dr. Jane: … / Patient: …" for a multi-person
   * room. On-device (loads the ~50 MB speaker runtime); slower than plain transcription, and it overrides
   * server transcription (diarization needs the audio locally). Default false.
   */
  conversationMode?: boolean;
  /** Diarization tuning for conversation mode (threshold, maxSpeakers, minSegmentSeconds, inferRoles). */
  diarizationOptions?: Omit<UseDiarizationOptions, 'enabled'>;
}

/** Props to spread onto <HeyOzwellToggle>. */
export interface HeyOzwellToggleBindings {
  active: boolean;
  level: number;
  loading: boolean;
  loadProgress: number;
  warmActive: boolean;
  warmProgress: number;
  loadLabel?: string;
  onToggle: (next: boolean) => void;
  onOpenSettings: () => void;
}

/** Props to spread onto <FloatingAIChat> (host supplies suggestions / userName). */
export interface HeyOzwellChatBindings {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: AIMessage[];
  isGenerating: boolean;
  inputPlaceholder: string;
  onSendMessage: (text: string) => void;
  /** Controlled composer wiring — fills the box with the live caption while dictating, else the typed
   *  text. Spread onto the chat; a host adding its own composerProps should merge (not replace) this. */
  composerProps: { value: string; onValueChange: (v: string) => void };
}

export interface UseHeyOzwellResult {
  /** Whether Ozwell is on (mic listening). */
  active: boolean;
  /** Turn Ozwell on/off — also tears down dictation + closes popups when turning off. */
  toggle: (next: boolean) => void;
  phase: HeyOzwellPhase;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  messages: AIMessage[];
  isGenerating: boolean;
  /** Room volume 0..1 from the detector's own mic stream (drives the octopus pulse). */
  level: number;
  /** Wake detector ready / error passthrough. */
  ready: boolean;
  error: string | null;
  /** Live readiness per model, for the settings menu's "Models & versions" readout. */
  modelStatus: Partial<Record<ModelStatusKey, ModelStatus>>;
  /** Send a (typed or dictated) message through the active flow. */
  send: (text: string) => void;
  /** Start recording dictation into the active turn (e.g. wire to a mic button). */
  startDictation: () => void;
  /** Stop dictation → transcribe → send. Pass `true` only for a spoken "ozwell i'm done" stop (it trims the
   *  phrase off the audio); a manual/button stop should call it with no argument. */
  stopDictation: (viaPhrase?: boolean) => void;
  /** Doctor-only gate is on AND a voiceprint is enrolled, so only the enrolled doctor is acted on. */
  locked: boolean;
  /** Live-caption text recognized so far during dictation (empty unless `liveTranscript` is on). Host can
   *  render it in the composer as it's spoken; the final send still uses the full-clip transcription. */
  liveText: string;
  toggleProps: HeyOzwellToggleBindings;
  chatProps: HeyOzwellChatBindings;
}

/**
 * Room-volume meter read from the wake-word detector's OWN mic stream — there is one shared mic, so
 * we attach a second analyser to `getStream()` rather than opening another `getUserMedia` (which
 * would silence the detector). Mirrors the Voice Setup pulse.
 */
function useRoomLevel(getStream: () => MediaStream | null, ready: boolean): number {
  const [level, setLevel] = React.useState(0);
  const getStreamRef = React.useRef(getStream);
  getStreamRef.current = getStream;

  React.useEffect(() => {
    if (!ready) {
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
      const stream = getStreamRef.current();
      if (!stream) {
        if (tries++ < 40) window.setTimeout(start, 300);
        return;
      }
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
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
    };
  }, [ready]);

  return level;
}

export function useHeyOzwell(options: UseHeyOzwellOptions = {}): UseHeyOzwellResult {
  const {
    autoDictateOnWake = false,
    closeChatOnDone = false,
    transcription = 'browser',
    onSend,
    assetBase,
    requireDoctor = false,
    autoStart = false,
    liveTranscript = false,
    conversationMode = false,
    diarizationOptions,
  } = options;

  const [active, setActive] = React.useState(autoStart);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<AIMessage[]>([]);
  const [generating, setGenerating] = React.useState(false);
  const [phase, setPhase] = React.useState<HeyOzwellPhase>('listening');
  const [typed, setTyped] = React.useState(''); // controlled composer text, so live caption can fill the box
  const dictLoad = React.useSyncExternalStore(subscribeDictationLoad, getDictationLoad); // transcription model load
  const wakeWarm = React.useSyncExternalStore(subscribeWakeWarm, getWakeWarm); // wake-model pre-fetch (no mic)

  const counterRef = React.useRef(0);
  const mkMsg = React.useCallback(
    (role: AIMessage['role'], text: string): AIMessage => ({
      id: `${role}-${++counterRef.current}`,
      role,
      content: [{ type: 'text', text }],
      timestamp: new Date(),
      status: 'complete',
    }),
    []
  );

  const messagesRef = React.useRef(messages);
  messagesRef.current = messages;
  const phaseRef = React.useRef(phase);
  phaseRef.current = phase;
  const recRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  // Aborts the in-flight streamed reply when a new send starts or Ozwell is toggled off.
  const streamAbortRef = React.useRef<AbortController | null>(null);
  // Live caption (opt-in): the recognized-so-far text + the accumulating recorder/timer that produce it.
  // `committed` is finalized text; the loop only re-transcribes the growing TAIL since the cursor, so
  // per-pass work stays bounded (near-real-time) instead of re-running the whole clip each tick.
  const [liveText, setLiveText] = React.useState('');
  const liveRecRef = React.useRef<RollingRecorder | null>(null);
  const liveTimerRef = React.useRef<number | null>(null);
  const liveCommittedRef = React.useRef('');
  const liveCursorRef = React.useRef(0);
  const liveBusyRef = React.useRef(false);
  const stopLive = React.useCallback(() => {
    if (liveTimerRef.current) window.clearInterval(liveTimerRef.current);
    liveTimerRef.current = null;
    liveRecRef.current?.close();
    liveRecRef.current = null;
    liveCommittedRef.current = '';
    liveCursorRef.current = 0;
    liveBusyRef.current = false;
    setLiveText('');
  }, []);
  // Holds the live detector so startDictation can reach its mic stream. Assigned after useWakeWord
  // runs below (onWake references startDictation, so the detector can't be created before it).
  const wakeRef = React.useRef<ReturnType<typeof useWakeWord> | null>(null);

  // Doctor-only gate (loads the ~50 MB speaker runtime only when requireDoctor). A rolling recorder is
  // the 2nd consumer of the shared stream, giving the WHO check the wake-utterance audio.
  const sv = useSpeakerVerify({ enabled: requireDoctor });
  const svRef = React.useRef(sv);
  svRef.current = sv;
  const rollRef = React.useRef<RollingRecorder | null>(null);

  // Conversation mode: diarize the dictation clip on send. Loads the speaker runtime only when on
  // (shares the window.SpeakerVerify singleton with the doctor gate, so no double-load).
  const diar = useDiarization({ ...diarizationOptions, enabled: conversationMode });
  const diarRef = React.useRef(diar);
  diarRef.current = diar;

  // Verify a wake INVISIBLY: WHO (it's the enrolled doctor) AND WHAT (they actually said the phrase —
  // WHAT stops a false fire on the doctor's own non-phrase speech, since WHO can't tell the phrase from
  // not-the-phrase in the same voice). Open (returns true) when the gate is off or nothing is enrolled;
  // enrolled-but-can't-capture fails closed. Mirrors the hands-free gate.
  const verified = React.useCallback((name: string): boolean => {
    if (!requireDoctor) return true;
    const svh = svRef.current;
    const enrolled = svh.conditionCount(name) > 0;
    if (!enrolled) return true;
    const roll = rollRef.current;
    if (!roll || !wakeRef.current) return false;
    const who = svh.verify(name, roll.snapshot(), roll.sampleRate);
    const what = wakeRef.current.phraseCosine(name, wakeRef.current.getLastEmbedding());
    const thr = whatThr(name);
    const ok = (who?.pass ?? false) && (what == null || what >= thr);
    console.log(
      `[hey-ozwell] ${name}: WHO ${who?.score?.toFixed(2)} ${who?.pass ? '✓' : '✗'} · WHAT ${what?.toFixed(2) ?? '—'} (≥${thr}) → ${ok ? 'ACT' : 'ignore'}`
    );
    return ok;
  }, [requireDoctor]);

  // Send a (typed or dictated) message — append the user turn, then either a host-provided send, a
  // canned keyless reply, or a streamed Ozwell response.
  const onSendRef = React.useRef(onSend);
  onSendRef.current = onSend;
  const send = React.useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      setTyped(''); // clear the composer on send (typed or dictated)
      setMessages((m) => [...m, mkMsg('user', t)]);

      if (onSendRef.current) {
        onSendRef.current(t);
        return;
      }

      if (!isOzwellConfigured()) {
        window.setTimeout(
          () =>
            setMessages((m) => [
              ...m,
              mkMsg(
                'assistant',
                `Heard: “${t}”. Wire me to the Ozwell backend and I'd answer.`
              ),
            ]),
          350
        );
        return;
      }

      const history = [
        ...toOzwellMessages(messagesRef.current),
        { role: 'user' as const, content: t },
      ];
      const id = `assistant-${++counterRef.current}`;
      setMessages((m) => [
        ...m,
        {
          id,
          role: 'assistant',
          content: [{ type: 'text', text: '' }],
          timestamp: new Date(),
          status: 'streaming',
        },
      ]);
      setGenerating(true);
      const patch = (txt: string, status: AIMessage['status']) =>
        setMessages((m) =>
          m.map((msg) =>
            msg.id === id
              ? { ...msg, content: [{ type: 'text', text: txt }], status }
              : msg
          )
        );
      // Cancel any prior in-flight stream, then start this one with its own signal.
      streamAbortRef.current?.abort();
      const ac = new AbortController();
      streamAbortRef.current = ac;
      askOzwellStream(history, (_d, full) => patch(full, 'streaming'), { signal: ac.signal })
        .then((full) => patch(full || '(no response)', 'complete'))
        .catch((e) => {
          if ((e as Error)?.name === 'AbortError') return; // superseded/cancelled — not an error to show
          patch(`⚠️ ${e instanceof Error ? e.message : String(e)}`, 'error');
        })
        .finally(() => {
          if (streamAbortRef.current === ac) setGenerating(false); // only if not superseded
        });
    },
    [mkMsg]
  );

  const startDictation = React.useCallback(() => {
    const stream = wakeRef.current?.getStream(); // the listener's OWN stream — no second getUserMedia
    if (!stream) return;
    chunksRef.current = [];
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream);
    } catch {
      return;
    }
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunksRef.current.push(e.data);
    };
    rec.start();
    recRef.current = rec;
    setPhase('dictating');

    // Live caption (browser mode only): accumulate raw PCM off the SAME stream and re-transcribe just the
    // recent TAIL frequently (~0.8s), so the text fills into the composer almost as it's spoken. Once the
    // tail grows past ~8s it's committed (frozen into `committed`) and the cursor advances, keeping each
    // pass cheap regardless of how long the utterance runs. The final send still re-transcribes the whole
    // clip at full quality (transcribeBlob above), so this preview never affects the sent text.
    if (liveTranscript && transcription === 'browser') {
      setLiveText('');
      liveCommittedRef.current = '';
      liveCursorRef.current = 0;
      liveBusyRef.current = false;
      liveRecRef.current = openRollingRecorder(stream, Infinity);
      liveTimerRef.current = window.setInterval(async () => {
        const acc = liveRecRef.current;
        if (!acc || liveBusyRef.current) return;
        const fresh = acc.totalSamples() - liveCursorRef.current;
        if (fresh < acc.sampleRate * 0.4) return; // need ~0.4s of fresh audio
        const tail = acc.snapshotFrom(liveCursorRef.current); // only the un-committed tail (O(tail), not O(total))
        liveBusyRef.current = true;
        try {
          const t = (await transcribeSamples(tail, acc.sampleRate)).trim();
          if (!liveRecRef.current) return; // stopped mid-pass
          const committed = liveCommittedRef.current;
          setLiveText(committed ? (t ? `${committed} ${t}` : committed) : t);
          if (tail.length >= acc.sampleRate * 8 && t) {
            liveCommittedRef.current = committed ? `${committed} ${t}` : t;
            liveCursorRef.current += tail.length;
          }
        } catch {
          /* transient — keep the last caption */
        } finally {
          liveBusyRef.current = false;
        }
      }, 800);
    }
  }, [liveTranscript, transcription]);

  // `viaPhrase` = stopped by the spoken "ozwell i'm done" wake (vs the mic button). Only then do we cut the
  // phrase off the AUDIO before transcribing — Whisper mishears it differently every time, so text-stripping
  // alone leaks it; a button stop has no phrase, so trimming would clip real speech.
  const stopDictation = React.useCallback((viaPhrase = false) => {
    const rec = recRef.current;
    if (!rec) return;
    stopLive(); // tear down the live-caption loop; the final full-clip transcription follows
    setPhase('transcribing');
    rec.onstop = async () => {
      let blob = new Blob(chunksRef.current, {
        type: rec.mimeType || 'audio/webm',
      });
      recRef.current = null;
      try {
        // Cut the spoken stop phrase off the audio so it never reaches ASR — covers the on-device, server,
        // AND diarization paths at once. Anchor the cut with the wake detector's measured phrase length (so
        // it works even with no pause before the phrase), snapped to a nearby pause. Best-effort: keep the
        // original clip on failure.
        if (viaPhrase) {
          const dur = wakeRef.current?.getLastWakeDuration() ?? 0;
          const hint = dur > 0 ? dur + stopTrimLeadIn() : 0;
          try { blob = await trimTrailingStopPhrase(blob, hint); } catch { /* keep original */ }
        }
        let text: string;
        if (conversationMode && diarRef.current.ready) {
          // Conversation mode: diarize the clip → labeled turns ("Dr. Jane: … / Patient: …") so the
          // assistant gets who-said-what. Fall back to plain transcription if diarization yields nothing.
          const turns = await diarRef.current.diarize(blob);
          const joined = turns.map((t) => `${t.speaker}: ${t.text}`).join('\n');
          text = stripStopPhrase(joined) || stripStopPhrase(await transcribeBlob(blob));
        } else if (transcription === 'server') {
          // Server mode posts the audio off-device; if it fails (no ASR endpoint, e.g. Ollama) fall
          // back to on-device so the flow still works.
          let raw: string;
          try {
            raw = await transcribeServer(blob);
          } catch (e) {
            console.warn('[hey-ozwell] server ASR failed → on-device fallback', e);
            raw = await transcribeBlob(blob);
          }
          text = stripStopPhrase(raw);
        } else {
          text = stripStopPhrase(await transcribeBlob(blob));
        }
        if (text) send(text);
        if (closeChatOnDone) setChatOpen(false);
      } catch (e) {
        console.error('[hey-ozwell] transcription failed', e);
      }
      setPhase('listening');
    };
    rec.stop();
  }, [transcription, conversationMode, closeChatOnDone, send, stopLive]);

  const wake = useWakeWord({
    enabled: active,
    assetBase,
    onWake: (name) => {
      if (name === 'hey-ozwell' && phaseRef.current === 'listening') {
        if (!verified('hey-ozwell')) return; // doctor-only gate (no-op when requireDoctor is off)
        // Always open the chat. Only DROP into dictation when auto-dictate is on; otherwise just
        // open and wait — the experiment surface for more specific wake-word directions.
        setChatOpen(true);
        if (autoDictateOnWake) startDictation();
      } else if (name === "ozwell-i'm-done" && phaseRef.current === 'dictating') {
        // Stop immediately on the verified stop-wake. (A transcribe-confirm gate was tried, but Whisper
        // mishears "done" often enough — e.g. "…all was well" — that it rejected real stops and trapped
        // dictation. The WHAT phrase-print check in verified() is the false-stop guard.) `true` = trim the
        // phrase off the audio before transcribing.
        if (verified("ozwell-i'm-done")) stopDictation(true);
      }
    },
  });
  wakeRef.current = wake;
  const level = useRoomLevel(wake.getStream, wake.ready);

  // Doctor-only gate plumbing: once the detector is listening, restore enrolled WHAT prints into it and
  // open the rolling recorder (2nd consumer of the shared stream) so the WHO check has audio to verify.
  // Only when requireDoctor — otherwise neither the speaker runtime nor this recorder is created.
  React.useEffect(() => {
    if (!requireDoctor || !active || !wake.ready) return;
    let cancelled = false;
    let tries = 0;
    void loadWhatPrints().then((loaded) => {
      if (cancelled) return;
      for (const k in loaded) wakeRef.current?.setVoiceprint(k, loaded[k]);
    });
    const tryOpen = () => {
      if (cancelled || rollRef.current) return;
      const stream = wakeRef.current?.getStream();
      if (stream) rollRef.current = openRollingRecorder(stream);
      else if (tries++ < 40) window.setTimeout(tryOpen, 300);
    };
    tryOpen();
    return () => {
      cancelled = true;
      rollRef.current?.close();
      rollRef.current = null;
    };
  }, [requireDoctor, active, wake.ready]);

  // Header octopus load state, split into two rings so the slow transcription warm-up never makes
  // the octopus look unavailable (primary ring = wake pre-warm; secondary arc = transcription).
  const ozLoading = wakeWarm.active;
  const ozProgress = wakeWarm.done ? 1 : wakeWarm.progress;
  const ozWarm = dictLoad.active && !dictLoad.done;
  const ozWarmProgress = dictLoad.done ? 1 : Math.min(0.99, dictLoad.progress); // hold at 99 until compile done
  const ozLoadLabel = ozWarm
    ? `Transcription ${Math.min(99, Math.round(dictLoad.progress * 100))}%`
    : wakeWarm.active
      ? 'Wake word…'
      : undefined;

  // Doctor-only and a voiceprint is enrolled → only the enrolled doctor is acted on.
  const locked = requireDoctor && sv.ready && sv.conditionCount('hey-ozwell') > 0;

  // Live readiness for the "Models & versions" readout in the settings menu.
  const modelStatus: Partial<Record<ModelStatusKey, ModelStatus>> = {
    wake: wakeWarm.done || wake.ready ? 'ready' : ozLoading ? 'loading' : 'idle',
    transcription: dictLoad.done ? 'ready' : dictLoad.active ? 'loading' : 'idle',
  };

  // Pre-load the small wake model FILES on mount (mic stays off) so the octopus is ready to listen
  // the instant it's pressed and shows the green ready-flash on reload. Cheap (~3 MB into OPFS).
  React.useEffect(() => {
    void warmWakeModels(assetBase);
  }, [assetBase]);

  // Warm the heavy (~1.3 GB) transcription model only once Ozwell is turned ON — in the background,
  // OFF the critical wake-start path. Activation must never be gated on the transcription download.
  React.useEffect(() => {
    if (active) warmWhisper();
  }, [active]);

  const toggle = React.useCallback((next: boolean) => {
    setActive(next);
    if (!next) {
      // Turning off: stop any dictation, abort an in-flight reply, close + reset.
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
      stopLive();
      streamAbortRef.current?.abort();
      streamAbortRef.current = null;
      setGenerating(false);
      setChatOpen(false);
      setSettingsOpen(false);
      setPhase('listening');
    }
  }, [stopLive]);

  // Controlled composer value: fill the box with the live caption while dictating (browser + liveTranscript);
  // otherwise the user's typed text. Typing is ignored during the live overlay (hands-free dictation).
  const dictatingLive = phase === 'dictating' && liveTranscript && transcription === 'browser';
  const composerValue = dictatingLive ? liveText : typed;

  const inputPlaceholder =
    phase === 'dictating'
      ? '🎙️ Dictating… say “ozwell I’m done” to send' // recognized text fills the box itself
      : phase === 'transcribing'
        ? conversationMode
          ? '⏳ Writing who-said-what…'
          : transcription === 'server'
            ? '⏳ Transcribing on the server…'
            : '⏳ Transcribing on-device…'
        : autoDictateOnWake
          ? 'Say “hey ozwell”, or type…'
          : 'Say “hey ozwell” to open, then type…';

  return {
    active,
    toggle,
    phase,
    chatOpen,
    setChatOpen,
    settingsOpen,
    setSettingsOpen,
    messages,
    isGenerating: generating,
    level,
    ready: wake.ready,
    error: wake.error,
    modelStatus,
    send,
    startDictation,
    stopDictation,
    locked,
    liveText,
    toggleProps: {
      active,
      level,
      loading: ozLoading,
      loadProgress: ozProgress,
      warmActive: ozWarm,
      warmProgress: ozWarmProgress,
      loadLabel: ozLoadLabel,
      onToggle: toggle,
      onOpenSettings: () => setSettingsOpen((v) => !v),
    },
    chatProps: {
      open: chatOpen,
      onOpenChange: setChatOpen,
      messages,
      isGenerating: generating,
      inputPlaceholder,
      onSendMessage: send,
      composerProps: {
        value: composerValue,
        onValueChange: (v: string) => {
          if (!dictatingLive) setTyped(v); // ignore typing while the live caption owns the box
        },
      },
    },
  };
}
