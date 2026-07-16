/**
 * Visit Scribe — the ambient-visit surface. Record a multi-person encounter, stop, and Ozwell writes a
 * speaker-labeled transcript (enrolled voices named via Voice Manager; unknowns as "Speaker N", or
 * AI-inferred roles when the toggle is on and a chat backend is configured). All on-device — audio never
 * leaves the page. Batch flow (Phase 1); live running transcript arrives in Phase 2. See AI/DIARIZATION.md.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { VisitScribe } from './VisitScribe';

const meta: Meta<typeof VisitScribe> = {
  title: 'Product/Feature Modules/AI/Hey Ozwell/Visit Scribe',
  component: VisitScribe,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Ambient-visit scribe — **record the room** (no wake word), stop, and get a **speaker-labeled ' +
          'transcript** on-device. Enroll people in **Voice Manager** first to see them named (doctor / ' +
          'care-team); everyone else is “Speaker N”, or an AI-inferred role (Patient / Caregiver / …) when ' +
          'you flip **Label unknown speakers with AI** and a chat backend is configured. All on-device.',
      },
    },
  },
};
export default meta;

/** Record a multi-person visit → attributed transcript. */
export const Scribe: StoryObj<typeof VisitScribe> = {
  render: () => <VisitScribe />,
};
