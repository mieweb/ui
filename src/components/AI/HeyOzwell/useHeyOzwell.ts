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
  stripStopPhrase,
  warmWhisper,
  subscribeDictationLoad,
  getDictationLoad,
} from '../whisperTranscribe';
import {
  askOzwellStream,
  isOzwellConfigured,
  toOzwellMessages,
} from '../ozwellChat';

export type HeyOzwellPhase = 'listening' | 'dictating' | 'transcribing';

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
  } = options;

  const [active, setActive] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<AIMessage[]>([]);
  const [generating, setGenerating] = React.useState(false);
  const [phase, setPhase] = React.useState<HeyOzwellPhase>('listening');
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
  // Holds the live detector so startDictation can reach its mic stream. Assigned after useWakeWord
  // runs below (onWake references startDictation, so the detector can't be created before it).
  const wakeRef = React.useRef<ReturnType<typeof useWakeWord> | null>(null);

  // Send a (typed or dictated) message — append the user turn, then either a host-provided send, a
  // canned keyless reply, or a streamed Ozwell response.
  const onSendRef = React.useRef(onSend);
  onSendRef.current = onSend;
  const send = React.useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
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
      askOzwellStream(history, (_d, full) => patch(full, 'streaming'))
        .then((full) => patch(full || '(no response)', 'complete'))
        .catch((e) =>
          patch(`⚠️ ${e instanceof Error ? e.message : String(e)}`, 'error')
        )
        .finally(() => setGenerating(false));
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
  }, []);

  const stopDictation = React.useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    setPhase('transcribing');
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, {
        type: rec.mimeType || 'audio/webm',
      });
      recRef.current = null;
      try {
        // Server mode posts the audio off-device; if it fails (no ASR endpoint, e.g. Ollama) fall
        // back to on-device so the flow still works. Browser mode trims the spoken stop phrase.
        let raw: string;
        if (transcription === 'server') {
          try {
            raw = await transcribeServer(blob);
          } catch (e) {
            console.warn('[hey-ozwell] server ASR failed → on-device fallback', e);
            raw = await transcribeBlob(blob, 1.0);
          }
        } else {
          raw = await transcribeBlob(blob, 1.0);
        }
        const text = stripStopPhrase(raw);
        if (text) send(text);
        if (closeChatOnDone) setChatOpen(false);
      } catch (e) {
        console.error('[hey-ozwell] transcription failed', e);
      }
      setPhase('listening');
    };
    rec.stop();
  }, [transcription, closeChatOnDone, send]);

  const wake = useWakeWord({
    enabled: active,
    assetBase,
    onWake: (name) => {
      if (name === 'hey-ozwell' && phaseRef.current === 'listening') {
        // Always open the chat. Only DROP into dictation when auto-dictate is on; otherwise just
        // open and wait — the experiment surface for more specific wake-word directions.
        setChatOpen(true);
        if (autoDictateOnWake) startDictation();
      } else if (name === "ozwell-i'm-done" && phaseRef.current === 'dictating') {
        stopDictation();
      }
    },
  });
  wakeRef.current = wake;
  const level = useRoomLevel(wake.getStream, wake.ready);

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
      // Turning off: stop any dictation, close + reset.
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
      setChatOpen(false);
      setSettingsOpen(false);
      setPhase('listening');
    }
  }, []);

  const inputPlaceholder =
    phase === 'dictating'
      ? '🎙️ Dictating… say “ozwell I’m done” to send'
      : phase === 'transcribing'
        ? transcription === 'server'
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
    },
  };
}
