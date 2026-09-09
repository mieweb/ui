/**
 * Hands-free voice chat — the composition of the voice primitives (wake + speaker-verify + dictation +
 * AIChat). The logic + UI live in the shipped `<HandsFreeChat>` component (built on `useHeyOzwell`);
 * this story just renders it and exposes its behavior props in the Controls panel. Say "hey ozwell" to
 * dictate, "ozwell I'm done" to send. One shared mic.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { HandsFreeChat } from './HandsFreeChat';
import { suggestedActions } from '../storyData';

const meta: Meta = {
  id: 'voice-hands-free-chat',
  title: 'Modules/Voice/Hands-Free Chat',
  component: HandsFreeChat,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**A full-height, always-listening voice chat: the Hey Ozwell flow rendered as an inline \`AIChat\` instead of a floating popup.** \`HandsFreeChat\` calls \`useHeyOzwell({ autoStart: true, … })\` and renders \`AIChat\` (\`title\` default "Ozwell Assistant — hands-free", \`suggestions\`, \`userName\`) with the octopus \`HeyOzwellToggle\` + \`OzwellSettingsMenu\` overlaid in the header's top-right, a status-driven composer placeholder ("Ozwell is off — tap the octopus to listen" → "Say “hey ozwell”, or type…" → live caption while dictating), and a controlled \`RecordButton\` in the composer's trailing slot wired to \`startDictation\` / \`stopDictation\` on the **shared** stream so tap-to-talk and "hey ozwell" do the same thing. Deployment options are props — \`requireDoctor\` (default \`true\`), \`transcription\` \`browser\` | \`server\`, \`autoDictateOnWake\` (default \`true\`), \`liveTranscript\`, \`conversationMode\`, \`reviewBeforeSend\` — not runtime toggles; the settings menu's "Your voice" opens \`VoiceManager\` in a \`Modal\`. Say **"hey ozwell"** to dictate and **"ozwell I'm done"** to transcribe and send.

### Use it when

- The assistant **is the page** (a kiosk, a dictation workstation, a dedicated assistant tab) and should start listening as soon as it mounts.
- You want the reference composition of the primitives (\`useWakeWord\` + \`useSpeakerVerify\` + \`whisperTranscribe\` + \`AIChat\`) to copy from when building a custom voice surface.

### Don't use it when

- Voice should live in the app header and open on demand — \`HeyOzwell\` (floating chat, click to activate; no mic until the user opts in).
- You need multiple speakers attributed in one transcript rather than a turn-taking chat — \`VisitScribe\`.
- The product's chat is not \`AIChat\` — use \`useHeyOzwell\` and spread \`chatProps\` / \`toggleProps\` onto your own components.
- You cannot accept an auto-started microphone: \`autoStart\` is hard-wired here, so the permission prompt appears on mount.

### Example

\`\`\`tsx
import { HandsFreeChat } from '@mieweb/ui';

// Deployment config comes from the host's settings, never hard-coded per user.
<HandsFreeChat
  title={t('assistant.title')}
  userName={user.displayName}
  suggestions={suggestions}
  requireDoctor={settings.voice.requireEnrolledClinician}
  transcription={settings.voice.serverAsr ? 'server' : 'browser'}
  reviewBeforeSend
  conversationMode={settings.voice.roomMode}
/>
\`\`\`

### Limitations

- **No \`onSend\` prop.** Unlike \`HeyOzwell\`, this component always uses the hook's built-in send: a streamed reply from the OpenAI-compatible endpoint in \`localStorage.ozwellConfig\` / \`window.__ozwell\`, or a canned "Heard: …" reply when no key is configured. To route to your own backend use \`useHeyOzwell({ onSend })\` with your own layout. A browser-held API key is visible to users — proxy it in production.
- **Layout is fixed:** \`height: 100vh\` flex column with the octopus absolutely positioned (\`top: 11px; right: 16px\`) over \`AIChat\`'s header — it is a page, not an embeddable widget, and the overlay is physical (RTL would need repositioning).
- Inherits every dependency of \`HeyOzwell\`: wake models (~6 MB), the speaker runtime (~50 MB, loaded because \`requireDoctor\` defaults to \`true\`), Transformers.js + Whisper (~1.3 GB turbo / ~75 MB base.en) from configurable hosts, OPFS / Cache API / service-worker caching, \`worker-src blob:\` under strict CSP, IndexedDB for voiceprints. \`transcription="server"\` POSTs audio to \`/v1/audio/transcriptions\` on the configured base URL (falls back to on-device on failure); \`conversationMode\` overrides it.
- **Accessibility as implemented:** the same as \`AIChat\` plus the toggle's \`aria-pressed\`; phase changes surface only as placeholder text and animation (no live region); the composer mic is a controlled \`RecordButton\` whose wrapper intercepts clicks (capture phase) to start/stop the shared recorder, so the button's own \`aria-label\`s describe a recorder it does not run. Errors from model loading appear as "⚠️ …" placeholder text.
- i18n: title, placeholders and the settings menu are English; wake phrases are fixed English models. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'voice-hey-ozwell-demo',
          why: 'HeyOzwell is a header toggle with a floating chat; HandsFreeChat is the same flow as a full inline chat surface.',
        },
        {
          type: 'alternative to',
          target: 'chat-aichat-voice',
          why: 'AIChat (Voice) is tap-to-record dictation on the plain AIChat; HandsFreeChat adds wake words, speaker verification and diarization.',
        },
        {
          type: 'contains',
          target: 'chat-aichat',
          why: 'The visible chat is AIChat driven by useHeyOzwell’s messages, placeholder and composer bindings.',
        },
        {
          type: 'uses',
          target: 'voice-voice-manager',
          why: 'The settings menu’s "Your voice" item opens VoiceManager in a Modal for enrollment.',
        },
      ],
    },
  },
};
export default meta;

interface HandsFreeArgs {
  /** Doctor-only gate: only the enrolled voice(s) act once enrolled (loads the speaker runtime). */
  requireDoctor: boolean;
  /** On-device (PHI-safe) vs. record the clip and POST it to the server ASR model. */
  transcription: 'browser' | 'server';
  /** ON: "hey ozwell" starts dictating hands-free. OFF: it just focuses the chat. */
  autoDictateOnWake: boolean;
  /** Fill the box with recognized words as you speak (on-device dictation). */
  liveTranscript: boolean;
  /** Diarize the clip on "done" and send a speaker-labeled transcript (who said what). */
  conversationMode: boolean;
  /** Put the transcript in the box to edit before sending, instead of auto-sending. */
  reviewBeforeSend: boolean;
}

