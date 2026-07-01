/**
 * HandsFreeChat — the always-listening, doctor-gated chat surface.
 *
 * Composition of the voice primitives over `useHeyOzwell`: say "hey ozwell" → dictate → "ozwell I'm
 * done" → transcribe on-device → send. Unlike <HeyOzwell> (a header octopus + floating chat), this is
 * the full inline AIChat with the octopus in its header and the composer's mic button wired to the same
 * shared-stream dictation. Doctor-only by default (only the enrolled doctor's voice acts).
 */
import * as React from 'react';
import { AIChat } from '../AIChat';
import { RecordButton } from '../../RecordButton';
import { HeyOzwellToggle } from './HeyOzwellToggle';
import { useHeyOzwell } from './useHeyOzwell';
import type { AISuggestedAction } from '../types';

export interface HandsFreeChatProps {
  /** Chat header title. */
  title?: string;
  /** Suggested-action chips for the empty state. */
  suggestions?: AISuggestedAction[];
  /** Display name for the user's messages. */
  userName?: string;
  /** Transcribe on-device (default, PHI-safe) or POST audio to the server. */
  transcription?: 'browser' | 'server';
  /** Doctor-only gate — only the enrolled doctor's voice acts. Default true. */
  requireDoctor?: boolean;
}

/** Say "hey ozwell" to dictate, "ozwell I'm done" to send — wake + speaker-verify + dictation + AIChat. */
export function HandsFreeChat({
  title = 'Ozwell Assistant — hands-free',
  suggestions,
  userName,
  transcription = 'browser',
  requireDoctor = true,
}: HandsFreeChatProps) {
  const oz = useHeyOzwell({
    autoStart: true, // always listening while mounted
    autoDictateOnWake: true, // "hey ozwell" → dictate
    requireDoctor,
    transcription,
  });
  const { phase, ready, error, locked, level, toggleProps } = oz;

  const banner =
    phase === 'dictating'
      ? '🎙️ Dictating… say “ozwell I’m done” to send'
      : phase === 'transcribing'
        ? '⏳ Transcribing on-device…'
        : error
          ? `⚠️ ${error}`
          : ready
            ? `● Listening for “hey ozwell”${locked ? '  ·  🔒 your voice only' : '  ·  set up your voice to lock it to you'}`
            : '… loading models';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Octopus in the chat header's top-right — pulses with room volume while listening. AIChat has
            no header-action slot, so it's a positioned overlay. */}
        <div style={{ position: 'absolute', top: 11, right: 16, zIndex: 10 }}>
          <HeyOzwellToggle
            active={ready}
            loading={toggleProps.loading}
            loadProgress={toggleProps.loadProgress}
            warmActive={toggleProps.warmActive}
            warmProgress={toggleProps.warmProgress}
            loadLabel={toggleProps.loadLabel}
            level={level}
            size={34}
          />
        </div>
        <AIChat
          messages={oz.messages}
          height="100%"
          isGenerating={oz.isGenerating}
          title={title}
          suggestions={suggestions}
          userName={userName}
          inputPlaceholder={phase === 'listening' ? 'Say “hey ozwell”, or type…' : banner}
          onSendMessage={oz.send}
          composerProps={{
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
    </div>
  );
}
