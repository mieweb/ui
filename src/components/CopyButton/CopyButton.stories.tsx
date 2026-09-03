import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyButton } from './CopyButton';

const meta: Meta<typeof CopyButton> = {
  title: 'Components/Buttons & Actions/CopyButton',
  component: CopyButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An inline copy-to-clipboard icon button with a brief success check. Click events ' +
          'are stopped so it is safe inside clickable rows and links. Each instance keeps ' +
          'its own state — drop it next to IDs, emails, phone numbers, and API keys.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: { description: 'Text written to the clipboard.', control: 'text' },
    label: { description: 'Accessible label / tooltip.', control: 'text' },
    copiedLabel: {
      description: 'Label while the copied state shows.',
      control: 'text',
    },
    timeout: { description: 'Copied-state duration in ms.', control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 'WC-10382', label: 'Copy MRN' },
  render: (args) => (
    <span className="text-foreground flex items-center gap-1 text-sm">
      MRN <span className="font-mono font-medium">WC-10382</span>
      <CopyButton {...args} />
    </span>
  ),
};

export const InDetailFields: Story = {
  render: () => (
    <dl className="grid w-80 grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {[
        { label: 'Email', value: 'w.hart@example.com' },
        { label: 'Phone', value: '+1 (260) 555-0184' },
        { label: 'Waggle ID', value: 'wgl_8f3k2m' },
      ].map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="text-foreground flex items-center gap-1">
            <span className="truncate">{row.value}</span>
            <CopyButton
              value={row.value}
              label={`Copy ${row.label.toLowerCase()}`}
            />
          </dd>
        </div>
      ))}
    </dl>
  ),
};
