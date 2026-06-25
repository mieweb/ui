/**
 * Hands-free voice chat — the COMPOSITION of the separate primitives.
 *
 * Wires `useWakeWord` (wake detection) + on-device Whisper (dictation) + `AIChat` (UI):
 *   say "hey ozwell"  → start dictating into the chat
 *   say "ozwell I'm done" → stop, transcribe on-device, send the message
 *
 * KEY: ONE mic stream. The wake listener stays on the whole time (it has to keep hearing
 * "ozwell I'm done"), and the dictation MediaRecorder attaches to that SAME stream
 * (`useWakeWord().getStream()`) — never a second getUserMedia, which would go silent.
 *
 * The primitives stay independent; this is just the thin layer that connects them. (The
 * doctor-only speaker gate is a separate primitive, added next.)
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AIChat } from './AIChat';
import type { AIMessage } from './types';
import { RecordButton } from '../RecordButton';
import { useWakeWord } from '../WakeWord/useWakeWord';
import { useSpeakerVerify } from '../SpeakerVerify/useSpeakerVerify';
import { transcribeBlob, stripStopPhrase, warmWhisper } from './whisperTranscribe';

const meta: Meta = {
  title: 'Product/Feature Modules/AI/Hands-Free Chat',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Composition of three independent primitives — wake-word + on-device dictation + AIChat. ' +
          'Say **“hey ozwell”** to start dictating, **“ozwell I’m done”** to send. One shared mic; all on-device.',
      },
    },
  },
};
export default meta;

let counter = 0;
const mkMsg = (role: AIMessage['role'], text: string): AIMessage => ({
  id: `${role}-${++counter}`, role, content: [{ type: 'text', text }], timestamp: new Date(), status: 'complete',
});

// --- doctor-only gate: restore enrolled WHAT prints + a rolling recorder for the wake-utterance audio ---
const WHAT_KEY = 'ozwellWhatPrints';
// Per-phrase WHAT (phrase-print cosine) gate. Stop is a touch looser (0.75): the run-on
// "…ozwell I'm done" at the dictation tail embeds slightly differently from the isolated enrolled
// one, so it lands a bit lower than the clean start phrase — 0.75 catches legit stops without
// opening the door to the doctor's own non-phrase speech.
const WHAT_THRESHOLDS: Record<string, number> = { 'hey-ozwell': 0.8, "ozwell-i'm-done": 0.75 };
const whatThr = (name: string) => WHAT_THRESHOLDS[name] ?? 0.8;
function loadWhat(): Record<string, Float32Array[]> {
  try { const o = JSON.parse(localStorage.getItem(WHAT_KEY) || '{}'); const out: Record<string, Float32Array[]> = {}; for (const k in o) out[k] = (o[k] as number[][]).map((a) => Float32Array.from(a)); return out; } catch { return {}; }
}
interface Roll { sampleRate: number; snapshot: () => Float32Array; close: () => void; }
function openRolling(stream: MediaStream): Roll {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx(); const src = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1); const sink = ctx.createGain(); sink.gain.value = 0;
  const max = Math.round(ctx.sampleRate * 2);
  let chunks: Float32Array[] = []; let total = 0;
  proc.onaudioprocess = (e) => { chunks.push(Float32Array.from(e.inputBuffer.getChannelData(0))); total += e.inputBuffer.length; while (total > max && chunks.length > 1) { total -= chunks[0].length; chunks.shift(); } };
  src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
  return { sampleRate: ctx.sampleRate, snapshot: () => { const s = new Float32Array(total); let o = 0; for (const c of chunks) { s.set(c, o); o += c.length; } return s; }, close: () => { try { proc.disconnect(); src.disconnect(); sink.disconnect(); } catch { /* ignore */ } void ctx.close(); } };
}

