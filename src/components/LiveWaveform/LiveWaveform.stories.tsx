import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { LiveWaveform } from './LiveWaveform';

const meta: Meta<typeof LiveWaveform> = {
  title: 'Components/Images & Media/LiveWaveform',
  component: LiveWaveform,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A real-time volume visualizer for an active capture \`MediaStream\`.

Unlike \`AudioRecorder\`, \`LiveWaveform\` owns no microphone — it visualizes a
stream you already have (e.g. from \`getUserMedia\` / \`getDisplayMedia\` or a
recording pipeline), so it can share the recorder's stream without contending
for the device. Bars are vertically centered and the color defaults to the
active brand's \`--color-primary-500\`.

\`\`\`tsx
import { LiveWaveform } from '@mieweb/ui';

<LiveWaveform stream={captureStream} active={isRecording} height={56} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LiveWaveform>;

/**
 * Synthetic demo: builds an oscillator-backed stream so the waveform animates
 * without requesting microphone permission.
 */
function SyntheticWaveform({
  height,
  color,
}: {
  height?: number;
  color?: string;
}) {
  const [active, setActive] = React.useState(false);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const cleanupRef = React.useRef<(() => void) | null>(null);

  const toggle = () => {
    if (active) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setStream(null);
      setActive(false);
      return;
    }

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const destination = ctx.createMediaStreamDestination();

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 220;
    lfo.frequency.value = 4;
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain).connect(oscillator.frequency);
    oscillator.connect(destination);
    oscillator.start();
    lfo.start();

    cleanupRef.current = () => {
      oscillator.stop();
      lfo.stop();
      void ctx.close();
    };

    setStream(destination.stream);
    setActive(true);
  };

  React.useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <div className="flex w-80 flex-col items-center gap-4">
      <div className="bg-muted h-14 w-full overflow-hidden rounded-lg">
        <LiveWaveform
          stream={stream}
          active={active}
          height={height}
          color={color}
        />
      </div>
      <button
        type="button"
        onClick={toggle}
        className="bg-primary-800 rounded-md px-4 py-2 text-sm text-white"
      >
        {active ? 'Stop' : 'Play tone'}
      </button>
    </div>
  );
}

export const Default: Story = {
  render: () => <SyntheticWaveform height={56} />,
};

export const CustomColor: Story = {
  render: () => <SyntheticWaveform height={56} color="#ef4444" />,
};

export const Idle: Story = {
  args: { stream: null, active: false, height: 56 },
  render: (args) => (
    <div className="bg-muted h-14 w-80 overflow-hidden rounded-lg">
      <LiveWaveform {...args} />
    </div>
  ),
};
