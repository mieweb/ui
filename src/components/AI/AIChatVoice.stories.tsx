/**
 * AIChat + on-device voice (Ozwell dictation).
 *
 * This is the REAL `AIChat` component — its existing `talkToText` mic and
 * `onRecordingComplete(blob)` seam wired to a browser-resident Whisper model.
 * The mic records, Whisper transcribes ENTIRELY in the browser (audio never
 * leaves the page — PHI-safe), and the text is sent as a message.
 *
 * Nothing in the shipped component changes; this is an additive story that
 * demonstrates how a host app would plug on-device transcription into the seam
 * AIChat already exposes. (The "assistant" reply here is a stand-in for the real
 * Ozwell backend — the point is the voice → text → message loop.)
 *
 * Transcription is handled by the shared `whisperTranscribe.ts` (on-device Whisper via
 * Transformers.js) — the same module HandsFreeChat / the Hey Ozwell demo use.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AIChat } from './AIChat';
import type { AIMessage } from './types';
import { askOzwellStream, isOzwellConfigured, toOzwellMessages } from './ozwellChat';
import { transcribeBlob, warmWhisper } from './whisperTranscribe';

const meta: Meta<typeof AIChat> = {
  title: 'Product/Feature Modules/AI/AIChat (Voice)',
  component: AIChat,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The real **AIChat** with **on-device** talk-to-text. Tap the mic, speak, and Whisper ' +
          'transcribes in the browser (no audio leaves the page). Built by wiring `onRecordingComplete` ' +
          'to a browser Whisper model — the shipped component is unchanged.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof AIChat>;

// On-device transcription uses the shared whisperTranscribe module — single source of truth for the model
// host + caching behaviour (this story previously inlined its own copy). See ./whisperTranscribe.ts.

let counter = 0;
const mkMsg = (role: AIMessage['role'], text: string): AIMessage => ({
  id: `${role}-${++counter}`,
  role,
  content: [{ type: 'text', text }],
  timestamp: new Date(),
  status: 'complete',
});

function VoiceAIChat() {
  const [messages, setMessages] = React.useState<AIMessage[]>([]);
  const [transcribing, setTranscribing] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  // latest messages, so `send` can pass the full conversation as history without re-creating the callback
  const messagesRef = React.useRef(messages);
  messagesRef.current = messages;

  // preload Whisper as soon as the story opens, so it's loading in the background while you read/talk
  // instead of waiting for the first mic tap — the first transcription is then fast.
  React.useEffect(() => { warmWhisper(); }, []);

  const send = React.useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, mkMsg('user', t)]);

    // No Ozwell key configured → keep the canned reply, so the demo still works keyless.
    // Configure with `window.__ozwell = { apiKey: '…' }` (or localStorage['ozwellConfig']).
    if (!isOzwellConfigured()) {
      window.setTimeout(
        () => setMessages((m) => [...m, mkMsg('assistant', `Heard: “${t}”. Wire me to the Ozwell backend and I'd answer.`)]),
        350,
      );
      return;
    }

    // Real Ozwell call — streamed token-by-token into one assistant message (multi-turn: pass history).
    const history = [...toOzwellMessages(messagesRef.current), { role: 'user' as const, content: t }];
    const id = `assistant-${++counter}`;
    setMessages((m) => [...m, { id, role: 'assistant', content: [{ type: 'text', text: '' }], timestamp: new Date(), status: 'streaming' }]);
    setGenerating(true);
    const patch = (txt: string, status: AIMessage['status']) =>
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, content: [{ type: 'text', text: txt }], status } : msg)));
    askOzwellStream(history, (_d, full) => patch(full, 'streaming'))
      .then((full) => patch(full || '(no response)', 'complete'))
      .catch((e) => patch(`⚠️ ${e instanceof Error ? e.message : String(e)}`, 'error'))
      .finally(() => setGenerating(false));
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <AIChat
        messages={messages}
        height="100%"
        talkToText
        isGenerating={generating}
        title="Ozwell Assistant"
        inputPlaceholder={transcribing ? 'Transcribing on-device…' : 'Speak or type…'}
        onSendMessage={send}
        onRecordingComplete={async (blob) => {
          setTranscribing(true);
          try {
            const text = await transcribeBlob(blob);
            if (text) send(text); // auto-send; change to set the composer value if you prefer review-first
          } catch (e) {
            console.error('[voice] on-device transcription failed', e);
          } finally {
            setTranscribing(false);
          }
        }}
      />
    </div>
  );
}

/** The real AIChat with the mic wired to a browser-resident Whisper. Tap mic → speak → it transcribes on-device → sends. */
export const OnDeviceVoice: Story = {
  render: () => <VoiceAIChat />,
};
