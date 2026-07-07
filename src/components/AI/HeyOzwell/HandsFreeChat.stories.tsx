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
  title: 'Product/Feature Modules/AI/Hey Ozwell/Hands-Free Chat',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Composition of the voice primitives — wake-word + on-device speaker verify + on-device ' +
          'dictation + AIChat. Say **“hey ozwell”** to start dictating, **“ozwell I’m done”** to send. ' +
          'One shared mic. **Configuration is props-first** — the **Controls panel below is a live props ' +
          'editor** (doctor-only gate, transcription mode, auto-dictate), which is exactly how a host ' +
          'configures it when it mounts the component. **Transcribe on server** records the clip and ' +
          'POSTs it to the server ASR model instead of transcribing on-device. Turn on **Built-in ' +
          'settings menu** to also get the runtime octopus menu (long-press for those toggles + *Your ' +
          'voice* enrollment) — off by default, since the runtime control UX is the host’s call.',
      },
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
  /** Opt in to the runtime octopus menu (toggles + Your-voice enrollment). Off by default. */
  showSettingsMenu: boolean;
}

/** Say "hey ozwell" to dictate, "ozwell I'm done" to send. Use the Controls panel to configure it. */
export const HandsFree: StoryObj<HandsFreeArgs> = {
  args: {
    requireDoctor: true,
    transcription: 'browser',
    autoDictateOnWake: true,
    liveTranscript: false,
    conversationMode: false,
    showSettingsMenu: false,
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
      description: 'ON: “hey ozwell” starts dictating hands-free. OFF: it just focuses the chat.',
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
    showSettingsMenu: {
      name: 'Built-in settings menu',
      control: 'boolean',
      description:
        'Opt in to the runtime octopus menu (long-press for the toggles above + Your-voice enrollment, ' +
        'left-click to turn Ozwell off/on). Off by default — the host owns the runtime control UX.',
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
      showSettingsMenu={args.showSettingsMenu}
    />
  ),
};
