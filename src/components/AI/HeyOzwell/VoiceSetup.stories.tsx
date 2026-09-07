/**
 * Voice Setup — the client-facing enrollment screen. The logic + UI now live in the shipped
 * `<VoiceSetup>` component (and `useVoiceSetup` hook); this story just renders it.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { VoiceSetup } from './VoiceSetup';

const meta: Meta<typeof VoiceSetup> = {
  id: 'voice-voice-setup',
  title: 'Modules/Voice/Voice Setup',
  component: VoiceSetup,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**The guided, Apple-style enrollment screen: tap the octopus, say "hey ozwell" and "ozwell I'm done" three times each, and both the speaker (WHO) and phrase (WHAT) voiceprints are saved on-device.** \`VoiceSetup\` is presentation over \`useVoiceSetup\`, which runs \`useSpeakerVerify\` + \`useWakeWord\` together: the wake detector supplies the shared mic stream and phrase embeddings, a rolling recorder captures each utterance, and on completion the TitaNet centroid is stored per phrase (\`enroll\`) and the phrase-prints are saved (\`saveWhatPrints\`). Props: \`mode\` \`enroll\` (replace the default voice \`you\`) | \`add\` (append another voice or condition under \`voiceId\` / \`label\`), \`logoSrc\`, \`onDone\`, \`onCancel\`. Phases (\`VoiceSetupPhase\`): \`intro\` → \`getready\` → \`speak\` → \`gotit\` | \`deny\` (retry: "Let's try that again") → \`done\`, with progress dots for the 6 reps, a volume-reactive octopus and "Add another spot" to append a further room/distance condition. Also exported: \`useVoiceSetup\` (\`ready\`, \`phase\`, \`phrase\`, \`step\`, \`total\`, \`level\`, \`start\`, \`addAnotherSpot\`, \`cancel\`).

### Use it when

- A clinician is turning on the **doctor-only gate** (\`requireDoctor\`) for the first time, or adding a colleague / a masked-voice condition — typically launched from \`VoiceManager\` or an onboarding step.
- You want \`VisitScribe\` to name a speaker instead of "Speaker N".

### Don't use it when

- You need to see or manage what is already enrolled — \`VoiceManager\` wraps this screen with the list, rename and remove actions.
- You want a compact or embedded control: this is a full-bleed, centred page with large type and animation.
- The device cannot load the ~50 MB speaker runtime plus the wake models, or the user cannot speak the two fixed English phrases.

### Example

\`\`\`tsx
import { VoiceSetup } from '@mieweb/ui';

// Onboarding step: enroll the signed-in clinician, then continue.
<VoiceSetup
  mode="enroll"
  voiceId={user.id}
  label={user.displayName}
  logoSrc={branding.ozwellIcon}
  onDone={() => { analytics.track('voice_enrolled'); next(); }}
  onCancel={skip}
/>
\`\`\`

### Limitations

- **Models and mic on mount:** loads the speaker runtime (~50 MB) and the wake models (~6 MB, \`onnxruntime-web\`) and opens the microphone as soon as the hook initialises, before the user taps — the permission prompt appears immediately. Requires a secure context, AudioWorklet, WASM and IndexedDB.
- **Fixed enrollment protocol:** two English phrases × 3 reps, 5 s timeout per rep, phrase validation via the wake model; a rejected rep shakes and repeats (\`deny\`). Quality depends on enrolling in the real room/mic — mismatches later show up as ignored wakes.
- **Accessibility as implemented:** the octopus is a real \`<button>\` (\`aria-label\` "Set up your voice" in intro, disabled otherwise); "← Cancel", "Add another spot" and "Done" are \`Button\`s. Phase text ("Get ready…", "Now say it", "Got it!") changes without a live region and the progress dots are visual only; motion (float, bounce, shake, rings) does not honour \`prefers-reduced-motion\`.
- **Physical positioning:** Cancel is \`absolute top-4 left-4\`, the success check sits at \`right:-2; bottom:-2\` — not RTL-aware. Layout uses inline styles and Ozwell accent colours (\`--mieweb-ozwell\`) over the themeable background.
- i18n: all copy is English and hard-coded; \`onDone\` fires only from the Done button (no auto-advance). Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'voice-speaker-verify',
          why: 'Each captured utterance is enrolled through useSpeakerVerify to build the WHO voiceprint.',
        },
        {
          type: 'uses',
          target: 'voice-wake-word',
          why: 'useVoiceSetup runs useWakeWord for the shared mic stream and the WHAT phrase embeddings.',
        },
      ],
    },
  },
};
export default meta;

/** Tap the Ozwell octopus; it pulses as you talk. On-device, brand-aligned enrollment. */
export const Setup: StoryObj<typeof VoiceSetup> = {
  render: () => <VoiceSetup />,
};

/** "Add a voice" — starts directly in append mode, so it adds another authorized voice (an assistant, or
 *  you under a new condition — mask, distance) to the existing voiceprint rather than requiring a fresh
 *  enroll first. This is what the settings menu's "Add a voice" opens. */
export const Add: StoryObj<typeof VoiceSetup> = {
  name: 'Add a voice',
  render: () => <VoiceSetup mode="add" />,
};
