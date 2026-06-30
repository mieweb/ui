/**
 * Voice Setup — the client-facing enrollment screen. The logic + UI now live in the shipped
 * `<VoiceSetup>` component (and `useVoiceSetup` hook); this story just renders it.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { VoiceSetup } from './VoiceSetup';

const meta: Meta<typeof VoiceSetup> = {
  title: 'Product/Feature Modules/AI/Hey Ozwell/Voice Setup',
  component: VoiceSetup,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'On-device voice enrollment — tap the Ozwell octopus, it pulses as you talk. One guided pass ' +
          'builds both the speaker (WHO) and phrase (WHAT) prints. Apple-style, brand-aligned, all on-device.',
      },
    },
  },
};
export default meta;

/** Tap the Ozwell octopus; it pulses as you talk. On-device, brand-aligned enrollment. */
export const Setup: StoryObj<typeof VoiceSetup> = {
  render: () => <VoiceSetup />,
};