function HandsFreeChat() {
  const sv = useSpeakerVerify();
  const svRef = React.useRef(sv); svRef.current = sv;
  const rollRef = React.useRef<Roll | null>(null);
  const [messages, setMessages] = React.useState<AIMessage[]>([]);
  const [phase, setPhase] = React.useState<'listening' | 'dictating' | 'transcribing'>('listening');
  const recRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const phaseRef = React.useRef(phase);
  phaseRef.current = phase;

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, mkMsg('user', t)]);
    // stand-in for the real Ozwell backend
    window.setTimeout(() => setMessages((m) => [...m, mkMsg('assistant',
      `Heard: “${t}”. Wire me to the Ozwell backend and I'd answer.`)]), 350);
  };

  // INVISIBLE doctor-only gate, run on each wake. If enrolled, only the enrolled doctor (WHO) saying the
  // phrase (WHAT) passes — everyone else is silently ignored. If NOT enrolled yet, it's open (so the chat
  // works before you've set up your voice). Enrolled-but-can't-capture fails closed.
  // Verify a wake INVISIBLY against the enrolled prints: WHO (it's the doctor) AND WHAT (they actually
  // said the phrase — WHAT is what stops a false fire on the doctor's OWN speech from triggering, since
  // WHO can't tell the phrase from not-the-phrase when it's the same voice). Both gates, start and stop.
  const verified = (name: string): boolean => {
    const roll = rollRef.current;
    const enrolled = svRef.current.conditionCount(name) > 0;
    if (!enrolled) return true;
    if (!roll) return false;
    const who = svRef.current.verify(name, roll.snapshot(), roll.sampleRate);
    const what = wakeRef.current.phraseCosine(name, wakeRef.current.getLastEmbedding());
    const thr = whatThr(name);
    const ok = (who?.pass ?? false) && (what == null || what >= thr);
    console.log(`[handsfree] ${name}: WHO ${who?.score?.toFixed(2)} ${who?.pass ? '✓' : '✗'} · WHAT ${what?.toFixed(2) ?? '—'} ${what != null ? (what >= thr ? '✓' : '✗') : ''} (≥${thr}) → ${ok ? 'ACT' : 'ignore'}`);
    return ok;
  };

  const wake = useWakeWord({
    onWake: (name) => {
      if (name === 'hey-ozwell' && phaseRef.current === 'listening') { if (verified('hey-ozwell')) startDictation(); }
      else if (name === "ozwell-i'm-done" && phaseRef.current === 'dictating') { if (verified("ozwell-i'm-done")) stopDictation(); }
    },
  });
  const wakeRef = React.useRef(wake);
  wakeRef.current = wake;

  // restore enrolled WHAT prints into the detector + open a rolling recorder (2nd consumer of the shared
  // stream) so the WHO gate has the wake-utterance audio. WHO prints auto-load from localStorage in speaker-verify.js.
  React.useEffect(() => {
    if (!wake.ready) return;
    let cancelled = false, tries = 0;
    const loaded = loadWhat();
    for (const k in loaded) wakeRef.current.setVoiceprint(k, loaded[k]);
    const tryOpen = () => {
      if (cancelled || rollRef.current) return;
      const stream = wakeRef.current.getStream();
      if (stream) rollRef.current = openRolling(stream);
      else if (tries++ < 40) window.setTimeout(tryOpen, 300);
    };
    tryOpen();
    return () => { cancelled = true; rollRef.current?.close(); rollRef.current = null; };
  }, [wake.ready]);

  // preload the dictation model on open, so the first "ozwell i'm done" doesn't wait on it
  React.useEffect(() => { warmWhisper(); }, []);

  function startDictation() {
    const stream = wakeRef.current.getStream(); // the listener's OWN stream — no second getUserMedia
    if (!stream) return;
    chunksRef.current = [];
    let rec: MediaRecorder;
    try { rec = new MediaRecorder(stream); } catch { return; }
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    rec.start();
    recRef.current = rec;
    setPhase('dictating');
  }

  function stopDictation() {
    const rec = recRef.current;
    if (!rec) return;
    setPhase('transcribing');
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
      recRef.current = null;
      try {
        const text = stripStopPhrase(await transcribeBlob(blob, 1.0)); // trim spoken stop phrase + strip residual
        if (text) send(text);
      } catch (e) { console.error('[handsfree] transcription failed', e); }
      setPhase('listening');
    };
    rec.stop();
  }

  const locked = sv.ready && sv.conditionCount('hey-ozwell') > 0; // enrolled → doctor-only
  const banner =
    phase === 'dictating' ? '🎙️ Dictating… say “ozwell I’m done” to send'
      : phase === 'transcribing' ? '⏳ Transcribing on-device…'
        : wake.error ? `⚠️ ${wake.error}`
          : wake.ready ? `● Listening for “hey ozwell”${locked ? '  ·  🔒 your voice only' : '  ·  set up your voice to lock it to you'}`
            : '… loading models';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 16px', font: '13px system-ui, sans-serif',
        background: phase === 'dictating' ? '#7f1d1d' : '#0b1622',
        color: phase === 'dictating' ? '#fecaca' : '#9fb6cc', transition: 'background .2s',
      }}>
        {banner}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <AIChat
          messages={messages}
          height="100%"
          title="Ozwell Assistant — hands-free"
          inputPlaceholder={phase === 'listening' ? 'Say “hey ozwell”, or type…' : banner}
          onSendMessage={send}
          composerProps={{
            // The composer's OWN mic button — but driven by our shared stream, not its own getUserMedia.
            // `state` puts RecordButton in controlled mode (its internal recorder is disabled); the
            // wrapping onClickCapture starts/stops OUR shared-stream dictation. So the built-in mic
            // and "hey ozwell" both do the same thing — either works, one mic, no conflict.
            inputTrailing: (
              <span
                onClickCapture={() => { if (phase === 'dictating') stopDictation(); else if (phase === 'listening') startDictation(); }}
                style={{ display: 'inline-flex' }}
                title="Dictate — or just say “hey ozwell”"
              >
                <RecordButton
                  variant="ghost"
                  size="sm"
                  showWaveform
                  showPulse={phase === 'dictating'}
                  state={phase === 'dictating' ? 'recording' : phase === 'transcribing' ? 'processing' : 'idle'}
                />
              </span>
            ),
          }}
        />
      </div>
    </div>
  );
}

/** Say "hey ozwell" to dictate, "ozwell I'm done" to send. Wake-word + dictation + AIChat, one shared mic. */
export const HandsFree: StoryObj = {
  render: () => <HandsFreeChat />,
};
