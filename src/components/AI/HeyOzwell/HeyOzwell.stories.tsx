/**
 * Hey Ozwell — the voice entry-point UX (mieweb/ui#287).
 *
 * The Ozwell octopus lives in the top bar. Off, it's gray and the floating chat
 * button is absent. Activate it and it runs the real on-device wake-word detector:
 * the octopus turns colour and pulses with the room volume, and the library
 * floating chat button (`FloatingAIChat`) appears.
 *
 *   • Auto-dictate on  → "hey ozwell" opens the chat AND starts dictating (hands-free).
 *   • Auto-dictate off → "hey ozwell" just opens the chat and waits (experiment with
 *                         more specific wake-word directions instead of transcribing).
 *   • Right-click / long-press the octopus → "Ozwell settings" (enrollment / test).
 *
 * One shared mic; audio never leaves the page.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { HeyOzwellToggle, type HeyOzwellToggleProps } from './HeyOzwellToggle';
import { FloatingAIChat } from '../AIChatModal';
import { suggestedActions } from '../storyData';
import type { AIMessage } from '../types';
import { useWakeWord } from './WakeWord/useWakeWord';
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

const meta: Meta = {
  title: 'Product/Feature Modules/AI/Hey Ozwell/Demo',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The Hey Ozwell entry point. The **octopus in the header** is gray until clicked; activating it ' +
          'starts the on-device **wake-word detector** (the octopus turns colour and pulses with the room ' +
          'volume) and the library **floating chat button** appears. Use the **Controls** panel to switch ' +
          'between auto-dictate (“hey ozwell” → dictate) and open-chat-only (“hey ozwell” → just opens the ' +
          'chat). **Right-click / long-press** the octopus for Ozwell settings (enrollment / test).',
      },
    },
  },
};
export default meta;

// --- story-to-story navigation (the settings menu links to the sibling Voice/Wake stories). Build the
// Storybook story id from the title + export name (same sanitize Storybook uses) and point the manager
// frame at it — avoids depending on addon-links being registered. ---
const HEY_OZWELL = 'Product/Feature Modules/AI/Hey Ozwell';
const sanitize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
const gotoStory = (title: string, story: string) => () => {
  const id = `${sanitize(title)}--${sanitize(story)}`;
  try {
    const top =
      window.parent && window.parent !== window ? window.parent : window;
    top.location.href = `${top.location.origin}${top.location.pathname}?path=/story/${id}`;
  } catch {
    /* ignore — navigation is best-effort */
  }
};

let counter = 0;
const mkMsg = (role: AIMessage['role'], text: string): AIMessage => ({
  id: `${role}-${++counter}`,
  role,
  content: [{ type: 'text', text }],
  timestamp: new Date(),
  status: 'complete',
});

type Phase = 'listening' | 'dictating' | 'transcribing';

/**
 * Room-volume meter read from the wake-word detector's OWN mic stream — there is
 * one shared mic, so we attach a second analyser to `getStream()` rather than
 * opening another `getUserMedia` (which would silence the detector). Mirrors the
 * Voice Setup pulse.
 */
