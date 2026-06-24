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
import { useWakeWord } from '../WakeWord/useWakeWord';
import { transcribeBlob, stripStopPhrase } from './whisperTranscribe';

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

function HandsFreeChat() {
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

  // hook must be declared before the handlers that read its getStream() — keep a ref to the handle
  const wake = useWakeWord({
    onWake: (name) => {
      if (name === 'hey-ozwell' && phaseRef.current === 'listening') startDictation();
      else if (name === "ozwell-i'm-done" && phaseRef.current === 'dictating') stopDictation();
    },
  });
  const wakeRef = React.useRef(wake);
  wakeRef.current = wake;

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
        const text = stripStopPhrase(await transcribeBlob(blob)); // strip the trailing "ozwell i'm done"
        if (text) send(text);
      } catch (e) { console.error('[handsfree] transcription failed', e); }
      setPhase('listening');
    };
    rec.stop();
  }

  const banner =
    phase === 'dictating' ? '🎙️ Dictating… say “ozwell I’m done” to send'
      : phase === 'transcribing' ? '⏳ Transcribing on-device…'
        : wake.error ? `⚠️ ${wake.error}`
          : wake.ready ? '● Listening for “hey ozwell”'
            : '… loading wake-word models';

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
        />
      </div>
    </div>
  );
}

/** Say "hey ozwell" to dictate, "ozwell I'm done" to send. Wake-word + dictation + AIChat, one shared mic. */
export const HandsFree: StoryObj = {
  render: () => <HandsFreeChat />,
};
