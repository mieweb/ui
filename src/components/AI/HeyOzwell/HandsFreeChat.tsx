/**
 * HandsFreeChat — the always-listening, doctor-gated chat surface.
 *
 * Composition of the voice primitives over `useHeyOzwell`: say "hey ozwell" → dictate → "ozwell I'm
 * done" → transcribe → send. Unlike <HeyOzwell> (a header octopus + floating chat), this is the full
 * inline AIChat with the octopus in its header and the composer's mic button wired to the same
 * shared-stream dictation.
 *
 * Configuration is **props-first**: `requireDoctor`, `transcription`, `liveTranscript`, `conversationMode`
 * and `autoDictateOnWake` are set by the host at mount (the Storybook Controls panel is just a live props
 * editor for them). They are deployment config, not clinician-facing runtime toggles, so they are NOT in
 * the octopus menu. The octopus behaves exactly like the <HeyOzwell> drop-in — click toggles Ozwell
 * on/off, long-press / right-click opens the end-user settings menu ("Your voice" enrollment + a
 * read-only "Models & versions" readout).
 */
import * as React from 'react';
import { AIChat } from '../AIChat';
import { RecordButton } from '../../RecordButton';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
} from '../../Modal';
import { HeyOzwellToggle } from './HeyOzwellToggle';
import { OzwellSettingsMenu } from './OzwellSettingsMenu';
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
  /** Transcription mode — on-device (default, PHI-safe) or POST the recorded clip to the server ASR model. */
  transcription?: 'browser' | 'server';
  /** Doctor-only gate — only the enrolled voice(s) act. Default true. */
  requireDoctor?: boolean;
  /** Live caption — fill the message box with recognized words as you dictate (on-device only). Default false. */
  liveTranscript?: boolean;
  /** Conversation mode — on "done", diarize the clip and send a speaker-labeled transcript ("Dr. Jane: … /
   *  Patient: …") so the assistant knows who said what in a multi-person room. On-device; overrides server
   *  transcription. Default false. */
  conversationMode?: boolean;
  /** Review before send — on "done", put the transcript in the message box to edit before sending, instead
   *  of sending automatically. Default false. */
  reviewBeforeSend?: boolean;
  /** Auto-dictate — "hey ozwell" starts dictating hands-free. Default true. */
  autoDictateOnWake?: boolean;
}

/** Say "hey ozwell" to dictate, "ozwell I'm done" to send — wake + speaker-verify + dictation + AIChat. */
export function HandsFreeChat({
  title = 'Ozwell Assistant — hands-free',
  suggestions,
  userName,
  logoSrc,
  transcription = 'browser',
  requireDoctor = true,
  liveTranscript = false,
  conversationMode = false,
  reviewBeforeSend = false,
  autoDictateOnWake = true,
}: HandsFreeChatProps) {
  // Props flow straight through — the host (or the Storybook Controls panel) drives them live; there's no
  // runtime toggle UI for them, since they're deployment config, not end-user controls.
  const oz = useHeyOzwell({
    autoStart: true, // always listening while mounted
    autoDictateOnWake,
    requireDoctor,
    transcription,
    liveTranscript,
    conversationMode,
    reviewBeforeSend,
  });
  const { phase, ready, error } = oz;

  const [voicesOpen, setVoicesOpen] = React.useState(false);

  // Composer placeholder: our own listening/off banner while idle; the hook's placeholder while
  // dictating/transcribing (it carries the live caption text + server-vs-device wording).
  const placeholder = !oz.active
    ? 'Ozwell is off — tap the octopus to listen'
    : phase === 'listening'
      ? ready
        ? 'Say “hey ozwell”, or type…'
        : error
          ? `⚠️ ${error}`
          : '… loading models'
      : oz.chatProps.inputPlaceholder;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Octopus in the chat header's top-right — same behavior as the <HeyOzwell> drop-in: click toggles
            on/off, long-press / right-click opens the end-user settings menu. AIChat has no header-action
            slot, so it's a positioned overlay. */}
        <div style={{ position: 'absolute', top: 11, right: 16, zIndex: 10 }}>
          <OzwellSettingsMenu
            trigger={
              <HeyOzwellToggle
                {...oz.toggleProps}
                logoSrc={logoSrc}
                size={34}
              />
            }
            open={oz.settingsOpen}
            onOpenChange={oz.setSettingsOpen}
            modelStatus={oz.modelStatus}
            onManageVoices={() => setVoicesOpen(true)}
          />
        </div>
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
            // Controlled input (value/onValueChange) comes from the hook — it fills the box with the live
            // caption while dictating, else the typed text. We only add the mic button here.
            ...oz.chatProps.composerProps,
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
                  state={
                    phase === 'dictating'
                      ? 'recording'
                      : phase === 'transcribing'
                        ? 'processing'
                        : 'idle'
                  }
                />
              </span>
            ),
          }}
        />
      </div>

      {/* "Your voice" — the central enrollment / manage page, opened from the settings menu. Set up, add,
          rename, remove authorized voices. */}
      <Modal open={voicesOpen} onOpenChange={setVoicesOpen} size="lg">
        <ModalHeader>
          <ModalTitle>Your voice</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <VoiceManager logoSrc={logoSrc} />
        </ModalBody>
      </Modal>
    </div>
  );
}
