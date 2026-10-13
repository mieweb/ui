import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  HeyOzwellSelector,
  type HeyOzwellSelectorPhase,
} from './HeyOzwellSelector';

const meta: Meta<typeof HeyOzwellSelector> = {
  id: 'voice-hey-ozwell-selector',
  title: 'Modules/Voice/Hey Ozwell Selector',
  component: HeyOzwellSelector,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  decorators: [
    (Story) => (
      <div className="flex min-h-48 items-end p-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

**The quiet "Hey Ozwell" on/off menu for the row below \`ChatComposer\`.** It shows the host's wake-word state on the trigger icon and offers Activate / Disable, plus an optional "Voice settings…" item. It is presentational: the host runs the listener (\`useWakeWord\` / \`useHeyOzwell\`) and maps it to \`phase\`.

| \`phase\` | Trigger |
| --- | --- |
| \`off\` | Waveform icon |
| \`loading\` | Spinner (models and mic starting) |
| \`listening\` | Waveform in the success colour |
| \`error\` | Warning icon; \`error\` text replaces the Activate description |

### Use it when

- The composer is the voice entry point and wake-word listening should be switchable from \`selectorsEndSlot\`.
- You already own the wake-word lifecycle and need a compact control that reflects it.

### Don't use it when

- You want the header octopus, settings menu and floating chat — use [Hey Ozwell Demo](?path=/docs/voice-hey-ozwell-demo--docs) (\`HeyOzwell\`).
- You need the listener itself — use [Wake Word](?path=/docs/voice-wake-word--docs); this component starts nothing.

### Example

\`\`\`tsx
import { ChatComposer, HeyOzwellSelector } from '@mieweb/ui';

<ChatComposer
  onSend={send}
  selectorsEndSlot={
    <HeyOzwellSelector
      phase={wake.phase}
      error={wake.error}
      onChange={(active) => (active ? wake.start() : wake.stop())}
      onOpenSettings={openVoiceSettings}
    />
  }
/>
\`\`\`

### Limitations

- \`onChange\` fires only when the choice changes, except that Activate from \`error\` fires again as a retry.
- A polite \`role="status"\` region announces each phase; the trigger's accessible name is "Hey Ozwell: Activate | Disable". All text comes from \`labels\` (English defaults).
- Long \`error\` text is truncated in the menu; keep it short. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'chat-chatcomposer',
          why: "Designed for ChatComposer's selectorsEndSlot, next to the model selector.",
        },
      ],
    },
  },
  argTypes: {
    phase: {
      control: 'select',
      options: ['off', 'loading', 'listening', 'error'],
      description: 'Wake-word state from the host listener.',
    },
    onChange: {
      description:
        'Called with true for Activate and false for Disable when the choice changes.',
    },
    onOpenSettings: {
      description: 'Adds a "Voice settings…" item when set.',
    },
    error: { description: 'Error detail shown while phase is error.' },
    disabled: { description: 'Disables the trigger and closes the menu.' },
    labels: { description: 'Overrides for all visible and announced text.' },
  },
  args: { onChange: () => {} },
};
export default meta;

type Story = StoryObj<typeof HeyOzwellSelector>;

export const Off: Story = { args: { phase: 'off' } };

export const Loading: Story = { args: { phase: 'loading' } };

export const Listening: Story = { args: { phase: 'listening' } };

export const ErrorState: Story = {
  name: 'Error',
  args: {
    phase: 'error',
    error: 'Microphone permission denied',
    onOpenSettings: () => {},
  },
};

function InteractiveDemo() {
  const [phase, setPhase] = React.useState<HeyOzwellSelectorPhase>('off');
  React.useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setTimeout(() => setPhase('listening'), 1500);
    return () => clearTimeout(timer);
  }, [phase]);
  return (
    <HeyOzwellSelector
      phase={phase}
      onChange={(active) => setPhase(active ? 'loading' : 'off')}
      onOpenSettings={() => {}}
    />
  );
}

/** Activate shows the loading spinner, then listening. Includes "Voice settings…". */
export const Interactive: Story = { render: () => <InteractiveDemo /> };
