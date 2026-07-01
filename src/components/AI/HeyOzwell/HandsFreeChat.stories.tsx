/**
 * Hands-free voice chat — the composition of the voice primitives (wake + speaker-verify + dictation +
 * AIChat). The logic + UI now live in the shipped `<HandsFreeChat>` component (built on `useHeyOzwell`);
 * this story just renders it. Say "hey ozwell" to dictate, "ozwell I'm done" to send. One shared mic.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { HandsFreeChat } from './HandsFreeChat';
import { suggestedActions } from '../storyData';

const meta: Meta<typeof HandsFreeChat> = {
  title: 'Product/Feature Modules/AI/Hey Ozwell/Hands-Free Chat',
  component: HandsFreeChat,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Composition of the voice primitives — wake-word + on-device speaker verify + on-device ' +
          'dictation + AIChat. Say **“hey ozwell”** to start dictating, **“ozwell I’m done”** to send. ' +
          'Doctor-only by default; one shared mic; all on-device.',
      },
    },
  },
};
export default meta;

/** Say "hey ozwell" to dictate, "ozwell I'm done" to send. Wake + speaker-verify + dictation + AIChat. */
export const HandsFree: StoryObj<typeof HandsFreeChat> = {
  render: () => <HandsFreeChat userName="Dr. Jane" suggestions={suggestedActions} />,
};
