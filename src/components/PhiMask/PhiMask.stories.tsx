import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { fn } from 'storybook/test';
import { PhiMask } from './PhiMask';

const meta: Meta<typeof PhiMask> = {
  id: 'record-details-phimask',
  title: 'Components/Record details/PhiMask',
  component: PhiMask,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    catalog: { entry: '@mieweb/ui' },
    docs: {
      description: {
        component: `
### What it's for

Hides a sensitive value — a patient name, SSN, date of birth, phone number — behind
bullets, with an eye toggle that reveals it on demand. \`keepLast\` leaves the tail
visible ("••••••••6789"), \`onReveal\` fires on every reveal for audit logging, and
\`autoHideMs\` re-masks after a delay.

### Use it when

- A record detail shows PHI/PII that should not sit on screen by default (shoulder-surfing, screen sharing).
- Reveals must be auditable — log from \`onReveal\`.

### Don't use it when

- The viewer is not allowed to see the value at all — don't send it to the client; render a placeholder instead. \`canReveal={false}\` hides the toggle but the value is still in your props.
- You need to blur a whole screen on inactivity — that's an app-level overlay, not a per-field mask.

### Example

\`\`\`tsx
<PhiMask
  value={patient.ssn}
  keepLast={4}
  autoHideMs={15000}
  onReveal={() => audit('ssn.reveal', patient.id)}
/>
\`\`\`

### Limitations

- While masked, the value is not in the DOM; screen readers hear \`labels.masked\` (or \`labels.maskedEnding(last)\`). The bullets are a fixed length, so they don't leak the value's length.
- The toggle is a \`<button aria-pressed>\` named \`labels.reveal\` / \`labels.hide\`, with a visible focus ring.
- \`onReveal\` fires only for user reveals through the toggle; a parent that sets \`revealed\` itself should log that reveal itself.
- Strings default to English; override through \`labels\`.
`,
      },
    },
  },
  argTypes: {
    value: { description: 'The sensitive text.' },
    keepLast: {
      description: 'Characters left visible at the end while masked.',
      control: 'number',
    },
    revealed: { description: 'Controlled revealed state.', control: 'boolean' },
    defaultRevealed: {
      description: 'Initial state when uncontrolled.',
      control: 'boolean',
    },
    onRevealedChange: {
      description: 'Called on every state change (toggle or auto-hide).',
    },
    onReveal: {
      description:
        'Called each time the user reveals the value — for audit logs.',
    },
    canReveal: {
      description: 'Set false to remove the toggle.',
      control: 'boolean',
    },
    autoHideMs: {
      description: 'Re-mask this many ms after a reveal.',
      control: 'number',
    },
    labels: { description: 'Overrides for the masked text and toggle names.' },
  },
  args: { value: 'Jane Q. Patient', onReveal: fn() },
};

export default meta;
type Story = StoryObj<typeof PhiMask>;

export const Default: Story = {};

export const KeepLast: Story = {
  args: { value: '123-45-6789', keepLast: 4 },
};

export const AutoHide: Story = {
  args: { value: '(555) 010-4477', autoHideMs: 3000 },
};

export const NoReveal: Story = {
  args: { canReveal: false },
};

function ControlledDemo(args: React.ComponentProps<typeof PhiMask>) {
  const [revealed, setRevealed] = React.useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={revealed}
          onChange={(e) => setRevealed(e.target.checked)}
        />
        Reveal all PHI
      </label>
      <PhiMask {...args} revealed={revealed} onRevealedChange={setRevealed} />
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledDemo {...args} />,
};
