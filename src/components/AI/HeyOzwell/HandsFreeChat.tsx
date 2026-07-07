/**
 * HandsFreeChat — the always-listening, doctor-gated chat surface.
 *
 * Composition of the voice primitives over `useHeyOzwell`: say "hey ozwell" → dictate → "ozwell I'm
 * done" → transcribe → send. Unlike <HeyOzwell> (a header octopus + floating chat), this is the full
 * inline AIChat with the octopus in its header and the composer's mic button wired to the same
 * shared-stream dictation.
 *
 * Configuration is **props-first**: the host sets `requireDoctor`, `transcription`, `liveTranscript`,
 * `autoDictateOnWake` when it mounts the component (this is what the Storybook Controls panel edits —
 * those knobs are just a live props editor). How an end-user flips them at *runtime* is the host's
 * call, so the built-in long-press settings menu is **opt-in** via `showSettingsMenu` (off by default).
 * With it off, the octopus is a plain listening indicator and the host owns any settings UI — every
 * piece of state is also available from `useHeyOzwell` if they'd rather wire their own chrome.
 */
import * as React from 'react';
import { AIChat } from '../AIChat';
import { RecordButton } from '../../RecordButton';
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody } from '../../Modal';
import { HeyOzwellToggle } from './HeyOzwellToggle';
import { OzwellSettingsMenu, type OzwellSettingToggle } from './OzwellSettingsMenu';
import { VoiceManager } from './VoiceManager';
import { useHeyOzwell } from './useHeyOzwell';
import type { AISuggestedAction } from '../types';

export interface HandsFreeChatProps {
  /** Chat header title. */
  title?: string;
  /** Suggested-action chips for the empty state. */
  suggestions?: AISuggestedAction[];
  /** Display name for the user's messages. */
  userName?: string;
  /** Octopus logo source, forwarded to the toggle + the enrollment screen. */
  logoSrc?: string;
  /** Transcription mode — on-device (default, PHI-safe) or POST the recorded clip to the server ASR
   *  model. Initial value; the settings menu (if shown) can flip it live. */
  transcription?: 'browser' | 'server';
  /** Doctor-only gate — only the enrolled voice(s) act. Default true. Initial value; menu can flip it. */
  requireDoctor?: boolean;
  /** Live caption — fill the message box with recognized words as you dictate (on-device only). Initial value. */
  liveTranscript?: boolean;
  /** Conversation mode — on "done", diarize the clip and send a speaker-labeled transcript ("Dr. Jane: … /
   *  Patient: …") so the assistant knows who said what in a multi-person room. On-device; slower than plain
   *  transcription and overrides server transcription. Initial value; menu can flip it. Default false. */
  conversationMode?: boolean;
  /** Auto-dictate — "hey ozwell" starts dictating hands-free. Default true. Initial value. */
  autoDictateOnWake?: boolean;
  /**
   * Opt in to the built-in runtime settings menu: long-press / right-click the octopus for "Your voice"
   * (enroll / manage, in a modal) + live switches for the gate, live caption, auto-dictate and server
   * transcription, plus left-click to turn Ozwell off/on. Off by default — how (or whether) an end-user
   * toggles these at runtime is a product decision that belongs to the host. With it off, the octopus is
   * a plain listening indicator; wire your own controls via `useHeyOzwell` if you want them elsewhere.
   */
  showSettingsMenu?: boolean;
}

