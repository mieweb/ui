/**
 * Visit Scribe — the ambient-visit surface. Record a multi-person encounter, stop, and Ozwell writes a
 * speaker-labeled transcript (enrolled voices named via Voice Manager; unknowns as "Speaker N", or
 * AI-inferred roles when the toggle is on and a chat backend is configured). All on-device — audio never
 * leaves the page. Batch flow (Phase 1); live running transcript arrives in Phase 2. See AI/DIARIZATION.md.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { VisitScribe } from './VisitScribe';

const meta: Meta<typeof VisitScribe> = {
  id: 'voice-visit-scribe',
  title: 'Modules/Voice/Visit Scribe',
  component: VisitScribe,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**An ambient scribe for multi-person encounters: record the room, stop, and get an on-device speaker-labelled transcript you can correct.** \`VisitScribe\` (props \`title\`, \`subtitle\`, \`inferRoles\`, \`liveTranscript\`, \`diarizationOptions\` — \`threshold\`, \`maxSpeakers\`, \`minSegmentSeconds\`, \`identifyThreshold\`, \`merge\` — and \`className\`) is the UI over \`useVisitScribe\`, which owns a \`MediaRecorder\` and an elapsed timer and, on **Stop**, runs \`useDiarization\`: Whisper word timestamps → TitaNet speaker embeddings → agglomerative clustering (\`threshold\`, default 0.65; \`maxSpeakers\` or Auto) → anchoring to voices enrolled in \`VoiceManager\` (\`identifyThreshold\`) → optional LLM role inference for unknown speakers ("Label unknown speakers with AI", only when a chat backend is configured). Unknown speakers are "Speaker N". With **Live transcript** on, \`transcribeSamples\` runs on ~7 s chunks of new audio for a rough running caption (no labels) that the clean diarized transcript replaces on stop. Afterwards: **Edit speakers** to rename (renaming two to the same name merges them) or reassign a single line; **Re-analyze** re-runs diarization on the stored clip with new Advanced settings without re-recording; **New visit** starts over. Also exported: \`useVisitScribe\`, \`useDiarization\`, and the pure helpers \`clusterEmbeddings\`, \`labelClusters\`, \`attributeSegments\`, \`mergeTurns\`, \`inferSpeakerRoles\`.

### Use it when

- A clinician wants a **who-said-what** record of a visit (doctor / patient / nurse) without wake words or turn-taking, and audio must not leave the browser.
- People in the room are enrolled (\`VoiceManager\`) so their turns come back named; everyone else can be labelled afterwards.
- You want to tune attribution on a real clip (\`Advanced\` → Speakers / Merge → Re-analyze) before deciding on defaults for a deployment.

### Don't use it when

- You just need the **audio file** (voicemail, dictated memo) — \`AudioRecorder\` records, previews and hands you a \`Blob\` with no models.
- The interaction is a dialogue with the assistant — \`HandsFreeChat\` / \`HeyOzwell\` (dictation → reply); \`conversationMode\` there diarizes a single dictated clip.
- You need a **live**, labelled, word-synced transcript with playback — the live caption here is rough and unlabelled; \`TranscriptView\` displays word-timed transcripts you already have.
- The device cannot host the models (see Limitations) or a server-side scribe is mandated: there is no \`transcription="server"\` option here.

### Example

\`\`\`tsx
import { VisitScribe } from '@mieweb/ui';

// Point model assets at your hosts once at app start (see Voice › Overview → Dependencies & hosting).
<VisitScribe
  title={t('scribe.title')}
  subtitle={t('scribe.subtitle')}
  inferRoles={settings.scribe.aiRoles}          // only effective when an OpenAI-compatible backend is configured
  diarizationOptions={{ threshold: 0.65, identifyThreshold: settings.scribe.identifyThreshold }}
/>
\`\`\`

The component keeps the transcript in its own state; there is no \`onResult\` callback yet — to persist a note, read the DOM or drive \`useVisitScribe\` directly and render your own view.

### Limitations

- **No host callbacks.** \`VisitScribe\` exposes neither the diarized \`result\` nor the edited labels to the host; use \`useVisitScribe\` (\`start\`, \`stop\`, \`reanalyze\`, \`reset\`, \`result\`, \`liveText\`, \`elapsedMs\`) for anything beyond display.
- **Models and hosting:** loads the ~50 MB sherpa-onnx/TitaNet runtime (\`window.__ozwellAssets\` → \`sv-runtime/\`), Transformers.js from a CDN and Whisper turbo (~1.3 GB, WebGPU; \`base.en\` WASM fallback) from \`window.__ozwellWhisperHost\`; caching via Cache API + service worker (\`/ozwell-model-sw.js\`, Storybook-served only). "Ready" waits for both. Diarization is a batch pass after Stop and scales with clip length; \`inferRoles\` sends the **transcript text** (not audio) to the configured chat endpoint.
- **Browser requirements:** secure context, microphone (\`getUserMedia\` on Start; failure shows "Microphone unavailable"), \`MediaRecorder\`, Web Workers, WASM, ideally WebGPU. Enrolled voiceprints are read from IndexedDB.
- **Accessibility as implemented:** the two toggles are \`role="switch" aria-checked\` buttons; Advanced is \`aria-expanded\`; rename inputs and the per-line speaker \`<select>\` carry \`aria-label\`s ("Rename …", "Speaker for the line at Ns"). The status line ("Listening to the room…", "Writing the transcript…", "N turns · M speakers") and the live caption are **not** live regions; speaker colours are supplemented by names. The elapsed timer is text inside the Stop button.
- i18n: every string (title/subtitle defaults, "Start visit", "Stop", "Speaker N", role names such as "Patient") is English and Whisper turbo is multilingual but role inference prompts are English. RTL: the Stop dot uses \`mr-2\`. Entry \`@mieweb/ui\` (\`onnxruntime-web\` runtime dependency).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'media-audiorecorder',
          why: 'AudioRecorder captures a raw Blob for the host; VisitScribe records the room and produces an on-device speaker-labelled transcript.',
        },
        {
          type: 'uses',
          target: 'voice-voice-manager',
          why: 'Turns are anchored to voices enrolled through VoiceManager so known speakers come back named.',
        },
      ],
    },
  },
};
export default meta;

/** Record a multi-person visit → attributed transcript. */
export const Scribe: StoryObj<typeof VisitScribe> = {
  render: () => <VisitScribe />,
};
