/**
 * Voice Manager — the central "your voice" page. Logic + UI live in the shipped `<VoiceManager>`
 * component; this story just renders it. Set up your voice, add another (assistant / new condition),
 * or clear everything. On-device.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { VoiceManager } from './VoiceManager';

const meta: Meta<typeof VoiceManager> = {
  id: 'voice-voice-manager',
  title: 'Modules/Voice/Voice Manager',
  component: VoiceManager,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**The "Your voice" page: list, rename, remove, add and clear the voices Ozwell is allowed to respond to, and launch \`VoiceSetup\` for enrollment.** \`VoiceManager\` (single prop \`logoSrc\`) reads enrolled voices from \`useSpeakerVerify().listVoices()\` — each \`{ id, label, createdAt, conditions }\` — and renders one card per voice with **Rename** (inline input, Enter saves / Escape cancels) and **Remove** (with a confirmation step), an "Add a voice" input + button that opens \`VoiceSetup mode="add"\` under a fresh \`voiceId\`, and **Clear all voices** (confirmation, also clears the phrase-prints). With nothing enrolled it shows "Set up your voice", which opens \`VoiceSetup mode="enroll"\` for the default voice \`you\`. \`onDone\` / \`onCancel\` from the setup screen return here and refresh the list. Voiceprints live in IndexedDB (\`ozwell-voice\`); the footer states "Voiceprints stay on your device — they're never uploaded." Also exported: \`useSpeakerVerify\` (\`enroll\`, \`verify\`, \`identify\`, \`listVoices\`, \`removeVoice\`, \`renameVoice\`, \`clear\`, \`setGates\`) and the store helpers \`getVoiceprints\` / \`setVoiceprints\` / \`clearVoiceprints\` / \`loadWhatPrints\` / \`saveWhatPrints\` / \`clearWhatPrints\`.

### Use it when

- Your app uses \`requireDoctor\` (\`HeyOzwell\` / \`HandsFreeChat\`) or \`VisitScribe\` speaker naming and needs a **settings destination** where the clinician manages who is enrolled — wire it to \`HeyOzwell onManageVoices\` or a \`/settings/voice\` route.
- A second person (a medical assistant) or a second condition (mask, distance) must be authorised alongside the primary voice.

### Don't use it when

- You only need the **enrollment flow** embedded in onboarding — \`VoiceSetup\` alone, with your own \`onDone\`.
- You need to inspect scores or tune thresholds — that is the developer diagnostic \`Speaker Verify\`.
- Voices must be managed **centrally** (server-side identity, cross-device): this component is per-browser storage with no sync or export.

### Example

\`\`\`tsx
import { VoiceManager } from '@mieweb/ui';

// Settings route; the same page HeyOzwell's "Your voice" menu item should navigate to.
export function VoiceSettingsPage() {
  return (
    <section aria-labelledby="voice-heading" className="h-full">
      <VisuallyHidden><h1 id="voice-heading">{t('settings.voice')}</h1></VisuallyHidden>
      <VoiceManager logoSrc={branding.ozwellIcon} />
    </section>
  );
}
\`\`\`

### Limitations

- **Loads the speaker runtime on mount** (~50 MB sherpa-onnx/TitaNet from \`window.__ozwellAssets\` → \`sv-runtime/\`, cached by the service worker when served); until \`ready\` it shows "Loading…", and on failure "Couldn't load the voice models — check the console." Entering setup additionally starts the wake detector and asks for the microphone.
- **Per-browser, per-origin storage.** Voiceprints are IndexedDB entries; clearing site data, another browser or another device means re-enrolling. Nothing is exported or uploaded, and there is no callback telling the host that the list changed.
- **Accessibility as implemented:** rename/add inputs carry \`aria-label\`s ("Voice name", "New voice name"); action buttons are text \`Button\`s; Remove / Clear all confirm through the shared \`AlertDialog\`. Loading and error states are plain text with no live region; the octopus logo is decorative. The page renders its own \`<h1>\` ("Your voice").
- **Layout:** a centred, full-height page (\`min-h-full\`, max width 460px) intended to own the viewport or a Modal body — not a compact widget.
- i18n: all copy is English and hard-coded (there are no label props). Theming: semantic tokens plus the Ozwell accent (\`text-ozwell\`, \`ozBtn\` override). Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'contains',
          target: 'voice-voice-setup',
          why: '"Set up your voice" and "Add a voice" swap the page for VoiceSetup in enroll or add mode.',
        },
        {
          type: 'uses',
          target: 'voice-speaker-verify',
          why: 'The voice list and rename/remove/clear actions call useSpeakerVerify’s store methods.',
        },
      ],
    },
  },
};
export default meta;

/** Manage your enrolled voices — set up, add, or clear. */
export const Manage: StoryObj<typeof VoiceManager> = {
  render: () => <VoiceManager />,
};