/** Say "hey ozwell" to dictate, "ozwell I'm done" to send — wake + speaker-verify + dictation + AIChat. */
export function HandsFreeChat({
  title = 'Ozwell Assistant — hands-free',
  suggestions,
  userName,
  logoSrc,
  transcription: transcriptionProp = 'browser',
  requireDoctor: requireDoctorProp = true,
  liveTranscript: liveTranscriptProp = false,
  conversationMode: conversationModeProp = false,
  autoDictateOnWake: autoDictateProp = true,
  showSettingsMenu = false,
}: HandsFreeChatProps) {
  // Props seed the configuration; the opt-in settings menu flips these at runtime (when shown). These
  // stay in sync with the props: if the host (or the Storybook Controls panel) changes a prop, the effect
  // below adopts it — the menu still overrides in between prop changes. So the props remain a live source
  // of truth, not a mount-only snapshot.
  const [transcription, setTranscription] = React.useState(transcriptionProp);
  const [requireDoctor, setRequireDoctor] = React.useState(requireDoctorProp);
  const [autoDictate, setAutoDictate] = React.useState(autoDictateProp);
  const [live, setLive] = React.useState(liveTranscriptProp);
  const [conversation, setConversation] = React.useState(conversationModeProp);
  const [voicesOpen, setVoicesOpen] = React.useState(false);
  // The composer's typed text (controlled), so we can push the live caption into the box while dictating.
  const [typed, setTyped] = React.useState('');
  React.useEffect(() => setTranscription(transcriptionProp), [transcriptionProp]);
  React.useEffect(() => setRequireDoctor(requireDoctorProp), [requireDoctorProp]);
  React.useEffect(() => setAutoDictate(autoDictateProp), [autoDictateProp]);
  React.useEffect(() => setLive(liveTranscriptProp), [liveTranscriptProp]);
  React.useEffect(() => setConversation(conversationModeProp), [conversationModeProp]);

  const oz = useHeyOzwell({
    autoStart: true, // always listening while mounted
    autoDictateOnWake: autoDictate,
    requireDoctor,
    transcription,
    liveTranscript: live,
    conversationMode: conversation,
  });
  const { phase, ready, error, locked } = oz;

  // While dictating with live caption on, the recognized text fills the composer box; otherwise it shows
  // whatever the user typed. The final send always uses the full-clip transcription, not this preview.
  const dictatingLive = phase === 'dictating' && live && transcription === 'browser';
  const composerValue = dictatingLive ? oz.liveText : typed;

  const toggles: OzwellSettingToggle[] = [
    {
      id: 'doctor',
      label: 'Your voice only',
      sub: 'Only enrolled voices trigger Ozwell',
      checked: requireDoctor,
      onChange: setRequireDoctor,
    },
    {
      id: 'conversation',
      label: 'Conversation mode',
      sub: 'Label who said what — send a speaker-tagged transcript for a multi-person room',
      checked: conversation,
      onChange: setConversation,
    },
    {
      id: 'server',
      label: 'Transcribe on server',
      sub: 'Send the audio to the server ASR model instead of on-device',
      checked: transcription === 'server',
      disabled: conversation, // conversation mode diarizes on-device, overriding server transcription
      onChange: (c) => setTranscription(c ? 'server' : 'browser'),
    },
    {
      id: 'live',
      label: 'Live caption',
      sub: 'Fill the box with words as you speak (on-device dictation only)',
      checked: live,
      disabled: transcription === 'server', // preview runs on the on-device model
      onChange: setLive,
    },
    {
      id: 'auto',
      label: 'Auto-dictate on “hey ozwell”',
      sub: 'Wake starts dictation hands-free (off: it just focuses the chat)',
      checked: autoDictate,
      onChange: setAutoDictate,
    },
  ];

  // Composer placeholder: our own listening/off banner while idle; the hook's placeholder while
  // dictating/transcribing (it carries the live caption text + server-vs-device wording).
  const placeholder = !oz.active
    ? 'Ozwell is off — tap the octopus to listen'
    : phase === 'listening'
      ? ready
        ? `Say “hey ozwell”, or type…${locked ? '  ·  🔒 your voice only' : ''}`
        : error
          ? `⚠️ ${error}`
          : '… loading models'
      : oz.chatProps.inputPlaceholder;

  // The octopus. With the menu on it's the interactive trigger (on/off + long-press settings); with it
  // off it's a plain listening indicator (pulses with room volume, shows model loading) — no controls.
  const octopus = showSettingsMenu ? (
    <OzwellSettingsMenu
      trigger={<HeyOzwellToggle {...oz.toggleProps} logoSrc={logoSrc} size={34} />}
      open={oz.settingsOpen}
      onOpenChange={oz.setSettingsOpen}
      modelStatus={oz.modelStatus}
      onManageVoices={() => setVoicesOpen(true)}
      toggles={toggles}
    />
  ) : (
    <HeyOzwellToggle
      active={oz.toggleProps.active}
      level={oz.toggleProps.level}
      loading={oz.toggleProps.loading}
      loadProgress={oz.toggleProps.loadProgress}
      warmActive={oz.toggleProps.warmActive}
      warmProgress={oz.toggleProps.warmProgress}
      loadLabel={oz.toggleProps.loadLabel}
      logoSrc={logoSrc}
      size={34}
    />
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Octopus in the chat header's top-right. AIChat has no header-action slot, so it's a
            positioned overlay. */}
        <div style={{ position: 'absolute', top: 11, right: 16, zIndex: 10 }}>{octopus}</div>
        <AIChat
          messages={oz.messages}
          height="100%"
          isGenerating={oz.isGenerating}
          title={title}
          suggestions={suggestions}
          userName={userName}
          inputPlaceholder={placeholder}
          onSendMessage={oz.send}
          composerProps={{
            // Controlled input: normally the user's typed text; while dictating with live caption on, the
            // recognized-so-far text fills the box. Typing is ignored during the live overlay (hands-free).
            value: composerValue,
            onValueChange: (v) => {
              if (!dictatingLive) setTyped(v);
            },
            // The composer's OWN mic button, driven by our shared stream (controlled mode disables its
            // internal recorder). So the built-in mic and "hey ozwell" both do the same thing — one mic.
            inputTrailing: (
              <span
                onClickCapture={() => {
                  if (phase === 'dictating') oz.stopDictation();
                  else if (phase === 'listening') oz.startDictation();
                }}
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

      {/* "Your voice" — the central enrollment / manage page, opened from the settings menu (so only when
          that's shown). Set up, add, rename, remove authorized voices. */}
      {showSettingsMenu && (
        <Modal open={voicesOpen} onOpenChange={setVoicesOpen} size="lg">
          <ModalHeader>
            <ModalTitle>Your voice</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <ModalBody>
            <VoiceManager logoSrc={logoSrc} />
          </ModalBody>
        </Modal>
      )}
    </div>
  );
}
