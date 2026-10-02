import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { LogoUploader } from './LogoUploader';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const sampleLogo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="teal"/><text x="32" y="42" font-size="28" text-anchor="middle" fill="white" font-family="sans-serif">AC</text></svg>'
  );

const meta: Meta<typeof LogoUploader> = {
  id: 'composite-forms-logouploader',
  title: 'Inputs/Composite forms/LogoUploader',
  component: LogoUploader,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A square or circular image slot for an organization logo or avatar. It is a drop target and a click-to-browse \`<input type="file">\`, previews the current \`value\`, and offers a remove button when \`onRemove\` is given.

### Use it when

- A record has exactly one image (clinic logo, company mark, profile photo) and the upload happens immediately.

### Don't use it when

- Users attach several files or documents — use \`FileManager\`.
- A whole region should accept drops — use \`DropzoneOverlay\`.
- The image needs cropping or annotation — use \`MediaEditor\` after upload.

### Example

\`\`\`tsx
<LogoUploader
  value={clinic.logoUrl}
  maxSizeBytes={2 * 1024 * 1024}
  onUpload={async (file) => (await uploadToStorage(file)).url}
  onRemove={() => updateClinic({ logoUrl: null })}
/>
\`\`\`

\`onUpload\` receives the file; resolve with the stored URL to preview it until the caller's \`value\` catches up. A local object-URL preview shows while it is pending; a rejection restores the previous logo and shows an error.

### Limitations

- The real file input is visually hidden but focusable; the drop target is its \`<label>\`, so Enter/Space on the focused input opens the picker and the target shows the focus ring.
- Type checking honours \`accept\` (MIME types, \`type/*\` wildcards and \`.ext\` tokens) before calling \`onUpload\`; \`maxSizeBytes\` is checked client-side only — validate again on the server.
- Progress is indeterminate (a spinner with a \`role="status"\` label); there is no byte-level progress.
- Errors render in \`role="alert"\` and mark the input \`aria-invalid\`.
- Fetching a logo from a website is app-specific; render your own action and set \`value\`.
- English defaults are overridable through \`labels\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
    },
  },
  argTypes: {
    value: { description: 'URL of the current logo.', control: 'text' },
    onUpload: {
      description: 'Upload the file; resolve with the new URL.',
      control: false,
    },
    onRemove: {
      description: 'Remove the logo. Omit to hide the button.',
      control: false,
    },
    accept: { description: '`accept` attribute for the file input.' },
    maxSizeBytes: {
      description: 'Reject larger files.',
      control: 'number',
    },
    shape: {
      description: 'Target shape.',
      control: 'radio',
      options: ['square', 'circle'],
    },
    size: {
      description: 'Target size.',
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { description: 'Disable uploads and removal.' },
    labels: { description: 'Translatable strings.', control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function Stateful({
  initial,
  fail,
  ...rest
}: {
  initial?: string | null;
  fail?: boolean;
  shape?: 'square' | 'circle';
  size?: 'sm' | 'md' | 'lg';
  maxSizeBytes?: number;
}) {
  const [value, setValue] = React.useState<string | null>(initial ?? null);
  return (
    <LogoUploader
      {...rest}
      value={value}
      onUpload={async () => {
        await wait(1000);
        if (fail) throw new Error('rejected');
        // A real app stores the file and returns its hosted URL.
        setValue(sampleLogo);
      }}
      onRemove={async () => {
        await wait(400);
        setValue(null);
      }}
    />
  );
}

export const Default: Story = {
  render: () => <Stateful maxSizeBytes={2 * 1024 * 1024} />,
};

export const WithLogo: Story = {
  render: () => <Stateful initial={sampleLogo} />,
};

export const Circle: Story = {
  render: () => <Stateful initial={sampleLogo} shape="circle" size="lg" />,
};

export const UploadFails: Story = {
  render: () => <Stateful initial={sampleLogo} fail />,
};

export const Disabled: Story = {
  args: { value: sampleLogo, disabled: true, onUpload: async () => undefined },
};
