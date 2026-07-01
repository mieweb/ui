/**
 * Voice Manager — the central "your voice" page. Logic + UI live in the shipped `<VoiceManager>`
 * component; this story just renders it. Set up your voice, add another (assistant / new condition),
 * or clear everything. On-device.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { VoiceManager } from './VoiceManager';

const meta: Meta<typeof VoiceManager> = {
  title: 'Product/Feature Modules/AI/Hey Ozwell/Voice Manager',
  component: VoiceManager,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The central voice-enrollment page — one home to set up your voice, add another authorized voice ' +
          '(an assistant, or you under a new condition), or clear everything. All on-device.',
      },
    },
  },
};
export default meta;

/** Manage your enrolled voices — set up, add, or clear. */
export const Manage: StoryObj<typeof VoiceManager> = {
  render: () => <VoiceManager />,
};