function useRoomLevel(
  getStream: () => MediaStream | null,
  ready: boolean
): number {
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

interface DemoArgs {
  /** ON: "hey ozwell" opens the chat AND starts dictating. OFF: it just opens the chat and waits. */
  autoDictateOnWake: boolean;
  /** Close the chat popup after "ozwell I'm done" transcribes + sends. */
  closeChatOnDone: boolean;
  /** Transcribe on-device (browser, PHI-safe) or POST audio to the server. */
  transcription: 'browser' | 'server';
}

function Demo({ autoDictateOnWake, closeChatOnDone, transcription }: DemoArgs) {
  const [active, setActive] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<AIMessage[]>([]);
  const [generating, setGenerating] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>('listening');
  const dictLoad = React.useSyncExternalStore(subscribeDictationLoad, getDictationLoad); // transcription model load

  const messagesRef = React.useRef(messages);
  messagesRef.current = messages;
  const phaseRef = React.useRef(phase);
  phaseRef.current = phase;
  const recRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  // Send a (typed or dictated) message — same flow as Hands-Free Chat: append the
  // user turn, then either a canned keyless reply or a streamed Ozwell response.
  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, mkMsg('user', t)]);

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
    const id = `assistant-${++counter}`;
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
  };

  const wake = useWakeWord({
    enabled: active,
    onWake: (name) => {
      if (name === 'hey-ozwell' && phaseRef.current === 'listening') {
        // Always open the chat. Only DROP into dictation when auto-dictate is on; otherwise just open and
        // wait — the experiment surface for more specific wake-word directions.
        setChatOpen(true);
        if (autoDictateOnWake) startDictation();
      } else if (
        name === "ozwell-i'm-done" &&
        phaseRef.current === 'dictating'
      ) {
        stopDictation();
      }
    },
  });
  const wakeRef = React.useRef(wake);
  wakeRef.current = wake;
  const level = useRoomLevel(wake.getStream, wake.ready);

  // Preload the dictation model when Ozwell turns on, so the first "ozwell I'm done"
  // doesn't wait on the Whisper load.
  React.useEffect(() => {
    if (active) warmWhisper();
  }, [active]);

  function startDictation() {
    const stream = wakeRef.current.getStream(); // the listener's OWN stream — no second getUserMedia
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
  }

  function stopDictation() {
    const rec = recRef.current;
    if (!rec) return;
    setPhase('transcribing');
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, {
        type: rec.mimeType || 'audio/webm',
      });
      recRef.current = null;
      try {
        // Server mode posts the audio off-device; if it fails (no ASR endpoint, e.g. Ollama) fall back to
        // on-device so the demo still works. Browser mode trims the spoken stop phrase from the audio.
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
  }

  const toggle = (next: boolean) => {
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
  };

  const placeholder =
    phase === 'dictating'
      ? '🎙️ Dictating… say “ozwell I’m done” to send'
      : phase === 'transcribing'
        ? transcription === 'server'
          ? '⏳ Transcribing on the server…'
          : '⏳ Transcribing on-device…'
        : autoDictateOnWake
          ? 'Say “hey ozwell”, or type…'
          : 'Say “hey ozwell” to open, then type…';

  return (
    <div
      data-hey-ozwell-demo
      style={{
        position: 'relative',
        height: 460,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Pointer cursor on the floating chat trigger — scoped to THIS demo only (AIChatTrigger is a shared
          library component, so we don't change it globally). FloatingAIChat doesn't forward a className to
          its trigger, so target its data-slot within this wrapper. */}
      <style>{`[data-hey-ozwell-demo] [data-slot="ai-chat-trigger"]{cursor:pointer}`}</style>

      {/* Header bar — app name + the octopus toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 22px',
          borderBottom: '1px solid #e2e8f0',
          background: '#fff',
        }}
      >
        <strong style={{ fontSize: 15, color: '#0f172a' }}>BlueHive EHR</strong>
        <span style={{ flex: 1 }} />
        <HeyOzwellToggle
          active={active}
          level={level}
          loading={active && !wake.ready && !wake.error}
          onToggle={toggle}
          onOpenSettings={() => setSettingsOpen((v) => !v)}
          size={40}
        />
      </div>

      {/* Ozwell settings menu — opened by right-click / long-press on the octopus. Links to the sibling
          enrollment + diagnostic stories (reuse, no new UI). */}
      {settingsOpen && (
        <>
          <div
            onClick={() => setSettingsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 60 }}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'absolute',
              top: 56,
              right: 18,
              zIndex: 61,
              width: 252,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow: '0 10px 34px rgba(15,23,42,.14)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '11px 14px',
                fontWeight: 600,
                fontSize: 13.5,
                color: '#0f172a',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              ⚙ Ozwell settings
            </div>
            <SettingsItem
              label="Voice enrollment"
              sub="Set up or re-enroll your voice"
              onClick={() => {
                setSettingsOpen(false);
                gotoStory(`${HEY_OZWELL}/Voice Setup`, 'Setup')();
              }}
            />
            <SettingsItem
              label="Add a condition"
              sub="New room / distance / background"
              onClick={() => {
                setSettingsOpen(false);
                gotoStory(`${HEY_OZWELL}/Voice Setup`, 'Setup')();
              }}
            />
            <SettingsItem
              label="Test & diagnostics"
              sub="Speaker-verify WHO/WHAT readout"
              onClick={() => {
                setSettingsOpen(false);
                gotoStory(
                  `${HEY_OZWELL}/Speaker Verify (dev diagnostic)`,
                  'Verify'
                )();
              }}
            />
            <SettingsItem
              label="Wake-word test"
              sub="Detector + live probabilities"
              onClick={() => {
                setSettingsOpen(false);
                gotoStory(`${HEY_OZWELL}/Wake Word`, 'Listener')();
              }}
            />
          </div>
        </>
      )}

      {/* Body — a faux app surface behind the floating chat */}
      <div
        style={{
          padding: 28,
          background: '#f8fafc',
          height: '100%',
          color: '#64748b',
          fontSize: 14,
        }}
      >
        {active && !wake.ready && !wake.error && (
          <p style={{ marginTop: 0 }}>
            Starting the on-device detector… (loading models)
          </p>
        )}
        {active && dictLoad.active && !dictLoad.done && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span>Loading transcription model… {Math.round(dictLoad.progress * 100)}%</span>
            <span style={{ display: 'inline-block', width: 140, height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${Math.round(dictLoad.progress * 100)}%`, background: '#0BA0E0', transition: 'width .2s linear' }} />
            </span>
          </div>
        )}
        {wake.error && (
          <p style={{ marginTop: 0, color: '#dc2626' }}>
            Wake word error: {wake.error}
          </p>
        )}
        {active && wake.ready && autoDictateOnWake && (
          <p style={{ marginTop: 0 }}>
            Listening — say <b style={{ color: '#0f172a' }}>“hey ozwell”</b> to
            start dictating, then
            <b style={{ color: '#0f172a' }}> “ozwell I’m done”</b> to transcribe
            and send. Or open the floating chat and type.
          </p>
        )}
        {active && wake.ready && !autoDictateOnWake && (
          <p style={{ marginTop: 0 }}>
            Listening — say <b style={{ color: '#0f172a' }}>“hey ozwell”</b> to{' '}
            <b>open the chat</b> (no auto-recording). Then type, or experiment
            with a more specific spoken command.
          </p>
        )}
        {!active && (
          <p style={{ marginTop: 0 }}>
            Click the gray octopus in the header to turn Ozwell on.
          </p>
        )}
        <p style={{ marginTop: 14, fontSize: 12.5, color: '#94a3b8' }}>
          Tip: <b>right-click</b> (or long-press) the octopus for Ozwell
          settings.
        </p>
      </div>

      {/* The normal AI chat (FloatingAIChat) — present ONLY while Ozwell is active */}
      {active && (
        <FloatingAIChat
          open={chatOpen}
          onOpenChange={setChatOpen}
          messages={messages}
          suggestions={suggestedActions}
          userName="Dr. Jane"
          isGenerating={generating}
          inputPlaceholder={placeholder}
          onSendMessage={send}
        />
      )}
    </div>
  );
}

function SettingsItem({
  label,
  sub,
  onClick,
}: {
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        padding: '10px 14px',
        border: 'none',
        borderTop: '1px solid #f1f5f9',
        background: 'transparent',
      }}
    >
      <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</div>
    </button>
  );
}

/**
 * The full flow. Use the Controls panel to switch **Auto-dictate on wake** on/off, and right-click /
 * long-press the octopus for Ozwell settings.
 */
export const Interactive: StoryObj<DemoArgs> = {
  args: { autoDictateOnWake: false, closeChatOnDone: false, transcription: 'browser' },
  argTypes: {
    autoDictateOnWake: {
      name: 'Auto-dictate on wake',
      control: 'boolean',
      description:
        'ON: “hey ozwell” opens the chat AND starts dictating (hands-free). OFF: “hey ozwell” just opens / ' +
        'focuses the chat and waits — for experimenting with more specific wake-word directions instead of ' +
        'always going into transcription.',
    },
    closeChatOnDone: {
      name: 'Close chat on “I’m done”',
      control: 'boolean',
      description:
        'After “ozwell I’m done” transcribes + sends, also close the chat popup — vs leaving it open to read ' +
        'the reply.',
    },
    transcription: {
      name: 'Transcription',
      control: { type: 'select' },
      options: ['browser', 'server'],
      labels: { browser: 'Browser (on-device)', server: 'Server' },
      description:
        '**browser** — on-device Whisper; audio never leaves the page (the PHI-safe default). **server** — ' +
        'POST the audio to the OpenAI-compatible /v1/audio/transcriptions endpoint (same baseURL/apiKey as ' +
        'the chat). Audio LEAVES the browser; falls back to on-device if the endpoint fails. Experiment only.',
    },
  },
  render: (args) => <Demo {...args} />,
};

// Wrapper component so the Controls-driven story can use hooks (a story `render` callback can't).
function TogglePlaygroundDemo(args: HeyOzwellToggleProps) {
  const [active, setActive] = React.useState(args.active ?? true);
  const [pinged, setPinged] = React.useState(false);
  React.useEffect(() => setActive(args.active ?? true), [args.active]);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <HeyOzwellToggle
        {...args}
        active={active}
        onToggle={setActive}
        onOpenSettings={() => {
          setPinged(true);
          window.setTimeout(() => setPinged(false), 1300);
        }}
      />
      <span
        style={{
          fontSize: 12,
          color: pinged ? '#0BA0E0' : '#94a3b8',
          transition: 'color .2s',
        }}
      >
        {pinged
          ? '⚙ onOpenSettings fired (right-click / long-press)'
          : 'click toggles · right-click or long-press for settings'}
      </span>
    </div>
  );
}

/**
 * The reusable octopus toggle on its own, fully driven by the Controls panel — tune `active`, `level`
 * (the pulse), `size`, the logo, and the long-press duration. Right-click / long-press fires settings.
 */
export const TogglePlayground: StoryObj<typeof HeyOzwellToggle> = {
  name: 'Toggle — Playground',
  parameters: { layout: 'centered' },
  args: {
    active: true,
    level: 0.25,
    size: 72,
    logoSrc: '/ozwell/icon.svg',
    longPressMs: 500,
  },
  argTypes: {
    active: {
      control: 'boolean',
      description: 'On (colour + pulse) vs off (gray).',
    },
    level: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Room volume 0..1 — drives the pulse while active.',
    },
    size: {
      control: { type: 'range', min: 24, max: 120, step: 4 },
      description: 'Logo diameter (px).',
    },
    logoSrc: { control: 'text', description: 'Octopus image source.' },
    longPressMs: {
      control: { type: 'range', min: 200, max: 1200, step: 50 },
      description: 'Long-press time before settings fire.',
    },
  },
  render: (args) => <TogglePlaygroundDemo {...args} />,
};

/** The header octopus across its states (no mic — static `level` values for reference). */
export const ToggleStates: StoryObj = {
  parameters: { layout: 'centered' },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 64,
        alignItems: 'center',
        padding: 56,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <Labelled caption="Off (gray)">
        <HeyOzwellToggle active={false} size={56} />
      </Labelled>
      <Labelled caption="Active — quiet">
        <HeyOzwellToggle active level={0.04} size={56} />
      </Labelled>
      <Labelled caption="Active — speaking">
        <HeyOzwellToggle active level={0.32} size={56} />
      </Labelled>
    </div>
  ),
};

function Labelled({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {children}
      <span
        style={{
          fontSize: 12,
          color: '#94a3b8',
          textAlign: 'center',
          maxWidth: 90,
        }}
      >
        {caption}
      </span>
    </div>
  );
}
