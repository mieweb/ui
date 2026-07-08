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
import { HeyOzwell } from './HeyOzwell';
import { HeyOzwellToggle, type HeyOzwellToggleProps } from './HeyOzwellToggle';
import { suggestedActions } from '../storyData';

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

interface DemoArgs {
  /** ON: "hey ozwell" opens the chat AND starts dictating. OFF: it just opens the chat and waits. */
  autoDictateOnWake: boolean;
  /** Close the chat popup after "ozwell I'm done" transcribes + sends. */
  closeChatOnDone: boolean;
  /** Transcribe on-device (browser, PHI-safe) or POST audio to the server. */
  transcription: 'browser' | 'server';
  /** Doctor-only gate: only the enrolled voice(s) act once enrolled (loads the speaker runtime). */
  requireDoctor: boolean;
  /** Live caption: recognized words fill the composer box as you dictate. */
  liveTranscript: boolean;
  /** Conversation mode: diarize the clip on "done" and send a speaker-labeled transcript (who said what). */
  conversationMode: boolean;
  /** Review before send: put the transcript in the box to edit before sending, instead of auto-sending. */
  reviewBeforeSend: boolean;
}

function Demo({ autoDictateOnWake, closeChatOnDone, transcription, requireDoctor, liveTranscript, conversationMode, reviewBeforeSend }: DemoArgs) {
  // The whole flow now lives in the shipped <HeyOzwell> drop-in — the host only places the octopus in
  // its header and wires where the settings items navigate. (For custom layouts, useHeyOzwell + the
  // parts give the same behavior; see the component source.)
  return (
    <div data-hey-ozwell-demo className="bg-background relative" style={{ height: 460 }}>
      {/* Pointer cursor on the floating chat trigger — scoped to THIS demo only (AIChatTrigger is a shared
          library component, so we don't change it globally). FloatingAIChat doesn't forward a className to
          its trigger, so target its data-slot within this wrapper. */}
      <style>{`[data-hey-ozwell-demo] [data-slot="ai-chat-trigger"]{cursor:pointer}`}</style>

      {/* Header bar — app name + the drop-in Hey Ozwell (octopus toggle + settings menu + floating chat) */}
      <div className="border-border bg-background flex items-center border-b px-[22px] py-3">
        <strong className="text-foreground text-[15px] font-bold">BlueHive EHR</strong>
        <span className="flex-1" />
        <HeyOzwell
          autoDictateOnWake={autoDictateOnWake}
          closeChatOnDone={closeChatOnDone}
          transcription={transcription}
          requireDoctor={requireDoctor}
          liveTranscript={liveTranscript}
          conversationMode={conversationMode}
          reviewBeforeSend={reviewBeforeSend}
          size={40}
          chatProps={{ suggestions: suggestedActions, userName: 'Dr. Jane' }}
          // "Your voice" opens the central Voice Manager page (set up / add / rename / remove voices). In a
          // real app this opens the host's voice-management surface. Diagnostics (wake-word test, speaker
          // verify) are dev-only and intentionally NOT surfaced in the product settings menu.
          onManageVoices={gotoStory(`${HEY_OZWELL}/Voice Manager`, 'Manage')}
        />
      </div>

      {/* Body — a faux app surface behind the floating chat. The octopus ring + chat placeholder now carry
          the live loading / listening / dictating feedback, so this stays a simple, static intro. */}
      <div className="bg-muted text-muted-foreground h-full p-7 text-sm">
        <p className="mt-0">
          Click the gray octopus in the header to turn Ozwell on, then say{' '}
          <b className="text-foreground">“hey ozwell”</b>.
        </p>
        <p className="text-muted-foreground mt-3.5 text-[12.5px]">
          Tip: <b>right-click</b> (or long-press) the octopus for Ozwell settings.
        </p>
      </div>
    </div>
  );
}

/**
 * The full flow. Use the Controls panel to switch **Auto-dictate on wake** on/off, and right-click /
 * long-press the octopus for Ozwell settings.
 */
export const Interactive: StoryObj<DemoArgs> = {
  args: { autoDictateOnWake: false, closeChatOnDone: false, transcription: 'browser', requireDoctor: false, liveTranscript: false, conversationMode: false, reviewBeforeSend: false },
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
    requireDoctor: {
      name: 'Doctor-only gate',
      control: 'boolean',
      description:
        'ON: only enrolled voice(s) act on a wake (loads the ~50 MB speaker runtime). Open until you enroll ' +
        'via the settings menu → Your voice. OFF: any voice can wake it.',
    },
    liveTranscript: {
      name: 'Live caption',
      control: 'boolean',
      description:
        'ON: while dictating, the recognized words fill the composer box in near-real-time (on-device / ' +
        'browser mode only). The final send still uses the full-clip transcription. OFF: a “Dictating…” hint.',
    },
    conversationMode: {
      name: 'Conversation mode',
      control: 'boolean',
      description:
        'ON: on “ozwell I’m done”, diarize the clip and send a speaker-labeled transcript ("Dr. Jane: … / ' +
        'Patient: …") so the assistant knows who said what in a multi-person room. On-device; overrides server ' +
        'transcription. Enroll voices (settings → Your voice) to see real names instead of “Speaker N”.',
    },
    reviewBeforeSend: {
      name: 'Review before send',
      control: 'boolean',
      description:
        'ON: on “done”, drop the transcript into the message box to review/edit before sending, instead of ' +
        'auto-sending. An accuracy safety net; OFF keeps it fully hands-free.',
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
