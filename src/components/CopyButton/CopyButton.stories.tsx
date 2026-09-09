import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyButton } from './CopyButton';

const meta: Meta<typeof CopyButton> = {
  id: 'actions-copybutton',
  title: 'Inputs/Actions/CopyButton',
  component: CopyButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

An inline icon \`Button\` that writes \`value\` to the clipboard and shows a check mark for \`timeout\` ms (default 1200). Click events are stopped, so it is safe inside clickable rows and links, and each instance keeps its own copied state.

### Use it when

- A value the user will paste elsewhere sits in the UI: IDs, MRNs, emails, phone numbers, API keys, share links.
- The copy affordance must live inside an interactive row or card without triggering the row's own click.

### Don't use it when

- The action is anything other than copying text — use \`Button\`.
- You need to copy rich content or files; \`navigator.clipboard.writeText\` only handles plain text.
- The page is served over plain HTTP: the async clipboard API needs a secure context, and the button will silently fail.

### Example

\`\`\`tsx
<span className="font-mono">{patient.mrn}</span>
<CopyButton value={patient.mrn} label="Copy MRN" copiedLabel="MRN copied" onCopied={track} />
\`\`\`

### Limitations

- Accessible name and tooltip come from \`label\` / \`copiedLabel\` (\`aria-label\` + \`title\`); both are English by default and must be translated by the host.
- The copied state is visual and via label only; there is no live region announcement.
- Inherits \`Button\`'s \`variant\`/\`size\` props (except \`value\`), so it follows brand and dark mode automatically.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'actions-button',
          why: 'Renders an icon-size Button and accepts its variant/size props.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