/** Say "hey ozwell" to dictate, "ozwell I'm done" to send. Use the Controls panel to configure it. */
export const HandsFree: StoryObj<HandsFreeArgs> = {
  args: {
    requireDoctor: true,
    transcription: 'browser',
    autoDictateOnWake: true,
    liveTranscript: false,
    conversationMode: false,
    reviewBeforeSend: false,
  },
  argTypes: {
    requireDoctor: {
      name: 'Your voice only (doctor gate)',
      control: 'boolean',
      description:
        'Only the enrolled voice(s) trigger Ozwell once enrolled (loads the on-device speaker runtime).',
    },
    transcription: {
      name: 'Transcribe on server',
      control: 'radio',
      options: ['browser', 'server'],
      description:
        'browser: on-device, PHI-safe (default). server: record the clip and POST it to the ' +
        'OpenAI-compatible /v1/audio/transcriptions endpoint (uses the server ASR model).',
    },
    autoDictateOnWake: {
      name: 'Auto-dictate on wake',
      control: 'boolean',
      description:
        'ON: “hey ozwell” starts dictating hands-free. OFF: it just focuses the chat.',
    },
    liveTranscript: {
      name: 'Live caption',
      control: 'boolean',
      description:
        'Fill the box with recognized words as you speak (on-device dictation only). The final send ' +
        'still re-transcribes the whole clip at full quality, so this preview never affects the result.',
    },
    conversationMode: {
      name: 'Conversation mode',
      control: 'boolean',
      description:
        'On “done”, diarize the clip and send a speaker-labeled transcript ("Dr. Jane: … / Patient: …") ' +
        'so the assistant knows who said what in a multi-person room. On-device; overrides server transcription.',
    },
    reviewBeforeSend: {
      name: 'Review before send',
      control: 'boolean',
      description:
        'On “done”, drop the transcript into the message box to review/edit before sending, instead of ' +
        'auto-sending. An accuracy safety net; off keeps the flow fully hands-free.',
    },
  },
  render: (args) => (
    <HandsFreeChat
      userName="Dr. Jane"
      suggestions={suggestedActions}
      requireDoctor={args.requireDoctor}
      transcription={args.transcription}
      autoDictateOnWake={args.autoDictateOnWake}
      liveTranscript={args.liveTranscript}
      conversationMode={args.conversationMode}
      reviewBeforeSend={args.reviewBeforeSend}
    />
  ),
};
