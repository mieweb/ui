import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import { Button } from '../Button';
import { Text } from '../Text';
import { CardCapture, type CardCaptureProps } from './CardCapture';

const meta: Meta<typeof CardCapture> = {
  title: 'Components/Images & Media/CardCapture',
  component: CardCapture,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
CardCapture provides model-assisted ID-card capture directly in the browser.

The component combines the existing MIE camera and document-quality utilities
with an ONNX ID-card detector. Automatic capture begins only after the image is
clear, stable, properly lit, and the model has consistently detected an ID card.

The ONNX model is supplied separately through \`modelUrl\`, allowing the model
to be versioned or improved independently from the UI component.

Manual capture remains available when automatic detection is disabled,
unavailable, or uncertain.

### MVP scope

- Single-class \`id_card\` detection
- Browser inference through ONNX Runtime Web
- WASM execution provider
- Stable consecutive detections
- Automatic countdown and capture
- Manual capture fallback
- Captured result returned as a \`File\`

The initial detector demonstrates the complete browser workflow. Model
calibration across additional card types, cameras, and lighting conditions can
be performed independently without changing the component API.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    open: {
      description: 'Whether the card-capture modal is open',
      control: false,
    },
    onOpenChange: {
      description: 'Called when the modal open state changes',
      control: false,
    },
    onCapture: {
      description: 'Called with the captured image after the user confirms it',
      control: false,
      table: {
        type: {
          summary: '(file: File) => void',
        },
      },
    },
    modelUrl: {
      description:
        'Browser-accessible URL containing the ONNX ID-card detector',
      control: 'text',
    },
    wasmPaths: {
      description: 'Public directory containing ONNX Runtime Web WASM assets',
      control: 'text',
    },
    enableAutoCapture: {
      description:
        'Enable model-assisted automatic capture after stable detection',
      control: 'boolean',
      table: {
        defaultValue: {
          summary: 'true',
        },
      },
    },
    confidenceThreshold: {
      description: 'Minimum model confidence accepted as an ID-card detection',
      control: {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.05,
      },
      table: {
        defaultValue: {
          summary: '0.7',
        },
      },
    },
    countdownSeconds: {
      description: 'Number of seconds before automatic capture begins',
      control: {
        type: 'number',
        min: 1,
        max: 5,
      },
      table: {
        defaultValue: {
          summary: '2',
        },
      },
    },
    title: {
      description: 'Title displayed in the capture modal',
      control: 'text',
    },
    description: {
      description: 'Instructions displayed above the camera preview',
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof CardCapture>;

function CardCaptureDemo(props: CardCaptureProps) {
  const [open, setOpen] = React.useState(false);
  const [capturedFile, setCapturedFile] = React.useState<File | null>(null);

  const handleCapture = (file: File) => {
    setCapturedFile(file);
    props.onCapture(file);
  };

  return (
    <div className="border-border bg-card flex w-full flex-col items-center gap-5 rounded-xl border p-6 text-center shadow-sm">
      <div className="space-y-1">
        <Text as="h2" size="xl" weight="semibold">
          Browser ID-card detection
        </Text>

        <Text variant="muted" size="sm">
          Open the camera and position an ID card within the preview.
        </Text>
      </div>

      <Button
        variant="primary"
        onClick={() => {
          setCapturedFile(null);
          setOpen(true);
        }}
      >
        Open ID-card capture
      </Button>

      {capturedFile && (
        <div
          className="border-success bg-success/10 rounded-lg border px-4 py-3"
          role="status"
        >
          <Text weight="medium">Capture completed</Text>

          <Text variant="muted" size="sm">
            {capturedFile.name} · {Math.round(capturedFile.size / 1024)} KB
          </Text>
        </div>
      )}

      <CardCapture
        {...props}
        open={open}
        onOpenChange={setOpen}
        onCapture={handleCapture}
      />
    </div>
  );
}

export const LiveBrowserModel: Story = {
  args: {
    open: false,
    onOpenChange: () => undefined,
    onCapture: () => undefined,
    modelUrl: '/models/id-card-detector-v1.onnx',
    wasmPaths: '/ort-wasm/',
    enableAutoCapture: true,
    confidenceThreshold: 0.7,
    countdownSeconds: 2,
    title: 'Capture ID card',
    description: 'Position your ID card within the frame and hold it steady.',
  },
  render: (args) => <CardCaptureDemo {...args} />,
  parameters: {
    docs: {
      description: {
        story: `
This live story loads the ONNX detector from
\`/models/id-card-detector.onnx\` and performs inference directly inside the
browser.

For local development, place the approved model at:

\`\`\`text
.storybook/public/models/id-card-detector.onnx
\`\`\`

The model is intentionally not bundled with the component. Manual capture
remains available throughout the flow.
        `,
      },
    },
  },
};
